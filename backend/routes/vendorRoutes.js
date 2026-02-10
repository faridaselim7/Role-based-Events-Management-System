// backend/routes/vendorRoutes.js

import express from "express";

import jwt from "jsonwebtoken";

import bcrypt from "bcryptjs";

import sgMail from '@sendgrid/mail';

import Stripe from "stripe";

import dotenv from "dotenv";

import upload from './../config/multerConfig.js';
import { requireRole } from '../middleware/requireRole.js';
import { protect } from "../middleware/protect.js";  // ← ADD THIS
import { sendAllQRCodesToVendor } from "../controllers/BazaarQRCodeController.js";


// import { getVendorLostItems } from "../controllers/vendorController.js";


dotenv.config(); // ensure .env is loaded here too

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

if (!process.env.STRIPE_SECRET_KEY) {
  console.error("❌ STRIPE_SECRET_KEY is missing in .env");
}

import {
  applyForBooth,
  applyForBazaar,
  getAcceptedBooths,
  getAcceptedBazaars,
  getPendingOrRejectedBooths,
  getPendingOrRejectedBazaars,
  getAllApplications, // vendor-specific combined view (kept)
} from "../controllers/vendorController.js";

import {
  applyLoyaltyProgram,
  cancelLoyaltyProgram,
  getLoyaltyProgramStatus,
  listLoyaltyVendors,
} from "../controllers/VendorDocumentController.js";

// ✅ Read-only unified view pulled from both collections (no create changes)
import {
  listUnifiedVendorRequests as listVendorRequests,
  getUnifiedVendorRequestById as getVendorRequest,
} from "../controllers/vendorRequestViewController.js";

import User from "../models/User.js";  // CORRECT

import Bazaar from "../models/Bazaar.js";

import BazaarApplication from "../models/BazaarApplication.js";

import BoothApplication from "../models/BoothApplication.js";

import { notifyVendorApplicationStatusEmail } from "../controllers/notifyController.js";

// 🔹 NEW: QR code library
import QRCode from "qrcode";

const router = express.Router();

/* -------------------------------------------------------------------------- */
/*                 Helper: build QR HTML for external visitors                */
/* -------------------------------------------------------------------------- */
/**
 * For a given application (bazaar or booth), generate a QR code per attendee.
 * - Uses attendees.length = number of external visitors
 * - Fills attendee.qrCode if empty
 * - Returns HTML snippet with <img> tags for the email
 */
async function buildAttendeeQrHtml(application, type) {
  const attendees = application.attendees || [];
  if (!Array.isArray(attendees) || attendees.length === 0) {
    return "";
  }

  const qrHtmlParts = [];

  for (let i = 0; i < attendees.length; i++) {
    const attendee = attendees[i] || {};
    let code = attendee.qrCode;

    // If no QR code stored yet, generate one and store it
    if (!code) {
      const baseType = type || (application.bazaarId ? "bazaar" : "booth");
      code = `${baseType}-${application._id}-${i + 1}`;
      attendee.qrCode = code;
    }

    let dataUrl = "";
    try {
      dataUrl = await QRCode.toDataURL(code);
    } catch (err) {
      console.error("Failed to generate QR code image for attendee", i, err);
      continue;
    }

    const labelName = attendee.name ? ` - ${attendee.name}` : "";
    qrHtmlParts.push(`
      <div>
        <p>External Visitor ${i + 1}${labelName}</p>
        <img src="${dataUrl}" alt="QR code for external visitor ${i + 1}" />
      </div>
    `);
  }

  // Try to save updated qrCode fields on attendees
  try {
    await application.save();
  } catch (saveErr) {
    console.error("Failed to save QR codes on application:", saveErr);
  }

  if (qrHtmlParts.length === 0) {
    return "";
  }

  return `
    <p>Here are your QR codes for your external visitors (one per attendee):</p>
    ${qrHtmlParts.join("\n")}
  `;
}

/* -------------------------------------------------------------------------- */
/*                              Auth (Vendor role)                            */
/* -------------------------------------------------------------------------- */

// Signup (creates a User with role Vendor)
router.post("/signup", async (req, res) => {
  try {
    const { email, password, companyName } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Vendor already exists" });

    const vendor = await User.create({
      email,
      password,
      companyName,
      role: "Vendor",
    });

    const token = jwt.sign({ id: vendor._id, role: vendor.role}, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.status(201).json({ token, vendor });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login (checks User with role Vendor)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const vendor = await User.findOne({ email, role: "Vendor" });
    if (!vendor) return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, vendor.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    const token = jwt.sign({ id: vendor._id, role: vendor.role}, process.env.JWT_SECRET, { expiresIn: "1d" });
    
    // ✅ Return both token and full vendor object
    res.json({ 
      token, 
      user: {
        _id: vendor._id,
        id: vendor._id,
        email: vendor.email,
        role: vendor.role,
        companyName: vendor.companyName
      },
      vendorId: vendor._id 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* -------------------------------------------------------------------------- */
/*                         Bazaars list (not yet applied)                     */
/* -------------------------------------------------------------------------- */

router.get("/bazaars/:vendorId", async (req, res) => {
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

    // Use vendor's actual _id for queries
    const allBazaars = await Bazaar.find({
      startDateTime: { $gte: new Date() },
    }).sort("startDateTime");

    console.log('📊 Total upcoming bazaars:', allBazaars.length);

    const appliedBazaars = await BazaarApplication.find({ vendorId: vendor._id }).select("bazaarId");
    const appliedBazaarIds = appliedBazaars.map((app) => app.bazaarId.toString());

    console.log('📋 Applied bazaar IDs:', appliedBazaarIds);

    const availableBazaars = allBazaars.filter(
      (b) => !appliedBazaarIds.includes(b._id.toString())
    );

    console.log('✅ Available bazaars:', availableBazaars.length);

    res.json(availableBazaars);
  } catch (err) {
    console.error("Error in /bazaars/:vendorId:", err);
    res.status(500).json({ error: err.message });
  }
});

/* -------------------------------------------------------------------------- */
/*                         Applications creation endpoints                    */
/* -------------------------------------------------------------------------- */

// Apply for a Bazaar (kept as-is; writes to BazaarApplication)

// Then replace the route:
router.post("/apply-for-bazaar", upload.array('idFile', 5), applyForBazaar);

/* -------------------------------------------------------------------------- */
/*                     Vendor-scoped reading (kept unchanged)                 */
/* -------------------------------------------------------------------------- */

// Returns vendor’s own bazaar+booth applications (your existing controller)
router.get("/applications/:vendorId", getAllApplications);

// Accepted only
router.get("/accepted-booths/:vendorId", getAcceptedBooths);
router.get("/accepted-bazaars/:vendorId", getAcceptedBazaars);

// Pending/Rejected
router.get("/requests/booths/:vendorId", getPendingOrRejectedBooths);
router.get("/requests/bazaars/:vendorId", getPendingOrRejectedBazaars);

/* -------------------------------------------------------------------------- */
/*                           Admin / unified READ ONLY                        */
/*     NEW: does NOT touch creation; pulls from both collections and merges   */
/* -------------------------------------------------------------------------- */

// Unified list across BazaarApplication + BoothApplication
// Filters: ?type=bazaar|booth&status=Pending|Accepted|Rejected&vendorId=&eventId=&q=&page=&limit=&sort=asc|desc
router.get("/requests", listVendorRequests);

// Unified single item lookup by _id (works for both collections)
router.get("/requests/:id", getVendorRequest);

/* -------------------------------------------------------------------------- */
/*                               Vendor directory                             */
/* -------------------------------------------------------------------------- */

// List all users with role Vendor
router.get("/", async (req, res) => {
  try {
    const vendors = await User.find({ role: "Vendor" });
    res.json(vendors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* -------------------------------------------------------------------------- */
/*                     SPECIFIC ROUTES FIRST (before generic :id)             */
/* -------------------------------------------------------------------------- */

// Booth application creation
router.post("/apply-for-booth", upload.array('idFile', 5), applyForBooth);

// Add this BEFORE the /applications/:id/pay route in vendorRoutes.js
router.post("/create-payment-intent", async (req, res) => {
  try {
    const { amount, vendorEmail, applicationId } = req.body;

    console.log('💳 Creating payment intent for:', { amount, vendorEmail, applicationId });

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const vendor = await User.findOne({ email: vendorEmail, role: "Vendor" });
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        vendorId: vendor._id.toString(),
        vendorEmail: vendorEmail,
        applicationId: applicationId || "",
      },
    });

    console.log('✅ Payment intent created:', paymentIntent.id);

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("❌ Error creating payment intent:", error);
    res.status(500).json({
      message: "Failed to create payment intent",
      error: error.message,
    });
  }
});

// Pay for an application - MUST come before /applications/:id
// Pay for an application (vendor)
router.post('/applications/:id/pay', async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod, amount, vendorEmail, stripePaymentIntentId } = req.body;

    console.log('💳 Payment request for:', id);
    console.log('📧 Vendor email:', vendorEmail);
    console.log('💰 Payment method:', paymentMethod);

    // Find application
    let application = await BazaarApplication.findById(id);
    let type = 'bazaar';
    
    if (!application) {
      application = await BoothApplication.findById(id);
      type = 'booth';
    }
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    console.log('✅ Application found:', type);

    if (application.paid) {
      return res.status(400).json({ message: 'Application already paid' });
    }

    // Validate amount matches amountDue (if provided)
    if (amount && Number(amount) !== Number(application.amountDue)) {
      const diff = Math.abs(Number(amount) - Number(application.amountDue));
      if (diff > 0.01) {
        return res.status(400).json({ message: 'Amount does not match amount due' });
      }
    }

    // Find vendor by email
    const vendor = await User.findOne({ email: vendorEmail, role: "Vendor" });
    
    if (!vendor) {
      console.error('❌ Vendor not found for email:', vendorEmail);
      return res.status(404).json({ message: 'Vendor user not found' });
    }
    
    console.log('👤 Vendor found:', {
      id: vendor._id,
      email: vendor.email,
      wallet: vendor.wallet
    });

    // WALLET PAYMENT
    if (paymentMethod === 'wallet') {
      if ((vendor.wallet || 0) < (application.amountDue || 0)) {
        return res.status(400).json({ 
          message: `Insufficient wallet balance. Available: $${(vendor.wallet || 0).toFixed(2)}, Required: $${(application.amountDue || 0).toFixed(2)}` 
        });
      }
      
      // Deduct from wallet
      vendor.wallet = (vendor.wallet || 0) - (application.amountDue || 0);
      await vendor.save();

      // Update application
      application.amountPaid = application.amountDue;
      application.paymentMethod = 'wallet';
      application.paid = true;
      
      // Update vendorId to ensure consistency
      if (!application.vendorId || application.vendorId.toString() !== vendor._id.toString()) {
        application.vendorId = vendor._id;
      }
      
      await application.save();

      console.log('✅ Payment successful (wallet)');

      // Send receipt
      try {
        if (process.env.SENDGRID_API_KEY && process.env.OUTLOOK_USER) {
          let qrHtml = "";
          try {
            qrHtml = await buildAttendeeQrHtml(application, type);
          } catch (qrErr) {
            console.error("Failed to build QR HTML:", qrErr);
          }

          sgMail.setApiKey(process.env.SENDGRID_API_KEY);
          const to = vendor.email;
          const subject = 'Payment Receipt - Application';
          const html = `
            <p>Dear ${vendor.companyName || 'Vendor'},</p>
            <p>Your payment of $${application.amountPaid.toFixed(2)} has been received for application ${application._id}.</p>
            <p>Payment method: Wallet</p>
            ${qrHtml}
            <p>Thank you!</p>
          `;
          await sgMail.send({ to, from: process.env.OUTLOOK_USER, subject, html });
          console.log('✅ Receipt sent to:', to);
        }
      } catch (err) {
        console.error('Failed to send receipt:', err);
      }

      return res.json({ 
        message: 'Payment successful (wallet)', 
        application,
        newWalletBalance: vendor.wallet 
      });
    }

    // STRIPE PAYMENT
    if (paymentMethod === 'stripe') {
      if (!stripePaymentIntentId) {
        return res.status(400).json({ message: 'stripePaymentIntentId is required for stripe payments' });
      }
      
      try {
        // Verify payment intent
        const pi = await stripe.paymentIntents.retrieve(stripePaymentIntentId);
        
        if (!pi || pi.status !== 'succeeded') {
          return res.status(400).json({ 
            message: `Payment not completed. Status: ${pi?.status || 'unknown'}` 
          });
        }

        console.log('✅ Stripe payment verified:', pi.id);

        // Update application
        application.amountPaid = (pi.amount || 0) / 100;
        application.paymentMethod = 'stripe';
        application.stripePaymentIntentId = stripePaymentIntentId;
        application.paid = true;
        
        // Update vendorId if needed
        if (!application.vendorId || application.vendorId.toString() !== vendor._id.toString()) {
          application.vendorId = vendor._id;
        }
        
        await application.save();

        console.log('✅ Payment successful (stripe)');

        // Send receipt
        try {
          if (process.env.SENDGRID_API_KEY && process.env.OUTLOOK_USER) {
            let qrHtml = "";
            try {
              qrHtml = await buildAttendeeQrHtml(application, type);
            } catch (qrErr) {
              console.error("Failed to build QR HTML:", qrErr);
            }

            sgMail.setApiKey(process.env.SENDGRID_API_KEY);
            const to = vendor.email;
            const subject = 'Payment Receipt - Application';
            const html = `
              <p>Dear ${vendor.companyName || 'Vendor'},</p>
              <p>Your payment of $${application.amountPaid.toFixed(2)} has been received for application ${application._id}.</p>
              <p>Payment method: Credit Card (Stripe)</p>
              ${qrHtml}
              <p>Thank you!</p>
            `;
            await sgMail.send({ to, from: process.env.OUTLOOK_USER, subject, html });
            console.log('✅ Receipt sent');
          }
        } catch (err) {
          console.error('Failed to send receipt:', err);
        }

        return res.json({ 
          message: 'Payment successful (stripe)', 
          application 
        });
      } catch (err) {
        console.error('Error verifying stripe payment:', err);
        return res.status(500).json({ 
          message: 'Error verifying payment', 
          error: err.message 
        });
      }
    }

    return res.status(400).json({ message: 'Unsupported payment method' });
  } catch (err) {
    console.error('❌ Payment error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Update application status - MUST come before /applications/:id
// Update application status - MUST come before /applications/:id
router.put("/applications/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["Accepted", "Rejected"].includes(status)) {
      return res.status(400).json({ message: 'Status must be "Accepted" or "Rejected"' });
    }

    let application = await BazaarApplication.findById(id)
      .populate("vendorId", "email companyName")
      .populate("bazaarId", "name startDateTime location");

    let type = "bazaar";

    if (!application) {
      application = await BoothApplication.findById(id)
        .populate("vendorId", "email companyName");
      type = "booth";
    }

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Update status
    application.status = status;

    // If accepted → compute amount + due date
    if (status === "Accepted") {
      const now = new Date();
      const dueDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

      const locationFee = (loc) => {
        const key = (loc || "").toLowerCase();
        if (key.includes("front") || key.includes("prime") || key.includes("main")) return 100;
        if (key.includes("middle")) return 50;
        return 20;
      };

      const computeBoothAmount = (app) => {
        const durationRates = {
          "1 week": 100,
          "2 weeks": 180,
          "3 weeks": 250,
          "4 weeks": 300,
        };
        const base = durationRates[app.setupDuration] || 100;
        return base + locationFee(app.location || "");
      };

      const computeBazaarAmount = (app) => {
        const sizeRates = { "2x2": 150, "4x4": 260 };
        const base = sizeRates[app.boothSize] || 150;
        let loc = "";
        if (app.bazaarId && typeof app.bazaarId === "object" && app.bazaarId.location) {
          loc = app.bazaarId.location;
        }
        return base + locationFee(loc);
      };

      if (type === "bazaar") {
        application.amountDue = computeBazaarAmount(application);
      } else {
        application.amountDue = computeBoothAmount(application);
      }

      application.paymentDueDate = dueDate;
      application.paid = false;

      console.log(`💰 ${type} application accepted. Amount due: $${application.amountDue}`);
    }

    await application.save();

    // ✅ Send email to vendor for both Accepted and Rejected
    try {
      const vendor = application.vendorId; // populated with email + companyName
      await notifyVendorApplicationStatusEmail({ application, vendor });
    } catch (err) {
      console.error("Failed to send vendor status email:", err);
    }

    res.json({ message: "Application status updated", application });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});








// Cancel application - MUST come before /applications/:id
router.delete('/applications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    let application = await BazaarApplication.findById(id);
    let type = 'bazaar';
    
    if (!application) {
      application = await BoothApplication.findById(id);
      type = 'booth';
    }
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.paid) {
      return res.status(400).json({ message: 'Cannot cancel paid application' });
    }

    if (type === 'bazaar') {
      await BazaarApplication.findByIdAndDelete(id);
    } else {
      await BoothApplication.findByIdAndDelete(id);
    }

    res.json({ message: 'Application cancelled successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* -------------------------------------------------------------------------- */
/*                          GENERIC ROUTES LAST                               */
/* -------------------------------------------------------------------------- */

// List vendor requests
router.get("/applications", listVendorRequests);

// Get vendor's applications by vendorId
router.get("/applications/:vendorId", getAllApplications);

// Get single application by ID
router.get("/requests/:id", getVendorRequest);

/* -------------------------------------------------------------------------- */
/*                        LOYALTY PROGRAM ROUTES                              */
/* -------------------------------------------------------------------------- */


// Req #70 - Vendor applies to GUC loyalty program
router.post('/loyalty/apply', protect, requireRole(['Vendor']), applyLoyaltyProgram);

// Req #71 - Vendor cancels participation in GUC loyalty program
router.post('/loyalty/cancel', protect, requireRole(['Vendor']), cancelLoyaltyProgram);

// Get loyalty program status
router.get('/loyalty/status', protect, requireRole(['Vendor']), getLoyaltyProgramStatus);

// List all vendors enrolled in loyalty program (for Events Office/Admin)
router.get('/loyalty/vendors', listLoyaltyVendors);


router.post("/applications/:id/send-qr-codes", protect, requireRole(['Vendor']), sendAllQRCodesToVendor);
// After the loyalty routes, before export
// router.get("/lost-items/:vendorId", protect, requireRole(['Vendor']), getVendorLostItems);
export default router;
