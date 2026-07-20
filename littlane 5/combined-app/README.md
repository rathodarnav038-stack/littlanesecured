# Littix — QR Ticketing & Verification System

A fully working web app built from the Littix Figma design: generate QR tickets, scan them with your camera, and track check-ins on a live dashboard.

## What's working

- **Generate Ticket** — real form (event, attendee, email, date/time, ticket type) that creates a new ticket
- **Ticket Card** — shows a real scannable QR code (encodes the ticket ID), "Send to Email" confirmation
- **QR Scanner** — uses your device camera (`getUserMedia` + `jsQR`) to actually decode QR codes, plus manual ID entry
- **Scan Success / Scan Rejected** — driven by real ticket state: first scan succeeds, a repeat scan is rejected as a duplicate, an unknown code is rejected as not found
- **Dashboard** — live stats, working search, working status filters (All / Scanned / Pending), tap a row to open that ticket
- **Light / Dark theme toggle** — persisted, same exact visual system as the original design
- Ticket data persists in the browser via `localStorage`, so refreshing keeps your tickets

## Run it

```bash
npm install
npm run dev
```

Open the printed local URL. For camera scanning to work on a phone, serve over HTTPS or `localhost` (browser camera permission requirement).

## Build for deployment

```bash
npm run build
```

Outputs a static site in `dist/` — deploy it to Vercel, Netlify, Cloudflare Pages, GitHub Pages, or any static host.

## Try the flow

1. On the Dashboard, tap **+ New Ticket**, fill it in, generate it — you'll land on the Ticket Card with a live QR code.
2. Tap **Scan Ticket**, point your camera at that QR code (or another device showing it) — it will resolve to **Ticket Valid**.
3. Scan the same code again — it resolves to **Already Scanned**.
4. Try **Enter ID Manually** with a made-up code — it resolves to **Ticket Not Found**.

## Stack

React 19 + TypeScript + Vite + Tailwind CSS v4, `qrcode` for generation, `jsqr` for camera decoding, `framer-motion` for animation.

## Animation pass

Every screen now runs on Framer Motion:

- Animated route transitions between screens (slide forward/back depending on navigation depth, fade for the full-screen scanner)
- Dashboard: count-up stat numbers, staggered ticket list entrance, sliding "pill" background on filters, animated theme toggle icon swap, focus glow on search
- Generate Ticket: staggered field entrance, focus glow on inputs, sliding pill on ticket type selector, a real button state machine (idle → loading spinner → animated checkmark → navigate)
- Ticket Card: card entrance with a subtle 3D tilt-in, image zoom-in, staggered detail rows, QR code pop-in, animated "Sent to email" checkmark
- QR Scanner: animated scan line, corner brackets pop in, live green "detected" flash + checkmark the instant a code resolves, spring-driven manual-entry bottom sheet
- Scan Success: confetti burst, spring-scaled success badge with a drawn checkmark, staggered detail rows
- Scan Rejected: shake on the error badge, drawn "X", staggered detail rows
- Logo: animated gradient sweep on "tix" plus a soft pulsing dot, everywhere it appears
