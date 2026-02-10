import { Workshop } from '../models/Workshop.js';

import {
  notifyWorkshopAccepted,
  notifyWorkshopRejected,
} from "./notifyController.js";
export async function updateWorkshopRestrictions(req, res) {
  try {
    const { id } = req.params;
    const { allowedUserTypes } = req.body;

    if (!Array.isArray(allowedUserTypes)) {
      return res
        .status(400)
        .json({ message: "allowedUserTypes must be an array" });
    }

    // 🔹 Normalize everything to lowercase
    const normalized = allowedUserTypes.map((r) =>
      String(r).toLowerCase()
    );

    const validRoles = ["student", "ta", "staff", "professor"];
    const invalid = normalized.filter((r) => !validRoles.includes(r));

    if (invalid.length > 0) {
      return res.status(400).json({
        message: `Invalid roles: ${invalid.join(", ")}`,
      });
    }

    const ws = await Workshop.findById(id);
    if (!ws) {
      return res.status(404).json({ message: "Workshop not found" });
    }

    ws.allowedUserTypes = normalized;

    const vErr = ws.validateSync();
    if (vErr) {
      return res.status(400).json({
        message: vErr.message,
        errors: vErr.errors,
      });
    }

    await ws.save();

    return res.json({
      message: "Restrictions saved successfully",
      workshop: ws,
    });
  } catch (err) {
    console.error("Error updating workshop restrictions:", err);
    return res
      .status(500)
      .json({ message: "Failed to save restrictions" });
  }
}



// Approve + Publish
// controllers/EO_workshopController.js
export async function acceptAndPublishWorkshop(req, res) {
  try {
    const { id } = req.params;
    const ws = await Workshop.findById(id);
    if (!ws) return res.status(404).json({ message: "Workshop not found" });

    ws.status = "approved";
    ws.approvedBy = req.user?._id || null;
    ws.approvedAt = new Date();

    ws.published = true;
    ws.publishedAt = new Date();

    // safest way to clear these: set to undefined (not an empty subdoc)
    ws.editRequest = undefined;
    ws.rejectionReason = undefined;

    await ws.save();

        // Notify professor that their workshop was accepted
    try {
      await notifyWorkshopAccepted({
        workshop: ws,
        triggeredBy: req.user?.id || null,
      });
    } catch (notifyErr) {
      console.error(
        "Failed to send 'workshop accepted' notification:",
        notifyErr
      );
    }

    res.json({ message: "Workshop approved and published successfully.", workshop: ws });
  } catch (err) {
    console.error("accept error:", err);
    // expose validation details
    return res.status(400).json({
      message: err.message || "Validation/Save error",
      errors: err.errors || undefined,
    });
  }
}


export async function rejectWorkshop(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body; // optional

    const ws = await Workshop.findById(id);
    if (!ws) return res.status(404).json({ message: "Workshop not found" });

    ws.status = "rejected";
    ws.rejectionReason = (reason && reason.trim()) || "No reason provided";

    // Ensure it's not published if rejected
    ws.published = false;
    ws.publishedAt = undefined;

    // Clear edit request on hard reject
    ws.editRequest = { message: "", requestedBy: undefined, requestedAt: undefined };

    await ws.save();
    
        // Notify professor that their workshop was rejected
    try {
      await notifyWorkshopRejected({
        workshop: ws,
        triggeredBy: req.user?._id || null,
      });
    } catch (notifyErr) {
      console.error(
        "Failed to send 'workshop rejected' notification:",
        notifyErr
      );
    }

    res.json({ message: "Workshop rejected successfully.", workshop: ws });
  } catch (err) {
    console.error("reject error:", err);
    res.status(500).json({ message: "Server error rejecting workshop." });
  }
}

export async function requestWorkshopEdits(req, res) {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Edit request 'message' is required" });
    }

    const ws = await Workshop.findById(id);
    if (!ws) return res.status(404).json({ message: "Workshop not found" });

    // move to needs_edit and unpublish
    ws.status = "needs_edit";
    ws.published = false;
    ws.publishedAt = undefined;

    ws.editRequest = {
      message: message.trim(),
      requestedBy: req.user?._id || undefined,
      requestedAt: new Date()
    };

    // 🔎 surface validation issues BEFORE save too (gives clearer errors)
    const vErr = ws.validateSync();
    if (vErr) {
      return res.status(400).json({
        message: vErr.message,
        errors: vErr.errors
      });
    }

    await ws.save();

    return res.json({ message: "Edit request sent to professor.", workshop: ws });
  } catch (err) {
    console.error("request-edits error:", err);
    return res.status(400).json({
      message: err.message || "Validation/Save error",
      errors: err.errors || undefined,
    });
  }
}

// ✅ NEW: delete a workshop by id
export async function deleteWorkshop(req, res) {
  try {
    const { id } = req.params;
    const del = await Workshop.findByIdAndDelete(id);
    if (!del) return res.status(404).json({ message: "Workshop not found" });
    return res.json({ message: "Workshop deleted" });
  } catch (err) {
    console.error("delete error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
}