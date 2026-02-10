// import express from "express";
// import { registerEvent, getMyRegistrations } from "../controllers/eventController.js";
// const router = express.Router();

// router.post("/register", registerEvent);
// router.get("/my-registrations", getMyRegistrations);

// export default router;
import { notifyEventCreated } from "../controllers/notifyController.js";
import express from 'express';
import mongoose from 'mongoose'; // ✅ added for ObjectId validation
import Bazaar from '../models/Bazaar.js';
import Trip from '../models/Trip.js';
import { Workshop } from '../models/Workshop.js';
import Event from '../models/Event.js';
import { requireRole } from '../middleware/requireRole.js';
import jwt from 'jsonwebtoken';
import { getAllUpcomingEvents } from '../controllers/allEventsController.js';
import {
  editConference,
  createGymSession,
  deleteEvent,
  getVendorRequests,
  getVendorRequestsForEvent,
  getSingleVendorRequest,
  updateVendorRequestStatus, 
  getActiveEvents,
  getArchivedEvents,
  archiveEvent,
  generateExternalVisitorQr,
  getAttendanceReport, // ✅ NEW
  getSalesReport, 
  editGymSession, 
} from '../controllers/eventsController.js';
import { registerEvent, getMyRegistrations, exportEventRegistrations } from '../controllers/eventController.js';
import { listVendorRequests } from "../controllers/vendorController.js";
import { GymSession } from '../models/GymSession.js';
import requireEventsOffice from '../middleware/requireEventsOffice.js'; // ✅ NEW
import { listLoyaltyVendors } from "../controllers/VendorDocumentController.js"; // ✅ NEW

import { filterEvents, sortEvents } from "../controllers/eventQueryController.js";
import { rateEvent, commentOnEvent, getEventRatings, deleteComment,
  addFavorite, removeFavorite, listFavorites } from "../controllers/eventRatingController.js";
import { getEventReviews, deleteEventReview } from "../controllers/eventRatingController.js";
import { listAllEvents } from "../controllers/eventsAggregateController.js";

const router = express.Router();
const allowAdminOrEvents = requireRole('admin', 'events_office');
const requireAttendee = requireRole('student', 'staff', 'ta', 'professor');
const requireRatingViewer = requireRole('student', 'staff', 'ta', 'professor', 'events_office', 'admin');
const requireAdminOnly = requireRole('admin');
const requireLoyaltyViewer = requireRole('student', 'staff', 'ta', 'professor', 'events_office', 'admin'); // ✅ NEW

// Inline auth (uses JWT from Authorization header) – no new files created
const requireAuth = (req, res, next) => {
  const auth = req.headers.authorization || '';
  const [scheme, token] = auth.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Authorization token missing' });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload?.id || !payload?.role) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }
    req.user = { id: payload.id, role: payload.role };
    return next();
  } catch (e) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

//view list of events
router.get('/my-events', async (req, res) => {
  try {
    const { userId, userType } = req.query;

    if (!userId || !userType) {
      return res.status(400).json({ 
        message: 'Missing required parameters: userId and userType' 
      });
    }

    // Find all registrations for this user from Registration model
    const Registration = (await import('../models/Registration.js')).default;
    
    const registrations = await Registration.find({ 
      userId,
      userType: userType.toLowerCase(),
      status: 'registered' 
    }).sort({ registrationDate: -1 });

    // Fetch full event details for each registration
    const eventsWithDetails = await Promise.all(
      registrations.map(async (reg) => {
        let event = null;
        
        try {
          switch (reg.eventType) {
            case 'workshop':
              event = await Workshop.findById(reg.eventId).lean();
              if (event) {
                event.eventType = 'workshop';
                event.date = event.startDateTime;
                event.capacity = event.maxParticipants || 50;
                event.currentRegistrations = await Registration.countDocuments({ 
                  eventId: reg.eventId, 
                  status: 'registered' 
                });
              }
              break;
              
            case 'trip':
              event = await Trip.findById(reg.eventId).lean();
              if (event) {
                event.eventType = 'trip';
                event.title = event.name;
                event.date = event.startDateTime;
                event.capacity = event.maxParticipants || 40;
                event.currentRegistrations = await Registration.countDocuments({ 
                  eventId: reg.eventId, 
                  status: 'registered' 
                });
              }
              break;
              
            case 'bazaar':
              event = await Bazaar.findById(reg.eventId).lean();
              if (event) {
                event.eventType = 'bazaar';
                event.title = event.name;
                event.date = event.startDateTime;
                event.capacity = event.maxParticipants || 100;
                event.currentRegistrations = await Registration.countDocuments({ 
                  eventId: reg.eventId, 
                  status: 'registered' 
                });
              }
              break;
              
            case 'conference':
              event = await Event.findById(reg.eventId).lean();
              if (event) {
                event.eventType = 'conference';
                event.location = event.conference?.location;
                event.capacity = 200;
                event.currentRegistrations = await Registration.countDocuments({ 
                  eventId: reg.eventId, 
                  status: 'registered' 
                });
              }
              break;
              
            case 'gym':
              event = await GymSession.findById(reg.eventId).lean();
              if (event) {
                event.eventType = 'gym';
                event.title = `${event.type} Session`;
                event.capacity = event.maxParticipants || 20;
                event.currentRegistrations = await Registration.countDocuments({ 
                  eventId: reg.eventId, 
                  status: 'registered' 
                });
              }
              break;
          }

          if (event) {
            // Determine status based on date
            const now = new Date();
            const eventDate = new Date(event.date);
            const endDate = event.endDateTime ? new Date(event.endDateTime) : eventDate;
            
            if (event.status === 'cancelled') {
              event.status = 'cancelled';
            } else if (now > endDate) {
              event.status = 'completed';
            } else if (now >= eventDate && now <= endDate) {
              event.status = 'ongoing';
            } else {
              event.status = 'upcoming';
            }
            
            return event;
          }
        } catch (err) {
          console.error(`Error fetching event ${reg.eventId}:`, err);
        }
        
        return null;
      })
    );

    // Filter out null events (deleted or not found)
    const validEvents = eventsWithDetails.filter(e => e !== null);

    res.json(validEvents);
  } catch (error) {
    console.error('Error fetching my events:', error);
    res.status(500).json({ 
      message: 'Failed to fetch registered events',
      error: error.message 
    });
  }
});
// Routes from events.js
// Req 31: Create Bazaar

router.post('/bazaars', async (req, res) => {
  console.log('Create bazaar data:', req.body);
  try {
    const bazaar = new Bazaar(req.body);
    await bazaar.save();

    await notifyEventCreated({
      event: bazaar,
      triggeredBy: req.user?._id,
    });


    res.status(201).send(bazaar);
  } catch (err) {
    res.status(400).send(err);
  }
});

// Req 32: Edit Bazaar
router.put('/bazaars/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    console.log('Bazaar update data:', updateData);
    if (!updateData || typeof updateData !== 'object' || Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'Invalid update data' });
    }
    const bazaar = await Bazaar.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true });
    if (!bazaar) return res.status(404).json({ message: 'Bazaar not found' });
    res.json(bazaar);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ NEW: Delete Bazaar
router.delete('/bazaars/:id', allowAdminOrEvents, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid bazaar id' });
    }
    const doc = await Bazaar.findById(id);
    if (!doc) return res.status(404).json({ message: 'Bazaar not found' });
    await doc.deleteOne();
    res.json({ message: 'Bazaar deleted', id });
  } catch (e) {
    res.status(500).json({ message: e.message || 'Server error' });
  }
});

// Req 33: Create Trip
router.post('/trips', async (req, res) => {
  console.log('Create trip data:', req.body);
  try {
    const trip = new Trip(req.body);
    await trip.save();

    await notifyEventCreated({
     event: trip,
     triggeredBy: req.user?._id,
    });


    res.status(201).send(trip);
  } catch (err) {
    res.status(400).send(err);
  }
});

// Req 34: Edit Trip
router.put('/trips/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    console.log('Trip update data:', updateData);
    if (!updateData || typeof updateData !== 'object' || Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'Invalid update data' });
    }
    const trip = await Trip.findById(id);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    const currentDate = new Date();
    if (currentDate > new Date(trip.endDateTime)) {
      return res.status(403).json({ message: 'Cannot edit a trip that has already passed' });
    }

    const updatedTrip = await Trip.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true });
    res.json(updatedTrip);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ NEW: Delete Trip
router.delete('/trips/:id', allowAdminOrEvents, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid trip id' });
    }
    const doc = await Trip.findById(id);
    if (!doc) return res.status(404).json({ message: 'Trip not found' });
    await doc.deleteOne();
    res.json({ message: 'Trip deleted', id });
  } catch (e) {
    res.status(500).json({ message: e.message || 'Server error' });
  }
});

// GET routes
router.get('/bazaars', async (req, res) => {
  try {
    const bazaars = await Bazaar.find();
    res.status(200).send(bazaars);
  } catch (err) {
    res.status(500).send(err);
  }
});

router.get('/trips', async (req, res) => {
  try {
    const trips = await Trip.find();
    res.status(200).send(trips);
  } catch (err) {
    res.status(500).send(err);
  }
});

// Public: list upcoming workshops for everyone (students/staff/TA/professors)
// Returns an array of workshops (no auth required)
router.get('/workshops', async (req, res) => {
  try {
    const now = new Date();

    const filter = {
      published: true,
      archived: { $ne: true },
      startDate: { $gt: now },
      // Only include workshops whose registration deadline hasn't passed
      $or: [
        { registrationDeadline: { $exists: false } },
        { registrationDeadline: { $gt: now } }
      ]
    };

    const docs = await Workshop.find(filter)
      .sort({ startDate: 1 })
      .populate('professorsParticipating', 'firstName lastName')
      .lean();

    // Normalize minimal fields for frontend
    const workshops = docs.map(w => ({
      _id: w._id,
      title: w.title,
      name: w.title,
      description: w.description || w.shortDescription || "",
      facultyResponsible: w.facultyResponsible,
      professorsParticipating: (w.professorsParticipating || []).map(p => ({ _id: p._id, firstName: p.firstName, lastName: p.lastName })),
      professorsParticipatingNames: w.professorsParticipatingNames || "",
      startDate: w.startDate,
      endDate: w.endDate,
      registrationDeadline: w.registrationDeadline,
      location: w.location,
      capacity: w.capacity,
      price: w.price || w.price === 0 ? w.price : (w.requiredBudget || 0),
      eventType: 'workshop'
    }));

    res.json(workshops);
  } catch (err) {
    console.error('Error fetching public workshops:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

router.get('/bazaars/:id', async (req, res) => {
  try {
    const bazaar = await Bazaar.findById(req.params.id);
    if (!bazaar) return res.status(404).send('Bazaar not found');
    res.send(bazaar);
  } catch (err) {
    res.status(400).send(err);
  }
});

router.get('/trips/:id', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).send('Trip not found');
    res.send(trip);
  } catch (err) {
    res.status(400).send(err);
  }
});

// Favorites (Student/Staff/TA/Professor)
router.post('/:eventType/:eventId/favorite', requireAuth, requireAttendee, addFavorite);
router.delete('/:eventType/:eventId/favorite', requireAuth, requireAttendee, removeFavorite);
router.get('/favorites', requireAuth, requireAttendee, listFavorites);

// Feedback (unchanged)
router.post('/:eventType/:eventId/rate', requireAuth, requireAttendee, rateEvent);
router.post('/:eventType/:eventId/comment', requireAuth, requireAttendee, commentOnEvent);
router.get('/:eventType/:eventId/ratings', requireAuth, requireRatingViewer, getEventRatings);
router.delete('/:eventType/:eventId/ratings/:userId/comment', requireAuth, requireAdminOnly, deleteComment);

// ✅ GET: Event details by ID (works for all types)
router.get('/:id/details', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid event ID' });
    }

    // Try to find in all collections
    let event =
      (await Bazaar.findById(id).populate('vendors').lean()) ||
      (await Trip.findById(id).lean()) ||
      (await Workshop.findById(id).lean()) ||
      (await Event.findById(id).lean());

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Identify the type
    if (event.category) {
      event.category = event.category.toLowerCase();
    } else if (event.vendors) {
      event.category = 'bazaar';
    }

    // If bazaar, also fetch vendors if not populated
    if (event.category === 'bazaar' && event.vendors?.length > 0) {
      const Vendor = (await import('../models/Vendor.js')).default;
      const vendors = await Vendor.find({ _id: { $in: event.vendors } }).lean();
      event.vendors = vendors;
    }

    res.json(event);
  } catch (err) {
    console.error('Error fetching event details:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


// Roles allowed to view events
router.get('/upcoming', getAllUpcomingEvents);

// ✅ NEW: Events Office archive routes
router.get('/active', requireEventsOffice, getActiveEvents);
router.get('/archived', requireEventsOffice, getArchivedEvents);
router.patch('/:id/archive', requireEventsOffice, archiveEvent);

// ✅ NEW: Attendance report (Events Office)
router.get('/attendance-report', requireEventsOffice, getAttendanceReport);


// backend/routes/events.js
router.get("/search", async (req, res) => {
  try {
    const { name, type, professor } = req.query;
    let results = [];

    const regex = (val) => ({ $regex: val.trim(), $options: "i" });

    // Define all event types
    const eventTypes = [
      { model: Bazaar, category: "bazaar", nameField: "name" },
      { model: Trip, category: "trip", nameField: "name" },
      { model: Workshop, category: "workshop", nameField: "title" },
      { model: Event, category: "conference", nameField: "title" },
    ];

    for (const { model, category, nameField } of eventTypes) {
      // Only include this category if type matches or user typed category name
      if (!type || type.toLowerCase() === category || name?.toLowerCase() === category) {
        const filter = {};

        // Apply name filter only if it's not the same as category
        if (name && name.toLowerCase() !== category) {
          filter[nameField] = regex(name);
        }

        // Apply professor filter for Workshops and Conferences
        if (professor && ["workshop", "conference"].includes(category)) {
          filter.facultyResponsible = regex(professor);
        }

        const docs = await model.find(filter).lean();
        results.push(...docs.map((d) => ({ ...d, category })));
      }
    }

    res.json({ count: results.length, events: results });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ message: err.message });
  }
});


// Health
router.get('/ping', (_req, res) => res.json({ ok: true }));

// Events
router.patch('/:id/conference', allowAdminOrEvents, editConference);
router.post('/GymSession', allowAdminOrEvents, createGymSession);


router.get('/GymSession', allowAdminOrEvents, async (req, res) => {
  try {
    const docs = await GymSession.find().sort({ date: -1 });
    res.json(docs);
  } catch (e) {
    res.status(500).json({ message: e.message || 'Server error' });
  }
});

// Update gym session - CHANGE THIS
router.patch('/:id/GymSession', allowAdminOrEvents, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid gym session id' });
    }

    const { date, time, durationMins, type, maxParticipants } = req.body;

    const session = await GymSession.findById(id);
    if (!session) return res.status(404).json({ message: 'Gym session not found' });

    if (durationMins !== undefined) session.durationMins = Number(durationMins);
    if (maxParticipants !== undefined) session.maxParticipants = Number(maxParticipants);
    if (type) {
      const norm = String(type).trim().toLowerCase().replace(/[\s-]+/g, '_');
      session.type = norm;
    }
    if (date && time) {
      const when = new Date(`${date}T${time}`);
      if (Number.isNaN(when.getTime())) {
        return res.status(400).json({ message: 'date/time is invalid' });
      }
      session.date = when;
      session.time = time;
    }

    await session.save();
    res.json(session);
  } catch (e) {
    res.status(500).json({ message: e.message || 'Server error' });
  }
});

router.delete('/:id/GymSession', allowAdminOrEvents, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Deleting gym session:', id); // Debug log
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid gym session id' });
    }

    const session = await GymSession.findById(id);
    if (!session) {
      console.log('Gym session not found:', id); // Debug log
      return res.status(404).json({ message: 'Gym session not found' });
    }

    await session.deleteOne();
    console.log('Gym session deleted successfully:', id); // Debug log
    res.json({ message: 'Gym session deleted', id });
  } catch (e) {
    console.error('Delete gym session error:', e);
    res.status(500).json({ message: e.message || 'Server error' });
  }
});


router.delete('/:id', allowAdminOrEvents, deleteEvent);

// Vendor requests
//router.get('/vendor-requests', allowAdminOrEvents, getVendorRequests);
router.get('/:eventId/vendor-requests', allowAdminOrEvents, getVendorRequestsForEvent);
router.get('/vendor-requests/:id', allowAdminOrEvents, getSingleVendorRequest);
router.patch('/vendor-requests/:id', allowAdminOrEvents, updateVendorRequestStatus);

// Routes from eventRoutes.js
router.post('/register', registerEvent);
router.get('/my-registrations', getMyRegistrations);

// ✅ NEW: Export registrations (Events Office only, except conferences)
router.get('/:eventId/export-registrations', requireEventsOffice, exportEventRegistrations);

// Add this route
router.get("/vendor-requests", listVendorRequests);
// ✅ Generate QR code for external visitors (bazaars + career fairs/conferences)
router.post(
  '/:eventId/external-visitor-qr',
  requireEventsOffice,
  generateExternalVisitorQr
);
// ✅ NEW: Attendance report (Events Office)
router.get('/attendance-report', requireEventsOffice, getAttendanceReport);

// ✅ NEW: Sales report (Events Office)
router.get('/sales-report', requireEventsOffice, getSalesReport);

// ✅ NEW: Loyalty vendors list (Students/Staff/TA/Professor/Events Office/Admin)
router.get('/loyalty-vendors', requireLoyaltyViewer, listLoyaltyVendors);

router.get("/filter", filterEvents);
router.get("/sort", sortEvents);
router.get("/all", listAllEvents);
router.get("/:eventId/reviews", getEventReviews);
router.delete("/reviews/:reviewId", deleteEventReview);

export default router;
