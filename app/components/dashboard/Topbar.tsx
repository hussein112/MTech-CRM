"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

// ── Types ──────────────────────────────────────────────────────────────────
interface NotifItem {
  id:      string
  tab:     "general" | "tasks" | "onboarding" | "mentions"
  title:   string
  body:    string
  time:    string
  unread:  boolean
  icon:    string
  iconColor: string
}

interface Props {
  notificationCount?: number
  userInitials?:      string
  userName?:          string
  userRole?:          string
}

// ── Mock data ──────────────────────────────────────────────────────────────
const MOCK_NOTIFS: NotifItem[] = [
  { id:"n1", tab:"general",    title:"System maintenance",     body:"Scheduled downtime Sunday 2–4 AM.",      time:"2h ago",  unread:true,  icon:"info",           iconColor:"#6366f1" },
  { id:"n2", tab:"general",    title:"New feature released",   body:"Batch CSV import is now live.",          time:"1d ago",  unread:true,  icon:"new_releases",   iconColor:"#10b981" },
  { id:"n3", tab:"tasks",      title:"Task assigned to you",   body:"Review merchant ID #8821 docs.",         time:"30m ago", unread:true,  icon:"task_alt",       iconColor:"#f59e0b" },
  { id:"n4", tab:"tasks",      title:"Task overdue",           body:"Follow-up call with Global Pay.",        time:"3h ago",  unread:false, icon:"warning",        iconColor:"#ef4444" },
  { id:"n5", tab:"onboarding", title:"Merchant approved",      body:"TechStore POS completed onboarding.",    time:"15m ago", unread:true,  icon:"storefront",     iconColor:"#6366f1" },
  { id:"n6", tab:"onboarding", title:"Documents pending",      body:"FastFood Co is missing bank statements.", time:"4h ago",  unread:false, icon:"description",    iconColor:"#f59e0b" },
  { id:"n7", tab:"mentions",   title:"@you in ticket #4521",  body:"Can you check this chargeback?",         time:"1h ago",  unread:true,  icon:"alternate_email", iconColor:"#8b5cf6" },
  { id:"n8", tab:"mentions",   title:"@you in ticket #4499",  body:"Agent needs approval on this case.",     time:"2d ago",  unread:false, icon:"alternate_email", iconColor:"#8b5cf6" },
]

// ── useOutsideClick ────────────────────────────────────────────────────────
function useOutsideClick(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) handler()
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [ref, handler])
}

// ── Topbar ─────────────────────────────────────────────────────────────────
export function Topbar({
  notificationCount = 3,
  userInitials = "HK",
  userName     = "Hussein Khalil",
  userRole     = "Admin",
}: Props) {
  const [query,        setQuery]        = useState("")
  const [notifOpen,    setNotifOpen]    = useState(false)
  const [notifTab,     setNotifTab]     = useState<NotifItem["tab"]>("general")
  const [notifs,       setNotifs]       = useState<NotifItem[]>(MOCK_NOTIFS)
  const [userOpen,     setUserOpen]     = useState(false)
  const [darkMode,     setDarkMode]     = useState(false)
  const router = useRouter()

  const notifRef = useRef<HTMLDivElement>(null)
  const userRef  = useRef<HTMLDivElement>(null)

  useOutsideClick(notifRef, () => setNotifOpen(false))
  useOutsideClick(userRef,  () => setUserOpen(false))

  // Sync dark mode with <html> data-theme
  useEffect(() => {
    const html = document.documentElement
    const current = html.getAttribute("data-theme") === "dark"
    setDarkMode(current)
  }, [])

  function toggleDark() {
    const next = !darkMode
    setDarkMode(next)
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light")
  }

  function handleSearch(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && query.trim()) {
      router.push(`/merchants?q=${encodeURIComponent(query.trim())}`)
    }
  }

  function markAllRead() {
    setNotifs(n => n.map(x => ({ ...x, unread: false })))
  }

  const tabNotifs   = notifs.filter(n => n.tab === notifTab)
  const unreadCount = notifs.filter(n => n.unread).length

  return (
    <header style={{
      height: 56,
      background: "var(--bg2)",
      borderBottom: "1px solid var(--border)",
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "0 20px",
      position: "sticky",
      top: 0,
      zIndex: 99,
      flexShrink: 0,
    }}>

      {/* ── Search ── */}
      <div style={{ flex: 1, maxWidth: 420, position: "relative" }}>
        <span className="material-symbols-outlined" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: "var(--text3)", pointerEvents: "none" }}>
          search
        </span>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleSearch}
          placeholder="Search merchants by MID or name..."
          style={{
            width: "100%",
            padding: "8px 14px 8px 36px",
            background: "var(--bg3)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            fontSize: 13,
            color: "var(--text)",
            outline: "none",
            fontFamily: "inherit",
            boxSizing: "border-box",
          }}
          onFocus={e  => (e.currentTarget.style.borderColor = "var(--accent-crm)")}
          onBlur={e   => (e.currentTarget.style.borderColor = "var(--border)")}
        />
      </div>

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>

        {/* ── Calendar shortcut ── */}
        <Link
          href="/calendar"
          style={{ width: 36, height: 36, borderRadius: 9, background: "var(--bg3)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text3)", textDecoration: "none", flexShrink: 0 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>calendar_month</span>
        </Link>

        {/* ── Notifications ── */}
        <div ref={notifRef} style={{ position: "relative" }}>
          <button
            onClick={() => { setNotifOpen(o => !o); setUserOpen(false) }}
            style={{ position: "relative", width: 36, height: 36, borderRadius: 9, background: "var(--bg3)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text3)", cursor: "pointer", flexShrink: 0 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>notifications</span>
            {unreadCount > 0 && (
              <span style={{ position: "absolute", top: -4, right: -4, background: "#ef4444", color: "#fff", borderRadius: "50%", width: 16, height: 16, fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid var(--bg2)" }}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div style={{
              position: "absolute",
              top: 44,
              right: 0,
              width: 360,
              background: "var(--bg2)",
              border: "1px solid var(--border)",
              borderRadius: 14,
              boxShadow: "0 8px 32px rgba(0,0,0,.18)",
              zIndex: 200,
              overflow: "hidden",
            }}>
              {/* Header */}
              <div style={{ padding: "14px 16px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 800, fontSize: 14, color: "var(--text)" }}>Notifications</span>
                <button
                  onClick={markAllRead}
                  style={{ fontSize: 11, fontWeight: 700, color: "var(--accent-crm)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  Mark all read
                </button>
              </div>

              {/* Summary */}
              <p style={{ margin: "4px 16px 10px", fontSize: 11, color: "var(--text3)" }}>
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}` : "All caught up!"}
              </p>

              {/* Tabs */}
              <div style={{ display: "flex", borderBottom: "1px solid var(--border)", padding: "0 10px", gap: 2 }}>
                {(["general","tasks","onboarding","mentions"] as const).map(tab => {
                  const count = notifs.filter(n => n.tab === tab && n.unread).length
                  const active = notifTab === tab
                  return (
                    <button
                      key={tab}
                      onClick={() => setNotifTab(tab)}
                      style={{
                        padding: "7px 10px",
                        fontSize: 11,
                        fontWeight: active ? 700 : 600,
                        color: active ? "var(--accent-crm)" : "var(--text3)",
                        background: "none",
                        border: "none",
                        borderBottom: active ? "2px solid var(--accent-crm)" : "2px solid transparent",
                        cursor: "pointer",
                        position: "relative",
                        textTransform: "capitalize",
                        marginBottom: -1,
                      }}
                    >
                      {tab}
                      {count > 0 && (
                        <span style={{ marginLeft: 4, background: "#ef4444", color: "#fff", borderRadius: 8, padding: "1px 5px", fontSize: 9, fontWeight: 800 }}>
                          {count}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Items */}
              <div style={{ maxHeight: 300, overflowY: "auto" }}>
                {tabNotifs.length === 0 ? (
                  <p style={{ padding: "24px 16px", textAlign: "center", fontSize: 12, color: "var(--text3)" }}>No notifications here</p>
                ) : tabNotifs.map(n => (
                  <div
                    key={n.id}
                    onClick={() => setNotifs(ns => ns.map(x => x.id === n.id ? { ...x, unread: false } : x))}
                    style={{
                      display: "flex",
                      gap: 10,
                      padding: "11px 16px",
                      borderBottom: "1px solid var(--border)",
                      background: n.unread ? "var(--accent-crm-light)" : "transparent",
                      cursor: "pointer",
                      transition: ".12s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--bg3)")}
                    onMouseLeave={e => (e.currentTarget.style.background = n.unread ? "var(--accent-crm-light)" : "transparent")}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: n.iconColor + "22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16, color: n.iconColor }}>{n.icon}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: n.unread ? 700 : 600, color: "var(--text)", lineHeight: 1.3 }}>{n.title}</span>
                        {n.unread && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#6366f1", flexShrink: 0, marginTop: 3 }} />}
                      </div>
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--text3)", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.body}</p>
                      <span style={{ fontSize: 10, color: "var(--text3)", marginTop: 2, display: "block" }}>{n.time}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div style={{ padding: "10px 16px" }}>
                <Link
                  href="/notifications"
                  onClick={() => setNotifOpen(false)}
                  style={{ display: "block", textAlign: "center", fontSize: 12, fontWeight: 700, color: "var(--accent-crm)", textDecoration: "none" }}
                >
                  View all notifications
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* ── User menu ── */}
        <div ref={userRef} style={{ position: "relative" }}>
          <button
            onClick={() => { setUserOpen(o => !o); setNotifOpen(false) }}
            style={{ width: 36, height: 36, borderRadius: 9, background: "#5b3fde", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff", cursor: "pointer", border: "none", flexShrink: 0 }}
            title={userName}
          >
            {userInitials}
          </button>

          {userOpen && (
            <div style={{
              position: "absolute",
              top: 44,
              right: 0,
              width: 240,
              background: "var(--bg2)",
              border: "1px solid var(--border)",
              borderRadius: 14,
              boxShadow: "0 8px 32px rgba(0,0,0,.18)",
              zIndex: 200,
              overflow: "hidden",
            }}>
              {/* User header */}
              <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: "#5b3fde", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                    {userInitials}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 13, color: "var(--text)" }}>{userName}</div>
                    <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 1 }}>{userRole}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <div style={{ flex: 1, background: "var(--bg3)", borderRadius: 8, padding: "6px 10px", textAlign: "center" }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: "var(--accent-crm)" }}>12</div>
                    <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 1 }}>Open Tickets</div>
                  </div>
                  <div style={{ flex: 1, background: "var(--bg3)", borderRadius: 8, padding: "6px 10px", textAlign: "center" }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: "var(--text)" }}>84</div>
                    <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 1 }}>Total Handled</div>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div style={{ padding: "6px 8px" }}>
                {[
                  { label: "My Tickets",  href: "/tickets",   icon: "confirmation_number" },
                  { label: "Timecard",    href: "/timecard",  icon: "schedule"            },
                  { label: "My Tasks",    href: "/tasks",     icon: "task_alt"            },
                  { label: "Feedback",    href: "/feedback",  icon: "rate_review"         },
                  { label: "Profile",     href: "/profile",   icon: "person"              },
                ].map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setUserOpen(false)}
                    style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: 8, textDecoration: "none", color: "var(--text2)", fontSize: 13, fontWeight: 600, transition: ".12s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--bg3)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--text3)" }}>{item.icon}</span>
                    {item.label}
                  </Link>
                ))}

                {/* Dark mode toggle */}
                <div
                  onClick={toggleDark}
                  style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: 8, cursor: "pointer", transition: ".12s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--bg3)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--text3)" }}>{darkMode ? "light_mode" : "dark_mode"}</span>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "var(--text2)" }}>Dark Mode</span>
                  {/* Toggle switch */}
                  <div style={{ width: 34, height: 18, borderRadius: 9, background: darkMode ? "var(--accent-crm)" : "var(--border)", position: "relative", transition: ".2s", flexShrink: 0 }}>
                    <div style={{ position: "absolute", top: 2, left: darkMode ? 16 : 2, width: 14, height: 14, borderRadius: "50%", background: "#fff", transition: ".2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} />
                  </div>
                </div>
              </div>

              {/* Sign out */}
              <div style={{ borderTop: "1px solid var(--border)", padding: "6px 8px" }}>
                <button
                  onClick={() => { setUserOpen(false); router.push("/login") }}
                  style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: 8, cursor: "pointer", width: "100%", background: "none", border: "none", color: "#ef4444", fontSize: 13, fontWeight: 700, transition: ".12s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#fef2f2")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>logout</span>
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  )
}
