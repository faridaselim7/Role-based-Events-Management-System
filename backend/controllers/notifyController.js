import { Notification } from "../models/Notification.js";
import sgMail from "@sendgrid/mail";

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export async function notifyWorkshopSubmitted({ workshop, triggeredBy }) {
  return Notification.create({
    type: "workshop_submitted",
    message: `New workshop request submitted: ${workshop.title}`,
    workshop: workshop._id,
    createdBy: triggeredBy,
    audienceRole: "events_office",
  });
}

export async function notifyWorkshopAccepted({ workshop, triggeredBy }) {
  if (!workshop?.createdBy) return; // nothing to notify

  return Notification.create({
    type: "workshop_accepted",
    message: `Your workshop "${workshop.title}" has been accepted and published.`,
    workshop: workshop._id,
    createdBy: triggeredBy || null,
    audienceRole: "professor",
    targetUser: workshop.createdBy,
  });
}

export async function notifyWorkshopRejected({ workshop, triggeredBy }) {
  if (!workshop?.createdBy) return;

  return Notification.create({
    type: "workshop_rejected",
    message: `Your workshop "${workshop.title}" has been rejected.`,
    workshop: workshop._id,
    createdBy: triggeredBy || null,
    audienceRole: "professor",
    targetUser: workshop.createdBy,
  });
}

export async function notifyEventCreated({ event, triggeredBy }) {
  return Notification.create({
    type: "event_created",
    message: `A new event was added: ${event.title}`,
    createdBy: triggeredBy || null,
    audienceRole: "all",   // students + staff + TA + professors + EO + admin
  });
}

export async function notifyNewLoyaltyPartner({ partner, triggeredBy }) {
  const roles = ["student", "staff", "ta", "professor"];

  const notifications = roles.map((role) => ({
    type: "new_loyalty_partner",
    message: `New GUC Loyalty Partner added: ${partner.name}`,
    createdBy: triggeredBy || null,
    audienceRole: role,
    partnerId: partner._id,
  }));

  // create all notifications at once
  return Notification.insertMany(notifications);
}


export async function notifyEventReminder({ event, userId, when, eventId, eventType }) {
  // when = "1d" or "1h"
  if (!event || !userId) return;

  const type =
    when === "1d" ? "event_reminder_1d" :
    when === "1h" ? "event_reminder_1h" :
    "generic";

  const whenText =
    when === "1d" ? "tomorrow" :
    when === "1h" ? "in 1 hour" :
    "soon";

  const dateStr = event.date
    ? new Date(event.date).toLocaleString()
    : "";

  const message = `Reminder: "${event.title}" is ${whenText}${dateStr ? ` at ${dateStr}` : ""}.`;

  const doc = {
    type,
    message,
    createdBy: null,
    targetUser: userId,   // 🔥 personal notification
    audienceRole: "all",
  };

  if (eventId) doc.eventId = eventId;
  if (eventType) doc.eventType = eventType;

  return Notification.create(doc);
}

export async function notifyPendingVendorRequest({ vendor }) {
  const roles = ["events_office", "admin"];

  const notifications = roles.map((role) => ({
    type: "vendor_request_pending",
    message: `Vendor request from ${vendor.vendorName} is pending approval.`,
    createdBy: vendor._id,
    audienceRole: role,
    vendorId: vendor._id,
  }));

  return Notification.insertMany(notifications);
}



export async function notifyVendorApplicationStatusEmail({ application, vendor }) {
  if (!vendor?.email) {
    console.warn("No vendor email found, skipping vendor status email");
    return;
  }

  const status = application.status; // "Accepted" or "Rejected"
  const isBazaar = !!application.bazaarId;

  const subject = isBazaar
    ? `Your bazaar application has been ${status.toLowerCase()}`
    : `Your booth application has been ${status.toLowerCase()}`;

  // Try to get some nice extra info if populated
  const bazaarName =
    application.bazaarId && application.bazaarId.name
      ? application.bazaarId.name
      : null;

  const companyName = vendor.companyName || "Vendor";

  const bazaarLine = bazaarName
    ? `<p>Bazaar: <strong>${bazaarName}</strong></p>`
    : "";

  const statusText =
    status === "Accepted"
      ? "We’re happy to inform you that your application has been accepted."
      : "We’re sorry to inform you that your application has been rejected.";

  const html = `
    <p>Hi ${companyName},</p>
    <p>${statusText}</p>
    ${bazaarLine}
    <p>Application type: <strong>${isBazaar ? "Bazaar" : "Booth"}</strong></p>
    <p>Status: <strong>${status}</strong></p>
    <p>You can log in to your vendor dashboard to see more details.</p>
    <p>Best regards,<br/>Inspire Events Team</p>
  `;

  if (!process.env.OUTLOOK_USER) {
    console.warn("OUTLOOK_USER is not set, cannot send vendor email");
    return;
  }

  const msg = {
    to: vendor.email,
    from: process.env.OUTLOOK_USER,
    subject,
    html,
  };

  try {
    await sgMail.send(msg);
    console.log("Vendor status email sent to", vendor.email);
  } catch (err) {
    console.error("Error sending vendor status email:", err);
  }
}

export async function notifyGymSessionChangeEmail({ session, users, changeType }) {
  try {
    if (!users || users.length === 0) {
      console.log("No users to notify for gym session change");
      return;
    }

    if (!process.env.SENDGRID_API_KEY || !process.env.OUTLOOK_USER) {
      console.warn("Missing SENDGRID_API_KEY or OUTLOOK_USER, skipping gym email notifications");
      return;
    }

    const typeLabels = {
      yoga: "Yoga",
      pilates: "Pilates",
      aerobics: "Aerobics",
      zumba: "Zumba",
      cross_circuit: "Cross Circuit",
      kick_boxing: "Kick Boxing",
    };

    const sessionTypeName = typeLabels[session.type] || session.type || "Gym Session";

    const dateStr = session.date
      ? new Date(session.date).toLocaleString()
      : "";

    const isCancelled = changeType === "cancelled";
    const subject = isCancelled
      ? `Gym session cancelled: ${sessionTypeName}`
      : `Gym session updated: ${sessionTypeName}`;

    const mainText = isCancelled
      ? `The following gym session you registered for has been cancelled.`
      : `The following gym session you registered for has been updated.`;

    const reasonText =
      isCancelled && session.cancellationReason
        ? `<p><strong>Reason:</strong> ${session.cancellationReason}</p>`
        : "";

    const timeLine = `
      <p><strong>Type:</strong> ${sessionTypeName}</p>
      ${dateStr ? `<p><strong>Date & time:</strong> ${dateStr} (${session.time || ""})</p>` : ""}
      <p><strong>Duration:</strong> ${session.durationMins || "N/A"} minutes</p>
    `;

    const baseHtml = (displayName) => `
      <p>Hi ${displayName},</p>
      <p>${mainText}</p>
      ${timeLine}
      ${reasonText}
      <p>You can check the latest schedule in your dashboard.</p>
      <p>Best regards,<br/>Inspire Gym Team</p>
    `;

    const messages = users
      .filter((u) => !!u.email)
      .map((user) => {
        const displayName =
          [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
          user.email;

        return {
          to: user.email,
          from: process.env.OUTLOOK_USER,
          subject,
          html: baseHtml(displayName),
        };
      });

    if (!messages.length) {
      console.log("No users with email to notify for gym session change");
      return;
    }

    await sgMail.send(messages);
    console.log(
      `Sent ${changeType} gym session emails to`,
      messages.map((m) => m.to)
    );
  } catch (err) {
    console.error("Error sending gym session change emails:", err);
  }
}

