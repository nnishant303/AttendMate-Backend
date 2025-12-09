import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  googleId: { type: String },
  picture: { type: String },
  role: { type: String, enum: ["hr"], default: "hr" },
}, { timestamps: true });


export default mongoose.model("User", userSchema, "hrUsers");
