import Notification from "../models/Notification.js";
import Employee from "../models/Employee.js";
import { sendPushNotification, sendPushNotificationToMultiple } from "../utils/fcmService.js";

// @desc    Create a new notification to a specific employee
// @route   POST /api/notifications
// @access  Private (HR/System)
export const createNotification = async (req, res) => {
  try {
    const { recipientId, recipientType, title, message, type, link, metadata } = req.body;

    if (!recipientId || !recipientType || !title || !message) {
      return res.status(400).json({ message: "Required fields: recipientId, recipientType, title, message" });
    }

    // Validate recipient if it's an employee and get employee object for reuse
    let employee = null;
    if (recipientType === "employee") {
      employee = await Employee.findOne({ employeeId: recipientId });
      if (!employee) {
        return res.status(404).json({ message: `Employee with ID ${recipientId} not found` });
      }
    }

    // Create notification
    const notification = await Notification.create({
      recipientId,
      recipientType,
      title,
      message,
      type: type || "system",
      link,
      metadata,
    });

    // Send push notification if recipient is an employee (reuse employee object from validation)
    if (recipientType === "employee" && employee && employee.fcmToken) {
      try {
        const pushResult = await sendPushNotification(
          employee.fcmToken,
          title,
          message,
          {
            notificationId: notification._id.toString(),
            type: type || "system",
            link: link || "",
          }
        );

        // Remove invalid FCM token if push failed due to invalid token
        if (!pushResult.success && pushResult.shouldRemoveToken) {
          employee.fcmToken = null;
          await employee.save();
          console.log(`Removed invalid FCM token for employee ${recipientId}`);
        }
      } catch (pushError) {
        console.error("Error sending push notification:", pushError);
        // Don't fail the request if push fails
      }
    }

    // Emit socket event for real-time notification to specific recipient
    if (req.io) {
      req.io.to(`notification_${recipientType}_${recipientId}`).emit("newNotification", notification);
      // Also emit to global room for admin/HR dashboards
      req.io.to("global").emit("newNotification", notification);
    }

    res.status(201).json({ message: "Notification created successfully", notification });
  } catch (error) {
    console.error("createNotification error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all notifications for current user/employee
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res) => {
  try {
    let recipientId, recipientType;

    // Determine recipient based on authentication
    if (req.user && !req.employee) {
      // HR user (only user, not employee)
      recipientId = req.user._id.toString();
      recipientType = "user";
    } else if (req.employee) {
      // Employee (always use employeeId string field for consistency)
      recipientId = req.employee.employeeId;
      recipientType = "employee";
    } else {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { limit = 50, page = 1, read } = req.query;
    const skip = (page - 1) * limit;

    const query = { recipientId, recipientType };
    if (read !== undefined) {
      query.read = read === "true";
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ recipientId, recipientType, read: false });

    res.json({
      notifications,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
      unreadCount,
    });
  } catch (error) {
    console.error("getNotifications error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
export const getUnreadCount = async (req, res) => {
  try {
    let recipientId, recipientType;

    if (req.user && !req.employee) {
      recipientId = req.user._id.toString();
      recipientType = "user";
    } else if (req.employee) {
      recipientId = req.employee.employeeId;
      recipientType = "employee";
    } else {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const count = await Notification.countDocuments({
      recipientId,
      recipientType,
      read: false,
    });

    res.json({ unreadCount: count });
  } catch (error) {
    console.error("getUnreadCount error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req, res) => {
  try {
    let recipientId, recipientType;

    if (req.user && !req.employee) {
      recipientId = req.user._id.toString();
      recipientType = "user";
    } else if (req.employee) {
      recipientId = req.employee.employeeId;
      recipientType = "employee";
    } else {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const notification = await Notification.findOne({
      _id: req.params.id,
      recipientId,
      recipientType,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    notification.read = true;
    await notification.save();

    // Emit socket event
    if (req.io) {
      req.io.to(`notification_${recipientType}_${recipientId}`).emit("notificationUpdated", notification);
    }

    res.json({ message: "Notification marked as read", notification });
  } catch (error) {
    console.error("markAsRead error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllAsRead = async (req, res) => {
  try {
    let recipientId, recipientType;

    if (req.user && !req.employee) {
      recipientId = req.user._id.toString();
      recipientType = "user";
    } else if (req.employee) {
      recipientId = req.employee.employeeId;
      recipientType = "employee";
    } else {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const result = await Notification.updateMany(
      { recipientId, recipientType, read: false },
      { $set: { read: true } }
    );

    // Emit socket event
    if (req.io) {
      req.io.to(`notification_${recipientType}_${recipientId}`).emit("notificationsReadAll");
    }

    res.json({
      message: "All notifications marked as read",
      updatedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("markAllAsRead error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send notification to all employees (bulk)
// @route   POST /api/notifications/send-to-all
// @access  Private (HR only)
export const sendNotificationToAll = async (req, res) => {
  try {
    const { title, message, type, link, metadata } = req.body;

    if (!title || !message) {
      return res.status(400).json({ message: "Required fields: title, message" });
    }

    // Get all employees
    const employees = await Employee.find({}).select("employeeId fcmToken");

    if (employees.length === 0) {
      return res.status(404).json({ message: "No employees found" });
    }

    // Create notifications for all employees
    const notifications = [];
    const fcmTokens = [];

    for (const employee of employees) {
      const notification = await Notification.create({
        recipientId: employee.employeeId,
        recipientType: "employee",
        title,
        message,
        type: type || "system",
        link,
        metadata,
      });

      notifications.push(notification);

      if (employee.fcmToken) {
        fcmTokens.push(employee.fcmToken);
      }

      // Emit socket event for each employee
      if (req.io) {
        req.io
          .to(`notification_employee_${employee.employeeId}`)
          .emit("newNotification", notification);
      }
    }

    // Send bulk push notifications
    if (fcmTokens.length > 0) {
      try {
        const pushResult = await sendPushNotificationToMultiple(
          fcmTokens,
          title,
          message,
          {
            type: type || "system",
            link: link || "",
          }
        );

        // Handle invalid tokens - remove them from database
        if (pushResult.invalidTokens && pushResult.invalidTokens.length > 0) {
          await Employee.updateMany(
            { fcmToken: { $in: pushResult.invalidTokens } },
            { $unset: { fcmToken: "" } }
          );
          console.log(`Removed ${pushResult.invalidTokens.length} invalid FCM tokens`);
        }

        console.log(
          `Bulk push notifications: ${pushResult.successCount} successful, ${pushResult.failureCount} failed`
        );
      } catch (pushError) {
        console.error("Error sending bulk push notifications:", pushError);
        // Don't fail the request if push fails
      }
    }

    // Emit to global room
    if (req.io) {
      req.io.to("global").emit("bulkNotificationSent", {
        count: notifications.length,
        title,
        message,
      });
    }

    res.status(201).json({
      message: `Notification sent to ${notifications.length} employees successfully`,
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    console.error("sendNotificationToAll error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get notification by ID
// @route   GET /api/notifications/:id
// @access  Private
export const getNotificationById = async (req, res) => {
  try {
    let recipientId, recipientType;

    if (req.user && !req.employee) {
      recipientId = req.user._id.toString();
      recipientType = "user";
    } else if (req.employee) {
      recipientId = req.employee.employeeId;
      recipientType = "employee";
    } else {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const notification = await Notification.findOne({
      _id: req.params.id,
      recipientId,
      recipientType,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json(notification);
  } catch (error) {
    console.error("getNotificationById error:", error);
    res.status(500).json({ message: error.message });
  }
};
