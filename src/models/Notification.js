import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  recipientId: { type: String, required: true },
  recipientType: { type: String, enum: ["user", "employee", "User", "Employee"], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ["attendance", "leave", "event", "system", "employee", "hr"],
    default: "system"
  },
  read: { type: Boolean, default: false },
  link: { type: String }, // Optional URL to related resource
  metadata: { type: mongoose.Schema.Types.Mixed }, // Additional data as JSON
}, { timestamps: true });

// Index for efficient queries
notificationSchema.index({ recipientId: 1, recipientType: 1, read: 1 });
notificationSchema.index({ createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);
