"use client"

import { useState } from "react"
import Link from "next/link"

// ── Constants ─────────────────────────────────────────────────────────────────

const USER = {
  name: "Hussein Khalil",
  initials: "HK",
  role: "Admin",
  email: "husseinkhalil@mtech-dist.com",
  phone: "+961 71 248 017",
  department: "Operations",
  location: "Beirut, Lebanon",
  timezone: "Asia/Beirut (GMT+3)",
  joinDate: "March 12, 2024",
  bio: "CRM administrator overseeing merchant onboarding, ticket resolution, and platform operations for MTech Distributors.",
  avatarColor: "#5b3fde",
}

const STATS = [
  { label: "Open Tickets", value: "12", icon: "confirmation_number", color: "#6366f1" },
  { label: "Total Resolved", value: "84", icon: "check_circle", color: "#10b981" },
  { label: "Tasks Completed", value: "37", icon: "task_alt", color: "#f59e0b" },
  { label: "Attendance Rate", value: "96%", icon: "event_available", color: "#06b6d4" },
]

const SKILLS = [
  "Merchant Onboarding", "Dispute Resolution", "CRM Administration",
  "Reporting & Analytics", "Team Management", "Process Improvement",
]

const ACTIVITY = [
  { icon: "check_circle", color: "#10b981", text: "Resolved ticket #4521 — Chargeback dispute", time: "2h ago" },
  { icon: "storefront", color: "#6366f1", text: "Approved TechStore POS merchant onboarding", time: "4h ago" },
  { icon: "task_alt", color: "#f59e0b", text: "Completed task: Review merchant ID #8821 docs", time: "Yesterday" },
  { icon: "confirmation_number", color: "#8b5cf6", text: "Created ticket #4588 — API integration issue", time: "Yesterday" },
  { icon: "shield_person", color: "#06b6d4", text: "Updated role permissions for Agents group", time: "2d ago" },
]

// ── Field component ───────────────────────────────────────────────────────────

function InfoField({ label, value, editing, onChange, type = "text", textarea = false }: {
  label: string
  value: string
  editing: boolean
  onChange: (v: string) => void
  type?: string
  textarea?: boolean
}) {
  const inputSt: React.CSSProperties = {
    width: "100%", padding: "10px 14px", background: "var(--bg3)",
    border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)",
    fontSize: 13, fontFamily: "inherit", outline: "none",
    boxSizing: "border-box", fontWeight: 600, resize: "vertical", transition: "border-color 0.15s"
  }
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
        {label}
      </div>
      {editing ? (
        textarea
          ? <textarea rows={4} value={value} onChange={e => onChange(e.target.value)} style={{ ...inputSt, lineHeight: 1.5 }}
            onFocus={e => (e.currentTarget.style.borderColor = "var(--accent-crm)")}
            onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")} />
          : <input type={type} value={value} onChange={e => onChange(e.target.value)} style={inputSt}
            onFocus={e => (e.currentTarget.style.borderColor = "var(--accent-crm)")}
            onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")} />
      ) : (
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", padding: "10px 0", borderBottom: "1px solid var(--border)", lineHeight: 1.5 }}>
          {value || <span style={{ color: "var(--text3)" }}>—</span>}
        </div>
      )}
    </div>
  )
}

// ── Card Title ────────────────────────────────────────────────────────────────

function CardTitle({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div className="dv2-title">
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 20, color: "var(--accent-crm)" }}>{icon}</span>
        {children}
      </div>
    </div>
  )
}

// ── Toggle ────────────────────────────────────────────────────────────────────

function Toggle({ on, onChange, label, sub }: { on: boolean; onChange: (v: boolean) => void; label: string; sub?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid var(--border)" }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{label}</div>
        {sub && <div style={{ fontSize: 11, fontWeight: 500, color: "var(--text3)", marginTop: 4 }}>{sub}</div>}
      </div>
      <button
        onClick={() => onChange(!on)}
        style={{ width: 44, height: 24, borderRadius: 12, background: on ? "var(--accent-crm)" : "var(--border)", border: "none", position: "relative", cursor: "pointer", transition: "background .2s", flexShrink: 0 }}
      >
        <div style={{ position: "absolute", top: 3, left: on ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} />
      </button>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function ProfileClient() {
  // Personal info edit state
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(USER.name)
  const [email, setEmail] = useState(USER.email)
  const [phone, setPhone] = useState(USER.phone)
  const [dept, setDept] = useState(USER.department)
  const [location, setLocation] = useState(USER.location)
  const [bio, setBio] = useState(USER.bio)

  // Password change state
  const [pwOpen, setPwOpen] = useState(false)
  const [curPw, setCurPw] = useState("")
  const [newPw, setNewPw] = useState("")
  const [confPw, setConfPw] = useState("")
  const [pwErr, setPwErr] = useState("")

  // Saved-name snapshot for cancel
  const [saved, setSaved] = useState({ name, email, phone, dept, location, bio })

  // Preferences toggles
  const [notifEmail, setNotifEmail] = useState(true)
  const [notifBrowser, setNotifBrowser] = useState(true)
  const [notifTasks, setNotifTasks] = useState(true)
  const [notifMentions, setNotifMentions] = useState(true)
  const [twoFA, setTwoFA] = useState(false)

  // Toast
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = { current: null as ReturnType<typeof setTimeout> | null }

  function showToast(msg: string) {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3000)
  }

  function startEdit() {
    setSaved({ name, email, phone, dept, location, bio })
    setEditing(true)
  }

  function cancelEdit() {
    setName(saved.name); setEmail(saved.email); setPhone(saved.phone)
    setDept(saved.dept); setLocation(saved.location); setBio(saved.bio)
    setEditing(false)
  }

  function saveEdit() {
    setSaved({ name, email, phone, dept, location, bio })
    setEditing(false)
    showToast("Profile updated successfully")
  }

  function submitPassword() {
    if (!curPw) return setPwErr("Enter your current password.")
    if (newPw.length < 8) return setPwErr("New password must be at least 8 characters.")
    if (newPw !== confPw) return setPwErr("Passwords don't match.")
    setPwErr(""); setCurPw(""); setNewPw(""); setConfPw("")
    setPwOpen(false)
    showToast("Password changed successfully")
  }

  const pwInputSt: React.CSSProperties = {
    width: "100%", padding: "10px 14px", background: "var(--bg3)",
    border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)",
    fontSize: 13, fontFamily: "inherit", outline: "none",
    boxSizing: "border-box", fontWeight: 600, transition: "border-color 0.15s"
  }

  return (
    <div className="dash-layout">

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)",
          background: "#10b981", color: "#fff", borderRadius: 14, padding: "12px 24px",
          fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", gap: 10,
          zIndex: 9999, boxShadow: "0 8px 32px rgba(16,185,129,.3)", pointerEvents: "none",
          animation: "fadeUp 0.3s ease"
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span>
          {toast}
        </div>
      )}

      {/* Page Header */}
      <div className="dash-header">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "var(--text)", margin: 0, letterSpacing: -0.5 }}>My Profile</h1>
          <p style={{ fontSize: 13, color: "var(--text3)", margin: "4px 0 0", fontWeight: 500 }}>
            Manage your personal information, security settings, and preferences.
          </p>
        </div>
      </div>

      <div className="dash-rows">
        {/* ── Hero card ─────────────────────────────────────────────────────── */}
        <div className="dash-card-v2">
          <div style={{ display: "flex", alignItems: "flex-start", gap: 32, flexWrap: "wrap" }}>
            {/* Avatar + identity */}
            <div style={{ display: "flex", alignItems: "center", gap: 24, flex: 1, minWidth: 300 }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{
                  width: 90, height: 90, borderRadius: 24, background: USER.avatarColor,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 30, fontWeight: 900, color: "#fff",
                  boxShadow: "0 4px 20px rgba(91,63,222,.35)",
                }}>
                  {USER.initials}
                </div>
                {/* Online dot */}
                <div style={{
                  position: "absolute", bottom: 4, right: 4, width: 18, height: 18,
                  borderRadius: "50%", background: "#10b981",
                  border: "3px solid var(--bg2)",
                }} />
              </div>

              <div>
                <div style={{ fontSize: 26, fontWeight: 900, color: "var(--text)", lineHeight: 1.2 }}>{name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
                  <span style={{
                    fontSize: 12, fontWeight: 800, background: "rgba(99,102,241,.12)",
                    color: "#6366f1", padding: "4px 12px", borderRadius: 20, textTransform: "uppercase", letterSpacing: 0.5
                  }}>
                    {USER.role}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text3)" }}>{dept}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "var(--text3)" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>location_on</span>
                    {location}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "var(--text3)" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>calendar_month</span>
                    Joined {USER.joinDate}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "#10b981" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>circle</span>
                    Online
                  </span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {STATS.map(s => (
                <div key={s.label} style={{
                  background: "var(--bg3)", border: "1px solid var(--border)",
                  borderRadius: 16, padding: "16px 20px", textAlign: "center", minWidth: 100,
                  transition: "transform 0.2s", cursor: "default"
                }}
                  onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-2px)")}
                  onMouseLeave={e => (e.currentTarget.style.transform = "none")}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: s.color + "22", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: s.color }}>{s.icon}</span>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", marginTop: 4, whiteSpace: "nowrap" }}>{s.label}</div>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* ── Main layout rows ───────────────────────────────────────────────── */}
        <div className="dash-rows">

          {/* Row 1: Personal Info & Recent Activity */}
          <div className="dash-grid dash-grid-2-1">
            {/* Personal info */}
            <div className="dash-card-v2" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                <CardTitle icon="person">Personal Information</CardTitle>
                {!editing ? (
                  <button
                    onClick={startEdit}
                    className="crm-btn"
                    style={{ padding: "8px 16px", background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 12, display: "flex", alignItems: "center", gap: 6, borderRadius: 10, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                    Edit Profile
                  </button>
                ) : (
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={cancelEdit} className="crm-btn" style={{ padding: "8px 16px", background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 12, borderRadius: 10, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>
                      Cancel
                    </button>
                    <button onClick={saveEdit} className="crm-btn" style={{ padding: "8px 16px", background: "var(--accent-crm)", border: "none", color: "#fff", fontSize: 12, borderRadius: 10, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>
                      Save Changes
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "0 24px" }}>
                <InfoField label="Display Name" value={name} editing={editing} onChange={setName} />
                <InfoField label="Email" value={email} editing={editing} onChange={setEmail} type="email" />
                <InfoField label="Phone" value={phone} editing={editing} onChange={setPhone} type="tel" />
                <InfoField label="Department" value={dept} editing={editing} onChange={setDept} />
                <InfoField label="Location" value={location} editing={editing} onChange={setLocation} />
                <InfoField label="Timezone" value={USER.timezone} editing={false} onChange={() => { }} />
              </div>
              <InfoField label="Bio" value={bio} editing={editing} onChange={setBio} textarea />
            </div>

            {/* Recent activity */}
            <div className="dash-card-v2" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <CardTitle icon="history">Recent Activity</CardTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {ACTIVITY.map((a, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, paddingBottom: 16, marginBottom: 16, borderBottom: i < ACTIVITY.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: a.color + "22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16, color: a.color }}>{a.icon}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", lineHeight: 1.5 }}>{a.text}</div>
                      <div style={{ fontSize: 11, fontWeight: 500, color: "var(--text3)", marginTop: 4 }}>{a.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2: Notifications & Quick Links */}
          <div className="dash-grid dash-grid-2-1">
            {/* Notification preferences */}
            <div className="dash-card-v2" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <CardTitle icon="notifications">Notifications</CardTitle>
              <Toggle on={notifEmail} onChange={setNotifEmail} label="Email Notifications" sub="Receive updates via email" />
              <Toggle on={notifBrowser} onChange={setNotifBrowser} label="Browser Notifications" sub="Desktop push alerts" />
              <Toggle on={notifTasks} onChange={setNotifTasks} label="Task Reminders" sub="Due dates and assignments" />
              <Toggle on={notifMentions} onChange={setNotifMentions} label="Mentions" sub="When you're @mentioned" />
            </div>

            {/* Quick links */}
            <div className="dash-card-v2" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <CardTitle icon="apps">Quick Links</CardTitle>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
                {[
                  { label: "My Tickets", href: "/tickets?assigned=me", icon: "confirmation_number", color: "#6366f1" },
                  { label: "My Tasks", href: "/tasks?assigned=me", icon: "task_alt", color: "#f59e0b" },
                  { label: "Timecard", href: "/timecard", icon: "schedule", color: "#10b981" },
                  { label: "Feedback", href: "/feedback", icon: "forum", color: "#8b5cf6" },
                ].map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "14px 16px", borderRadius: 12,
                      background: "var(--bg3)", border: "1px solid var(--border)",
                      textDecoration: "none", color: "var(--text)", transition: "all .15s",
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = item.color; (e.currentTarget as HTMLElement).style.background = item.color + "11" }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.background = "var(--bg3)" }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: item.color + "22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: item.color }}>{item.icon}</span>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{item.label}</span>
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--text3)", marginLeft: "auto", transition: "transform .15s" }}>chevron_right</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Row 3: Account Security & Skills */}
          <div className="dash-grid dash-grid-2-1">
            {/* Account security */}
            <div className="dash-card-v2" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <CardTitle icon="security">Account Security</CardTitle>

              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Password</div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text3)", marginTop: 4 }}>Last changed 30 days ago</div>
                  </div>
                  <button
                    onClick={() => { setPwOpen(o => !o); setPwErr("") }}
                    className="crm-btn"
                    style={{ padding: "8px 16px", background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 12, borderRadius: 10, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}
                  >
                    Change
                  </button>
                </div>

                {pwOpen && (
                  <div style={{ background: "var(--bg3)", borderRadius: 12, padding: 18, display: "flex", flexDirection: "column", gap: 12, marginBottom: 16, border: "1px solid var(--border)" }}>
                    {pwErr && (
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#ef4444", background: "rgba(239,68,68,.08)", borderRadius: 10, padding: "8px 12px" }}>{pwErr}</div>
                    )}
                    <input type="password" placeholder="Current password" value={curPw} onChange={e => setCurPw(e.target.value)} style={pwInputSt}
                      onFocus={e => (e.currentTarget.style.borderColor = "var(--accent-crm)")}
                      onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")} />
                    <input type="password" placeholder="New password" value={newPw} onChange={e => setNewPw(e.target.value)} style={pwInputSt}
                      onFocus={e => (e.currentTarget.style.borderColor = "var(--accent-crm)")}
                      onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")} />
                    <input type="password" placeholder="Confirm new password" value={confPw} onChange={e => setConfPw(e.target.value)} style={pwInputSt}
                      onFocus={e => (e.currentTarget.style.borderColor = "var(--accent-crm)")}
                      onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")} />
                    <button onClick={submitPassword} className="crm-btn" style={{ padding: "10px", background: "var(--accent-crm)", border: "none", color: "#fff", fontSize: 13, borderRadius: 10, width: "100%", marginTop: 4, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>
                      Update Password
                    </button>
                  </div>
                )}
              </div>

              <Toggle on={twoFA} onChange={setTwoFA} label="Two-Factor Authentication" sub="Add an extra layer of security" />
            </div>

            {/* Skills */}
            <div className="dash-card-v2" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <CardTitle icon="star">Skills &amp; Expertise</CardTitle>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {SKILLS.map(s => (
                  <span key={s} style={{
                    padding: "8px 16px", borderRadius: 24,
                    background: "rgba(99,102,241,.08)", border: "1px solid rgba(99,102,241,.2)",
                    fontSize: 13, fontWeight: 700, color: "var(--text)",
                    transition: "all .15s", cursor: "default"
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,.15)"; e.currentTarget.style.color = "var(--text)" }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(99,102,241,.08)"; e.currentTarget.style.color = "var(--text)" }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
