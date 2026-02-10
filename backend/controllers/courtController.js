import { Court } from "../models/Court.js";

// GET all courts and availability
export const getAllCourts = async (req, res) => {
  try {
    const courts = await Court.find();
    res.json(courts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// RESERVE a court
export const reserveCourt = async (req, res) => {
  try {
    const { courtId, date, time, studentName, gucId, studentId } = req.body;

    // Validate inputs
    if (!courtId || !date || !time || !studentName || !gucId || !studentId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Find the court
    const court = await Court.findById(courtId);
    if (!court) {
      return res.status(404).json({ message: "Court not found" });
    }

    // Check if the time slot exists in availability
    const availabilitySlot = court.availability.find(
      (slot) => slot.date === date
    );

    if (!availabilitySlot || !availabilitySlot.time.includes(time)) {
      return res.status(400).json({ message: "This time slot is not available" });
    }

    // Check if already reserved
    const existingReservation = court.reservations.find(
      (res) => res.date === date && res.time === time
    );

    if (existingReservation) {
      return res.status(400).json({ message: "This time slot has already been reserved" });
    }

    // Add reservation
    court.reservations.push({
      studentId,
      studentName,
      gucId,
      date,
      time,
    });

    // Remove the time slot from availability
    availabilitySlot.time = availabilitySlot.time.filter((t) => t !== time);

    await court.save();

    res.status(201).json({
      message: "Court reserved successfully",
      reservation: {
        courtName: court.name,
        courtType: court.type,
        date,
        time,
        studentName,
        gucId,
      },
    });
  } catch (err) {
    console.error("Error reserving court:", err);
    res.status(500).json({ error: err.message });
  }
};