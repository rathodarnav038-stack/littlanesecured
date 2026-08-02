const NAV_ITEMS = [
  { key:"dashboard", href:"dashboard.html", label:"Dashboard",
    icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/></svg>' },
  { key:"orders", href:"orders.html", label:"Orders",
    icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16l-1.5 12.5a2 2 0 0 1-2 1.5H7.5a2 2 0 0 1-2-1.5L4 7Z"/><path d="M8 7V5a4 4 0 0 1 8 0v2"/></svg>', count:14 },
  { key:"tickets", href:"tickets.html", label:"Tickets",
    icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1a2 2 0 0 0 0 4v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1a2 2 0 0 0 0-4V9Z"/></svg>' },
  { key:"customers", href:"customers.html", label:"Customers",
    icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="3.2"/><path d="M5 20c1-3.6 3.8-5.6 7-5.6S18 16.4 19 20"/></svg>' },
  { key:"events", href:"events.html", label:"Events",
    icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 9.5h17M8 3v3.5M16 3v3.5"/></svg>' },
  { key:"email-delivery", href:"email-delivery.html", label:"Email delivery",
    icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="m4 7 8 6 8-6"/></svg>' },
  { key:"email-live-log", href:"email-live-log.html", label:"Live trigger log",
    icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M13 3 4 14h6l-1 7 9-11h-6l1-7Z"/></svg>' },
  { key:"payments", href:"payments.html", label:"Payments",
    icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2.5" y="6" width="19" height="13" rx="2.5"/><path d="M2.5 10.5h19"/><path d="M6 15h4"/></svg>' },
  { key:"qr-scan-logs", href:"qr-scan-logs.html", label:"QR scan logs",
    icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1.2"/><rect x="14" y="3.5" width="6.5" height="6.5" rx="1.2"/><rect x="3.5" y="14" width="6.5" height="6.5" rx="1.2"/><path d="M14 14h3v3h-3zM19.5 14v3M14 19.5h3M19.5 19.5v.01"/></svg>' },
  { key:"settings", href:"settings.html", label:"Settings",
    icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 13a1.7 1.7 0 0 0 .34 1.87l.06.06a2.06 2.06 0 1 1-2.91 2.91l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V19a2.06 2.06 0 1 1-4.12 0v-.09a1.7 1.7 0 0 0-1.11-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2.06 2.06 0 1 1-2.91-2.91l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H4a2.06 2.06 0 1 1 0-4.12h.09A1.7 1.7 0 0 0 5.64 5.7a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2.06 2.06 0 1 1 2.91-2.91l.06.06a1.7 1.7 0 0 0 1.87.34h.09A1.7 1.7 0 0 0 11.5 0h.09a2.06 2.06 0 1 1 4.12 0V.09c.02.66.42 1.25 1 1.55.63.27 1.36.14 1.87-.34l.06-.06a2.06 2.06 0 1 1 2.91 2.91l-.06.06a1.7 1.7 0 0 0-.34 1.87v.09c.3.58.89.98 1.55 1H20a2.06 2.06 0 1 1 0 4.12h-.09c-.66.02-1.25.42-1.55 1Z"/></svg>' },
];

function renderChrome(activeKey, title, subtitle){
  const rail = document.getElementById("rail");
  const topbar = document.getElementById("topbar");
  if(rail){
    rail.className = "rail";
    rail.innerHTML = `
      <div class="rail-brand">
        <div class="mark">L</div>
        <div class="word"><b>LitTix</b><span>Live event ops</span></div>
      </div>
      <div class="rail-tabs">
        <button class="active">Events</button>
        <button>Archived</button>
      </div>
      <nav class="rail-nav">
        ${NAV_ITEMS.map(item => `
          <a class="rail-link${item.key===activeKey?" active":""}" href="${item.href}">
            ${item.icon}<span>${item.label}</span>
            ${item.count?`<span class="count">${item.count}</span>`:""}
          </a>`).join("")}
      </nav>
      <div class="rail-promo">
        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M13 3 4 14h6l-1 7 9-11h-6l1-7Z"/></svg>
        <div>Activate Pro<span>Unlock all features</span></div>
      </div>`;
  }
  if(topbar){
    topbar.className = "topbar";
    topbar.innerHTML = `
      <div class="tb-profile">
        <div class="tb-avatar-sm">JD</div>
        <div class="who">
          <div class="name">Jordan Diaz <span class="badge-pro">PRO</span></div>
          <div class="handle">${title}${subtitle?" · "+subtitle:""}</div>
        </div>
      </div>
      <div class="topbar-search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
        <span>Search ${title.toLowerCase()}…</span>
      </div>
      <div class="topbar-actions">
        <button class="tb-icon-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3a6 6 0 0 0-6 6v4l-2 3h16l-2-3V9a6 6 0 0 0-6-6Z"/><path d="M9.5 20a2.5 2.5 0 0 0 5 0"/></svg><span class="tb-dot"></span></button>
        <button class="tb-icon-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 13a1.7 1.7 0 0 0 .34 1.87"/></svg></button>
        <button class="tb-cta">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
          New ticket
        </button>
      </div>`;
  }
}

function fitCanvas(){
  // Canvas is now fluid (100vw/100vh) and responsive via CSS media queries,
  // so no JS scaling is needed. Kept as a no-op so existing calls don't break.
}
