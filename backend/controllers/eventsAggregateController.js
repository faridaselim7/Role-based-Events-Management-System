import Event from "../models/Event.js";
import { Workshop } from "../models/Workshop.js";
import Bazaar from "../models/Bazaar.js";
import Trip from "../models/Trip.js";
import { GymSession } from "../models/GymSession.js";

export async function listAllEvents(req, res) {
  try {
    const [events, workshops, bazaars, trips, gyms] = await Promise.all([
      Event.find({}).lean(),
      Workshop.find({}).lean(),
      Bazaar.find({}).lean(),
      Trip.find({}).lean(),
      GymSession.find({}).lean()
    ]);

    const out = [];

    for (const e of events) {
      out.push({
        _id: e._id,
        title: e.title,
        name: e.title,
        category: e.category || "event",
        date: e.date || e.conference?.startDate || null,
        location: e.location || e.conference?.location || null
      });
    }
    for (const w of workshops) {
      out.push({
        _id: w._id,
        title: w.title,
        name: w.title,
        category: "workshop",
        startDate: w.startDate || w.startDateTime || null,
        endDate: w.endDate || w.endDateTime || null,
        location: w.location || null
      });
    }
    for (const b of bazaars) {
      out.push({
        _id: b._id,
        title: b.name,
        name: b.name,
        category: "bazaar",
        startDateTime: b.startDateTime || null,
        endDateTime: b.endDateTime || null,
        location: b.location || null
      });
    }
    for (const t of trips) {
      out.push({
        _id: t._id,
        title: t.name,
        name: t.name,
        category: "trip",
        startDateTime: t.startDateTime || null,
        endDateTime: t.endDateTime || null,
        location: t.location || null
      });
    }
    for (const g of gyms) {
      out.push({
        _id: g._id,
        title: `${g.type} Session`,
        name: `${g.type} Session`,
        category: "gym",
        date: g.date || null,
        location: g.location || null
      });
    }

    return res.json({ count: out.length, events: out });
  } catch (e) {
    console.error("listAllEvents error:", e);
    return res.status(500).json({ message: e.message || "Server error" });
  }
}