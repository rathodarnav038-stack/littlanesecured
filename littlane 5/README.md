# 🎟️ Littlane Ticket Manager & Admin Dashboard

A unified platform combining the **Littlane Event Site** (root `/`), the **Littix Animated Tickets App** (`/tickets`), and the **Admin Dashboard** (`/dashboard`) into a single SQLite-persisted Node/Express + React repository.

## 📁 Repository Structure
```
├── combined-app/       # React SPA (Tickets app + Admin Dashboard views)
│   ├── src/
│   │   ├── admin-dash/ # Admin Dashboard pages (real-time stats)
│   │   ├── screens/    # Littix Client screens (QR Scanner, Ticket card)
│   │   └── App.tsx     # SPA Client router
│   └── dist/           # Built production bundle assets
├── server/             # Express.js Backend API
│   ├── db.js           # SQLite Database Layer (sales.db)
│   ├── mailer.js       # SMTP Emailer interface (with Ethereal fallback)
│   └── server.js       # Main server entry & route controllers
├── index.html          # Littlane main landing page (root booking site)
└── script.js           # Littlane landing logic (Razorpay payments checkout)
```

---

## 🚀 Getting Started

### 1. Setup Environment
Go to the `server/` directory, copy `.env.example` to `.env`, and fill in the values:
```bash
cd server
cp .env.example .env
```
Update your `ADMIN_KEY` (defaults to `change-me-admin-key`). If you leave `RAZORPAY_KEY_ID` blank, the app will run in safe **TEST MODE** (automatically bypasses transaction charges).

### 2. Install Dependencies
Install dependencies for both the Backend and Frontend:
```bash
# Backend dependencies
cd server && npm install

# Frontend dependencies
cd ../combined-app && npm install
```

### 3. Build & Run
First build the Frontend React bundle:
```bash
cd combined-app
npm run build
```
Then start your unified Node/Express server:
```bash
cd ../server
node server.js
```

The unified app is now online:
* 🎭 **Littlane Landing Site:** `http://localhost:3000/`
* 🎟 **Littix Tickets Portal:** `http://localhost:3000/tickets`
* 📊 **Admin Dashboard:** `http://localhost:3000/dashboard` (Enter your `ADMIN_KEY` to unlock)
