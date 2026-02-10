import BoothApplication from "../models/BoothApplication.js";
import BazaarApplication from "../models/BazaarApplication.js";
import Bazaar from "../models/Bazaar.js";
import User from "../models/User.js";
import Document from "../models/Document.js";
import path from "path";
import { fileURLToPath } from "url";
import { Notification } from "../models/Notification.js";
import fs from 'fs';
import mongoose from "mongoose";
import LostItem from '../models/LostItem.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Apply for a bazaar with file uploads
// Add this to vendorController.js (or replace the existing one)
/**
 * GET /api/vendors/lost-items/:vendorId
 * Returns all lost items from bazaars where:
 * - Vendor has an accepted application
 * - Application is PAID
 * - Bazaar has STARTED (startDateTime or date <= now)
 */
export const getVendorLostItems = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const now = new Date();

    console.log('🔍 Fetching lost items for vendor:', vendorId);
    console.log('Current time:', now.toISOString());

    // Find all ACCEPTED and PAID bazaar applications for this vendor
    const acceptedPaidApplications = await BazaarApplication.find({
      vendorId: vendorId,
      status: 'Accepted',
      paid: true  // ✅ Must be paid
    }).select('bazaarId');

    if (acceptedPaidApplications.length === 0) {
      console.log('⚠️ Vendor has no accepted & paid bazaar applications');
      return res.status(200).json({
        message: 'No accepted and paid bazaar applications found',
        count: 0,
        lostItems: []
      });
    }

    // Extract bazaar IDs
    const bazaarIds = acceptedPaidApplications.map(app => app.bazaarId);
    console.log(`✅ Vendor has ${bazaarIds.length} accepted & paid bazaar(s)`);

    // Find bazaars that have STARTED
    const startedBazaars = await Bazaar.find({
      _id: { $in: bazaarIds },
      $or: [
        { startDateTime: { $lte: now } },
        { date: { $lte: now } }
      ]
    }).select('_id name startDateTime date');

    if (startedBazaars.length === 0) {
      console.log('⚠️ None of vendor\'s bazaars have started yet');
      return res.status(200).json({
        message: 'No bazaars have started yet',
        count: 0,
        lostItems: []
      });
    }

    const startedBazaarIds = startedBazaars.map(b => b._id);
    console.log(`✅ ${startedBazaars.length} bazaar(s) have started:`);
    startedBazaars.forEach(b => {
      const startDate = b.startDateTime || b.date;
      console.log(`   - ${b.name}: ${new Date(startDate).toDateString()}`);
    });

    // Find all lost items for these STARTED bazaars
    const lostItems = await LostItem.find({
      event: { $in: startedBazaarIds },
      eventModel: 'Bazaar'
    })
      .populate('event', 'name title startDateTime date location')
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    console.log(`📦 Found ${lostItems.length} lost items for vendor's started & paid bazaars`);

    res.status(200).json({
      message: 'Lost items retrieved successfully',
      count: lostItems.length,
      lostItems
    });

  } catch (err) {
    console.error('❌ Error fetching vendor lost items:', err);
    res.status(500).json({
      message: 'Failed to fetch lost items',
      error: err.message
    });
  }
};
export const applyForBazaar = async (req, res) => {
  try {
    console.log('📥 Bazaar application received');
    console.log('req.body:', req.body);
    console.log('req.files:', req.files?.length);
    
    const { vendorId, bazaarId, boothSize } = req.body;
    
    // Parse attendees from JSON string
    let attendees = req.body.attendees;
    
    if (typeof attendees === 'string') {
      try {
        attendees = JSON.parse(attendees);
        console.log('✅ Parsed attendees from JSON');
      } catch (e) {
        console.error('❌ Parse failed:', e);
        return res.status(400).json({ message: "Invalid attendees format" });
      }
    }

    console.log('Final attendees:', attendees);
    console.log('Is array?', Array.isArray(attendees));

    // Validate
    if (!vendorId || !bazaarId) {
      return res.status(400).json({ message: "Vendor ID and Bazaar ID required" });
    }

    if (!Array.isArray(attendees) || attendees.length === 0) {
      return res.status(400).json({ message: "At least one attendee is required" });
    }

    if (attendees.length > 5) {
      return res.status(400).json({ message: "Maximum 5 attendees allowed" });
    }

    for (const person of attendees) {
      if (!person?.name || !person?.email) {
        return res.status(400).json({ 
          message: "Each attendee must have name and email" 
        });
      }
    }

    const validBoothSizes = ["2x2", "4x4"];
    if (!validBoothSizes.includes(boothSize)) {
      return res.status(400).json({ message: "Invalid booth size" });
    }

    // ✅ VALIDATE ID FILES
    if (!req.files || req.files.length !== attendees.length) {
      return res.status(400).json({ 
        message: `Each attendee must have an ID document. Expected ${attendees.length} files, got ${req.files?.length || 0}` 
      });
    }

    // Verify vendor by email or ID
    let vendor = null;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(vendorId);
    
    if (isObjectId) {
      vendor = await User.findOne({ _id: vendorId, role: "Vendor" });
    }
    
    if (!vendor) {
      vendor = await User.findOne({ email: vendorId, role: "Vendor" });
    }
    
    const bazaar = await Bazaar.findById(bazaarId);
    
    console.log('🔧 Looking up vendor:', vendorId);
    console.log('✅ Vendor found:', vendor?.companyName || 'NOT FOUND');
    console.log('✅ Bazaar found:', bazaar?.name || 'NOT FOUND');
    
    if (!vendor) {
      // Clean up uploaded files
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
      return res.status(404).json({ message: "Vendor not found" });
    }
    
    if (!bazaar) {
      // Clean up uploaded files
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
      return res.status(404).json({ message: "Bazaar not found" });
    }

    // Check duplicate
    const existingApp = await BazaarApplication.findOne({ 
      vendorId: vendor._id, 
      bazaarId 
    });
    
    if (existingApp) {
      // Clean up uploaded files
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
      return res.status(400).json({ 
        message: "You have already applied to this bazaar" 
      });
    }

    // ✅ CREATE APPLICATION FIRST (to get application ID)
    const application = await BazaarApplication.create({
      vendorId: vendor._id,
      bazaarId,
      attendees: attendees, // Save without documents first
      boothSize,
      status: 'Pending'
    });

    console.log('✅ Bazaar application created:', application._id);

    // ✅ NOW SAVE ID DOCUMENTS AND UPDATE ATTENDEES
    const attendeesWithDocs = [];
    
    for (let idx = 0; idx < attendees.length; idx++) {
      const file = req.files[idx];
      const attendee = attendees[idx];
      
      try {
        // Create document entry
        const document = await Document.create({
          fileName: file.originalname,
          filePath: file.path,
          fileSize: file.size,
          mimeType: file.mimetype,
          documentType: "attendee_id",
          vendorId: vendor._id,
          bazaarApplicationId: application._id,
          attendeeId: attendee.email,
          uploadedBy: vendor._id,
          status: "pending",
        });

        console.log(`✅ Saved ID document for attendee: ${attendee.name} (${document._id})`);

        // Add document reference to attendee
        attendeesWithDocs.push({
          ...attendee,
          idDocument: document._id,
        });
      } catch (docError) {
        console.error(`❌ Failed to save document for attendee ${idx}:`, docError);
        
        // Rollback: delete application and all saved documents
        await BazaarApplication.findByIdAndDelete(application._id);
        
        // Delete any documents that were created
        for (let i = 0; i <= idx; i++) {
          const f = req.files[i];
          if (f && fs.existsSync(f.path)) {
            fs.unlinkSync(f.path);
          }
        }
        
        return res.status(500).json({ 
          message: `Failed to save ID document for attendee: ${attendee.name}`,
          error: docError.message 
        });
      }
    }

    // ✅ UPDATE APPLICATION WITH DOCUMENT REFERENCES
    application.attendees = attendeesWithDocs;
    await application.save();

    console.log('✅ Bazaar application updated with document references');

    // ✅ CREATE NOTIFICATIONS FOR EVENTS OFFICE AND ADMIN
    await Notification.create([
      {
        type: "vendor_request_pending",
        message: `New vendor bazaar application from ${vendor.companyName}`,
        audienceRole: "events_office",
        vendorId: vendor._id,
        applicationId: application._id,
      },
      {
        type: "vendor_request_pending",
        message: `New vendor bazaar application from ${vendor.companyName}`,
        audienceRole: "admin",
        vendorId: vendor._id,
        applicationId: application._id,
      }
    ]);

    console.log('✅ Notifications created');

    res.status(201).json({
      message: "Bazaar application submitted successfully",
      application: await application.populate("bazaarId")
    });
    
  } catch (err) {
    console.error('❌ Error in applyForBazaar:', err);
    
    // Clean up any uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    res.status(500).json({ error: err.message });
  }
};

export const uploadAttendeeId = async (req, res) => {
  try {
    const { applicationId, attendeeIndex, applicationType = "bazaar" } = req.body;
    const userId = req.user.id; // from protect middleware

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    if (!applicationId || attendeeIndex === undefined) {
      return res.status(400).json({ message: "Missing applicationId or attendeeIndex" });
    }

    const index = parseInt(attendeeIndex);
    if (isNaN(index)) {
      return res.status(400).json({ message: "Invalid attendee index" });
    }

    // DYNAMICALLY CHOOSE MODEL
    const ApplicationModel = applicationType === "booth" 
      ? BoothApplication 
      : BazaarApplication;

    const application = await ApplicationModel.findById(applicationId);

    if (!application) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: "Application not found" });
    }

    if (application.vendorId.toString() !== userId) {
      fs.unlinkSync(req.file.path);
      return res.status(403).json({ message: "Not authorized" });
    }

    if (!application.attendees[index]) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: "Attendee not found" });
    }

    // Create Document
    const document = await Document.create({
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      documentType: "attendee_id",
      vendorId: userId,
      bazaarApplicationId: applicationType === "bazaar" ? applicationId : null,
      boothApplicationId: applicationType === "booth" ? applicationId : null,
      uploadedBy: userId,
      status: "pending",
    });

    // Link document to attendee
    application.attendees[index].idDocument = document._id;
    await application.save();

    res.json({
      message: "ID uploaded successfully",
      document,
      attendeeIndex: index,
    });
  } catch (error) {
    console.error("uploadAttendeeId error:", error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
};
// 1. Apply for a booth
export const applyForBooth = async (req, res) => {
  try {
    const { vendorId, location, boothSize, setupDuration, categories, tags } = req.body;
    
    console.log('🔥 Booth application request');
    console.log('📧 vendorId from request:', vendorId);
    
    // Parse attendees from JSON string
    let attendees = req.body.attendees;
    
    if (typeof attendees === 'string') {
      try {
        attendees = JSON.parse(attendees);
      } catch (e) {
        return res.status(400).json({ message: "Invalid attendees format" });
      }
    }

        // ✅ Parse categories & tags coming from FormData (JSON strings)
    let parsedCategories = [];
    let parsedTags = [];

    if (categories) {
      try {
        parsedCategories = Array.isArray(categories)
          ? categories
          : JSON.parse(categories); // e.g. '["Food","Tech"]'
      } catch (e) {
        return res.status(400).json({ message: "Invalid categories format" });
      }
    }

    if (tags) {
      try {
        parsedTags = Array.isArray(tags)
          ? tags
          : JSON.parse(tags); // e.g. '["desserts","bubble tea"]'
      } catch (e) {
        return res.status(400).json({ message: "Invalid tags format" });
      }
    }

    


    // Validate
    if (!vendorId || !location) {
      return res.status(400).json({ message: "Vendor ID and location required" });
    }

    if (!Array.isArray(attendees) || attendees.length === 0) {
      return res.status(400).json({ message: "At least one attendee is required" });
    }

    if (attendees.length > 5) {
      return res.status(400).json({ message: "Maximum 5 attendees allowed" });
    }

    for (const person of attendees) {
      if (!person?.name || !person?.email) {
        return res.status(400).json({ 
          message: "Each attendee must have name and email" 
        });
      }
    }

    const validBoothSizes = ["2x2", "4x4"];
    if (!validBoothSizes.includes(boothSize)) {
      return res.status(400).json({ message: "Invalid booth size" });
    }

    const allowedDurations = ["1 week", "2 weeks", "3 weeks", "4 weeks"];
    if (!allowedDurations.includes(setupDuration)) {
      return res.status(400).json({ message: "Invalid setup duration" });
    }

    // ✅ VALIDATE ID FILES
    if (!req.files || req.files.length !== attendees.length) {
      return res.status(400).json({ 
        message: `Each attendee must have an ID document. Expected ${attendees.length} files, got ${req.files?.length || 0}` 
      });
    }

    // Verify vendor by email or ID
    // let vendor = null;
    // const isObjectId = /^[0-9a-fA-F]{24}$/.test(vendorId);
    
    // if (isObjectId) {
    //   vendor = await User.findOne({ _id: vendorId, role: "Vendor" });
    //   console.log('🔍 Lookup by ObjectId:', !!vendor);
    // }
    
    // if (!vendor) {
    //   vendor = await User.findOne({ email: vendorId, role: "Vendor" });
    //   console.log('🔍 Lookup by email:', !!vendor);
    // }
    
    // if (!vendor) {
    //   // Clean up uploaded files
    //   req.files.forEach(file => {
    //     if (fs.existsSync(file.path)) {
    //       fs.unlinkSync(file.path);
    //     }
    //   });
    //   console.error('❌ Vendor not found for:', vendorId);
    //   return res.status(404).json({ message: "Vendor not found" });
    // }

    let resolvedVendorId;

if (req.user?._id) {
  // Best case: user is authenticated → use JWT
  resolvedVendorId = req.user._id;
  console.log('Using authenticated user from JWT:', resolvedVendorId);
}
else if (mongoose.Types.ObjectId.isValid(vendorId)) {
  // vendorId is a valid MongoDB ObjectId
  resolvedVendorId = vendorId;
}
else {
  // Last resort: vendorId is an email
  const userFromEmail = await User.findOne({ email: vendorId, role: "Vendor" });
  if (!userFromEmail) {
    req.files?.forEach(f => fs.existsSync(f.path) && fs.unlinkSync(f.path));
    return res.status(404).json({ message: "Vendor not found" });
  }
  resolvedVendorId = userFromEmail._id;
  console.log('Resolved vendor from email:', resolvedVendorId);
}

const vendor = await User.findById(resolvedVendorId);
if (!vendor) {
  req.files?.forEach(f => fs.existsSync(f.path) && fs.unlinkSync(f.path));
  return res.status(404).json({ message: "Vendor not found" });
}
    console.log('✅ Vendor found:', {
      id: vendor._id,
      email: vendor.email,
      companyName: vendor.companyName
    });

    console.log('🔍 Creating booth application with vendorId:', vendor._id);

    // ✅ CREATE APPLICATION FIRST
    const application = await BoothApplication.create({
      vendorId: resolvedVendorId,
      location,
      boothSize,
      setupDuration,
      attendees: attendees, // Save without documents first
      categories: parsedCategories, // 👈 NEW
      tags: parsedTags,             // 👈 NEW
      status: 'Pending'
    });

    console.log('✅ Booth application created:', {
      id: application._id,
      vendorId: application.vendorId,
      status: application.status
    });

    // ✅ NOW SAVE ID DOCUMENTS AND UPDATE ATTENDEES
    const attendeesWithDocs = [];
    
    for (let idx = 0; idx < attendees.length; idx++) {
      const file = req.files[idx];
      const attendee = attendees[idx];
      
      try {
        // Create document entry
        const document = await Document.create({
          fileName: file.originalname,
          filePath: file.path,
          fileSize: file.size,
          mimeType: file.mimetype,
          documentType: "attendee_id",
          vendorId: vendor._id,
          boothApplicationId: application._id, // Use boothApplicationId instead
          attendeeId: attendee.email,
          uploadedBy: vendor._id,
          status: "pending",
        });

        console.log(`✅ Saved ID document for attendee: ${attendee.name} (${document._id})`);

        // Add document reference to attendee
        attendeesWithDocs.push({
          ...attendee,
          idDocument: document._id,
        });
      } catch (docError) {
        console.error(`❌ Failed to save document for attendee ${idx}:`, docError);
        
        // Rollback: delete application and all saved documents
        await BoothApplication.findByIdAndDelete(application._id);
        
        // Delete any documents that were created
        for (let i = 0; i <= idx; i++) {
          const f = req.files[i];
          if (f && fs.existsSync(f.path)) {
            fs.unlinkSync(f.path);
          }
        }
        
        return res.status(500).json({ 
          message: `Failed to save ID document for attendee: ${attendee.name}`,
          error: docError.message 
        });
      }
    }

    // ✅ UPDATE APPLICATION WITH DOCUMENT REFERENCES
    application.attendees = attendeesWithDocs;
    await application.save();

    console.log('✅ Booth application updated with document references');

    await Notification.create([
      {
        type: "vendor_request_pending",
        message: `New vendor booth application from ${vendor.companyName}`,
        audienceRole: "events_office",
        vendorId: vendor._id,
        applicationId: application._id,
      },
      {
        type: "vendor_request_pending",
        message: `New vendor booth application from ${vendor.companyName}`,
        audienceRole: "admin",
        vendorId: vendor._id,
        applicationId: application._id,
      }
    ]);

    res.status(201).json({
      message: "Booth application submitted successfully",
      application
    });
  } catch (error) {
    console.error("❌ Error in applyForBooth:", error);
    
    // Clean up any uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    res.status(500).json({ message: error.message });
  }
};
// Get accepted booth setups
export const getAcceptedBooths = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const booths = await BoothApplication.find({
      vendorId,
      status: "Accepted",
    });
    res.status(200).json(booths);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get accepted bazaars
export const getAcceptedBazaars = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const bazaars = await BazaarApplication.find({
      vendorId,
      status: "Accepted"
    }).populate("bazaarId");
    
    // Filter for upcoming bazaars only
    const upcomingBazaars = bazaars.filter(app => 
      app.bazaarId && new Date(app.bazaarId.date) >= new Date()
    );
    
    res.status(200).json(upcomingBazaars);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get pending or rejected booth applications
export const getPendingOrRejectedBooths = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const booths = await BoothApplication.find({
      vendorId,
      status: { $in: ["Pending", "Rejected"] },
    });
    res.status(200).json(booths);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get pending or rejected bazaar applications
export const getPendingOrRejectedBazaars = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const bazaars = await BazaarApplication.find({
      vendorId,
      status: { $in: ["Pending", "Rejected"] }
    }).populate("bazaarId");
    
    // Filter for upcoming bazaars only
    const upcomingBazaars = bazaars.filter(app => 
      app.bazaarId && new Date(app.bazaarId.date) >= new Date()
    );
    
    res.status(200).json(upcomingBazaars);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all applications (accepted, pending, rejected) for a vendor
export const getAllApplications = async (req, res) => {
  try {
    const { vendorId } = req.params;
    
    // Support both ObjectId and email lookup
    let vendor = null;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(vendorId);
    
    if (isObjectId) {
      vendor = await User.findOne({ _id: vendorId, role: "Vendor" });
    }
    
    if (!vendor) {
      vendor = await User.findOne({ email: vendorId, role: "Vendor" });
    }
    
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }
    
    console.log('✅ Vendor found:', vendor.email, 'ID:', vendor._id);
    
    const bazaarApps = await BazaarApplication.find({ vendorId: vendor._id })
      .populate("bazaarId");
    const boothApps = await BoothApplication.find({ vendorId: vendor._id });
    
    console.log(`📊 Found ${bazaarApps.length} bazaar apps, ${boothApps.length} booth apps`);
    
    res.status(200).json({
      bazaarApplications: bazaarApps,
      boothApplications: boothApps
    });
  } catch (error) {
    console.error("Error fetching applications:", error);
    res.status(500).json({ message: error.message });
  }
};
export const listVendorRequests = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = { status: "Pending" }; // show only pending

    // ✅ Bazaar applications
    const bazaars = await BazaarApplication.find(filter)
      .populate("vendorId", "companyName email")
      .populate("bazaarId", "name date location");

    // ✅ Booth applications (no bazaarId field)
    const booths = await BoothApplication.find(filter)
      .populate("vendorId", "companyName email");

    let allRequests = [];

    // ✅ Add bazaars
    if (!category || category === "bazaar") {
      allRequests.push(
        ...bazaars.map((req) => ({
          _id: req._id,
          type: "Bazaar",
          vendor: req.vendorId?.companyName || "-",
          email: req.vendorId?.email || "-",
          eventName: req.bazaarId?.name || "-", // from populate
          date: req.bazaarId?.date
            ? new Date(req.bazaarId.date).toLocaleDateString()
            : "-",
          location: req.bazaarId?.location || "-",
          boothSize: req.boothSize || "-",
          status: req.status || "-",
        }))
      );
    }

    // ✅ Add booths
    if (!category || category === "booth") {
      allRequests.push(
        ...booths.map((req) => ({
          _id: req._id,
          type: "Booth",
          vendor: req.vendorId?.companyName || "-",
          email: req.vendorId?.email || "-",
          eventName: req.location || "-", // booth has its own location field
          date: "-", // no date field
          location: req.location || "-",
          boothSize: req.boothSize || "-",
          status: req.status || "-",
        }))
      );
    }

    res.json(allRequests);
  } catch (error) {
    console.error("❌ Error fetching vendor requests:", error);
    res.status(500).json({ message: "Error fetching vendor requests" });
  }
};

// ✅ FIXED getVendorRequest
export const getVendorRequest = async (req, res) => {
  try {
    const { id } = req.params;

    // Try finding in BazaarApplication first
    let request = await BazaarApplication.findById(id)
      .populate("vendorId", "companyName email phone")
      .populate("bazaarId", "name category date location");

    // If not found in Bazaar, try BoothApplication
    if (!request) {
      request = await BoothApplication.findById(id)
        .populate("vendorId", "companyName email phone")
        .populate("bazaarId", "name category date location");
    }

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    res.json(request);
  } catch (err) {
    console.error("❌ getVendorRequest error:", err);
    res.status(500).json({ message: "Failed to fetch request details" });
  }
};
