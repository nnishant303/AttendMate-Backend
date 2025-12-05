import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  start: { type: String, required: true }, // ISO Date String
  end: { type: String, required: true },
  description: { type: String },
  allDay: { type: Boolean, default: false },
  type: { type: String, enum: ["Holiday", "Meeting", "Event"], default: "Event" }
}, { timestamps: true });

export default mongoose.model("Event", eventSchema);
