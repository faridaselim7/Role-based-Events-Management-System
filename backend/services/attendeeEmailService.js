import { getTransporter } from "./qrCodeService.js";  // reuse same Gmail OAuth2
import { generateQRCode } from "./qrCodeService.js";

export const sendQRCodeToAttendeeEmail = async ({ attendee, boothName, bazaarName }) => {
  try {
    const mailer = await getTransporter();

    // create the quiz URL
    const quizUrl = `${process.env.BASE_URL}/visitor-quiz?visitorId=${attendee._id}&boothId=${attendee.boothId}`;

    // generate QR for this attendee
    const qrCode = await generateQRCode(attendee.email, boothName, bazaarName);

    const html = `
      <div style="font-family:Arial; padding:20px">
        <h2>Hello ${attendee.name},</h2>

        <p>You are registered to visit <strong>${boothName}</strong> at <strong>${bazaarName}</strong>.</p>

        <p><strong>Your QR Code:</strong></p>
        <img src="${qrCode}" style="width:200px;" />

        <p><strong>Your Check-In Link:</strong></p>
        <a href="${quizUrl}" target="_blank">${quizUrl}</a>

        <br><br>
        <p>See you at the event!</p>
      </div>
    `;

    await mailer.sendMail({
      from: `"GUC Events" <${process.env.GMAIL_USER}>`,
      to: attendee.email,
      subject: `Your Visitor QR Code`,
      html
    });

    console.log("Attendee email sent:", attendee.email);

    return true;
  } catch (err) {
    console.error("Attendee email error:", err);
    return false;
  }
};
