import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  status: { type: String, enum: ["Present", "Absent", "Leave", "Late"], default: "Absent" },

  checkInTime: { type: Date },  // ISO Timestamp
  checkOutTime: { type: Date }, // ISO Timestamp

  duration: { type: Number },   // Minutes
  lateBy: { type: Number },     // Minutes late
}, { timestamps: true });

// Prevent duplicate attendance per day for same employee
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

export default mongoose.model("Attendance", attendanceSchema);
