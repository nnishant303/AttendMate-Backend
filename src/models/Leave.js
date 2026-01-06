import mongoose from "mongoose";

const leaveEmployeeSchema = new mongoose.Schema({
  employeeId: String,
  leaveType: String,
  fromDate: String,
  toDate: String,
  reason: String,
  status: { type: String, enum: ["Pending", "Approved", "Rejected"],default: "Pending" },
  appliedOn: { type: Date, default: Date.now }
});

const leaveSchema = new mongoose.Schema({
  date: String,      
  employees: [leaveEmployeeSchema]
});

export default mongoose.model("Leave", leaveSchema);
