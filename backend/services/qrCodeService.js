// backend/services/qrCodeService.js
import QRCode from 'qrcode';
import { google } from 'googleapis';
import nodemailer from 'nodemailer';

// backend/services/qrCodeService.js
//console.log('GMAIL_REFRESH_TOKEN VALUE:', process.env.GMAIL_REFRESH_TOKEN);

// OAUTH2 CLIENT
const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET
);

oauth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN
});

// LAZY-INIT TRANSPORTER (DOES NOT CRASH ON STARTUP)
let transporter = null;

const getTransporter = async () => {
  if (transporter) return transporter;

  try {
    const { token } = await oauth2Client.getAccessToken();
    if (!token) throw new Error('Failed to get access token');

    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.GMAIL_USER,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
        accessToken: token
      }
    });

    // TEST ONCE
    await transporter.verify();
    console.log('GMAIL OAUTH2 READY: Connected successfully');
  } catch (error) {
    console.error('GMAIL OAUTH2 FAILED:', error.message);
    throw error;
  }

  return transporter;
};

// Generate QR code
export const generateQRCode = async (attendeeEmail, boothName, bazaarName) => {
  try {
    const qrData = {
      email: attendeeEmail,
      booth: boothName,
      bazaar: bazaarName,
      timestamp: new Date().toISOString()
    };

    const qrString = JSON.stringify(qrData);
    return await QRCode.toDataURL(qrString);
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

// Send email
export const sendQRCodeEmail = async (attendeeEmail, attendeeName, qrCodeDataUrl, boothName, bazaarName) => {
  try {
    const mailer = await getTransporter();

    const mailOptions = {
      from: `"GUC Events" <${process.env.GMAIL_USER}>`,  // FIXED: Use GMAIL_USER
      to: attendeeEmail,
      subject: `Your QR Code for ${boothName} at ${bazaarName}`,
      html: `
        <h2>Welcome to ${bazaarName}!</h2>
        <p>Dear ${attendeeName},</p>
        <p>You are registered to visit <strong>${boothName}</strong> at our event.</p>
        <p>Please use the QR code below to check in:</p>
        <img src="${qrCodeDataUrl}" alt="QR Code" style="width: 300px; height: 300px; border: 1px solid #ccc; padding: 10px;">
        <p>Event Details:</p>
        <ul>
          <li>Booth: ${boothName}</li>
          <li>Event: ${bazaarName}</li>
          <li>Generated on: ${new Date().toLocaleString()}</li>
        </ul>
        <p>If you have any questions, please contact the Events Office.</p>
        <br>
        <p>Best regards,<br>GUC Events Team</p>
      `
    };

    await mailer.sendMail(mailOptions);
    console.log(`QR code email sent to ${attendeeEmail}`);
    return true;
  } catch (error) {
    console.error('Error sending QR code email:', error);
    throw error;
  }
};

// Batch send
export const sendQRCodesToAttendees = async (attendees, boothName, bazaarName) => {
   const results = [];

  for (const attendee of attendees) {
    try {
      // Send quiz URL email only, no QR code
      await sendVisitorQuizEmail(attendee.email, attendee.name, boothName, bazaarName);

      results.push({
        email: attendee.email,
        status: 'sent'
      });
    } catch (error) {
      results.push({
        email: attendee.email,
        status: 'failed',
        error: error.message
      });
    }
  }

  return results;
};
// services/qrCodeService.js

export const sendAllQRCodesToVendorEmail = async ({ vendorEmail, companyName, bazaarName, attendees }) => {
  if (!attendees || attendees.length === 0) {
    console.log("No attendees → skipping QR email");
    return;
  }

  const qrImages = attendees.map(att => ({
    name: att.name || "Visitor",
    qrCode: att.qrCode || "N/A"
  }));

  const qrHtml = qrImages.map((q, i) => `
    <div style="margin: 30px 0; padding: 20px; border: 2px solid #CEE5D6; border-radius: 16px; text-align: center; background: #f8fff9;">
      <h3 style="margin: 0 0 15px 0; color: #103A57;">${q.name}</h3>
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(q.qrCode)}" 
           alt="QR Code" style="width: 200px; height: 200px; border: 1px solid #ddd;" />
      <p style="margin: 10px 0 0; font-family: monospace; font-size: 13px; color: #307B8E; word-break: break-all;">
        ${q.qrCode}
      </p>
    </div>
  `).join('');

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 700px; margin: 0 auto; padding: 30px; background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
      <h1 style="color: #103A57; text-align: center;">Your Visitor QR Codes</h1>
      <p>Hello <strong>${companyName || "Vendor"}</strong>,</p>
      <p>Here are the QR codes for all external visitors coming to your booth at <strong>${bazaarName || "the event"}</strong>.</p>
      <p>Show these at the entrance gate.</p>
      <hr style="border: 1px dashed #CEE5D6; margin: 30px 0;" />
      ${qrHtml}
      <hr style="border: 1px dashed #CEE5D6; margin: 40px 0 20px;" />
      <p style="color: #666; font-size: 14px; text-align: center;">
        GUC Events Platform • This is an automated message
      </p>
    </div>
  `;

  try {
    const mailer = await getTransporter();  // ← THIS IS THE KEY LINE
    await mailer.sendMail({
      from: `"GUC Events" <${process.env.GMAIL_USER}>`,
      to: vendorEmail,
      subject: `Your Visitor QR Codes - ${bazaarName || "Event"}`,
      html
    });
    console.log("QR codes emailed successfully to:", vendorEmail);
  } catch (error) {
    console.error("Failed to send QR email to vendor:", error.message);
    throw error;
  }
};
export const sendVisitorQuizEmail = async (attendeeEmail, attendeeName, boothName, bazaarName) => {
  try {
    const mailer = await getTransporter();

    // Construct the quiz URL
    const quizUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/visitor-quiz?email=${encodeURIComponent(attendeeEmail)}&booth=${encodeURIComponent(boothName)}&bazaar=${encodeURIComponent(bazaarName)}`;

    const mailOptions = {
      from: `"GUC Events" <${process.env.GMAIL_USER}>`,
      to: attendeeEmail,
      subject: `Your Visitor Quiz for ${boothName} at ${bazaarName}`,
      html: `
        <h2>Welcome to ${bazaarName}!</h2>
        <p>Dear ${attendeeName},</p>
        <p>You are registered to visit <strong>${boothName}</strong> at our event.</p>
        <p>Please take the visitor quiz by clicking the link below:</p>
        <p><a href="${quizUrl}" target="_blank" style="color:#307B8E; font-weight:bold;">Start the Visitor Quiz</a></p>
        <p>Event Details:</p>
        <ul>
          <li>Booth: ${boothName}</li>
          <li>Event: ${bazaarName}</li>
          <li>Generated on: ${new Date().toLocaleString()}</li>
        </ul>
        <p>If you have any questions, please contact the Events Office.</p>
        <br>
        <p>Best regards,<br>GUC Events Team</p>
      `
    };

    await mailer.sendMail(mailOptions);
    console.log(`Visitor quiz email sent to ${attendeeEmail}`);
    return true;
  } catch (error) {
    console.error('Error sending Visitor Quiz email:', error);
    throw error;
  }
};

export const sendQuizToAttendees = async (attendees, boothName) => {
   const results = [];

  for (const attendee of attendees) {
    try {
      // Send quiz URL email only, no QR code
      await sendBoothQuizEmail(attendee.email, attendee.name, boothName);

      results.push({
        email: attendee.email,
        status: 'sent'
      });
    } catch (error) {
      results.push({
        email: attendee.email,
        status: 'failed',
        error: error.message
      });
    }
  }

  return results;
};

export const sendBoothQuizEmail = async (attendeeEmail, attendeeName, boothName) => {
  try {
    const mailer = await getTransporter();

    // Construct the quiz URL
    const quizUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/visitor-quiz?email=${encodeURIComponent(attendeeEmail)}&booth=${encodeURIComponent(boothName)}`;

    const mailOptions = {
      from: `"GUC Events" <${process.env.GMAIL_USER}>`,
      to: attendeeEmail,
      subject: `Your Visitor Quiz for ${boothName}`,
      html: `
        <h2>Welcome!</h2>
        <p>Dear ${attendeeName},</p>
        <p>You are registered to visit <strong>${boothName}</strong> at our event.</p>
        <p>Please take the visitor quiz by clicking the link below:</p>
        <p><a href="${quizUrl}" target="_blank" style="color:#307B8E; font-weight:bold;">Start the Visitor Quiz</a></p>
        <p>Event Details:</p>
        <ul>
          <li>Booth: ${boothName}</li>
          <li>Generated on: ${new Date().toLocaleString()}</li>
        </ul>
        <p>If you have any questions, please contact the Events Office.</p>
        <br>
        <p>Best regards,<br>GUC Events Team</p>
      `
    };

    await mailer.sendMail(mailOptions);
    console.log(`Visitor quiz email sent to ${attendeeEmail}`);
    return true;
  } catch (error) {
    console.error('Error sending Visitor Quiz email:', error);
    throw error;
  }
};


export default { generateQRCode, sendQRCodeEmail, sendQRCodesToAttendees, sendAllQRCodesToVendorEmail };