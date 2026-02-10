// backend/controllers/vendorRequestViewController.js
import mongoose from "mongoose";
import BazaarApplication from "../models/BazaarApplication.js";
import BoothApplication from "../models/BoothApplication.js";

const toObjectId = (s) => {
  try {
    return new mongoose.Types.ObjectId(s);
  } catch {
    return null;
  }
};

const normalizeStatus = (s) =>
  s ? s.toString().trim().toLowerCase().replace(/^\w/, (c) => c.toUpperCase()) : undefined;
// maps "pending" -> "Pending", etc.

export const listUnifiedVendorRequests = async (req, res) => {
  try {
    const {
      type, // "bazaar" | "booth" | undefined (both)
      status, // "Pending" | "Accepted" | "Rejected"
      eventId, // bazaarId for bazaar items (booth apps have no eventId in your schema)
      vendorId, // optional: filter by vendorId
      q, // text search over attendees' name/email (basic)
      page = 1,
      limit = 10,
      sort = "desc", // by createdAt if available, else _id
    } = req.query;

    const s = normalizeStatus(status);
    const pg = Math.max(parseInt(page, 10) || 1, 1);
    const lm = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);

    // ---------- Bazaar pipeline ----------
    const bazaarMatch = {};
    if (s) bazaarMatch.status = s;
    if (vendorId && toObjectId(vendorId)) bazaarMatch.vendorId = toObjectId(vendorId);
    if (eventId && toObjectId(eventId)) bazaarMatch.bazaarId = toObjectId(eventId);
    if (q) bazaarMatch["attendees.email"] = { $regex: q, $options: "i" }; // simple filter

    const bazaarPipeline = [
      { $match: bazaarMatch },
      // 🔍 join vendor
      {
        $lookup: {
          from: "users",
          localField: "vendorId",
          foreignField: "_id",
          as: "vendor",
        },
      },
      { $unwind: { path: "$vendor", preserveNullAndEmptyArrays: true } },
      // 🔍 join bazaar (event)
      {
        $lookup: {
          from: "bazaars",
          localField: "bazaarId",
          foreignField: "_id",
          as: "bazaar",
        },
      },
      { $unwind: { path: "$bazaar", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          type: { $literal: "bazaar" },
          vendorId: 1,
          // ✅ new: human-readable vendor name
          vendorName: {
            $ifNull: [
              "$vendor.companyName",
              {
                $ifNull: ["$vendor.name", "$vendor.email"],
              },
            ],
          },
          eventId: "$bazaarId",
          // ✅ new: human-readable event (bazaar) name
          eventName: {
            $ifNull: ["$bazaar.title", "$bazaar.name"],
          },
          attendees: 1,
          boothSize: 1,
          setupDuration: { $literal: null },
          location: { $literal: null },
          status: 1,
          createdAt: { $ifNull: ["$createdAt", "$_id"] }, // fallback to _id time
        },
      },
    ];

    // ---------- Booth pipeline ----------
    const boothMatch = {};
    if (s) boothMatch.status = s;
    if (vendorId && toObjectId(vendorId)) boothMatch.vendorId = toObjectId(vendorId);
    if (q) boothMatch["attendees.email"] = { $regex: q, $options: "i" };

    const boothPipeline = [
      { $match: boothMatch },
      // 🔍 join vendor for booths as well
      {
        $lookup: {
          from: "users",
          localField: "vendorId",
          foreignField: "_id",
          as: "vendor",
        },
      },
      { $unwind: { path: "$vendor", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          type: { $literal: "booth" },
          vendorId: 1,
          // ✅ new: vendorName for booth rows
          vendorName: {
            $ifNull: [
              "$vendor.companyName",
              {
                $ifNull: ["$vendor.name", "$vendor.email"],
              },
            ],
          },
          eventId: { $literal: null }, // your BoothApplication has no eventId
          // ✅ keep eventName null for now (no event model wired)
          eventName: { $literal: null },
          attendees: 1,
          boothSize: 1,
          setupDuration: 1,
          location: 1,
          status: 1,
          createdAt: { $ifNull: ["$createdAt", "$_id"] },
        },
      },
    ];

    // Choose base + optional union depending on "type"
    let pipeline;
    if (type === "bazaar") {
      pipeline = bazaarPipeline;
    } else if (type === "booth") {
      pipeline = boothPipeline;
    } else {
      // union both, starting from Bazaar
      pipeline = [
        ...bazaarPipeline,
        {
          $unionWith: {
            coll: BoothApplication.collection.name, // "boothapplications"
            pipeline: boothPipeline,
          },
        },
      ];
    }

    // Sorting + pagination
    pipeline.push({
      $sort: {
        createdAt: sort === "asc" ? 1 : -1,
        _id: sort === "asc" ? 1 : -1,
      },
    });
    pipeline.push({ $skip: (pg - 1) * lm }, { $limit: lm });

    const data =
      type === "booth"
        ? await BoothApplication.aggregate(boothPipeline.concat(pipeline.slice(-3)))
        : await BazaarApplication.aggregate(pipeline);

    res.json({ page: pg, limit: lm, count: data.length, data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getUnifiedVendorRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const oid = toObjectId(id);
    if (!oid) return res.status(400).json({ message: "Invalid id" });

    // Try bazaar first
    const b = await BazaarApplication.findById(oid)
      .populate("vendorId", "companyName name email")
      .populate("bazaarId", "title name")
      .lean();

    if (b) {
      return res.json({
        _id: b._id,
        type: "bazaar",
        // keep vendorId / eventId as before (ids), but add names
        vendorId: b.vendorId?._id || b.vendorId,
        vendorName:
          b.vendorId?.companyName || b.vendorId?.name || b.vendorId?.email,
        eventId: b.bazaarId?._id || b.bazaarId,
        eventName: b.bazaarId?.title || b.bazaarId?.name,
        attendees: b.attendees,
        boothSize: b.boothSize,
        setupDuration: null,
        location: null,
        status: b.status,
        createdAt: b.createdAt || b._id.getTimestamp?.(),
      });
    }

    const h = await BoothApplication.findById(oid)
      .populate("vendorId", "companyName name email")
      .lean();

    if (h) {
      return res.json({
        _id: h._id,
        type: "booth",
        vendorId: h.vendorId?._id || h.vendorId,
        vendorName:
          h.vendorId?.companyName || h.vendorId?.name || h.vendorId?.email,
        eventId: null,
        eventName: null,
        attendees: h.attendees,
        boothSize: h.boothSize,
        setupDuration: h.setupDuration,
        location: h.location,
        status: h.status,
        createdAt: h.createdAt || h._id.getTimestamp?.(),
      });
    }

    res.status(404).json({ message: "Not found in either collection" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};