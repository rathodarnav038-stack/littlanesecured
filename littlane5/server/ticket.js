// Generates a unique ticket ID, a QR code, and a downloadable "Littix"-style
// PDF pass for FRESHERS TAKEOVER — mirrors the reference ticket design
// (banner artwork, NOT SCANNED / ACTIVE badges, info pills, QR, Littix mark).

const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');
const { randomUUID } = require('crypto');

const TICKETS_DIR = path.join(__dirname, 'tickets');
if (!fs.existsSync(TICKETS_DIR)) fs.mkdirSync(TICKETS_DIR, { recursive: true });

const BANNER_PATH = path.join(__dirname, 'coe-freshers-party-2026.png');
const LEGACY_FRESHERS_BANNER_PATH = path.join(__dirname, 'ticket-banner.png');
const AURA_BANNER_PATH = path.join(__dirname, 'aura-ticket-banner.jpg');
const INVITE_BANNER_PATH = path.join(__dirname, 'invite-banner.png');
const TAKEOVER2_BANNER_PATH = path.join(__dirname, 'takeover2-banner.jpeg');

const EVENT_NAME = 'COE UNOFFICIAL FRESHERS PARTY 2026';

// ---- Edit these to match your actual event details ----
const EVENT_DETAILS = {
    brand: 'COE UNOFFICIAL FRESHERS PARTY 2026',
    stage: 'Food · Live DJ · Dance',
    admission: 'General Admission',
    date: '06 OCT 2026',
    time: 'TBA',
    venue: 'THE MILLS · PUNE',
    generatedBy: 'Littlane Events'
};

const GENDER_LABEL = { female: 'Female Pass', male: 'Male Pass' };

function generateTicketId() {
    // Short, human-readable, still unique: FT-XXXXXXXX
    return `FT-${randomUUID().split('-')[0].toUpperCase()}`;
}

/** QR data URL for inline display in the browser / email (encodes the ticket ID). */
async function buildQrDataUrl(ticketId) {
    return QRCode.toDataURL(ticketId, { margin: 1, width: 400 });
}

/** QR PNG buffer, reused by the PDF and the emailed inline image. */
async function buildQrBuffer(ticketId) {
    return QRCode.toBuffer(ticketId, { margin: 1, width: 400 });
}

function pill(doc, { x, y, w, h, bg, textColor, label, fontSize = 8 }) {
    doc.roundedRect(x, y, w, h, h / 2).fill(bg);
    doc.font('Helvetica-Bold').fontSize(fontSize).fillColor(textColor)
        .text(label, x, y + (h - fontSize) / 2 - 1, { width: w, align: 'center' });
}



/**
 * Renders the "Littix"-style ticket PDF: banner artwork with NOT SCANNED /
 * ACTIVE badges, then a white details panel with pills, ticket type/qty/
 * price, ticket ID, QR code, and the Littix wordmark.
 */
async function buildTicketPdf({ ticketId, name, email, gender, quantity, amount, createdAt, event }) {
    const filePath = path.join(TICKETS_DIR, `${ticketId}.pdf`);
    const qrPngBuffer = await buildQrBuffer(ticketId);

    const eventName = (event || EVENT_NAME).toUpperCase();
    const isAura = eventName.includes('AURA');
    const isLegacyTakeover = eventName.includes('TAKEOVER 2');
    const isLegacyFreshers = eventName === 'FRESHERS TAKEOVER';
    const brandName = isAura ? 'AURA GENESIS' : isLegacyTakeover ? 'TAKEOVER 2.0' : isLegacyFreshers ? 'FRESHERS TAKEOVER' : EVENT_DETAILS.brand;
    const eventDate = isAura ? '14 AUG 2026' : isLegacyFreshers ? '05 AUG 2026' : isLegacyTakeover ? 'TBA' : EVENT_DETAILS.date;
    const eventVenue = isLegacyFreshers ? 'Flo The Brewery, Pune' : isLegacyTakeover ? 'Pune' : EVENT_DETAILS.venue;
    const bannerFile = isAura ? AURA_BANNER_PATH : BANNER_PATH;

    const W = 380;
    const BANNER_H = 650;

    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: [W, 1200], margin: 0 });
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        let bannerToUse = BANNER_PATH;
        if (event && event.toUpperCase().includes('TAKEOVER 2') && fs.existsSync(TAKEOVER2_BANNER_PATH)) {
            bannerToUse = TAKEOVER2_BANNER_PATH;
        } else if (event && event.toUpperCase().includes('AURA') && fs.existsSync(AURA_BANNER_PATH)) {
            bannerToUse = AURA_BANNER_PATH;
        } else if (event && event.toUpperCase() === 'FRESHERS TAKEOVER' && fs.existsSync(LEGACY_FRESHERS_BANNER_PATH)) {
            bannerToUse = LEGACY_FRESHERS_BANNER_PATH;
        } else if (gender && gender.toUpperCase().includes('EXCLUSIVE') && fs.existsSync(INVITE_BANNER_PATH)) {
            bannerToUse = INVITE_BANNER_PATH;
        }

        // ---- Banner artwork ----
        if (fs.existsSync(bannerToUse)) {
            doc.image(bannerToUse, 0, 0, { width: W, height: BANNER_H });
        } else {
            doc.rect(0, 0, W, BANNER_H).fill('#0d0d0f');
        }

        // Badges over the banner
        pill(doc, { x: 16, y: 16, w: 96, h: 22, bg: 'rgba(255,255,255,0.85)', textColor: '#333333', label: 'NOT SCANNED' });
        pill(doc, { x: W - 16 - 64, y: 16, w: 64, h: 22, bg: '#22c55e', textColor: '#ffffff', label: 'ACTIVE' });

        // ---- White details panel ----
        let y = BANNER_H + 22;
        doc.rect(0, BANNER_H, W, 1200 - BANNER_H).fill('#ffffff');

        const titleWidth = W - 48;
        let titleFontSize = 20;
        doc.font('Helvetica-Bold').fillColor('#0d0d0f');
        while (titleFontSize > 14 && doc.fontSize(titleFontSize).widthOfString(brandName) > titleWidth) {
            titleFontSize -= 0.5;
        }
        doc.fontSize(titleFontSize).text(brandName, 24, y, { width: titleWidth, lineBreak: false });
        y += doc.currentLineHeight() + 6;
        const passLabel = GENDER_LABEL[gender] || gender;
        doc.font('Helvetica-Bold').fontSize(11).fillColor('#A855F7')
            .text(passLabel.toUpperCase(), 24, y);
        y += doc.currentLineHeight() + 8;
        
        doc.font('Helvetica-Bold').fontSize(12).fillColor('#111111').text(`Attendee: ${name}`, 24, y);
        y += 22;

        // Info pills: date / time / venue (Aura Genesis: date only)
        const pillY = y;
        const pillH = 26;
        const infoPills = isAura ? [eventDate] : [eventDate, EVENT_DETAILS.time, eventVenue];
        let px = 24;
        infoPills.forEach(text => {
            const w = 30 + text.length * 6.5;
            pill(doc, { x: px, y: pillY, w, h: pillH, bg: '#f2f2f5', textColor: '#333333', label: text, fontSize: 9 });
            px += w + 8;
        });
        y = pillY + pillH + 20;

        doc.moveTo(24, y).lineTo(W - 24, y).strokeColor('#e5e5e8').lineWidth(1).stroke();
        y += 20;

        // Ticket type / qty / price row
        const isExclusive = gender && gender.toUpperCase().includes('EXCLUSIVE');
        const colW = (W - 48) / 3;
        const cols = isExclusive ? [
            { label: 'TICKET TYPE', value: 'Exclusive Pass', align: 'left' },
            { label: 'QTY', value: String(quantity), align: 'center' },
            { label: 'ACCESS', value: 'Complimentary', align: 'right' }
        ] : [
            { label: 'TICKET TYPE', value: GENDER_LABEL[gender] || gender, align: 'left' },
            { label: 'QTY', value: String(quantity), align: 'center' },
            { label: 'PRICE', value: `Rs. ${amount}`, align: 'right' }
        ];
        cols.forEach((c, i) => {
            const x = 24 + i * colW;
            doc.font('Helvetica').fontSize(8).fillColor('#9a9a9a').text(c.label, x, y, { width: colW, align: c.align });
            doc.font('Helvetica-Bold').fontSize(13).fillColor('#0d0d0f').text(c.value, x, y + 13, { width: colW, align: c.align });
        });
        y += 52;

        doc.moveTo(24, y).lineTo(W - 24, y).strokeColor('#e5e5e8').lineWidth(1).stroke();
        y += 18;

        doc.font('Helvetica').fontSize(8).fillColor('#9a9a9a').text('TICKET ID', 24, y);
        doc.font('Helvetica-Bold').fontSize(14).fillColor('#0d0d0f').text(ticketId, 24, y + 13);
        y += 36;
        doc.font('Helvetica').fontSize(8).fillColor('#9a9a9a')
            .text(`Generated by nexoracult on ${new Date(createdAt).toLocaleString('en-IN')}`, 24, y);
        y += 30;

        // QR code, centered
        const qrSize = 180;
        doc.image(qrPngBuffer, (W - qrSize) / 2, y, { width: qrSize, height: qrSize });
        y += qrSize + 25;

        // Brand signature — LITTLANE ENTERTAINMENT centered
        doc.font('Helvetica-Bold').fontSize(11).fillColor('#000000')
            .text('LITTLANE ENTERTAINMENT', 0, y, { width: W, align: 'center' });

        doc.end();
        stream.on('finish', () => resolve(filePath));
        stream.on('error', reject);
    });
}

module.exports = {
    EVENT_NAME,
    EVENT_DETAILS,
    GENDER_LABEL,
    generateTicketId,
    buildQrDataUrl,
    buildQrBuffer,
    buildTicketPdf,
    TICKETS_DIR,
    BANNER_PATH,
    AURA_BANNER_PATH,
    INVITE_BANNER_PATH,
    TAKEOVER2_BANNER_PATH
};
