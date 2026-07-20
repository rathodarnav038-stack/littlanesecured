// Handles sending the ticket to the buyer's email once payment succeeds.
// Configure real SMTP credentials in server/.env — see .env.example.

const fs = require('fs');
const nodemailer = require('nodemailer');
const { EVENT_NAME, EVENT_DETAILS, GENDER_LABEL, BANNER_PATH } = require('./ticket');

let transporter = null;
let usingTestAccount = false;

async function getTransporter() {
    if (transporter) return transporter;

    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: Number(process.env.SMTP_PORT) === 465,
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        });
        return transporter;
    }

    // No SMTP configured — fall back to a free Ethereal test inbox so the
    // whole flow (including "email sent") still works out of the box while
    // you're testing. Nothing will land in a real inbox until you set
    // SMTP_HOST / SMTP_USER / SMTP_PASS in server/.env.
    console.warn('[Mailer] No SMTP_HOST configured — using a temporary Ethereal test inbox. Set SMTP_HOST/SMTP_USER/SMTP_PASS in server/.env to send real emails.');
    const testAccount = await nodemailer.createTestAccount();
    usingTestAccount = true;
    transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: { user: testAccount.user, pass: testAccount.pass }
    });
    return transporter;
}

/**
 * Emails the "Littix"-style ticket to the buyer: banner + QR shown inline,
 * PDF pass attached. Returns { success, error, previewUrl }.
 * previewUrl is only present when using the Ethereal test fallback.
 */
async function sendTicketEmail({ to, name, ticketId, gender, quantity, amount, pdfPath, qrBuffer, downloadUrl }) {
    try {
        const t = await getTransporter();
        const genderLabel = GENDER_LABEL[gender] || gender;

        const attachments = [
            { filename: `${ticketId}.pdf`, path: pdfPath }
        ];
        if (qrBuffer) attachments.push({ filename: 'qr.png', content: qrBuffer, cid: 'ticketqr' });
        if (fs.existsSync(BANNER_PATH)) attachments.push({ filename: 'banner.png', path: BANNER_PATH, cid: 'ticketbanner' });

        const html = `
        <div style="font-family:Arial,sans-serif;max-width:420px;margin:auto;background:#0d0d0f;border-radius:16px;overflow:hidden;">
          <img src="cid:ticketbanner" alt="${EVENT_NAME}" style="width:100%;display:block;" />
          <div style="background:#ffffff;padding:24px;">
            <p style="color:#A855F7;font-weight:700;font-size:11px;letter-spacing:.06em;text-transform:uppercase;margin:0 0 4px;">${EVENT_NAME}</p>
            <h2 style="margin:0 0 4px;color:#0d0d0f;">${EVENT_DETAILS.brand}</h2>
            <p style="margin:0 0 16px;color:#A855F7;font-size:13px;font-weight:600;">${EVENT_DETAILS.stage} · ${EVENT_DETAILS.admission}</p>
            <p style="margin:0 0 16px;color:#555;font-size:13px;">📅 ${EVENT_DETAILS.date} &nbsp; ⏰ ${EVENT_DETAILS.time} &nbsp; 📍 ${EVENT_DETAILS.venue}</p>
            <hr style="border:none;border-top:1px solid #eee;margin:16px 0;">
            <table style="width:100%;font-size:13px;color:#0d0d0f;margin-bottom:16px;">
              <tr>
                <td style="color:#999;font-size:11px;">TICKET TYPE<br><b style="color:#0d0d0f;font-size:14px;">${genderLabel}</b></td>
                <td style="color:#999;font-size:11px;text-align:center;">QTY<br><b style="color:#0d0d0f;font-size:14px;">${quantity}</b></td>
                <td style="color:#999;font-size:11px;text-align:right;">PRICE<br><b style="color:#0d0d0f;font-size:14px;">₹${amount}</b></td>
              </tr>
            </table>
            <hr style="border:none;border-top:1px solid #eee;margin:16px 0;">
            <p style="color:#999;font-size:11px;margin:0;">TICKET ID</p>
            <p style="color:#0d0d0f;font-size:15px;font-weight:700;margin:2px 0 16px;">${ticketId}</p>
            <div style="text-align:center;margin:16px 0;">
              <img src="cid:ticketqr" alt="QR code" style="width:160px;height:160px;" />
              <p style="color:#999;font-size:11px;margin-top:8px;">Show this QR code at entry</p>
            </div>
            <p style="text-align:center;margin:20px 0 4px;font-weight:700;color:#0d0d0f;">Lit<span style="color:#A855F7;">tix</span> •</p>
          </div>
          <div style="padding:16px 24px;background:#0d0d0f;text-align:center;">
            <a href="${downloadUrl}" style="background:#A855F7;color:#fff;padding:10px 22px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;display:inline-block;">Download Ticket</a>
          </div>
        </div>`;

        const info = await t.sendMail({
            from: process.env.EMAIL_FROM || '"Littlane Events" <events@littlane.com>',
            to,
            subject: `Your ${EVENT_NAME} Pass — ${ticketId}`,
            text: `Hi ${name},\n\nThanks for booking your ${EVENT_NAME} pass! Your ticket (${ticketId}) is attached as a PDF.\n\nYou can also download it anytime here: ${downloadUrl}\n\nSee you on the dancefloor!\n— Littlane Entertainment`,
            html,
            attachments
        });

        const previewUrl = usingTestAccount ? nodemailer.getTestMessageUrl(info) : null;
        if (previewUrl) console.log(`[Mailer] Test email preview: ${previewUrl}`);
        return { success: true, messageId: info.messageId, previewUrl };
    } catch (error) {
        console.error(`[Mailer] Failed to send ticket to ${to}:`, error.message);
        return { success: false, error: error.message };
    }
}

module.exports = { sendTicketEmail };
