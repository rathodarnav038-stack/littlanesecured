import { useState } from 'react'

type SettingsTab = 'smtp' | 'payments' | 'branding' | 'roles' | 'audit'

const tabs: { id: SettingsTab; label: string; icon: string }[] = [
  { id: 'smtp', label: 'SMTP Config', icon: '📧' },
  { id: 'payments', label: 'Payment Gateways', icon: '💳' },
  { id: 'branding', label: 'Branding', icon: '🎨' },
  { id: 'roles', label: 'Roles & Permissions', icon: '🛡️' },
  { id: 'audit', label: 'Audit Logs', icon: '📋' },
]

const auditLogs = [
  { id: 1, admin: 'Atharva S', action: 'Updated SMTP configuration', entity: 'Settings', time: '2025-07-18 14:30', ip: '103.24.18.142', severity: 'info' },
  { id: 2, admin: 'Atharva S', action: 'Issued refund for Order #LT-29177', entity: 'Refund', time: '2025-07-18 14:00', ip: '103.24.18.142', severity: 'warning' },
  { id: 3, admin: 'Meera K', action: 'Created new event: EDM Rave Pune', entity: 'Event', time: '2025-07-17 11:22', ip: '103.24.22.98', severity: 'info' },
  { id: 4, admin: 'Atharva S', action: 'Deactivated ticket TKT-88100', entity: 'Ticket', time: '2025-07-16 09:45', ip: '103.24.18.142', severity: 'warning' },
  { id: 5, admin: 'Rahul V', action: 'Exported orders CSV (2,841 rows)', entity: 'Export', time: '2025-07-15 16:12', ip: '103.24.31.45', severity: 'info' },
]

const roles = [
  { name: 'Super Admin', members: 1, permissions: ['All access'], color: '#9333ea' },
  { name: 'Event Manager', members: 3, permissions: ['Events', 'Tickets', 'Orders'], color: '#3b82f6' },
  { name: 'Support Staff', members: 8, permissions: ['Orders', 'Customers', 'Refunds'], color: '#22c55e' },
  { name: 'Gate Scanner', members: 12, permissions: ['QR Scanning only'], color: '#f59e0b' },
  { name: 'Finance', members: 2, permissions: ['Payments', 'Refunds', 'Reports'], color: '#ef4444' },
]

function Field({ label, value, type = 'text', placeholder }: { label: string; value: string; type?: string; placeholder?: string }) {
  return (
    <div>
      <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)', display: 'block', marginBottom: '6px' }}>{label}</label>
      <input
        defaultValue={value}
        type={type}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '9px 12px',
          backgroundColor: 'var(--muted)', border: '1px solid var(--border)',
          borderRadius: '8px', fontSize: '13px', color: 'var(--foreground)', outline: 'none',
        }}
      />
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '28px' }}>
      <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--foreground)', margin: '0 0 16px', letterSpacing: '-0.2px' }}>{title}</h3>
      {children}
    </div>
  )
}

export default function Settings() {
  const [tab, setTab] = useState<SettingsTab>('smtp')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--foreground)', letterSpacing: '-0.5px', margin: 0 }}>Settings</h1>
        <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', margin: '4px 0 0' }}>Configure your LitTix platform</p>
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Sidebar tabs */}
        <div style={{ width: '200px', flexShrink: 0 }}>
          <div style={{ backgroundColor: 'var(--card)', borderRadius: '14px', padding: '8px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '9px 12px', borderRadius: '8px', border: 'none',
                backgroundColor: tab === t.id ? 'var(--secondary)' : 'transparent',
                color: tab === t.id ? '#9333ea' : 'var(--muted-foreground)',
                fontSize: '13px', fontWeight: tab === t.id ? 600 : 400,
                cursor: 'pointer', textAlign: 'left',
              }}>
                <span>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, backgroundColor: 'var(--card)', borderRadius: '16px', padding: '24px', border: '1px solid var(--border)', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
          {tab === 'smtp' && (
            <div>
              <Section title="SMTP Configuration">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <Field label="SMTP Provider" value="SendGrid" />
                  <Field label="SMTP Host" value="smtp.sendgrid.net" />
                  <Field label="Port" value="587" />
                  <Field label="Encryption" value="TLS" />
                  <Field label="Username" value="apikey" />
                  <Field label="API Key" value="SG.xxxx" type="password" />
                  <Field label="From Email" value="tickets@littix.com" />
                  <Field label="From Name" value="LitTix Tickets" />
                </div>
              </Section>
              <Section title="Backup Provider">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <Field label="Backup Provider" value="Mailgun" />
                  <Field label="API Key" value="key-xxxx" type="password" />
                </div>
              </Section>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={{ padding: '9px 18px', background: 'linear-gradient(135deg, #9333EA, #A855F7)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px rgba(147,51,234,0.3)' }}>Save Changes</button>
                <button style={{ padding: '9px 18px', border: '1px solid var(--border)', backgroundColor: 'var(--muted)', borderRadius: '10px', fontSize: '13px', fontWeight: 500, color: 'var(--foreground)', cursor: 'pointer' }}>Send Test Email</button>
              </div>
            </div>
          )}

          {tab === 'payments' && (
            <div>
              {['Razorpay', 'Stripe', 'Cashfree', 'PayPal'].map(gw => (
                <div key={gw} style={{ marginBottom: '20px', padding: '16px', backgroundColor: 'var(--muted)', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--foreground)' }}>{gw}</div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', color: 'var(--muted-foreground)' }}>
                      <input type="checkbox" defaultChecked={gw !== 'PayPal'} style={{ accentColor: '#9333ea' }} />
                      Enabled
                    </label>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <Field label="Key ID / Client ID" value="rzp_live_xxxx" />
                    <Field label="Secret Key" value="●●●●●●●●" type="password" />
                  </div>
                </div>
              ))}
              <button style={{ padding: '9px 18px', background: 'linear-gradient(135deg, #9333EA, #A855F7)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px rgba(147,51,234,0.3)' }}>Save Changes</button>
            </div>
          )}

          {tab === 'branding' && (
            <div>
              <Section title="Brand Identity">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <Field label="Platform Name" value="LitTix" />
                  <Field label="Support Email" value="support@littix.com" />
                  <Field label="Primary Color" value="#9333EA" />
                  <Field label="Secondary Color" value="#C084FC" />
                  <Field label="Website URL" value="https://littix.com" />
                  <Field label="Instagram Handle" value="@littix.events" />
                </div>
              </Section>
              <Section title="Email Templates">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {['Ticket Confirmation', 'Payment Failed', 'Refund Processed', 'Event Reminder', 'QR Code'].map(tmpl => (
                    <div key={tmpl} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: 'var(--muted)', borderRadius: '8px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--foreground)', fontWeight: 500 }}>{tmpl}</span>
                      <button style={{ padding: '5px 12px', borderRadius: '7px', border: '1px solid var(--border)', backgroundColor: 'var(--card)', fontSize: '12px', fontWeight: 600, color: 'var(--foreground)', cursor: 'pointer' }}>Edit</button>
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          )}

          {tab === 'roles' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>Admin Roles</h3>
                <button style={{ padding: '7px 14px', background: 'linear-gradient(135deg, #9333EA, #A855F7)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}>+ New Role</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {roles.map(r => (
                  <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', backgroundColor: 'var(--muted)', borderRadius: '10px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: r.color, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--foreground)' }}>{r.name}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--muted-foreground)', marginTop: '2px' }}>{r.permissions.join(' · ')}</div>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', textAlign: 'right', minWidth: '60px' }}>
                      {r.members} {r.members === 1 ? 'admin' : 'admins'}
                    </div>
                    <button style={{ padding: '5px 12px', borderRadius: '7px', border: '1px solid var(--border)', backgroundColor: 'var(--card)', fontSize: '12px', fontWeight: 600, color: 'var(--foreground)', cursor: 'pointer' }}>Edit</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'audit' && (
            <div>
              <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>Audit Logs</h3>
                <button style={{ padding: '7px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--muted)', fontSize: '12px', fontWeight: 500, color: 'var(--foreground)', cursor: 'pointer' }}>Export Logs</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {auditLogs.map(log => (
                  <div key={log.id} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 14px',
                    backgroundColor: 'var(--muted)', borderRadius: '10px',
                    borderLeft: `3px solid ${log.severity === 'warning' ? '#f59e0b' : '#9333ea'}`,
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '3px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>{log.admin}</span>
                        <span style={{
                          fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                          backgroundColor: log.severity === 'warning' ? '#fef3c7' : '#ede9fe',
                          color: log.severity === 'warning' ? '#d97706' : '#7c3aed',
                          padding: '1px 6px', borderRadius: '4px',
                        }}>{log.entity}</span>
                      </div>
                      <div style={{ fontSize: '12.5px', color: 'var(--muted-foreground)' }}>{log.action}</div>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', textAlign: 'right', flexShrink: 0 }}>
                      <div>{log.time}</div>
                      <div style={{ fontFamily: 'monospace', marginTop: '2px' }}>{log.ip}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
