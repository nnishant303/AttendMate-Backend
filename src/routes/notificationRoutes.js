import express from "express";
import {
  createNotification,
  sendNotificationToAll,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  getNotificationById,
} from "../controllers/notificationController.js";
import combinedAuthMiddleware from "../middleware/combinedAuthMiddleware.js";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

// Create notification to specific employee (HR only)
router.post("/", authMiddleware, adminMiddleware, createNotification);

// Send notification to all employees (HR only)
router.post("/send-to-all", authMiddleware, adminMiddleware, sendNotificationToAll);

// Get unread count (must be before /:id route)
router.get("/unread-count", combinedAuthMiddleware, getUnreadCount);

// Get all notifications for current user/employee
router.get("/", combinedAuthMiddleware, getNotifications);

// Mark all notifications as read (must be before /:id route)
router.put("/read-all", combinedAuthMiddleware, markAllAsRead);

// Get notification by ID
router.get("/:id", combinedAuthMiddleware, getNotificationById);

// Mark notification as read
router.put("/:id/read", combinedAuthMiddleware, markAsRead);

export default router;
