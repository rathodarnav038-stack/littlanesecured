require('dotenv').config({ quiet: true });
const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');

const db = require('./db');
const { EVENT_NAME, EVENT_DETAILS, generateTicketId, buildTicketPdf, buildQrDataUrl, buildQrBuffer, TICKETS_DIR } = require('./ticket');
const { sendTicketEmail } = require('./mailer');

const app = express();
app.use(cors());
app.use(express.json());

// ==================== EVENT & PRICING ====================
const EVENT = { name: EVENT_NAME };
const PRICING = {
    female: 2,
    male: 1
};

// ==================== RAZORPAY SETUP ====================
const RZP_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RZP_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const TEST_MODE = !RZP_KEY_ID || !RZP_KEY_SECRET;

let razorpay = null;
if (!TEST_MODE) {
    const Razorpay = require('razorpay');
    razorpay = new Razorpay({ key_id: RZP_KEY_ID, key_secret: RZP_KEY_SECRET });
} else {
    console.warn('[Payments] RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not set — running in TEST MODE (no real money is charged). See server/.env.example.');
}

const ADMIN_KEY = process.env.ADMIN_KEY || 'change-me-admin-key';
const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

// Serve generated ticket PDFs at /ticket-files
app.use('/ticket-files', express.static(TICKETS_DIR));

// ==================== SPA ROUTES — /tickets and /dashboard serve React app ====================
// Try multiple candidate paths for the React build (handles local dev + Railway)
const _distCandidates = [
    path.join(__dirname, '../combined-app/dist'),
    path.join(process.cwd(), 'combined-app/dist'),
    path.join(process.cwd(), '../combined-app/dist'),
    '/app/combined-app/dist',
];
const fs2 = require('fs');
const _distDir = _distCandidates.find(p => fs2.existsSync(path.join(p, 'index.html'))) || _distCandidates[0];
const distIndexHtml = path.join(_distDir, 'index.html');
console.log(`React dist: ${_distDir} (exists: ${fs2.existsSync(distIndexHtml)})`);

// Serve static JS/CSS assets from the React build
app.use('/assets', express.static(path.join(_distDir, 'assets')));

app.get('/tickets', (req, res) => res.sendFile(distIndexHtml));
app.get('/tickets/:splat', (req, res) => res.sendFile(distIndexHtml));
app.get('/dashboard', (req, res) => res.sendFile(distIndexHtml));
app.get('/dashboard/:splat', (req, res) => res.sendFile(distIndexHtml));

// Serve original Littlane HTML site (index.html + script.js + styles.css) for everything else
const _staticCandidates = [
    path.join(__dirname, '..'),
    process.cwd(),
    '/app',
];
const _staticDir = _staticCandidates.find(p => fs2.existsSync(path.join(p, 'index.html'))) || _staticCandidates[0];
console.log(`Static dir: ${_staticDir} (exists: ${fs2.existsSync(path.join(_staticDir, 'index.html'))})`);
app.use(express.static(_staticDir));

// ==================== HELPERS ====================
function computeAmount(gender, quantity) {
    const rate = PRICING[gender];
    if (!rate) return null;
    const qty = Math.max(1, Math.min(20, parseInt(quantity, 10) || 1));
    return { amount: rate * qty, qty };
}

function requireAdmin(req, res, next) {
    const key = req.headers['x-admin-key'] || req.query.key;
    if (key !== ADMIN_KEY) return res.status(401).json({ success: false, message: 'Unauthorized' });
    next();
}

// ==================== 1. CREATE ORDER (start of checkout) ====================
app.post('/api/create-order', async (req, res) => {
    const { name, email, phone, gender, quantity } = req.body || {};

    if (!name || !email || !phone || !gender) {
        return res.status(400).json({ success: false, message: 'Name, email, phone and gender are all required.' });
    }
    const computed = computeAmount(gender, quantity);
    if (!computed) {
        return res.status(400).json({ success: false, message: 'Invalid ticket type. Choose Male or Female pass.' });
    }
    const { amount, qty } = computed;

    try {
        let orderId, currency = 'INR';

        if (TEST_MODE) {
            orderId = `order_test_${crypto.randomBytes(8).toString('hex')}`;
        } else {
            const order = await razorpay.orders.create({
                amount: amount * 100, // paise
                currency,
                receipt: `ft_${Date.now()}`
            });
            orderId = order.id;
        }

        await db.createSaleRecord({
            orderId,
            event: EVENT.name,
            name, email, phone, gender,
            quantity: qty,
            amount,
            currency,
            status: 'created',
            paymentId: null,
            ticketId: null,
            emailStatus: null,
            emailError: null,
            errorLog: [],
            createdAt: new Date().toISOString()
        });

        console.log(`[Order Created] ${orderId} | ${name} <${email}> | ${gender} x${qty} = ₹${amount}`);

        res.json({
            success: true,
            testMode: TEST_MODE,
            orderId,
            amount,
            currency,
            keyId: RZP_KEY_ID || null,
            event: EVENT.name
        });
    } catch (err) {
        const details = err.error?.description || err.message || JSON.stringify(err);
        console.error(`[create-order] Error (status ${err.statusCode || 'n/a'}):`, details);
        res.status(err.statusCode === 401 ? 401 : 500).json({
            success: false,
            message: err.statusCode === 401
                ? 'Payment gateway rejected our credentials. Check RAZORPAY_KEY_ID/SECRET in server/.env.'
                : 'Could not start checkout. Please try again.'
        });
    }
});

// ==================== 2. VERIFY PAYMENT (after gateway completes) ====================
app.post('/api/verify-payment', async (req, res) => {
    const { orderId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body || {};

    const sale = await db.getByOrderId(orderId);
    if (!sale) {
        return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    try {
        let paymentId = razorpay_payment_id;

        if (TEST_MODE) {
            paymentId = paymentId || `pay_test_${crypto.randomBytes(8).toString('hex')}`;
        } else {
            const expectedSignature = crypto
                .createHmac('sha256', RZP_KEY_SECRET)
                .update(`${razorpay_order_id}|${razorpay_payment_id}`)
                .digest('hex');

            if (expectedSignature !== razorpay_signature) {
                await db.updateSaleRecord(orderId, {
                    status: 'failed',
                    errorLog: [...(sale.errorLog || []), { at: new Date().toISOString(), stage: 'verify-payment', error: 'Signature mismatch' }]
                });
                return res.status(400).json({ success: false, message: 'Payment verification failed (signature mismatch).' });
            }
        }

        await db.updateSaleRecord(orderId, { status: 'paid', paymentId, paidAt: new Date().toISOString() });

        // ---- Generate the ticket (PDF + QR) ----
        const ticketId = generateTicketId();
        const generatedAt = new Date().toISOString();
        let pdfPath, qrBuffer, qrDataUrl;
        try {
            pdfPath = await buildTicketPdf({
                ticketId,
                name: sale.name,
                email: sale.email,
                gender: sale.gender,
                quantity: sale.quantity,
                amount: sale.amount,
                createdAt: generatedAt
            });
            qrBuffer = await buildQrBuffer(ticketId);
            qrDataUrl = await buildQrDataUrl(ticketId);
            await db.updateSaleRecord(orderId, { status: 'ticket_generated', ticketId, generatedAt });
        } catch (genErr) {
            console.error('[verify-payment] Ticket generation failed:', genErr.message);
            await db.updateSaleRecord(orderId, {
                status: 'ticket_generation_failed',
                errorLog: [...(sale.errorLog || []), { at: new Date().toISOString(), stage: 'ticket_generation', error: genErr.message }]
            });
            return res.status(500).json({
                success: false,
                message: 'Payment succeeded but ticket generation failed. Our team has been notified — contact support with your payment ID.',
                paymentId
            });
        }

        const downloadUrl = `${BASE_URL}/api/ticket/${ticketId}/download`;

        // ---- Email the ticket ----
        const emailResult = await sendTicketEmail({
            to: sale.email,
            name: sale.name,
            ticketId,
            gender: sale.gender,
            quantity: sale.quantity,
            amount: sale.amount,
            pdfPath,
            qrBuffer,
            downloadUrl
        });

        if (emailResult.success) {
            await db.updateSaleRecord(orderId, { status: 'emailed', emailStatus: 'sent', emailError: null, emailPreviewUrl: emailResult.previewUrl || null });
        } else {
            await db.updateSaleRecord(orderId, {
                status: 'email_failed',
                emailStatus: 'failed',
                emailError: emailResult.error,
                errorLog: [...(sale.errorLog || []), { at: new Date().toISOString(), stage: 'email', error: emailResult.error }]
            });
        }

        console.log(`[Ticket Issued] ${ticketId} for ${sale.email} | email ${emailResult.success ? 'sent ✅' : 'FAILED ❌ (' + emailResult.error + ')'}`);

        res.json({
            success: true,
            ticketId,
            downloadUrl,
            qrDataUrl,
            emailSent: emailResult.success,
            emailError: emailResult.success ? null : emailResult.error,
            event: EVENT.name,
            name: sale.name,
            email: sale.email,
            gender: sale.gender,
            quantity: sale.quantity,
            amount: sale.amount,
            generatedAt,
            details: EVENT_DETAILS
        });
    } catch (err) {
        console.error('[verify-payment] Error:', err.message);
        await db.updateSaleRecord(orderId, {
            status: 'failed',
            errorLog: [...(sale.errorLog || []), { at: new Date().toISOString(), stage: 'verify-payment', error: err.message }]
        });
        res.status(500).json({ success: false, message: 'Something went wrong verifying your payment. Please contact support.' });
    }
});

// ==================== 3. TICKET DOWNLOAD ====================
app.get('/api/ticket/:ticketId/download', async (req, res) => {
    const sale = await db.getByTicketId(req.params.ticketId);
    if (!sale) return res.status(404).send('Ticket not found.');
    const filePath = path.join(TICKETS_DIR, `${sale.ticketId}.pdf`);
    res.download(filePath, `${EVENT.name.replace(/\s+/g, '-')}-${sale.ticketId}.pdf`, err => {
        if (err) res.status(404).send('Ticket file not found. Please contact support.');
    });
});


// ==================== 4. RESEND TICKET EMAIL (self-serve retry) ====================
app.post('/api/ticket/:ticketId/resend', async (req, res) => {
    const sale = await db.getByTicketId(req.params.ticketId);
    if (!sale) return res.status(404).json({ success: false, message: 'Ticket not found.' });

    const pdfPath = path.join(TICKETS_DIR, `${sale.ticketId}.pdf`);
    const downloadUrl = `${BASE_URL}/api/ticket/${sale.ticketId}/download`;
    const result = await sendTicketEmail({ to: sale.email, name: sale.name, ticketId: sale.ticketId, pdfPath, downloadUrl });

    await db.updateSaleRecord(sale.orderId, {
        emailStatus: result.success ? 'sent' : 'failed',
        emailError: result.success ? null : result.error,
        status: result.success ? 'emailed' : 'email_failed'
    });

    res.json({ success: result.success, message: result.success ? 'Ticket re-sent!' : `Failed: ${result.error}` });
});

// ==================== 5. ADMIN — MONITOR EVERY SALE ====================
app.get('/api/admin/sales', requireAdmin, async (req, res) => {
    const sales = await db.getAll();
    const summary = {
        totalOrders: sales.length,
        paidOrders: sales.filter(s => ['paid', 'ticket_generated', 'emailed', 'email_failed', 'scanned'].includes(s.status)).length,
        totalRevenue: sales.filter(s => ['paid', 'ticket_generated', 'emailed', 'email_failed', 'scanned'].includes(s.status)).reduce((sum, s) => sum + (s.amount || 0), 0),
        emailFailures: sales.filter(s => s.emailStatus === 'failed').length,
        ticketFailures: sales.filter(s => s.status === 'ticket_generation_failed').length
    };
    res.json({ success: true, testMode: TEST_MODE, summary, sales });
});

app.get('/api/admin/config', requireAdmin, (req, res) => {
    res.json({ success: true, event: EVENT.name, pricing: PRICING, testMode: TEST_MODE });
});

// ==================== 6. ADMIN — GENERATE TICKET MANUALLY ====================
app.post('/api/admin/generate-ticket', async (req, res) => {
    const { name, email, phone, gender, ticketType, quantity, amount, event } = req.body || {};

    if (!name || !email) {
        return res.status(400).json({ success: false, message: 'Name and email are required.' });
    }

    const qty = parseInt(quantity, 10) || 1;
    const finalAmount = parseFloat(amount) || 0;
    const evtName = event || EVENT.name;
    const tType = ticketType || (gender === 'male' ? 'Male Pass' : gender === 'female' ? 'Female Pass' : 'General');

    try {
        const orderId = `order_manual_${crypto.randomBytes(8).toString('hex')}`;
        const ticketId = generateTicketId();
        const generatedAt = new Date().toISOString();

        await db.createSaleRecord({
            orderId,
            event: evtName,
            name, email, phone: phone || '', gender: gender || 'general',
            quantity: qty, amount: finalAmount, currency: 'INR',
            status: 'paid', paymentId: 'manual', ticketId,
            emailStatus: 'pending', emailError: null, errorLog: [],
            createdAt: generatedAt, paidAt: generatedAt, generatedAt,
            scannedBy: null, scannedAt: null
        });

        // Build PDF and QR
        const pdfPath = await buildTicketPdf({
            ticketId,
            name,
            email,
            gender: tType,
            quantity: qty,
            amount: finalAmount,
            createdAt: generatedAt
        });
        const qrBuffer = await buildQrBuffer(ticketId);
        const qrDataUrl = await buildQrDataUrl(ticketId);

        await db.updateSaleRecord(orderId, { status: 'ticket_generated' });

        const downloadUrl = `${BASE_URL}/api/ticket/${ticketId}/download`;

        // Send Email
        const emailResult = await sendTicketEmail({
            to: email,
            name,
            ticketId,
            gender: tType,
            quantity: qty,
            amount: finalAmount,
            pdfPath,
            qrBuffer,
            downloadUrl
        });

        if (emailResult.success) {
            await db.updateSaleRecord(orderId, { status: 'emailed', emailStatus: 'sent', emailError: null, emailPreviewUrl: emailResult.previewUrl || null });
        } else {
            await db.updateSaleRecord(orderId, {
                status: 'email_failed',
                emailStatus: 'failed',
                emailError: emailResult.error,
                errorLog: [{ at: new Date().toISOString(), stage: 'email', error: emailResult.error }]
            });
        }

        res.json({
            success: true,
            ticket: {
                id: ticketId,
                orderId,
                event: evtName,
                attendee: name,
                email,
                phone,
                ticketType: tType,
                price: finalAmount.toString(),
                qty,
                generatedBy: 'Admin',
                generatedAt,
                status: 'pending',
                downloadUrl,
                qrDataUrl
            }
        });
    } catch (err) {
        console.error('[manual-generate] Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==================== 7. SCAN TICKET ====================
app.post('/api/scan-ticket', async (req, res) => {
    const { ticketId, scannedBy } = req.body || {};
    if (!ticketId) {
        return res.status(400).json({ success: false, message: 'Ticket ID is required' });
    }

    try {
        const sale = await db.getByTicketId(ticketId);
        if (!sale) {
            return res.json({ result: 'not_found' });
        }

        if (sale.status === 'scanned' || sale.scannedAt) {
            return res.json({
                result: 'rejected',
                ticket: {
                    id: sale.ticketId,
                    event: sale.event,
                    attendee: sale.name,
                    email: sale.email,
                    phone: sale.phone,
                    ticketType: sale.gender,
                    quantity: sale.quantity,
                    amount: sale.amount,
                    generatedAt: sale.generatedAt,
                    status: 'scanned',
                    scannedBy: sale.scannedBy,
                    scannedAt: sale.scannedAt
                }
            });
        }

        const now = new Date();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const hh = now.getHours().toString().padStart(2, '0');
        const mm = now.getMinutes().toString().padStart(2, '0');
        const scannedAtStr = `${months[now.getMonth()]} ${now.getDate()}, ${hh}:${mm}`;

        await db.updateSaleRecord(sale.orderId, {
            status: 'scanned',
            scannedBy: scannedBy || 'Gate Staff',
            scannedAt: scannedAtStr
        });

        const updatedSale = await db.getByOrderId(sale.orderId);

        res.json({
            result: 'success',
            ticket: {
                id: updatedSale.ticketId,
                event: updatedSale.event,
                attendee: updatedSale.name,
                email: updatedSale.email,
                phone: updatedSale.phone,
                ticketType: updatedSale.gender,
                quantity: updatedSale.quantity,
                amount: updatedSale.amount,
                generatedAt: updatedSale.generatedAt,
                status: 'scanned',
                scannedBy: updatedSale.scannedBy,
                scannedAt: updatedSale.scannedAt
            }
        });
    } catch (err) {
        console.error('[scan-ticket] Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==================== HEALTH ====================
app.get('/api/health', (req, res) => res.json({ success: true, event: EVENT.name, testMode: TEST_MODE }));

// All other routes — serve original Littlane index.html at root
app.get('/{*splat}', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n🎟  ${EVENT.name} ticketing server running on port ${PORT}`);
    console.log(`   Mode: ${TEST_MODE ? 'TEST MODE (no real payments)' : 'LIVE (Razorpay)'}`);
    console.log(`   Admin dashboard: ${BASE_URL}/dashboard  (key required)\n`);
});
