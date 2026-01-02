import mongoose from "mongoose";

const dailyEmployeeSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  checkInTime: Date,
  checkOutTime: Date,
  duration: Number,
  lateBy: Number,
  status: { type: String, default: "Present" }
});

const attendanceSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true },
  employees: [dailyEmployeeSchema],
}, { timestamps: true });

export default mongoose.model("Attendance", attendanceSchema);
