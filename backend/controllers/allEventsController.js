// controllers/allEventsController.js
import Event from '../models/Event.js';
import {Workshop} from '../models/Workshop.js';
import Trip from '../models/Trip.js';
import Bazaar from '../models/Bazaar.js';
import EO_Conference from '../models/EO_Conference.js';
import BazaarApplication from '../models/BazaarApplication.js';
import Vendor from '../models/Vendor.js';

const USER_TYPES = ["Student", "Staff", "TA", "Professor"];

function normalizeUserType(rawType) {
  if (!rawType) return null;
  return (
    USER_TYPES.find(
      (t) => t.toLowerCase() === String(rawType).toLowerCase()
    ) || null
  );
}

function buildAudienceFilter(rawType) {
  const normalized = normalizeUserType(rawType);

  if (!normalized) return {};

  return {
    $or: [
      { allowedUserTypes: { $exists: false } },
      { allowedUserTypes: { $size: 0 } },
      { allowedUserTypes: normalized },
    ],
  };
}

/**
 * GET /api/events/upcoming
 * Returns all upcoming events from all event types.
 * Includes vendors for bazaars and booths.
 */
export async function getAllUpcomingEvents(req, res) {
  try {
    const now = new Date();

    const rawUserType = req.user?.role || req.query.userType;
    const audienceFilter = buildAudienceFilter(rawUserType);

    // 1️⃣ Gather upcoming events from all collections
    const [
      events,
      workshops,
      trips,
      bazaars,
      conferences
    ] = await Promise.all([
      Event.find({ status: 'published', date: { $gte: now } }).lean(),

      // Workshops – requirement for restriction is for bazaar/trip/gym/conference,
      // so leave workshops logic unchanged for now.
   // ✅ Workshops: now also filtered by allowedUserTypes
Workshop.find({
  published: true,
  startDate: { $gte: now },
  ...audienceFilter,
}).lean(),


      // ✅ Trips: apply allowedUserTypes filtering
      Trip.find({
        startDateTime: { $gte: now },
        ...audienceFilter,
      }).lean(),
      Bazaar.find({
        startDateTime: { $gte: now },
        ...audienceFilter,
      }).lean(),
      EO_Conference.find({
        published: true,
        endDate: { $gte: now },
        ...audienceFilter,
      }).lean(),
    ]);

    // 2️⃣ Attach vendors for bazaars
    const bazaarIds = bazaars.map(b => b._id);
    const applications = await BazaarApplication.find({
      bazaarId: { $in: bazaarIds },
      status: 'Accepted'
    })
      .populate('vendorId', 'companyName email')
      .lean();

    const bazaarWithVendors = bazaars.map(b => {
      const vendors = applications
        .filter(app => app.bazaarId.toString() === b._id.toString())
        .map(app => app.vendorId);
      return { ...b, vendors };
    });

    // 3️⃣ FIXED: Add type and category to each event based on its source
    const typedEvents = events.map(e => ({
      ...e,
      type: 'Event',
      category: 'event'
    }));

    const typedWorkshops = workshops.map(w => ({
      ...w,
      type: 'Workshop',
      category: 'workshop'
    }));

    const typedTrips = trips.map(t => ({
      ...t,
      type: 'Trip',
      category: 'trip'
    }));

    const typedBazaars = bazaarWithVendors.map(b => ({
      ...b,
      type: 'Bazaar',
      category: 'bazaar'
    }));

    const typedConferences = conferences.map(c => ({
      ...c,
      type: 'Conference',
      category: 'conference'
    }));

    // 4️⃣ Merge all events
    const allEvents = [
      ...typedEvents,
      ...typedWorkshops,
      ...typedTrips,
      ...typedBazaars,
      ...typedConferences
    ];

    // 5️⃣ Sort by date
    allEvents.sort((a, b) => {
      const dateA = a.date || a.startDate || a.startDateTime || new Date();
      const dateB = b.date || b.startDate || b.startDateTime || new Date();
      return new Date(dateA) - new Date(dateB);
    });

    if (allEvents.length === 0) {
      return res.status(404).json({ message: 'No upcoming events found' });
    }

    return res.status(200).json({
      message: 'Upcoming events retrieved successfully',
      count: allEvents.length,
      events: allEvents
    });

  } catch (err) {
    console.error('getAllUpcomingEvents error:', err);
    return res.status(500).json({ message: err.message || 'Server error' });
  }
}