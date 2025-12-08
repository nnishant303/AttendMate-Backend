import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  date: { type: String, required: true }, 
  status: { type: String, enum: ["Present", "Absent", "Leave", "Late"], default: "Absent" },

  checkInTime: { type: Date },  
  checkOutTime: { type: Date }, 

  duration: { type: Number },   
  lateBy: { type: Number },     
}, { timestamps: true });

attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

export default mongoose.model("Attendance", attendanceSchema);
