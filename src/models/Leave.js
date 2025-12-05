import mongoose from "mongoose";

const leaveSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  leaveType: { type: String, required: true }, // Sick, Casual, etc.
  fromDate: { type: String, required: true },
  toDate: { type: String, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
  appliedOn: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model("Leave", leaveSchema);
