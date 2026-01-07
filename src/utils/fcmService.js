import admin from "firebase-admin";
import { readFileSync } from "fs";

// Initialize Firebase Admin SDK
let firebaseInitialized = false;

const initializeFirebase = () => {
  if (firebaseInitialized) return;

  try {
    // Check if Firebase credentials are provided via environment variable
    // Option 1: Service account JSON as base64 encoded string
    if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
      const serviceAccount = JSON.parse(
        Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString()
      );
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      firebaseInitialized = true;
      console.log("Firebase Admin initialized via base64 credentials");
      return;
    }

    // Option 2: Service account JSON file path
    if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      try {
        const serviceAccount = JSON.parse(
          readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, "utf8")
        );
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        firebaseInitialized = true;
        console.log("Firebase Admin initialized via file path");
        return;
      } catch (error) {
        console.error("Error loading Firebase service account file:", error);
      }
    }

    // Option 3: Individual credentials from environment variables
    if (
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_PRIVATE_KEY &&
      process.env.FIREBASE_CLIENT_EMAIL
    ) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
      });
      firebaseInitialized = true;
      console.log("Firebase Admin initialized via environment variables");
      return;
    }

    console.warn("Firebase credentials not found. Push notifications will be disabled.");
  } catch (error) {
    console.error("Error initializing Firebase Admin:", error);
    console.warn("Push notifications will be disabled.");
  }
};

// Initialize on module load
initializeFirebase();

/**
 * Send push notification to a single device
 * @param {String} fcmToken - FCM token of the device
 * @param {String} title - Notification title
 * @param {String} body - Notification message body
 * @param {Object} data - Additional data payload (optional)
 * @returns {Promise<Object>} FCM response
 */
export const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  if (!firebaseInitialized || !admin.apps.length) {
    console.warn("Firebase not initialized. Push notification not sent.");
    return { success: false, error: "Firebase not initialized" };
  }

  if (!fcmToken) {
    console.warn("No FCM token provided. Push notification not sent.");
    return { success: false, error: "No FCM token" };
  }

  try {
    const message = {
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        title: title,
        body: body,
      },
      token: fcmToken,
      android: {
        priority: "high",
        notification: {
          sound: "default",
          channelId: "default",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
          },
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log("Push notification sent successfully:", response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error("Error sending push notification:", error);

    // Handle invalid token errors - token should be removed from database
    if (
      error.code === "messaging/invalid-registration-token" ||
      error.code === "messaging/registration-token-not-registered"
    ) {
      return {
        success: false,
        error: "Invalid token",
        shouldRemoveToken: true,
        errorCode: error.code,
      };
    }

    return { success: false, error: error.message, errorCode: error.code };
  }
};

/**
 * Send push notification to multiple devices
 * @param {Array<String>} fcmTokens - Array of FCM tokens
 * @param {String} title - Notification title
 * @param {String} body - Notification message body
 * @param {Object} data - Additional data payload (optional)
 * @returns {Promise<Object>} Results with successful and failed tokens
 */
export const sendPushNotificationToMultiple = async (fcmTokens, title, body, data = {}) => {
  if (!firebaseInitialized || !admin.apps.length) {
    console.warn("Firebase not initialized. Push notifications not sent.");
    return { success: false, error: "Firebase not initialized" };
  }

  if (!fcmTokens || fcmTokens.length === 0) {
    return { success: false, error: "No FCM tokens provided" };
  }

  // Filter out null/undefined tokens
  const validTokens = fcmTokens.filter((token) => token);

  if (validTokens.length === 0) {
    return { success: false, error: "No valid FCM tokens provided" };
  }

  try {
    const message = {
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        title: title,
        body: body,
      },
      android: {
        priority: "high",
        notification: {
          sound: "default",
          channelId: "default",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
          },
        },
      },
    };

    // Use multicast for multiple tokens (up to 500 at a time)
    const chunks = [];
    for (let i = 0; i < validTokens.length; i += 500) {
      chunks.push(validTokens.slice(i, i + 500));
    }

    const results = {
      successCount: 0,
      failureCount: 0,
      invalidTokens: [],
    };

    for (const chunk of chunks) {
      const multicastMessage = {
        ...message,
        tokens: chunk,
      };

      const response = await admin.messaging().sendEachForMulticast(multicastMessage);

      results.successCount += response.successCount;
      results.failureCount += response.failureCount;

      // Collect invalid tokens
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const token = chunk[idx];
          if (
            resp.error?.code === "messaging/invalid-registration-token" ||
            resp.error?.code === "messaging/registration-token-not-registered"
          ) {
            results.invalidTokens.push(token);
          }
        }
      });
    }

    console.log(
      `Push notifications sent: ${results.successCount} successful, ${results.failureCount} failed`
    );
    return {
      success: true,
      ...results,
    };
  } catch (error) {
    console.error("Error sending multicast push notifications:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if Firebase is initialized
 * @returns {Boolean}
 */
export const isFirebaseInitialized = () => {
  return firebaseInitialized && admin.apps.length > 0;
};
