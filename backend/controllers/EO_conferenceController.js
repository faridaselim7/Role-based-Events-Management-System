import EO_Conference from "../models/EO_Conference.js";
import mongoose from "mongoose";

export async function createConference(req, res) {
  try {
    const {
      title,
      startDate,
      endDate,
      shortDescription,
      fullAgenda,
      website,
      requiredBudget,
      fundingSource,
      extraResources
    } = req.body;

    // Minimal validation tailored to your requirement
    if (!title || !startDate || !endDate || requiredBudget === undefined || !fundingSource) {
      return res.status(400).json({
        message: "title, startDate, endDate, requiredBudget, fundingSource are required"
      });
    }

    const conf = await EO_Conference.create({
      title,
      startDate,
      endDate,
      shortDescription: shortDescription || "",
      fullAgenda: fullAgenda || "",
      website: website || "",
      requiredBudget,
      fundingSource,
      extraResources: extraResources || "",
      // EO creates ⇒ approved & published by default (via model defaults)
    });

    return res.status(201).json({
      message: "Conference created (approved & published).",
      conference: conf
    });
  } catch (err) {
    console.error("createConference error:", err);
    const status = err.name === "ValidationError" ? 400 : 500;
    return res.status(status).json({ message: err.message });
  }
  
}

// Helpers (optional)
export async function listConferences(_req, res) {
  const list = await EO_Conference.find().sort({ startDate: 1 });
  res.json(list);
}

export async function getConference(req, res) {
  const item = await EO_Conference.findById(req.params.id);
  if (!item) return res.status(404).json({ message: "Conference not found" });
  res.json(item);
}

// ✅ NEW: update an existing conference (partial update)
export async function updateConference(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid conference id" });
    }

    const {
      title,
      startDate,        // "YYYY-MM-DD"
      endDate,          // "YYYY-MM-DD"
      shortDescription,
      fullAgenda,
      website,
      requiredBudget,   // number
      fundingSource,    // e.g. "guc", "external", "guc-funded"
      extraResources,
      allowedUserTypes, // ["student","staff","ta","professor"] from frontend
    } = req.body || {};

    // 1) find conference by _id, or fallback by eventId
    let conf = await EO_Conference.findById(id);
    if (!conf) {
      conf = await EO_Conference.findOne({ eventId: id });
    }

    if (!conf) {
      return res.status(404).json({ message: "Conference not found" });
    }

    // 2) apply partial updates

    if (title !== undefined) conf.title = title;
    if (startDate !== undefined) conf.startDate = startDate;
    if (endDate !== undefined) conf.endDate = endDate;
    if (shortDescription !== undefined) conf.shortDescription = shortDescription;
    if (fullAgenda !== undefined) conf.fullAgenda = fullAgenda;
    if (website !== undefined) conf.website = website;
    if (requiredBudget !== undefined) conf.requiredBudget = requiredBudget;
    if (extraResources !== undefined) conf.extraResources = extraResources;

    // normalize fundingSource to match your enum
    if (fundingSource !== undefined) {
      let fs = String(fundingSource || "").toLowerCase();
      if (fs === "guc-funded") fs = "guc";
      if (fs === "externally-funded") fs = "external";
      conf.fundingSource = fs;
    }

    // map allowedUserTypes to schema enum values
    if (Array.isArray(allowedUserTypes)) {
      const mapRole = {
        student: "Student",
        staff: "Staff",
        ta: "TA",
        professor: "Professor",
      };

      conf.allowedUserTypes = allowedUserTypes.map((t) => {
        const key = String(t).toLowerCase();
        return mapRole[key] || t; // fallback to original if not in map
      });
    }

    await conf.save();

    return res.json({
      message: "Conference updated successfully",
      conference: conf,
    });
  } catch (err) {
    console.error("updateConference error:", err);
    const status = err.name === "ValidationError" ? 400 : 500;
    return res
      .status(status)
      .json({ message: err.message || "Server error" });
  }
}




// ✅ NEW: delete an existing conference
export async function deleteConference(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid conference id" });
    }

    const deleted = await EO_Conference.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Conference not found" });

    return res.json({ message: "Conference deleted" });
  } catch (err) {
    console.error("deleteConference error:", err);
    const status = err.name === "ValidationError" ? 400 : 500;
    return res.status(status).json({ message: err.message || "Server error" });
  }
}

