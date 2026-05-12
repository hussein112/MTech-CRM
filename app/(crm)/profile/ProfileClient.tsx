"use client"

import { useState } from "react"
import Link from "next/link"

// ── Constants ─────────────────────────────────────────────────────────────────

const USER = {
  name:        "Hussein Khalil",
  initials:    "HK",
  role:        "Admin",
  email:       "husseinkhalil@mtech-dist.com",
  phone:       "+961 71 248 017",
  department:  "Operations",
  location:    "Beirut, Lebanon",
  timezone:    "Asia/Beirut (GMT+3)",
  joinDate:    "March 12, 2024",
  bio:         "CRM administrator overseeing merchant onboarding, ticket resolution, and platform operations for MTech Distributors.",
  avatarColor: "#5b3fde",
}

const STATS = [
  { label: "Open Tickets",    value: "12",  icon: "confirmation_number", color: "#6366f1" },
  { label: "Total Resolved",  value: "84",  icon: "check_circle",        color: "#10b981" },
  { label: "Tasks Completed", value: "37",  icon: "task_alt",            color: "#f59e0b" },
  { label: "Attendance Rate", value: "96%", icon: "event_available",     color: "#06b6d4" },
]

const SKILLS = [
  "Merchant Onboarding", "Dispute Resolution", "CRM Administration",
  "Reporting & Analytics", "Team Management", "Process Improvement",
]

const ACTIVITY = [
  { icon: "check_circle",        color: "#10b981", text: "Resolved ticket #4521 — Chargeback dispute",         time: "2h ago"    },
  { icon: "storefront",          color: "#6366f1", text: "Approved TechStore POS merchant onboarding",         time: "4h ago"    },
  { icon: "task_alt",            color: "#f59e0b", text: "Completed task: Review merchant ID #8821 docs",      time: "Yesterday" },
  { icon: "confirmation_number", color: "#8b5cf6", text: "Created ticket #4588 — API integration issue",      time: "Yesterday" },
  { icon: "shield_person",       color: "#06b6d4", text: "Updated role permissions for Agents group",          time: "2d ago"    },
  { icon: "person_add",          color: "#f43f5e", text: "Added user Diana Chen to the platform",              time: "3d ago"    },
  { icon: "storefront",          color: "#10b981", text: "Flagged FastFood Co — missing bank statements",      time: "4d ago"    },
]

// ── Field component ───────────────────────────────────────────────────────────

function InfoField({ label, value, editing, onChange, type = "text", textarea = false }: {
  label:    string
  value:    string
  editing:  boolean
  onChange: (v: string) => void
  type?:    string
  textarea?: boolean
}) {
  const inputSt: React.CSSProperties = {
    width: "100%", padding: "9px 13px", background: "var(--bg3)",
    border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)",
    fontSize: 13, fontFamily: "'Mulish', sans-serif", outline: "none",
    boxSizing: "border-box", fontWeight: 600, resize: "vertical",
  }
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
        {label}
      </div>
      {editing ? (
        textarea
          ? <textarea rows={3} value={value} onChange={e => onChange(e.target.value)} style={{ ...inputSt, lineHeight: 1.5 }}
              onFocus={e => (e.currentTarget.style.borderColor = "#6366f1")}
              onBlur={e  => (e.currentTarget.style.borderColor = "var(--border)")} />
          : <input type={type} value={value} onChange={e => onChange(e.target.value)} style={inputSt}
              onFocus={e => (e.currentTarget.style.borderColor = "#6366f1")}
              onBlur={e  => (e.currentTarget.style.borderColor = "var(--border)")} />
      ) : (
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", padding: "9px 0", borderBottom: "1px solid var(--border)", lineHeight: 1.5 }}>
          {value || <span style={{ color: "var(--text3)" }}>—</span>}
        </div>
      )}
    </div>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────────

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "var(--bg2)", border: "1px solid var(--border)",
      borderRadius: 16, padding: 24, ...style,
    }}>
      {children}
    </div>
  )
}

function CardTitle({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
      <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--accent-crm)" }}>{icon}</span>
      <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>{children}</span>
    </div>
  )
}

// ── Toggle ────────────────────────────────────────────────────────────────────

function Toggle({ on, onChange, label, sub }: { on: boolean; onChange: (v: boolean) => void; label: string; sub?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{sub}</div>}
      </div>
      <button
        onClick={() => onChange(!on)}
        style={{ width: 40, height: 22, borderRadius: 11, background: on ? "var(--accent-crm)" : "var(--border)", border: "none", position: "relative", cursor: "pointer", transition: "background .2s", flexShrink: 0 }}
      >
        <div style={{ position: "absolute", top: 3, left: on ? 20 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} />
      </button>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function ProfileClient() {
  // Personal info edit state
  const [editing,    setEditing]    = useState(false)
  const [name,       setName]       = useState(USER.name)
  const [email,      setEmail]      = useState(USER.email)
  const [phone,      setPhone]      = useState(USER.phone)
  const [dept,       setDept]       = useState(USER.department)
  const [location,   setLocation]   = useState(USER.location)
  const [bio,        setBio]        = useState(USER.bio)

  // Password change state
  const [pwOpen,     setPwOpen]     = useState(false)
  const [curPw,      setCurPw]      = useState("")
  const [newPw,      setNewPw]      = useState("")
  const [confPw,     setConfPw]     = useState("")
  const [pwErr,      setPwErr]      = useState("")

  // Saved-name snapshot for cancel
  const [saved, setSaved] = useState({ name, email, phone, dept, location, bio })

  // Preferences toggles
  const [notifEmail,   setNotifEmail]   = useState(true)
  const [notifBrowser, setNotifBrowser] = useState(true)
  const [notifTasks,   setNotifTasks]   = useState(true)
  const [notifMentions,setNotifMentions]= useState(true)
  const [twoFA,        setTwoFA]        = useState(false)

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
    if (!curPw)              return setPwErr("Enter your current password.")
    if (newPw.length < 8)   return setPwErr("New password must be at least 8 characters.")
    if (newPw !== confPw)    return setPwErr("Passwords don't match.")
    setPwErr(""); setCurPw(""); setNewPw(""); setConfPw("")
    setPwOpen(false)
    showToast("Password changed successfully")
  }

  const pwInputSt: React.CSSProperties = {
    width: "100%", padding: "9px 13px", background: "var(--bg3)",
    border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)",
    fontSize: 13, fontFamily: "'Mulish', sans-serif", outline: "none",
    boxSizing: "border-box", fontWeight: 600,
  }

  return (
    <div style={{ fontFamily: "'Mulish', sans-serif", padding: 24, maxWidth: 1100, margin: "0 auto" }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)",
          background: "#10b981", color: "#fff", borderRadius: 14, padding: "11px 22px",
          fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 8,
          zIndex: 9999, boxShadow: "0 8px 32px rgba(0,0,0,.2)", pointerEvents: "none",
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span>
          {toast}
        </div>
      )}

      {/* ── Hero card ─────────────────────────────────────────────────────── */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 24, flexWrap: "wrap" }}>

          {/* Avatar + identity */}
          <div style={{ display: "flex", alignItems: "center", gap: 20, flex: 1, minWidth: 260 }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{
                width: 80, height: 80, borderRadius: 20, background: USER.avatarColor,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 26, fontWeight: 900, color: "#fff",
                boxShadow: "0 4px 20px rgba(91,63,222,.35)",
              }}>
                {USER.initials}
              </div>
              {/* Online dot */}
              <div style={{
                position: "absolute", bottom: 4, right: 4, width: 14, height: 14,
                borderRadius: "50%", background: "#10b981",
                border: "2px solid var(--bg2)",
              }} />
            </div>

            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", lineHeight: 1.2 }}>{name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5 }}>
                <span style={{
                  fontSize: 11, fontWeight: 800, background: "rgba(99,102,241,.12)",
                  color: "#6366f1", padding: "3px 10px", borderRadius: 20,
                }}>
                  {USER.role}
                </span>
                <span style={{ fontSize: 11, color: "var(--text3)" }}>{dept}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 8, flexWrap: "wrap" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text3)" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>location_on</span>
                  {location}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text3)" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>calendar_month</span>
                  Joined {USER.joinDate}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#10b981" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>circle</span>
                  Online
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {STATS.map(s => (
              <div key={s.label} style={{
                background: "var(--bg3)", border: "1px solid var(--border)",
                borderRadius: 12, padding: "12px 18px", textAlign: "center", minWidth: 90,
              }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: s.color + "22", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 6px" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: s.color }}>{s.icon}</span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "var(--text)", lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text3)", marginTop: 3, whiteSpace: "nowrap" }}>{s.label}</div>
              </div>
            ))}
          </div>

        </div>
      </Card>

      {/* ── Main two-column ───────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, alignItems: "start" }}>

        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Personal info */}
          <Card>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--accent-crm)" }}>person</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>Personal Information</span>
              </div>
              {!editing ? (
                <button
                  onClick={startEdit}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 9, fontSize: 12, fontWeight: 700, color: "var(--text2)", cursor: "pointer", fontFamily: "inherit" }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>edit</span>
                  Edit Profile
                </button>
              ) : (
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={cancelEdit} style={{ padding: "7px 14px", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 9, fontSize: 12, fontWeight: 700, color: "var(--text2)", cursor: "pointer", fontFamily: "inherit" }}>
                    Cancel
                  </button>
                  <button onClick={saveEdit} style={{ padding: "7px 14px", background: "var(--accent-crm)", border: "none", borderRadius: 9, fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>
                    Save Changes
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
              <InfoField label="Display Name" value={name}     editing={editing} onChange={setName} />
              <InfoField label="Email"        value={email}    editing={editing} onChange={setEmail}    type="email" />
              <InfoField label="Phone"        value={phone}    editing={editing} onChange={setPhone}    type="tel" />
              <InfoField label="Department"   value={dept}     editing={editing} onChange={setDept} />
              <InfoField label="Location"     value={location} editing={editing} onChange={setLocation} />
              <InfoField label="Timezone"     value={USER.timezone} editing={false}  onChange={() => {}} />
            </div>
            <InfoField label="Bio" value={bio} editing={editing} onChange={setBio} textarea />
          </Card>

          {/* Skills */}
          <Card>
            <CardTitle icon="star">Skills &amp; Expertise</CardTitle>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {SKILLS.map(s => (
                <span key={s} style={{
                  padding: "6px 14px", borderRadius: 20,
                  background: "rgba(99,102,241,.08)", border: "1px solid rgba(99,102,241,.2)",
                  fontSize: 12, fontWeight: 700, color: "#6366f1",
                }}>
                  {s}
                </span>
              ))}
            </div>
          </Card>

          {/* Quick links */}
          <Card>
            <CardTitle icon="apps">Quick Links</CardTitle>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { label: "My Tickets",  href: "/tickets?assigned=me", icon: "confirmation_number", color: "#6366f1" },
                { label: "My Tasks",    href: "/tasks?assigned=me",   icon: "task_alt",            color: "#f59e0b" },
                { label: "Timecard",    href: "/timecard", icon: "schedule",            color: "#10b981" },
                { label: "Feedback",    href: "/feedback", icon: "forum",               color: "#8b5cf6" },
              ].map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "12px 14px", borderRadius: 10,
                    background: "var(--bg3)", border: "1px solid var(--border)",
                    textDecoration: "none", color: "var(--text)", transition: ".15s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = item.color; (e.currentTarget as HTMLElement).style.background = item.color + "11" }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.background = "var(--bg3)" }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: item.color + "22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: item.color }}>{item.icon}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{item.label}</span>
                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: "var(--text3)", marginLeft: "auto" }}>chevron_right</span>
                </Link>
              ))}
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Recent activity */}
          <Card>
            <CardTitle icon="history">Recent Activity</CardTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {ACTIVITY.map((a, i) => (
                <div key={i} style={{ display: "flex", gap: 10, paddingBottom: 14, marginBottom: 14, borderBottom: i < ACTIVITY.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: a.color + "22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14, color: a.color }}>{a.icon}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", lineHeight: 1.4 }}>{a.text}</div>
                    <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 3 }}>{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Account security */}
          <Card>
            <CardTitle icon="security">Account Security</CardTitle>

            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Password</div>
                  <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>Last changed 30 days ago</div>
                </div>
                <button
                  onClick={() => { setPwOpen(o => !o); setPwErr("") }}
                  style={{ padding: "6px 12px", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11, fontWeight: 700, color: "var(--text2)", cursor: "pointer", fontFamily: "inherit" }}
                >
                  Change
                </button>
              </div>

              {pwOpen && (
                <div style={{ background: "var(--bg3)", borderRadius: 10, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                  {pwErr && (
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", background: "rgba(239,68,68,.08)", borderRadius: 8, padding: "6px 10px" }}>{pwErr}</div>
                  )}
                  <input type="password" placeholder="Current password" value={curPw} onChange={e => setCurPw(e.target.value)} style={pwInputSt}
                    onFocus={e => (e.currentTarget.style.borderColor = "#6366f1")}
                    onBlur={e  => (e.currentTarget.style.borderColor = "var(--border)")} />
                  <input type="password" placeholder="New password" value={newPw} onChange={e => setNewPw(e.target.value)} style={pwInputSt}
                    onFocus={e => (e.currentTarget.style.borderColor = "#6366f1")}
                    onBlur={e  => (e.currentTarget.style.borderColor = "var(--border)")} />
                  <input type="password" placeholder="Confirm new password" value={confPw} onChange={e => setConfPw(e.target.value)} style={pwInputSt}
                    onFocus={e => (e.currentTarget.style.borderColor = "#6366f1")}
                    onBlur={e  => (e.currentTarget.style.borderColor = "var(--border)")} />
                  <button onClick={submitPassword} style={{ padding: "8px 0", background: "var(--accent-crm)", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>
                    Update Password
                  </button>
                </div>
              )}
            </div>

            <Toggle on={twoFA} onChange={setTwoFA} label="Two-Factor Authentication" sub="Add an extra layer of security" />
          </Card>

          {/* Notification preferences */}
          <Card>
            <CardTitle icon="notifications">Notifications</CardTitle>
            <Toggle on={notifEmail}    onChange={setNotifEmail}    label="Email Notifications"   sub="Receive updates via email" />
            <Toggle on={notifBrowser}  onChange={setNotifBrowser}  label="Browser Notifications" sub="Desktop push alerts" />
            <Toggle on={notifTasks}    onChange={setNotifTasks}    label="Task Reminders"        sub="Due dates and assignments" />
            <Toggle on={notifMentions} onChange={setNotifMentions} label="Mentions"              sub="When you're @mentioned" />
          </Card>

        </div>
      </div>
    </div>
  )
}
