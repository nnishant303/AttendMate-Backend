import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  googleId: { type: String },
  picture: { type: String },
  role: { type: String, enum: ["hr", "employee"], default: "employee" },

  // Forgot Password / OTP fields
  otp: { type: String }, // Hashed OTP
  otpExpires: { type: Date },
  otpAttempts: { type: Number, default: 0 },
  otpLastSent: { type: Date },

  // Password Reset Token fields
  resetPasswordToken: { type: String }, // Hashed token
  resetPasswordExpires: { type: Date },
}, { timestamps: true });


export default mongoose.model("User", userSchema, "hrUsers");
