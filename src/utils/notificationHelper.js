import Notification from "../models/Notification.js";

/**
 * Helper function to create notifications programmatically
 * Can be used from any controller/service to send notifications
 * 
 * @param {Object} options - Notification options
 * @param {String} options.recipientId - ID of the recipient (userId or employeeId)
 * @param {String} options.recipientType - "user" or "employee"
 * @param {String} options.title - Notification title
 * @param {String} options.message - Notification message
 * @param {String} options.type - Notification type: "attendance", "leave", "event", "system", "employee", "hr"
 * @param {String} options.link - Optional link to related resource
 * @param {Object} options.metadata - Optional additional data
 * @param {Object} options.io - Socket.io instance for real-time updates (optional)
 * @returns {Promise<Object>} Created notification
 */
export const createNotificationHelper = async ({
  recipientId,
  recipientType,
  title,
  message,
  type = "system",
  link = null,
  metadata = null,
  io = null,
}) => {
  try {
    if (!recipientId || !recipientType || !title || !message) {
      throw new Error("Missing required fields: recipientId, recipientType, title, message");
    }

    const notification = await Notification.create({
      recipientId,
      recipientType,
      title,
      message,
      type,
      link,
      metadata,
    });

    // Emit socket event for real-time notification
    if (io) {
      io.to(`notification_${recipientType}_${recipientId}`).emit("newNotification", notification);
      io.to("global").emit("newNotification", notification);
    }

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

/**
 * Helper to create notifications for multiple recipients
 * 
 * @param {Array} recipients - Array of { recipientId, recipientType }
 * @param {Object} notificationData - { title, message, type, link, metadata }
 * @param {Object} io - Socket.io instance (optional)
 * @returns {Promise<Array>} Array of created notifications
 */
export const createBulkNotifications = async (recipients, notificationData, io = null) => {
  try {
    const notifications = [];

    for (const recipient of recipients) {
      const notification = await createNotificationHelper({
        ...recipient,
        ...notificationData,
        io,
      });
      notifications.push(notification);
    }

    return notifications;
  } catch (error) {
    console.error("Error creating bulk notifications:", error);
    throw error;
  }
};
