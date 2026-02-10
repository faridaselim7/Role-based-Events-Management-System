import Document from '../models/Document.js';
import BazaarApplication from '../models/BazaarApplication.js';
import BoothApplication from '../models/BoothApplication.js';
import User from '../models/User.js';
import { Notification } from "../models/Notification.js";

// Req #3 - Vendor uploads tax card and logo
export const uploadVendorDocuments = async (req, res) => {
  try {
    const vendorId = req.user.id;
    
    // Get documentType from body OR from URL params (for new route)
    const documentType = req.body.documentType || req.params.type;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (!documentType) {
      return res.status(400).json({ message: 'Document type is required' });
    }

    const vendor = await User.findOne({ _id: vendorId, role: "Vendor" });
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    // Initialize documents object if not exists
    if (!vendor.documents) {
      vendor.documents = {};
    }

    // Handle tax card upload
    if (documentType === 'taxCard') {
      vendor.documents.taxCard = {
        fileName: req.file.originalname,
        filePath: req.file.path,
        uploadedAt: new Date()
      };
    }

    // Handle logo upload
    if (documentType === 'logo') {
      vendor.documents.logo = {
        fileName: req.file.originalname,
        filePath: req.file.path,
        uploadedAt: new Date()
      };
    }

    await vendor.save();

    // Also create a document record for tracking
    const document = new Document({
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      documentType: documentType === 'taxCard' ? 'tax_card' : 'logo',
      vendorId: vendorId,
      uploadedBy: vendorId,
      status: 'pending'
    });

    await document.save();

    // Return the URL for the uploaded file
    const fileUrl = `http://localhost:5001/${req.file.path.replace(/\\/g, '/')}`;

    res.status(200).json({
      message: `${documentType} uploaded successfully`,
      url: fileUrl,
      uploaded: {
        documentType,
        fileName: req.file.originalname,
        filePath: req.file.path,
        uploadedAt: new Date()
      },
      vendor: {
        _id: vendor._id,
        email: vendor.email,
        companyName: vendor.companyName,
        documents: vendor.documents
      }
    });
  } catch (error) {
    console.error('Error uploading vendor documents:', error);
    res.status(500).json({ message: 'Failed to upload document', error: error.message });
  }
};

// Get vendor documents
// ============================================================================
// FIXED: getVendorDocuments - Now works without vendorId in URL
// ============================================================================

export const getVendorDocuments = async (req, res) => {
  try {
    // ✅ FIX: Get vendorId from authenticated user, not URL params
    const vendorId = req.user.id;

    const vendor = await User.findOne({ _id: vendorId, role: "Vendor" });
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    if (!vendor.documents) {
      vendor.documents = {};
    }

    // ✅ FIX: Return clean response object with direct URLs
    const documents = {};
    
    if (vendor.documents.taxCard?.filePath) {
      documents.taxCard = `http://localhost:5001/${vendor.documents.taxCard.filePath.replace(/\\/g, '/')}`;
    }
    
    if (vendor.documents.logo?.filePath) {
      documents.logo = `http://localhost:5001/${vendor.documents.logo.filePath.replace(/\\/g, '/')}`;
    }

    res.status(200).json(documents);
  } catch (error) {
    console.error('Error fetching vendor documents:', error);
    res.status(500).json({ message: 'Failed to fetch documents', error: error.message });
  }
};

// REQ #62 - Upload ID for a specific attendee (works for both bazaar and booth applications)
export const uploadAttendeeId = async (req, res) => {
  try {
    const { bazaarApplicationId, attendeeIndex } = req.body;
    const vendorId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (!bazaarApplicationId || attendeeIndex === undefined) {
      return res.status(400).json({ message: 'Application ID and attendee index are required' });
    }

    const index = parseInt(attendeeIndex);
    if (isNaN(index)) {
      return res.status(400).json({ message: 'Attendee index must be a number' });
    }

    // Try to find in BazaarApplication first
    let application = await BazaarApplication.findOne({
      _id: bazaarApplicationId,
      vendorId
    });

    let applicationType = 'bazaar';

    // If not found, try BoothApplication
    if (!application) {
      application = await BoothApplication.findOne({
        _id: bazaarApplicationId,
        vendorId
      });
      applicationType = 'booth';
    }

    if (!application) {
      return res.status(404).json({ message: 'Application not found or not owned by you' });
    }

    if (application.status !== 'Accepted') {
      return res.status(400).json({ message: 'Application must be accepted before uploading attendee IDs' });
    }

    if (index < 0 || index >= application.attendees.length) {
      return res.status(400).json({ message: 'Invalid attendee index' });
    }

    const attendee = application.attendees[index];

    // Create document record in MongoDB
    const document = await Document.create({
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      documentType: 'attendee_id',
      bazaarApplicationId,
      attendeeId: attendee.email,
      uploadedBy: vendorId,
      status: 'pending'
    });

    // Link document to attendee
    application.attendees[index].idDocument = document._id;
    await application.save();

    // Create notification for Events Office
    try {
      await Notification.create({
        type: "document_uploaded",
        message: `Attendee ID uploaded for ${attendee.name} in ${applicationType} application`,
        createdBy: vendorId,
        targetUser: null,
        audienceRole: "events_office",
      });
    } catch (err) {
      console.error("Failed to create notification:", err);
    }

    res.status(201).json({
      message: 'Attendee ID uploaded successfully',
      document: {
        _id: document._id,
        fileName: document.fileName,
        filePath: document.filePath,
        uploadedAt: document.uploadedAt,
        status: document.status
      },
      attendee: {
        name: attendee.name,
        email: attendee.email,
        idDocument: document._id
      }
    });
  } catch (error) {
    console.error('Error uploading attendee ID:', error);
    res.status(500).json({ message: 'Failed to upload attendee ID', error: error.message });
  }
};

// Req #70 - Vendor applies to GUC loyalty program
export const applyLoyaltyProgram = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { discountRate, promoCode, termsAccepted } = req.body;

    if (discountRate === undefined || !promoCode || !termsAccepted) {
      return res.status(400).json({ 
        message: 'Discount rate, promo code, and terms acceptance are required' 
      });
    }

    if (discountRate < 0 || discountRate > 100) {
      return res.status(400).json({ 
        message: 'Discount rate must be between 0 and 100' 
      });
    }

    const vendor = await User.findOne({ _id: req.user.id, role: "Vendor" });
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    if (vendor.loyaltyProgram && vendor.loyaltyProgram.isEnrolled) {
      return res.status(400).json({ message: 'Vendor is already enrolled in the loyalty program' });
    }

    if (!vendor.loyaltyProgram) {
      vendor.loyaltyProgram = {};
    }

    vendor.loyaltyProgram.isEnrolled = true;
    vendor.loyaltyProgram.enrolledAt = new Date();
    vendor.loyaltyProgram.tier = 'bronze';
    vendor.loyaltyProgram.points = 0;
    vendor.loyaltyProgram.discountRate = discountRate;
    vendor.loyaltyProgram.promoCode = promoCode;
    vendor.loyaltyProgram.termsAccepted = termsAccepted;
    vendor.loyaltyProgram.termsAcceptedAt = new Date();

    await vendor.save();

    try {
      await Notification.create({
        type: "loyalty_partner_added",
        message: `${vendor.name || vendor.email} has joined the GUC Loyalty Program with discount ${discountRate}% and promo code ${promoCode}.`,
        createdBy: vendor._id,
        targetUser: null,
        audienceRole: "all",
      });
    } catch (err) {
      console.error("Failed to create loyalty partner notification:", err);
    }
    
    res.status(200).json({
      message: 'Successfully enrolled in GUC loyalty program',
      loyaltyProgram: vendor.loyaltyProgram
    });
  } catch (error) {
    console.error('Error applying to loyalty program:', error);
    res.status(500).json({ message: 'Failed to apply to loyalty program', error: error.message });
  }
};

// Req #71 - Vendor cancels participation in GUC loyalty program
export const cancelLoyaltyProgram = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { reason } = req.body;

    const vendor = await User.findOne({ _id: req.user.id, role: "Vendor" });
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    if (!vendor.loyaltyProgram || !vendor.loyaltyProgram.isEnrolled) {
      return res.status(400).json({ message: 'Vendor is not enrolled in the loyalty program' });
    }

    vendor.loyaltyProgram.isEnrolled = false;
    vendor.loyaltyProgram.cancelledAt = new Date();
    vendor.loyaltyProgram.cancellationReason = reason || '';

    await vendor.save();

    res.status(200).json({
      message: 'Successfully cancelled loyalty program participation',
      loyaltyProgram: vendor.loyaltyProgram
    });
  } catch (error) {
    console.error('Error cancelling loyalty program:', error);
    res.status(500).json({ message: 'Failed to cancel loyalty program', error: error.message });
  }
};

// Get vendor loyalty program status
export const getLoyaltyProgramStatus = async (req, res) => {
  try {
    const vendorId = req.user.id;

    const vendor = await User.findOne({ _id: req.user.id, role: "Vendor" });
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    res.status(200).json({
      loyaltyProgram: vendor.loyaltyProgram || {
        isEnrolled: false,
        tier: 'none',
        points: 0
      }
    });
  } catch (error) {
    console.error('Error fetching loyalty program status:', error);
    res.status(500).json({ message: 'Failed to fetch loyalty program status', error: error.message });
  }
};

// List all loyalty program vendors
export const listLoyaltyVendors = async (req, res) => {
  try {
    const vendors = await User.find(
      {
        role: 'Vendor',
        'loyaltyProgram.isEnrolled': true
      },
      'companyName email loyaltyProgram'
    ).lean();

    const partners = vendors.map(vendor => ({
      vendorId: vendor._id,
      companyName: vendor.companyName,
      email: vendor.email,
      discountRate: vendor.loyaltyProgram?.discountRate,
      promoCode: vendor.loyaltyProgram?.promoCode,
      termsAccepted: vendor.loyaltyProgram?.termsAccepted,
      termsAcceptedAt: vendor.loyaltyProgram?.termsAcceptedAt
    }));

    return res.status(200).json(partners);
  } catch (error) {
    console.error('Error listing loyalty vendors:', error);
    return res
      .status(500)
      .json({ message: 'Failed to load loyalty vendors', error: error.message });
  }
};