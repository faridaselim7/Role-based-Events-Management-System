// backend/controllers/eventsController.js (ESM)
import mongoose from 'mongoose';
import EO_Conference from '../models/EO_Conference.js';
import Event from '../models/Event.js';
import VendorRequest from '../models/VendorRequest.js';
import Registration from '../models/Registration.js';
import BazaarApplication from '../models/BazaarApplication.js';
import Bazaar from '../models/Bazaar.js';
import { GymSession } from '../models/GymSession.js';
import Trip from '../models/Trip.js';
import { Workshop } from '../models/Workshop.js';
import QRCode from 'qrcode';
import { notifyEventCreated } from './notifyController.js';


/**
 * PATCH /api/events/:id/conference
 * Update a conference event's basic fields and nested "conference" object (partial).
 */
export async function editConference(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid event id' });
    }

    const { title, date, durationMins, conference } = req.body;
    const ev = await Event.findById(id);
    if (!ev) return res.status(404).json({ message: 'Event not found' });

    // If you use category on Event to distinguish types, keep this check:
    if (ev.category && ev.category !== 'conference') {
      return res.status(400).json({ message: 'Event is not a conference' });
    }

    if (title !== undefined) ev.title = title;
    if (date !== undefined) {
      const when = new Date(date);
      if (Number.isNaN(when.getTime())) {
        return res.status(400).json({ message: 'date is invalid' });
      }
      ev.startDate = when; // or ev.date depending on your model
    }
    if (durationMins !== undefined) ev.durationMins = Number(durationMins);

    if (conference && typeof conference === 'object') {
      const current =
        typeof ev.conference?.toObject === 'function'
          ? ev.conference.toObject()
          : (ev.conference || {});
      ev.conference = { ...current, ...conference };
    }

    await ev.save();
    return res.json(ev);
  } catch (e) {
    console.error('editConference error:', e);
    return res.status(500).json({ message: e.message || 'Server error' });
  }
}

/**
 * POST /api/events/gym
 * Create a gym session with validation and normalized "type".
 */
export async function createGymSession(req, res) {
  try {
    const { date, time, durationMins, type, maxParticipants } = req.body || {};
    const normType = String(type || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
    const allowed = ['yoga', 'pilates', 'aerobics', 'zumba', 'cross_circuit', 'kick_boxing'];

    if (!date) return res.status(400).json({ message: 'date is required' });
    if (!time) return res.status(400).json({ message: 'time is required' });
    if (!durationMins) return res.status(400).json({ message: 'durationMins is required' });
    if (!allowed.includes(normType)) {
      return res.status(400).json({ message: `type must be one of: ${allowed.join(', ')}` });
    }
    if (!maxParticipants || Number(maxParticipants) < 1) {
      
      return res.status(400).json({ message: 'maxParticipants must be >= 1' });
    }

    const when = new Date(`${date}T${time}`);
    if (Number.isNaN(when.getTime())) {
      return res.status(400).json({ message: 'date/time is invalid' });
    }

    const doc = await GymSession.create({
      date: when,
      time,
      durationMins: Number(durationMins),
      type: normType,
      maxParticipants: Number(maxParticipants),
      status: 'published',
    });
    await notifyEventCreated({
      event: doc,
     triggeredBy: req.user?._id,
    });

    return res.status(201).json(doc);
  } catch (e) {
    console.error('createGymSession error:', e);
    return res.status(500).json({ message: e.message || 'Server error' });
  }
}

/**
 * DELETE /api/events/:id
 * Only deletes events with zero registrations.
 */
export async function deleteEvent(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid event id' });
    }

    const ev = await Event.findById(id);
    if (!ev) return res.status(404).json({ message: 'Event not found' });

    const regs = await Registration.countDocuments({ event: id });
    if (regs > 0) {
      return res.status(409).json({
        message: 'Cannot delete: event has registrations',
        registrations: regs,
      });
    }

    await ev.deleteOne();
    return res.status(200).json({ message: 'Event deleted', id });
  } catch (e) {
    console.error('deleteEvent error:', e);
    return res.status(500).json({ message: e.message || 'Server error' });
  }
}

/**
 * GET /api/events/vendor-requests
 * Optional filters: ?category=bazaar|booth&status=pending|approved|rejected
 */
export async function getVendorRequests(req, res) {
  try {
    const category = String(req.query.category || '').trim().toLowerCase();
    const status = String(req.query.status || '').trim().toLowerCase();
    const q = {};

    if (['pending', 'approved', 'rejected'].includes(status)) q.status = status;
    if (category === 'bazaar' || category === 'booth') {
      const eventIds = await Event.find({ category }).distinct('_id');
      q.event = { $in: eventIds };
    }

    const docs = await VendorRequest.find(q)
      .sort({ createdAt: -1 })
      .populate('event', 'title category startDate');

    return res.json(docs);
  } catch (e) {
    console.error('getVendorRequests error:', e);
    return res.status(500).json({ message: e.message || 'Server error' });
  }
}

/**
 * GET /api/events/:eventId/vendor-requests
 */
export async function getVendorRequestsForEvent(req, res) {
  try {
    const { eventId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: 'Invalid event id' });
    }

    const ev = await Event.findById(eventId);
    if (!ev) return res.status(404).json({ message: 'Event not found' });
    if (!['bazaar', 'booth'].includes(ev.category)) {
      return res.status(400).json({ message: 'Event is not a bazaar or booth' });
    }

    const docs = await VendorRequest.find({ event: eventId })
      .sort({ createdAt: -1 })
      .populate('event', 'title category startDate');

    return res.json(docs);
  } catch (e) {
    console.error('getVendorRequestsForEvent error:', e);
    return res.status(500).json({ message: e.message || 'Server error' });
  }
}

/**
 * GET /api/events/vendor-requests/:id
 */
export async function getSingleVendorRequest(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid request id' });
    }

    const doc = await VendorRequest.findById(id)
      .populate('event', 'title category startDate');

    if (!doc) return res.status(404).json({ message: 'Vendor request not found' });
    return res.json(doc);
  } catch (e) {
    console.error('getSingleVendorRequest error:', e);
    return res.status(500).json({ message: e.message || 'Server error' });
  }
}


/**
 * PATCH /api/events/vendor-requests/:id/status
 * Body: { status: "approved" | "rejected" }
 */
export async function updateVendorRequestStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid vendor request id' });
    }

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be approved or rejected' });
    }

    const request = await VendorRequest.findById(id);
    if (!request) return res.status(404).json({ message: 'Vendor request not found' });

    request.status = status;
    await request.save();

    return res.json({
      message: `Vendor request ${status}`,
      request,
    });
  } catch (e) {
    console.error('updateVendorRequestStatus error:', e);
    return res.status(500).json({ message: e.message || 'Server error' });
  }
}

export const getPendingVendorRequests = async (req, res) => {
  try {
    const today = new Date();

    // Get upcoming bazaars
    const upcomingBazaars = await Bazaar.find({ startDateTime: { $gte: today } }).select('_id');
    const upcomingBazaarIds = upcomingBazaars.map(b => b._id);

    // Get pending applications for upcoming bazaars
    const pendingApplications = await BazaarApplication.find({
      status: 'Pending',
      bazaarId: { $in: upcomingBazaarIds }
    })
      .populate('vendorId', 'name email')
      .populate('bazaarId', 'name startDateTime endDateTime location');

    res.json(pendingApplications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


/**
 * ✅ Archive-related controllers for Events Office Dashboard
 * - GET /api/events/active
 * - GET /api/events/archived
 * - PATCH /api/events/:id/archive
 */

// Helper to normalize date for sorting/listing
function getEventDate(doc, type) {
  if (!doc) return null;
  switch (type) {
    case 'conference':
      return doc.startDate || doc.date || null;
    case 'workshop':
      return doc.startDate || null;
    case 'trip':
      return doc.startDateTime || null;
    case 'bazaar':
      return doc.startDateTime || null;
    case 'gym':
      return doc.date || null;
    default:
      return null;
  }
}

function normalize(doc, type) {
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    ...obj,
    category: type,
    date: getEventDate(obj, type),
  };
}

// Get only non-archived events from all collections
export async function getActiveEvents(req, res) {
  try {
    const [confs, workshops, trips, bazaars, gyms] = await Promise.all([
      EO_Conference.find({ archived: { $ne: true } }),
      Workshop.find({ archived: { $ne: true } }),
      Trip.find({ archived: { $ne: true } }),
      Bazaar.find({ archived: { $ne: true } }),
      GymSession.find({ archived: { $ne: true } }),
    ]);

    let all = [
      ...confs.map(e => normalize(e, 'conference')),
      ...workshops.map(e => normalize(e, 'workshop')),
      ...trips.map(e => normalize(e, 'trip')),
      ...bazaars.map(e => normalize(e, 'bazaar')),
      ...gyms.map(e => normalize(e, 'gym')),
    ];

    all = all.sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return da - db;
    });

    return res.json(all);
  } catch (e) {
    console.error('getActiveEvents error:', e);
    return res.status(500).json({ message: e.message || 'Server error' });
  }
}

// Get only archived events from all collections
export async function getArchivedEvents(req, res) {
  try {
    const [confs, workshops, trips, bazaars, gyms] = await Promise.all([
      EO_Conference.find({ archived: true }),
      Workshop.find({ archived: true }),
      Trip.find({ archived: true }),
      Bazaar.find({ archived: true }),
      GymSession.find({ archived: true }),
    ]);

    let all = [
      ...confs.map(e => normalize(e, 'conference')),
      ...workshops.map(e => normalize(e, 'workshop')),
      ...trips.map(e => normalize(e, 'trip')),
      ...bazaars.map(e => normalize(e, 'bazaar')),
      ...gyms.map(e => normalize(e, 'gym')),
    ];

    all = all.sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return db - da; // newest archived first
    });

    return res.json(all);
  } catch (e) {
    console.error('getArchivedEvents error:', e);
    return res.status(500).json({ message: e.message || 'Server error' });
  }
}

// Archive a single event (any type) only if it has already passed
export async function archiveEvent(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid event id' });
    }

    // Try each collection until we find the event
    let ev = null;
    let type = null;

    ev = await EO_Conference.findById(id);
    if (ev) type = 'conference';

    if (!ev) {
      ev = await Workshop.findById(id);
      if (ev) type = 'workshop';
    }
    if (!ev) {
      ev = await Trip.findById(id);
      if (ev) type = 'trip';
    }
    if (!ev) {
      ev = await Bazaar.findById(id);
      if (ev) type = 'bazaar';
    }
    if (!ev) {
      ev = await GymSession.findById(id);
      if (ev) type = 'gym';
    }

    if (!ev || !type) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Determine "end date" depending on type
    let end;
    switch (type) {
      case 'conference':
        end = ev.endDate || ev.startDate;
        break;
      case 'workshop':
        end = ev.endDate || ev.startDate;
        break;
      case 'trip':
        end = ev.endDateTime || ev.startDateTime;
        break;
      case 'bazaar':
        end = ev.endDateTime || ev.startDateTime;
        break;
      case 'gym': {
        const base = ev.date ? new Date(ev.date) : null;
        if (base && ev.durationMins) {
          end = new Date(base.getTime() + ev.durationMins * 60000);
        } else {
          end = base;
        }
        break;
      }
      default:
        end = null;
    }

    const now = new Date();
    if (end && end > now) {
      return res.status(400).json({
        message: 'Only events that have already passed can be archived',
      });
    }

    if (ev.archived) {
      return res.status(400).json({ message: 'Event is already archived' });
    }

    ev.archived = true;
    ev.archivedAt = new Date();
    await ev.save();

    return res.json({
      message: 'Event archived successfully',
      event: normalize(ev, type),
    });
  } catch (e) {
    console.error('archiveEvent error:', e);
    return res.status(500).json({ message: e.message || 'Server error' });
  }
}

/**
 * ✅ Generate QR code for external visitors to bazaars and career fairs
 * POST /api/events/:eventId/external-visitor-qr
 * Body: { eventType: "bazaar" | "conference", name, email }
 * Returns: { qrCode: "data:image/png;base64,...", payload: {...} }
 */
export async function generateExternalVisitorQr(req, res) {
  try {
    const { eventId } = req.params;
    const { eventType, name, email } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: 'Invalid event id' });
    }

    if (!eventType || !name || !email) {
      return res.status(400).json({
        message: 'eventType, name and email are required',
      });
    }

    const normalizedType = String(eventType).toLowerCase();
    if (!['bazaar', 'conference'].includes(normalizedType)) {
      return res.status(400).json({
        message: 'eventType must be "bazaar" or "conference"',
      });
    }

    // 1) Make sure the event actually exists
    let eventDoc = null;
    if (normalizedType === 'bazaar') {
      eventDoc = await Bazaar.findById(eventId).lean();
    } else {
      // conference / career fair
      eventDoc = await EO_Conference.findById(eventId).lean();
    }

    if (!eventDoc) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // 2) Build the payload that will be encoded into the QR
    const payload = {
      kind: 'external_visitor_pass',
      eventId,
      eventType: normalizedType,
      eventName:
        normalizedType === 'bazaar'
          ? eventDoc.name
          : eventDoc.title,
      visitorName: name,
      visitorEmail: email,
      issuedAt: new Date().toISOString(),
    };

    const text = JSON.stringify(payload);

    // 3) Generate a Data URL (easy to test in Postman / frontend)
    const qrDataUrl = await QRCode.toDataURL(text, {
      width: 300,
      margin: 2,
    });

    return res.json({
      qrCode: qrDataUrl, // "data:image/png;base64,...."
      payload,
    });
  } catch (e) {
    console.error('generateExternalVisitorQr error:', e);
    return res.status(500).json({ message: e.message || 'Server error' });
  }
}

/**
 * ✅ Attendance report for Events Office
 * GET /api/events/attendance-report
 * Query params (all optional):
 *  - status: "registered" | "attended"  (default: both)
 *  - eventType: "trip" | "workshop" | "bazaar" | "conference" | "gym"
 *  - name: substring of event name/title (case-insensitive)
 *  - dateFrom: ISO date (e.g. 2025-11-01)
 *  - dateTo: ISO date (e.g. 2025-11-30)
 *
 * Default: counts registrations with status in ["registered", "attended"]
 */
export async function getAttendanceReport(req, res) {
  try {
    const { status, eventType, name, dateFrom, dateTo } = req.query;

    // Build match filter for Registration
    const match = {};
    if (status) {
      // If user passes a specific status
      match.status = status;
    } else {
      // By default: count active + attended (ignore cancelled)
      match.status = { $in: ["registered", "attended"] };
    }

    // If eventType is provided, we can also pre-filter registrations by eventType
    if (eventType) {
      match.eventType = String(eventType).toLowerCase();
    }

    // 1) Group registrations by eventId + eventType
    const groups = await Registration.aggregate([
      { $match: match },
      {
        $group: {
          _id: { eventId: "$eventId", eventType: "$eventType" },
          totalAttendees: { $sum: 1 },
        },
      },
    ]);

    // 2) For each group, fetch event details from the correct collection
    let results = await Promise.all(
      groups.map(async (g) => {
        const { eventId, eventType } = g._id;
        let eventDoc = null;

        switch (eventType) {
          case "trip":
            eventDoc = await Trip.findById(eventId).lean();
            break;
          case "workshop":
            eventDoc = await Workshop.findById(eventId).lean();
            break;
          case "bazaar":
            eventDoc = await Bazaar.findById(eventId).lean();
            break;
          case "conference":
            eventDoc = await EO_Conference.findById(eventId).lean();
            break;
          case "gym":
            eventDoc = await GymSession.findById(eventId).lean();
            break;
          default:
            eventDoc = null;
        }

        // Event might have been deleted after registrations existed
        if (!eventDoc) {
          return {
            eventId,
            eventType,
            name: "Deleted / Unknown event",
            date: null,
            totalAttendees: g.totalAttendees,
          };
        }

        // Derive a name + date field for the report
        let nameField = "";
        let date = null;

        switch (eventType) {
          case "trip":
            nameField = eventDoc.name;
            date = eventDoc.startDateTime || null;
            break;
          case "bazaar":
            nameField = eventDoc.name;
            date = eventDoc.startDateTime || null;
            break;
          case "workshop":
            nameField = eventDoc.title;
            date = eventDoc.startDate || null;
            break;
          case "conference":
            nameField = eventDoc.title;
            date = eventDoc.startDate || eventDoc.date || null;
            break;
          case "gym":
            nameField = `${eventDoc.type} session`;
            date = eventDoc.date || null;
            break;
          default:
            nameField = "Unknown event";
        }

        return {
          eventId,
          eventType,
          name: nameField,
          date,
          totalAttendees: g.totalAttendees,
        };
      })
    );

    // 3) Apply extra filters on the *joined* results

    // Filter by eventType (again, in case some weird casing slipped through)
    if (eventType) {
      const t = String(eventType).toLowerCase();
      results = results.filter(
        (r) => String(r.eventType).toLowerCase() === t
      );
    }

    // Filter by name (substring, case-insensitive)
    if (name) {
      const n = String(name).toLowerCase().trim();
      results = results.filter(
        (r) => r.name && r.name.toLowerCase().includes(n)
      );
    }

    // Filter by date range (dateFrom, dateTo)
    if (dateFrom || dateTo) {
      const from = dateFrom ? new Date(dateFrom) : null;
      const to = dateTo ? new Date(dateTo) : null;

      results = results.filter((r) => {
        if (!r.date) return false;
        const d = new Date(r.date);
        if (Number.isNaN(d.getTime())) return false;
        if (from && d < from) return false;
        if (to && d > to) return false;
        return true;
      });
    }

    // 4) Compute total attendees across filtered events
    const totalAttendees = results.reduce(
      (sum, r) => sum + r.totalAttendees,
      0
    );

    // 5) Sort events by date ascending
    results.sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return da - db;
    });

    return res.json({
      totalEvents: results.length,
      totalAttendees,
      events: results,
    });
  } catch (e) {
    console.error("getAttendanceReport error:", e);
    return res.status(500).json({ message: e.message || "Server error" });
  }
}


export async function getSalesReport(req, res) {
  try {
    const {
      status,
      eventType,
      name,
      dateFrom,
      dateTo,
      sortBy: sortByRaw,
      sortOrder: sortOrderRaw,
    } = req.query;

    // Build match filter for Registration
    const match = {};
    if (status) {
      match.status = status;
    } else {
      // Default: registered + attended
      match.status = { $in: ["registered", "attended"] };
    }

    if (eventType) {
      match.eventType = String(eventType).toLowerCase();
    }

    // 1) Group registrations by eventId + eventType
    const groups = await Registration.aggregate([
      { $match: match },
      {
        $group: {
          _id: { eventId: "$eventId", eventType: "$eventType" },
          totalAttendees: { $sum: 1 },
        },
      },
    ]);

    // 2) For each group, fetch event details & compute revenue
    let results = await Promise.all(
      groups.map(async (g) => {
        const { eventId, eventType } = g._id;
        let eventDoc = null;

        switch (eventType) {
          case "trip":
            eventDoc = await Trip.findById(eventId).lean();
            break;
          case "workshop":
            eventDoc = await Workshop.findById(eventId).lean();
            break;
          case "bazaar":
            eventDoc = await Bazaar.findById(eventId).lean();
            break;
          case "conference":
            eventDoc = await EO_Conference.findById(eventId).lean();
            break;
          case "gym":
            eventDoc = await GymSession.findById(eventId).lean();
            break;
          default:
            eventDoc = null;
        }

        // Event might have been deleted
        if (!eventDoc) {
          return {
            eventId,
            eventType,
            name: "Deleted / Unknown event",
            date: null,
            unitPrice: 0,
            totalAttendees: g.totalAttendees,
            revenue: 0,
          };
        }

        let nameField = "";
        let date = null;
        let unitPrice = 0;

        switch (eventType) {
          case "trip":
            nameField = eventDoc.name;
            date = eventDoc.startDateTime || null;
            unitPrice = eventDoc.price || 0;
            break;
          case "bazaar":
            nameField = eventDoc.name;
            date = eventDoc.startDateTime || null;
            unitPrice = eventDoc.price || 0;
            break;
          case "workshop":
            nameField = eventDoc.title;
            date = eventDoc.startDate || null;
            unitPrice = eventDoc.price || 0;
            break;
          case "conference":
            nameField = eventDoc.title;
            date = eventDoc.startDate || eventDoc.date || null;
            unitPrice = eventDoc.price || 0;
            break;
          case "gym":
            nameField = `${eventDoc.type} session`;
            date = eventDoc.date || null;
            unitPrice = eventDoc.price || 0;
            break;
          default:
            nameField = "Unknown event";
            unitPrice = 0;
        }

        const revenue = unitPrice * g.totalAttendees;

        return {
          eventId,
          eventType,
          name: nameField,
          date,
          unitPrice,
          totalAttendees: g.totalAttendees,
          revenue,
        };
      })
    );

    // 3) Apply filters on joined results

    // Filter by eventType again (just in case)
    if (eventType) {
      const t = String(eventType).toLowerCase();
      results = results.filter(
        (r) => String(r.eventType).toLowerCase() === t
      );
    }

    // Filter by name substring
    if (name) {
      const n = String(name).toLowerCase().trim();
      results = results.filter(
        (r) => r.name && r.name.toLowerCase().includes(n)
      );
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      const from = dateFrom ? new Date(dateFrom) : null;
      const to = dateTo ? new Date(dateTo) : null;

      results = results.filter((r) => {
        if (!r.date) return false;
        const d = new Date(r.date);
        if (Number.isNaN(d.getTime())) return false;
        if (from && d < from) return false;
        if (to && d > to) return false;
        return true;
      });
    }

    // 4) Totals
    const totalAttendees = results.reduce(
      (sum, r) => sum + r.totalAttendees,
      0
    );
    const totalRevenue = results.reduce(
      (sum, r) => sum + r.revenue,
      0
    );

    // 5) Sorting: by date or revenue, asc/desc
    const sortBy = (sortByRaw || "date").toLowerCase();
    const sortOrder = (sortOrderRaw || "asc").toLowerCase();
    const factor = sortOrder === "desc" ? -1 : 1;

    results.sort((a, b) => {
      let va = 0;
      let vb = 0;

      if (sortBy === "revenue") {
        va = a.revenue || 0;
        vb = b.revenue || 0;
      } else {
        // default: sort by date
        const da = a.date ? new Date(a.date).getTime() : 0;
        const db = b.date ? new Date(b.date).getTime() : 0;
        va = da;
        vb = db;
      }

      if (va < vb) return -1 * factor;
      if (va > vb) return 1 * factor;
      return 0;
    });

    return res.json({
      totalEvents: results.length,
      totalAttendees,
      totalRevenue,
      events: results,
    });
  } catch (e) {
    console.error("getSalesReport error:", e);
    return res.status(500).json({ message: e.message || "Server error" });
  }
}

export async function editGymSession(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid event id" });
    }

    const { date, time, durationMins } = req.body || {};

    // At least one editable field must be provided
    if (
      date === undefined &&
      time === undefined &&
      durationMins === undefined
    ) {
      return res
        .status(400)
        .json({ message: "Provide date, time and/or durationMins to update" });
    }

    const ev = await Event.findById(id);
    if (!ev) return res.status(404).json({ message: "Event not found" });

    if (ev.category !== "gym") {
      return res.status(400).json({ message: "Event is not a gym session" });
    }

    // --- Handle date & time update (same style as createGymSession) ---
    let when = ev.date; // start from current date/time

    // If a new date is provided, start from that
    if (date !== undefined) {
      const base = new Date(date);
      if (Number.isNaN(base.getTime())) {
        return res.status(400).json({ message: "date is invalid" });
      }
      when = base;
    }

    // If a new time is provided, combine date + time
    if (time !== undefined) {
      // Use the updated date if provided, otherwise current event date
      const dateStr =
        date !== undefined
          ? date
          : when.toISOString().slice(0, 10); // "YYYY-MM-DD"

      const combined = new Date(`${dateStr}T${time}`);
      if (Number.isNaN(combined.getTime())) {
        return res.status(400).json({ message: "time is invalid" });
      }
      when = combined;
    }

    // Apply the new datetime if either date or time was sent
    if (date !== undefined || time !== undefined) {
      ev.date = when;
    }

    // Only update durationMins (do NOT touch title, type, maxParticipants, etc.)
    if (durationMins !== undefined) {
      const num = Number(durationMins);
      if (Number.isNaN(num) || num <= 0) {
        return res
          .status(400)
          .json({ message: "durationMins must be a positive number" });
      }
      ev.durationMins = num;
    }

    await ev.save();
    return res.json(ev);
  } catch (e) {
    console.error("editGymSession error:", e);
    return res.status(500).json({ message: e.message || "Server error" });
  }
}