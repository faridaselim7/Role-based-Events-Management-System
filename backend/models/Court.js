import mongoose from "mongoose";

const courtSchema = new mongoose.Schema({
  name: String,
  type: String, // basketball, tennis, football
  availability: [
    {
      date: String,
      time: [String], // e.g. ["10:00-11:00", "12:00-13:00"]
    },
  ],

  reservations: [
    {
      studentId: String,
      studentName: String,
      gucId: String,
      date: String,
      time: String, // e.g. "10:00-11:00"
      createdAt: { type: Date, default: Date.now },
    },
  ],
});

export const Court = mongoose.model("Court", courtSchema);

