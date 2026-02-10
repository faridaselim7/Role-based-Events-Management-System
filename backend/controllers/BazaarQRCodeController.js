import BazaarApplication from '../models/BazaarApplication.js';
import BoothApplication from '../models/BoothApplication.js';
import mongoose from 'mongoose';
import User from '../models/User.js';

// Req #62 & #66 - Send QR codes to registered visitors via email
export const sendQRCodesToBazaarAttendees = async (req, res) => {
  try {
    const { bazaarApplicationId } = req.params;

    const application = await BazaarApplication.findById(bazaarApplicationId)
      .populate('bazaarId', 'name')
      .populate('vendorId', 'companyName');

    if (!application) {
      return res.status(404).json({ message: 'Bazaar application not found' });
    }

    if (application.status !== 'Accepted') {
      return res.status(400).json({ message: 'Application must be accepted before sending QR codes' });
    }

    // Extract attendee information
    const attendees = application.attendees.map(a => ({
      name: a.name,
      email: a.email
    }));

    const { sendQRCodesToAttendees } = await import('../services/qrCodeService.js');
    
    // Send QR codes to all attendees
    const results = await sendQRCodesToAttendees(
      attendees,
      application.vendorId.companyName,
      application.bazaarId.name
    );

    // Update attendees with QR codes
    const failedEmails = results.filter(r => r.status === 'failed').map(r => r.email);
    
    application.attendees.forEach((attendee, index) => {
      const result = results.find(r => r.email === attendee.email);
      if (result && result.status === 'sent') {
        attendee.qrCode = result.qrCode;
      }
    });

    application.qrCodesSentAt = new Date();
    await application.save();

    res.status(200).json({
      message: 'QR codes sent successfully',
      results,
      failedCount: failedEmails.length,
      successCount: results.length - failedEmails.length
    });
  } catch (error) {
    console.error('Error sending QR codes:', error);
    res.status(500).json({ message: 'Failed to send QR codes', error: error.message });
  }
};

// Get bazaar application with QR codes
export const getBazaarApplicationQRCodes = async (req, res) => {
  try {
    const { bazaarApplicationId } = req.params;

    const application = await BazaarApplication.findById(bazaarApplicationId)
      .populate('bazaarId', 'name')
      .populate('vendorId', 'companyName');

    if (!application) {
      return res.status(404).json({ message: 'Bazaar application not found' });
    }

    res.status(200).json({
      bazaarApplicationId: application._id,
      vendor: application.vendorId.companyName,
      bazaar: application.bazaarId.name,
      qrCodesSentAt: application.qrCodesSentAt,
      attendees: application.attendees.map(a => ({
        name: a.name,
        email: a.email,
        hasQRCode: !!a.qrCode,
        qrCode: a.qrCode || null
      }))
    });
  } catch (error) {
    console.error('Error fetching QR codes:', error);
    res.status(500).json({ message: 'Failed to fetch QR codes', error: error.message });
  }
};
// controllers/BazaarQRCodeController.js (add this function)
// export const sendAllQRCodesToVendor = async (req, res) => {
//   try {
//     const { applicationId } = req.params;
//     const loggedInUserId = req.user.id;  // this comes from JWT

//     console.log('sendAllQRCodesToVendor called by user:', loggedInUserId);

//     if (!mongoose.Types.ObjectId.isValid(applicationId)) {
//       return res.status(400).json({ message: 'Invalid application ID' });
//     }

//     // 1. First try normal way (vendorId as ObjectId)
//     let application = await BazaarApplication.findOne({
//       _id: applicationId,
//       vendorId: new mongoose.Types.ObjectId(loggedInUserId)
//     }).populate('bazaarId', 'name').populate('vendorId', 'email companyName');

//     let isBooth = false;

//     if (!application) {
//       application = await BoothApplication.findOne({
//         _id: applicationId,
//         vendorId: new mongoose.Types.ObjectId(loggedInUserId)
//       }).populate('bazaarId', 'name').populate('vendorId', 'email companyName');
//       isBooth = true;
//     }

//     // 2. Fallback: search by vendorEmail (saved during application creation)
//     if (!application) {
//       const userFromToken = await User.findById(loggedInUserId);
//       if (userFromToken) {
//         const email = userFromToken.email;

//         application = await BazaarApplication.findOne({
//           _id: applicationId,
//           vendorEmail: email
//         }).populate('bazaarId', 'name').populate('vendorId', 'email companyName');

//         if (!application) {
//           application = await BoothApplication.findOne({
//             _id: applicationId,
//             vendorEmail: email
//           }).populate('bazaarId', 'name').populate('vendorId', 'email companyName');
//           isBooth = true;
//         }

//         // Auto-fix broken vendorId
//         if (application && (!application.vendorId || application.vendorId.toString() !== loggedInUserId)) {
//           application.vendorId = loggedInUserId;
//           await application.save();
//           console.log('Fixed vendorId for application:', applicationId);
//         }
//       }
//     }

//     // 3. LAST RESORT: Allow any logged-in user who has the application ID (for testing)
//     // Remove this block in production if you want strict security
//     if (!application) {
//       application = await BazaarApplication.findById(applicationId)
//         .populate('bazaarId', 'name')
//         .populate('vendorId', 'email companyName');
//       if (!application) {
//         application = await BoothApplication.findById(applicationId)
//           .populate('bazaarId', 'name')
//           .populate('vendorId', 'email companyName');
//         isBooth = true;
//       }
//       console.warn('Warning: Using unsecured fallback – application found without ownership check');
//     }

//     if (!application) {
//       return res.status(404).json({ 
//         message: 'Application not found or you do not have permission'
//       });
//     }

//     // === Everything below is unchanged ===
//     if (application.status !== 'Accepted') {
//       return res.status(400).json({ message: 'Application must be accepted first' });
//     }

//     if (!application.attendees || application.attendees.length === 0) {
//       return res.status(400).json({ message: 'No attendees registered' });
//     }

//     const vendorEmail = application.vendorId?.email || application.vendorEmail || req.user.email;
//     const bazaarName = application.bazaarId?.name || (isBooth ? 'Your Booth' : 'Bazaar');
//     const companyName = application.vendorId?.companyName || 'Vendor';

//     const attendeesWithQR = application.attendees.map(att => ({
//       name: att.name,
//       email: att.email,
//       qrCode: att.qrCode || `VENDOR-${application._id}-${att.name.replace(/\s/g, '')}-${Date.now()}`
//     }));

//     const { sendAllQRCodesToVendorEmail } = await import('../services/qrCodeService.js');

//     await sendAllQRCodesToVendorEmail({
//       vendorEmail,
//       companyName,
//       bazaarName,
//       attendees: attendeesWithQR
//     });

//     application.qrCodesSentAt = new Date();
//     await application.save();

//     return res.json({
//       message: `QR codes sent to ${vendorEmail}`,
//       count: attendeesWithQR.length
//     });

//   } catch (error) {
//     console.error('Error in sendAllQRCodesToVendor:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };
// controllers/BazaarQRCodeController.js
export const sendAllQRCodesToVendor = async (req, res) => {
  try {
    const { applicationId } = req.params;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized – login required" });
    }

    const vendorId = req.user.id;
    console.log("QR Send requested by vendor:", vendorId);

    // FIX 1: Populate "title" from Bazaar model
    let application = await BazaarApplication.findOne({
      _id: applicationId,
      vendorId: vendorId,
      status: "Accepted"
    }).populate({
      path: "bazaarId",
      select: "name"   // ← this is correct
    });

    let isBooth = false;
    if (!application) {
      application = await BoothApplication.findOne({
        _id: applicationId,
        vendorId: vendorId,
        status: "Accepted"
      });
      isBooth = true;
    }

    if (!application) {
      return res.status(404).json({ message: "Application not found or not accepted" });
    }

    // DEBUG: Log what we actually got
    console.log("Populated bazaarId:", application.bazaarId);
    console.log("bazaarId.title =", application.bazaarId?.title);

    const vendor = await User.findById(vendorId);
    if (!vendor?.email) {
      return res.status(400).json({ message: "Vendor email not found" });
    }

    // FIX 2: Use .title, not .name!
    let eventName;
    if (isBooth) {
      eventName = application.location 
        ? `Booth Setup – ${application.location}` 
        : "Your Permanent Booth";
    } else {
      eventName = application.bazaarId?.name 
        ? application.bazaarId.name 
        : "Bazaar Event";
    }

    console.log("Final eventName sent to email:", eventName);   // ← THIS WILL SHOW YOU THE TRUTH

    const attendeesWithQR = application.attendees.map((a, i) => ({
      name: a.name || "Attendee",
      email: a.email,
      qrCode: a.qrCode || `${isBooth ? 'BOOTH' : 'BAZAAR'}-${applicationId}-${i + 1}`
    }));

    const { sendAllQRCodesToVendorEmail } = await import('../services/qrCodeService.js');
    await sendAllQRCodesToVendorEmail({
      vendorEmail: vendor.email,
      companyName: vendor.companyName || vendor.email.split("@")[0],
      bazaarName: eventName,   // ← now correct
      attendees: attendeesWithQR
    });

    application.qrCodesSentToVendorAt = new Date();
    await application.save();

    return res.json({
      success: true,
      message: `QR codes sent to ${vendor.email}`,
      eventName,   // ← see it in response too
      count: attendeesWithQR.length
    });

  } catch (error) {
    console.error("sendAllQRCodesToVendor error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
export const sendQRCodesToBoothAttendees = async (req, res) => {
  try {
    const { boothApplicationId } = req.params;

    const application = await BoothApplication.findById(boothApplicationId)
      .populate("vendorId", "companyName email");

    if (!application) {
      return res.status(404).json({ message: "Booth application not found" });
    }

    if (application.status !== "Accepted") {
      return res.status(400).json({ message: "Application must be accepted before sending QR codes" });
    }

    const attendees = application.attendees.map(a => ({
      name: a.name,
      email: a.email
    }));

    const { sendQRCodesToAttendees } = await import("../services/qrCodeService.js");

    const results = await sendQRCodesToAttendees(
      attendees,
      application.vendorId.companyName,   // Company
      application.location || "Booth"     // Event name
    );

    // Update QR codes in DB
    application.attendees.forEach(att => {
      const r = results.find(x => x.email === att.email);
      if (r && r.status === "sent") {
        att.qrCode = r.qrCode;
      }
    });

    application.qrCodesSentAt = new Date();
    await application.save();

    res.status(200).json({
      message: "QR codes sent to booth attendees",
      results
    });

  } catch (error) {
    console.error("Error sending booth attendee QR codes:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const sendQuizToBoothAttendees = async (req, res) => {
  try {
    const { boothApplicationId } = req.params;

    const application = await BoothApplication.findById(boothApplicationId)
      .populate("vendorId", "companyName")
      .populate("bazaarId", "name"); // may be null

    if (!application) {
      return res.status(404).json({ message: "Booth application not found" });
    }

    if (application.status !== "Accepted") {
      return res.status(400).json({
        message: "Application must be accepted before sending QR codes",
      });
    }
     const users = await User.find({ vendorId: application.vendorId });

    // Extract attendees
    const attendees = application.attendees.map((a) => ({
      name: a.name,
      email: a.email,
    }));

    const { sendQuizToAttendees} = await import(
      "../services/qrCodeService.js"
    );

    const results = await sendQuizToAttendees(
      attendees,
      application.location || "Booth"  
    );

    // Mark QR codes for each attendee
    results.forEach((r) => {
      const attendee = application.attendees.find((a) => a.email === r.email);
      if (attendee && r.status === "sent") {
        attendee.qrCode = r.qrCode;
      }
    });

    const failedEmails = results
      .filter((r) => r.status === "failed")
      .map((r) => r.email);

    application.qrCodesSentAt = new Date();
    await application.save();

    res.status(200).json({
      message: "QR codes sent successfully",
      results,
      failedCount: failedEmails.length,
      successCount: results.length - failedEmails.length,
    });
  } catch (error) {
    console.error("Error sending QR codes:", error);
    res.status(500).json({
      message: "Failed to send QR codes",
      error: error.message,
    });
  }
};


export default { sendQRCodesToBazaarAttendees, getBazaarApplicationQRCodes };