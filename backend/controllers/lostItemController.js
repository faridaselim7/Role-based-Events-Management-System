// backend/controllers/lostItemController.js
import mongoose from "mongoose";
import LostItem from "../models/LostItem.js";

import Event from '../models/Event.js';
import { Workshop } from '../models/Workshop.js';
import Trip from '../models/Trip.js';
import Bazaar from '../models/Bazaar.js';
import EO_Conference from '../models/EO_Conference.js';
// List of possible event model names
const EVENT_MODEL_NAMES = ["Workshop", "Trip", "EO_Conference", "Bazaar"];

const ALLOWED_STATUS = ["unfound", "found"];
export async function getStartedEventsForLostFound(req, res) {
  try {
    const now = new Date();

    console.log('🔍 Fetching started events for Lost & Found...');
    console.log('Current time:', now.toISOString());

    // Fetch all events that have STARTED (startDate/startDateTime <= now)
    const [events, workshops, trips, allBazaars, conferences] = await Promise.all([
      // Regular Events that have started
      Event.find({
        status: 'published',
        date: { $lte: now }
      }).lean(),

      // Workshops that have started
      Workshop.find({
        published: true,
        archived: { $ne: true },
        startDate: { $lte: now }
      }).lean(),

      // Trips that have started
      Trip.find({
        startDateTime: { $lte: now }
      }).lean(),

      // Fetch ALL bazaars - we'll filter in JavaScript for better control
      Bazaar.find({}).lean(),

      // Conferences that have started
      EO_Conference.find({
        published: true,
        startDate: { $lte: now }
      }).lean(),
    ]);

    // Filter bazaars in JavaScript for more control
    const bazaars = allBazaars.filter(b => {
      // Get the start date from either startDateTime or date field
      let startDate = null;
      
      if (b.startDateTime) {
        startDate = new Date(b.startDateTime);
      } else if (b.date) {
        startDate = new Date(b.date);
      }
      
      // Only include if we have a date AND it's in the past/today
      const hasStarted = startDate && startDate <= now;
      
      if (!hasStarted && startDate) {
        console.log(`   ❌ Excluding future bazaar: "${b.name}" (${startDate.toDateString()})`);
      }
      
      return hasStarted;
    });

    console.log(`📊 Found started events:`);
    console.log(`   - Events: ${events.length}`);
    console.log(`   - Workshops: ${workshops.length}`);
    console.log(`   - Trips: ${trips.length}`);
    console.log(`   - Bazaars: ${bazaars.length} (filtered from ${allBazaars.length} total)`);
    console.log(`   - Conferences: ${conferences.length}`);

    // Debug: Log included bazaar dates
    if (bazaars.length > 0) {
      console.log('✅ Included bazaars:');
      bazaars.forEach(b => {
        const bDate = b.startDateTime || b.date;
        console.log(`   - ${b.name}: ${new Date(bDate).toDateString()}`);
      });
    }

    // Add type and category to each event
    const typedEvents = events.map(e => ({
      ...e,
      type: 'Event',
      category: 'event',
      name: e.title || e.name
    }));

    const typedWorkshops = workshops.map(w => ({
      ...w,
      type: 'Workshop',
      category: 'workshop',
      name: w.title,
      date: w.startDate
    }));

    const typedTrips = trips.map(t => ({
      ...t,
      type: 'Trip',
      category: 'trip',
      name: t.name || t.title,
      date: t.startDateTime
    }));

    const typedBazaars = bazaars.map(b => ({
      ...b,
      type: 'Bazaar',
      category: 'bazaar',
      name: b.name || b.title,
      date: b.startDateTime || b.date
    }));

    const typedConferences = conferences.map(c => ({
      ...c,
      type: 'Conference',
      category: 'conference',
      name: c.title || c.name,
      date: c.startDate
    }));

    // Merge all events
    const allEvents = [
      ...typedEvents,
      ...typedWorkshops,
      ...typedTrips,
      ...typedBazaars,
      ...typedConferences
    ];

    // Sort by date (most recent first)
    allEvents.sort((a, b) => {
      const dateA = new Date(a.date || a.startDate || a.startDateTime || 0);
      const dateB = new Date(b.date || b.startDate || b.startDateTime || 0);
      return dateB - dateA; // Newest first
    });

    console.log(`✅ Total started events: ${allEvents.length}`);

    return res.status(200).json({
      message: 'Started events retrieved successfully',
      count: allEvents.length,
      events: allEvents
    });

  } catch (err) {
    console.error('❌ getStartedEventsForLostFound error:', err);
    return res.status(500).json({ 
      message: 'Failed to fetch started events',
      error: err.message 
    });
  }
}

// Helper function to convert role to lowercase enum value
const normalizeRole = (role) => {
  if (!role) return "Unknown";
  
  const roleMap = {
    'Student': 'student',
    'Staff': 'staff',
    'TA': 'ta',
    'Professor': 'professor',
    'Vendor': 'vendor',
    'EventsOffice': 'EventsOffice',
    'Admin': 'Admin'
  };
  
  return roleMap[role] || role.toLowerCase();
};

// POST /api/lost-items/event/:eventId
export const createLostItem = async (req, res) => {
  try {
    console.log('=== CREATE LOST ITEM CALLED ===');
    console.log('Event ID:', req.params.eventId);
    console.log('User:', req.user);
    console.log('Body:', req.body);
    console.log('File:', req.file);
    
    const { eventId } = req.params;
    const { title, description, dateLost, location, contactInfo, eventModel } = req.body;

    // Validate required fields
    if (!title || !description || !location) {
      console.error('Missing required fields');
      return res.status(400).json({ 
        message: "Missing required fields: title, description, location" 
      });
    }

    // If eventModel is provided, validate it and use it directly
    let eventDoc = null;
    let eventModelName = eventModel;

    if (eventModel) {
      // Validate that eventModel is one of the allowed types
      if (!EVENT_MODEL_NAMES.includes(eventModel)) {
        return res.status(400).json({ 
          message: `Invalid eventModel. Must be one of: ${EVENT_MODEL_NAMES.join(', ')}` 
        });
      }

      try {
        const Model = mongoose.model(eventModel);
        eventDoc = await Model.findById(eventId);
        
        if (!eventDoc) {
          return res.status(404).json({ 
            message: `Event not found in ${eventModel} collection` 
          });
        }
      } catch (err) {
        console.error('Error finding event with provided model:', err);
        return res.status(404).json({ 
          message: `Event not found in ${eventModel} collection` 
        });
      }
    } else {
      // If no eventModel provided, search all collections
      for (const name of EVENT_MODEL_NAMES) {
        let Model;
        try {
          Model = mongoose.model(name);
        } catch {
          continue;
        }

        const found = await Model.findById(eventId);
        if (found) {
          eventDoc = found;
          eventModelName = name;
          break;
        }
      }

      if (!eventDoc) {
        return res.status(404).json({ message: "Event not found in any model" });
      }
    }

    console.log('Event found:', eventModelName, eventDoc._id);


    // Convert role to lowercase for enum validation
    const normalizedRole = normalizeRole(req.user.role);
// Converts "Student" → "student" to match your model enum
    console.log('Original role:', req.user.role, '-> Normalized:', normalizedRole);

    let photo = null;
    if (req.file) {
      // Construct accessible URL
      photo = `${req.protocol}://${req.get('host')}/uploads/documents/${req.file.filename}`;
    }

    // Create the lost item
    const lostItem = await LostItem.create({
      event: eventId,
      eventModel: eventModelName,
      title,
      description,
      dateLost: dateLost || new Date(),
      location,
      status: "unfound",
      createdBy: req.user.id,
      createdByRole: normalizedRole, // Use normalized (lowercase) role
      contactInfo: contactInfo || req.user.email,
      photo,
    });

    console.log('✅ Lost item created successfully:', lostItem._id);

    // Populate before sending response
    await lostItem.populate('event');
    await lostItem.populate('createdBy', 'firstName lastName email');

    res.status(201).json({
      message: 'Lost item reported successfully',
      lostItem
    });
  } catch (err) {
    console.error("createLostItem error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET /api/lost-items/my?eventId=...&eventModel=Workshop&status=found
export const getMyLostItems = async (req, res) => {
  try {
    const { eventId, eventModel, status } = req.query;

    const filter = { createdBy: req.user.id };
    if (eventId) filter.event = eventId;
    if (eventModel) filter.eventModel = eventModel;
    if (status && ALLOWED_STATUS.includes(status)) filter.status = status;

    const items = await LostItem.find(filter)
      .populate("event") // refPath in LostItem will pick correct model
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json({ lostItems: items });
  } catch (err) {
    console.error("getMyLostItems error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET /api/lost-items/all?eventId=...&eventModel=Trip&status=unfound&createdByRole=Student
export const getAllLostItems = async (req, res) => {
  try {
    const { eventId, eventModel, status, createdByRole } = req.query;

    const filter = {};
    if (eventId) filter.event = eventId;
    if (eventModel) filter.eventModel = eventModel;
    if (status && ALLOWED_STATUS.includes(status)) filter.status = status;
    if (createdByRole) filter.createdByRole = createdByRole.toLowerCase();

    const items = await LostItem.find(filter)
      .populate("event")
      .populate("createdBy", "firstName lastName email role")
      .sort({ createdAt: -1 });

    res.json({ lostItems: items });
  } catch (err) {
    console.error("getAllLostItems error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// PATCH /api/lost-items/:id/status
export const updateLostItemStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!ALLOWED_STATUS.includes(status)) {
      return res.status(400).json({
        message: `Status must be one of: ${ALLOWED_STATUS.join(", ")}`,
      });
    }

    const item = await LostItem.findById(id);
    if (!item) {
      return res.status(404).json({ message: "Lost item not found" });
    }

    item.status = status;
    await item.save();

    // Populate before sending response
    await item.populate('event');
    await item.populate('createdBy', 'firstName lastName email');

    res.json({
      message: 'Status updated successfully',
      lostItem: item
    });
  } catch (err) {
    console.error("updateLostItemStatus error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};