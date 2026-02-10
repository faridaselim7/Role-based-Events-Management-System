// controllers/eventQueryController.js
import Event from "../models/Event.js";
import { Workshop } from "../models/Workshop.js";
import Trip from "../models/Trip.js";
import Bazaar from "../models/Bazaar.js";
import EO_Conference from "../models/EO_Conference.js";

/**
 * Requirement 13 (enhanced):
 * Filter events by name (including professor names for workshop / conference),
 * location (STRICT: if provided must match), type, or date.
 */
export async function filterEvents(req, res) {
  try {
    const { name, location, type, date, dateStart, dateEnd, sort } = req.query;

    const escapeRegExp = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const makeNameRegex = (val) => {
      if (!val) return undefined;
      const q = String(val).trim();
      if (!q) return undefined;
      const escaped = escapeRegExp(q);
      const short = escaped.length <= 3;
      const pattern = short ? `\\b${escaped}\\b` : escaped;
      return new RegExp(pattern, "i");
    };
    const makeRegex = (val) => (val ? new RegExp(escapeRegExp(String(val).trim()), "i") : undefined);

    // Date parsing helpers
    const parseSingleDay = (val) => {
      if (!val) return null;
      const raw = String(val).trim();
      const m = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      let d;
      if (m) {
        d = new Date(parseInt(m[3], 10), parseInt(m[2], 10) - 1, parseInt(m[1], 10));
      } else {
        d = new Date(raw);
      }
      if (isNaN(d)) return null;
      return {
        start: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0),
        end: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999),
      };
    };

    const toDate = (v) => {
      if (!v) return null;
      const d = new Date(v);
      return isNaN(d) ? null : d;
    };
    // If strictWithin is true, only include events fully within the range
    const occursInRange = (obj, rangeStart, rangeEnd, strictWithin = false) => {
      if (!rangeStart || !rangeEnd) return true;

      // Extract start/end for each event type
      let start = null, end = null;
      if (obj._kind === 'conference' && obj.conference) {
        start = toDate(obj.conference.startDate);
        end = toDate(obj.conference.endDate);
      } else if (obj._kind === 'conference_eo') {
        start = toDate(obj.startDate);
        end = toDate(obj.endDate);
      } else if (obj._kind === 'workshop') {
        start = toDate(obj.startDateTime) || toDate(obj.startDate) || toDate(obj.date);
        end = toDate(obj.endDateTime) || toDate(obj.endDate) || toDate(obj.date);
      } else if (obj._kind === 'trip' || obj._kind === 'bazaar') {
        start = toDate(obj.startDate) || toDate(obj.date);
        end = toDate(obj.endDate) || toDate(obj.date);
      } else {
        // fallback for generic events
        start = toDate(obj.startDateTime) || toDate(obj.startDate) || toDate(obj.date);
        end = toDate(obj.endDateTime) || toDate(obj.endDate) || toDate(obj.date);
      }
      if (!start && !end) return false;
      if (!start) start = end;
      if (!end) end = start;
      if (strictWithin) {
        // Event must start >= rangeStart and end <= rangeEnd
        return start >= rangeStart && end <= rangeEnd;
      }
      // Default: any overlap
      return start <= rangeEnd && end >= rangeStart;
    };

    const nameRegex = makeNameRegex(name);
    const locationRegex = makeRegex(location);
    const rawTypes = type ? String(type).split(",").map((t) => t.trim().toLowerCase()).filter(Boolean) : [];
    const wantAll = rawTypes.length === 0 || rawTypes.includes("all");
    const typeRequested = (kind) => wantAll || rawTypes.includes(kind);

    // Determine range: priority dateStart/dateEnd over single 'date'
    let rangeStart = null, rangeEnd = null;
    let strictWithin = false;
    // Helper to parse dd/mm/yyyy or yyyy-mm-dd
    function parseDateInput(val) {
      if (!val) return null;
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
        // dd/mm/yyyy
        const [day, month, year] = val.split("/").map(Number);
        return new Date(year, month - 1, day);
      }
      // fallback to Date constructor
      const d = new Date(val);
      return isNaN(d) ? null : d;
    }
    if (dateStart || dateEnd) {
      const ds = parseDateInput(dateStart);
      const de = parseDateInput(dateEnd);
      if (ds && de) {
        rangeStart = new Date(ds.getFullYear(), ds.getMonth(), ds.getDate(), 0, 0, 0, 0);
        rangeEnd = new Date(de.getFullYear(), de.getMonth(), de.getDate(), 23, 59, 59, 999);
        strictWithin = true;
      } else if (ds && !de) {
        rangeStart = new Date(ds.getFullYear(), ds.getMonth(), ds.getDate(), 0, 0, 0, 0);
        rangeEnd = new Date(ds.getFullYear(), ds.getMonth(), ds.getDate(), 23, 59, 59, 999);
      } else if (!ds && de) {
        rangeStart = new Date(de.getFullYear(), de.getMonth(), de.getDate(), 0, 0, 0, 0);
        rangeEnd = new Date(de.getFullYear(), de.getMonth(), de.getDate(), 23, 59, 59, 999);
      }
    } else if (date) {
      const day = parseSingleDay(date);
      if (!day && date) return res.status(400).json({ message: "Invalid date format" });
      if (day) {
        rangeStart = day.start;
        rangeEnd = day.end;
      }
    }

    const results = [];

    // --- Type counts for dropdown: apply all filters except type ---
    const mainTypes = ['bazaar', 'conference', 'workshop', 'trip', 'event'];
    const typeCounts = {};
    for (const t of mainTypes) {
      // Build a query object for this type, omitting the 'type' filter
      const typeQuery = { ...req.query };
      delete typeQuery.type;
      // For each type, call filterEvents recursively, but only for that type
      // We'll use a helper function to avoid infinite recursion
      typeCounts[t] = await getTypeCountForFilter(t, typeQuery);
    }

    // --- End typeCounts logic ---


    // Events / Conferences
    if (typeRequested("event") || typeRequested("conference")) {
      const list = await Event.find({}).lean();
      for (const e of list) {
        const kind = e.category === "conference" ? "conference" : "event";
        // Only include if the kind matches the requested types
        if (!typeRequested(kind)) continue;
        const eventObj = {
          ...e,
          _kind: kind,
          location: e.category === "conference" ? e.conference?.location || null : null,
        };
        if (!occursInRange(eventObj, rangeStart, rangeEnd, strictWithin)) continue;
        // Fix: check both title and name for Event Name filter
        const nameField = e.title || e.name || "";
        const titleMatch = nameRegex ? nameRegex.test(nameField) : true;
        let locationMatch = true;
        if (locationRegex) {
          if (e.category === "conference") {
            locationMatch = locationRegex.test(e.conference?.location || "");
          } else {
            locationMatch = locationRegex.test(eventObj.location || "");
          }
        }
        if (titleMatch && locationMatch) {
          results.push(eventObj);
        }
      }
    }

    // Workshops
    if (typeRequested("workshop")) {
      const ws = await Workshop.find({
        ...(locationRegex && { location: locationRegex }),
      })
        .populate("createdBy", "name")
        .populate("professorsParticipating", "name")
        .lean();

      for (const w of ws) {
        const eventObj = { ...w, _kind: "workshop", location: w.location || null };
        if (!occursInRange(eventObj, rangeStart, rangeEnd, strictWithin)) continue;
        // Fix: check both title and name for Event Name filter
        const nameField = w.title || w.name || "";
        const titleMatch = nameRegex ? nameRegex.test(nameField) : true;
        const createdByMatch = nameRegex && w.createdBy?.name ? nameRegex.test(w.createdBy.name) : !nameRegex;
        const profsMatch =
          nameRegex && Array.isArray(w.professorsParticipating)
            ? w.professorsParticipating.some((p) => nameRegex.test(p?.name || ""))
            : !nameRegex;
        if (titleMatch || createdByMatch || profsMatch) {
          results.push(eventObj);
        }
      }
    }

    // Trips
    if (typeRequested("trip")) {
      const trips = await Trip.find({
        ...(locationRegex && { location: locationRegex }),
        // Remove nameRegex from query, do filtering below for both name/title
      }).lean();
      for (const t of trips) {
        const eventObj = { ...t, _kind: "trip", location: t.location || null };
        if (!occursInRange(eventObj, rangeStart, rangeEnd, strictWithin)) continue;
        // Fix: check both title and name for Event Name filter
        const nameField = t.title || t.name || "";
        const titleMatch = nameRegex ? nameRegex.test(nameField) : true;
        if (titleMatch) {
          results.push(eventObj);
        }
      }
    }

    // Bazaars
    if (typeRequested("bazaar")) {
      const bazaars = await Bazaar.find({
        ...(locationRegex && { location: locationRegex }),
        // Remove nameRegex from query, do filtering below for both name/title
      }).lean();
      for (const b of bazaars) {
        const eventObj = { ...b, _kind: "bazaar", location: b.location || null };
        if (!occursInRange(eventObj, rangeStart, rangeEnd, strictWithin)) continue;
        // Fix: check both title and name for Event Name filter
        const nameField = b.title || b.name || "";
        const titleMatch = nameRegex ? nameRegex.test(nameField) : true;
        if (titleMatch) {
          results.push(eventObj);
        }
      }
    }

    // EO Conferences (apply location filter if present)
    if (typeRequested("conference")) {
      const confs = await EO_Conference.find({}).lean();
      for (const c of confs) {
        const eventObj = { ...c, _kind: "conference_eo", location: c.location || null };
        if (!occursInRange(eventObj, rangeStart, rangeEnd, strictWithin)) continue;
        // Fix: check both title and name for Event Name filter
        const nameField = c.title || c.name || "";
        const titleMatch = nameRegex ? nameRegex.test(nameField) : true;
        const createdByMatch =
          nameRegex && typeof c.createdBy === "string" ? nameRegex.test(c.createdBy) : !nameRegex;
        let locationMatch = true;
        if (locationRegex) {
          locationMatch = locationRegex.test(eventObj.location || "");
        }
        if ((titleMatch || createdByMatch) && locationMatch) {
          results.push(eventObj);
        }
      }
    }

    // If strict location requested
    if (locationRegex) {
      const filtered = results.filter(
        (r) => typeof r.location === "string" && locationRegex.test(r.location)
      );
      if (!filtered.length) {
        return res.status(404).json({ message: "No matching events found for that location." });
      }
      // Apply sorting before return
      const finalSorted = applySort(filtered, sort);
      return res.status(200).json({
        message: "Filtered events (location enforced) retrieved successfully.",
        count: finalSorted.length,
        events: finalSorted,
      });
    }

    if (!results.length) {
      return res.status(404).json({ message: "No matching events found." });
    }

    const finalSorted = applySort(results, sort);
    return res.status(200).json({
      message: "Filtered events retrieved successfully.",
      count: finalSorted.length,
      events: finalSorted,
      typeCounts,
    });
  // Helper to get count for a type with all filters except type
  async function getTypeCountForFilter(type, query) {
    // This is a simplified version of the main filter logic, only for counting
    // It does not support all edge cases, but matches the main filter logic for dropdown counts
    const name = query.name;
    const location = query.location;
    const date = query.date;
    const dateStart = query.dateStart;
    const dateEnd = query.dateEnd;
    // Reuse helpers from above
    const escapeRegExp = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const makeNameRegex = (val) => {
      if (!val) return undefined;
      const q = String(val).trim();
      if (!q) return undefined;
      const escaped = escapeRegExp(q);
      const short = escaped.length <= 3;
      const pattern = short ? `\\b${escaped}\\b` : escaped;
      return new RegExp(pattern, "i");
    };
    const makeRegex = (val) => (val ? new RegExp(escapeRegExp(String(val).trim()), "i") : undefined);
    const nameRegex = makeNameRegex(name);
    const locationRegex = makeRegex(location);
    // Date logic
    let rangeStart = null, rangeEnd = null, strictWithin = false;
    function parseDateInput(val) {
      if (!val) return null;
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
        const [day, month, year] = val.split("/").map(Number);
        return new Date(year, month - 1, day);
      }
      const d = new Date(val);
      return isNaN(d) ? null : d;
    }
    if (dateStart || dateEnd) {
      const ds = parseDateInput(dateStart);
      const de = parseDateInput(dateEnd);
      if (ds && de) {
        rangeStart = new Date(ds.getFullYear(), ds.getMonth(), ds.getDate(), 0, 0, 0, 0);
        rangeEnd = new Date(de.getFullYear(), de.getMonth(), de.getDate(), 23, 59, 59, 999);
        strictWithin = true;
      } else if (ds && !de) {
        rangeStart = new Date(ds.getFullYear(), ds.getMonth(), ds.getDate(), 0, 0, 0, 0);
        rangeEnd = new Date(ds.getFullYear(), ds.getMonth(), ds.getDate(), 23, 59, 59, 999);
      } else if (!ds && de) {
        rangeStart = new Date(de.getFullYear(), de.getMonth(), de.getDate(), 0, 0, 0, 0);
        rangeEnd = new Date(de.getFullYear(), de.getMonth(), de.getDate(), 23, 59, 59, 999);
      }
    } else if (date) {
      const raw = String(date).trim();
      let d = null;
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
        const [day, month, year] = raw.split("/").map(Number);
        d = new Date(year, month - 1, day);
      } else {
        d = new Date(raw);
      }
      if (!isNaN(d)) {
        rangeStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
        rangeEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
      }
    }
    // Now, for each type, run the same logic as in filterEvents
    let count = 0;
    try {
      if (type === 'event' || type === 'conference') {
        // 1. Count Event documents
        const list = await Event.find({}).lean();
        for (const e of list) {
          const kind = e.category === "conference" ? "conference" : "event";
          if (type !== kind) continue;
          let eventObj = { ...e, _kind: kind, location: e.category === "conference" ? e.conference?.location || null : null };
          // Date
          let occurs = true;
          if (rangeStart && rangeEnd) {
            let start = e.date || e.startDate || e.startDateTime;
            let end = e.endDate || e.endDateTime;
            start = start ? new Date(start) : null;
            end = end ? new Date(end) : start;
            if (!start) occurs = false;
            else if (strictWithin) occurs = start >= rangeStart && end <= rangeEnd;
            else occurs = start <= rangeEnd && end >= rangeStart;
          }
          if (!occurs) continue;
          // Name
          const titleMatch = nameRegex ? nameRegex.test(e.title || "") : true;
          let locationMatch = true;
          if (locationRegex) {
            if (e.category === "conference") {
              locationMatch = locationRegex.test(e.conference?.location || "");
            } else {
              locationMatch = false;
            }
          }
          if (titleMatch && locationMatch) count++;
        }
        // 2. If conference, also count EO_Conference documents (no location filter)
        if (type === 'conference') {
          const confs = await EO_Conference.find({}).lean();
          for (const c of confs) {
            // Date
            let occurs = true;
            if (rangeStart && rangeEnd) {
              let start = c.startDate;
              let end = c.endDate;
              start = start ? new Date(start) : null;
              end = end ? new Date(end) : start;
              if (!start) occurs = false;
              else if (strictWithin) occurs = start >= rangeStart && end <= rangeEnd;
              else occurs = start <= rangeEnd && end >= rangeStart;
            }
            if (!occurs) continue;
            // Name
            const titleMatch = nameRegex ? nameRegex.test(c.title || "") : true;
            const createdByMatch = nameRegex && typeof c.createdBy === "string" ? nameRegex.test(c.createdBy) : !nameRegex;
            if (titleMatch || createdByMatch) count++;
          }
        }
      } else if (type === 'workshop') {
        const ws = await Workshop.find({ ...(location && { location }) }).lean();
        for (const w of ws) {
          let occurs = true;
          if (rangeStart && rangeEnd) {
            let start = w.startDateTime || w.startDate || w.date;
            let end = w.endDateTime || w.endDate || w.date;
            start = start ? new Date(start) : null;
            end = end ? new Date(end) : start;
            if (!start) occurs = false;
            else if (strictWithin) occurs = start >= rangeStart && end <= rangeEnd;
            else occurs = start <= rangeEnd && end >= rangeStart;
          }
          if (!occurs) continue;
          const titleMatch = nameRegex ? nameRegex.test(w.title || "") : true;
          if (titleMatch) count++;
        }
      } else if (type === 'trip') {
        const trips = await Trip.find({ ...(location && { location }) }).lean();
        for (const t of trips) {
          let occurs = true;
          if (rangeStart && rangeEnd) {
            let start = t.startDateTime || t.startDate || t.date;
            let end = t.endDateTime || t.endDate || t.date;
            start = start ? new Date(start) : null;
            end = end ? new Date(end) : start;
            if (!start) occurs = false;
            else if (strictWithin) occurs = start >= rangeStart && end <= rangeEnd;
            else occurs = start <= rangeEnd && end >= rangeStart;
          }
          if (!occurs) continue;
          const nameMatch = nameRegex ? nameRegex.test(t.name || "") : true;
          if (nameMatch) count++;
        }
      } else if (type === 'bazaar') {
        const bazaars = await Bazaar.find({ ...(location && { location }) }).lean();
        for (const b of bazaars) {
          let occurs = true;
          if (rangeStart && rangeEnd) {
            let start = b.startDateTime || b.startDate || b.date;
            let end = b.endDateTime || b.endDate || b.date;
            start = start ? new Date(start) : null;
            end = end ? new Date(end) : start;
            if (!start) occurs = false;
            else if (strictWithin) occurs = start >= rangeStart && end <= rangeEnd;
            else occurs = start <= rangeEnd && end >= rangeStart;
          }
          if (!occurs) continue;
          const nameMatch = nameRegex ? nameRegex.test(b.name || "") : true;
          if (nameMatch) count++;
        }
      }
    } catch (err) {
      // fallback: count = 0
    }
    return count;
  }
  } catch (err) {
    console.error("filterEvents error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
}

// helper: apply sort (date_asc/date_desc/name_asc/name_desc)
function applySort(list, sortParamRaw) {
  const sortParam = String(sortParamRaw || "date_asc").toLowerCase();
  return [...list].sort((a, b) => {
    if (sortParam.startsWith("date")) {
      const da =
        new Date(
          a.date ||
            a.startDate ||
            a.startDateTime ||
            a.endDate ||
            a.endDateTime ||
            a.conference?.startDate ||
            0
        ).getTime() || 0;
      const db =
        new Date(
          b.date ||
            b.startDate ||
            b.startDateTime ||
            b.endDate ||
            b.endDateTime ||
            b.conference?.startDate ||
            0
        ).getTime() || 0;
      return sortParam === "date_desc" ? db - da : da - db;
    }
    if (sortParam.startsWith("name")) {
      const na = (a.name || a.title || "").toLowerCase();
      const nb = (b.name || b.title || "").toLowerCase();
      return sortParam === "name_desc" ? nb.localeCompare(na) : na.localeCompare(nb);
    }
    return 0;
  });
}



/**
 * ✅ Requirement 14:
 * Sort events by date ascending or descending.
 * Example:
 *   /api/events/sort?sort=date_asc
 *   /api/events/sort?sort=date_desc
 */
export async function sortEvents(req, res) {
  try {
    // accept ?sort=date_asc or ?sort=date_desc
    const sortParam = (req.query.sort || "date_asc").toLowerCase();
    const isDescending = sortParam.includes("desc");

    // load everything
    const [events, workshops, trips, bazaars, conferences] = await Promise.all([
      Event.find().lean(),
      Workshop.find().lean(),
      Trip.find().lean(),
      Bazaar.find().lean(),
      EO_Conference.find().lean(),
    ]);

    const all = [...events, ...workshops, ...trips, ...bazaars, ...conferences];

    // normalise every event to have a single date value
    const getEventDate = (obj) => new Date(
      obj.date ||
      obj.startDate ||
      obj.startDateTime ||
      obj.endDate ||
      obj.endDateTime ||
      0
    );

    // map & sort explicitly
    const sorted = all
      .map((e) => ({ ...e, _sortDate: getEventDate(e) }))
      .sort((a, b) => {
        const da = a._sortDate.getTime();
        const db = b._sortDate.getTime();
        return isDescending ? db - da : da - db;
      });

    return res.status(200).json({
      message: `Events sorted successfully (${isDescending ? "DESC" : "ASC"})`,
      count: sorted.length,
      events: sorted,
    });
  } catch (err) {
    console.error("sortEvents error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
}

