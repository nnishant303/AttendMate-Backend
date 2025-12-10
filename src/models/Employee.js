import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  employeeId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  department: { type: String, required: true },
  password: { type: String, required: true },
  designation: { type: String, required: true },
  salary: { type: Number, required: true },
  joiningDate: { type: Date, required: true },
  address: { type: String },
  dateOfBirth: { type: Date },
  gender: { type: String },
  image: { type: String }
}, { timestamps: true });

export default mongoose.model("Employee", employeeSchema);
