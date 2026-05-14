"use client"

import { useState } from "react"

const MOCK_NOTIFS = [
  { id:"n1", tab:"general",    title:"System maintenance",     body:"Scheduled downtime Sunday 2–4 AM.",      time:"2h ago",  unread:true,  icon:"info",           iconColor:"#6366f1" },
  { id:"n2", tab:"general",    title:"New feature released",   body:"Batch CSV import is now live.",          time:"1d ago",  unread:true,  icon:"new_releases",   iconColor:"#10b981" },
  { id:"n3", tab:"tasks",      title:"Task assigned to you",   body:"Review merchant ID #8821 docs.",         time:"30m ago", unread:true,  icon:"task_alt",       iconColor:"#f59e0b" },
  { id:"n4", tab:"tasks",      title:"Task overdue",           body:"Follow-up call with Global Pay.",        time:"3h ago",  unread:false, icon:"warning",        iconColor:"#ef4444" },
  { id:"n5", tab:"onboarding", title:"Merchant approved",      body:"TechStore POS completed onboarding.",    time:"15m ago", unread:true,  icon:"storefront",     iconColor:"#6366f1" },
  { id:"n6", tab:"onboarding", title:"Documents pending",      body:"FastFood Co is missing bank statements.", time:"4h ago",  unread:false, icon:"description",    iconColor:"#f59e0b" },
  { id:"n7", tab:"mentions",   title:"@you in ticket #4521",  body:"Can you check this chargeback?",         time:"1h ago",  unread:true,  icon:"alternate_email", iconColor:"#8b5cf6" },
  { id:"n8", tab:"mentions",   title:"@you in ticket #4499",  body:"Agent needs approval on this case.",     time:"2d ago",  unread:false, icon:"alternate_email", iconColor:"#8b5cf6" },
]

export function NotificationsClient() {
  const [notifs, setNotifs] = useState(MOCK_NOTIFS)
  const [activeTab, setActiveTab] = useState<"all" | "general" | "tasks" | "onboarding" | "mentions">("all")

  function markAllRead() {
    setNotifs(n => n.map(x => ({ ...x, unread: false })))
  }

  function markRead(id: string) {
    setNotifs(n => n.map(x => x.id === id ? { ...x, unread: false } : x))
  }

  const filteredNotifs = activeTab === "all" ? notifs : notifs.filter(n => n.tab === activeTab)

  return (
    <div className="dash-layout">
      {/* Page Header */}
      <div className="dash-header">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "var(--text)", margin: 0, letterSpacing: -0.5 }}>Notifications</h1>
          <p style={{ fontSize: 13, color: "var(--text3)", margin: "4px 0 0", fontWeight: 500 }}>
            Stay updated with system alerts, tasks, and mentions.
          </p>
        </div>
        <button
          onClick={markAllRead}
          className="crm-btn"
          style={{ padding: "8px 16px", background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 13, borderRadius: 10, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}
        >
          Mark all as read
        </button>
      </div>

      <div className="dash-rows">
        <div className="dash-card-v2">
          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid var(--border)", gap: 24, marginBottom: 16 }}>
            {(["all", "general", "tasks", "onboarding", "mentions"] as const).map(tab => {
              const active = activeTab === tab
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: "10px 0",
                    fontSize: 13,
                    fontWeight: active ? 800 : 600,
                    color: active ? "var(--accent-crm)" : "var(--text3)",
                    background: "none",
                    border: "none",
                    borderBottom: active ? "2px solid var(--accent-crm)" : "2px solid transparent",
                    cursor: "pointer",
                    textTransform: "capitalize",
                    marginBottom: -1,
                  }}
                >
                  {tab}
                </button>
              )
            })}
          </div>

          {/* List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {filteredNotifs.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text3)", fontSize: 14, fontWeight: 600 }}>
                No notifications found.
              </div>
            ) : (
              filteredNotifs.map((n, i) => (
                <div
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  style={{
                    display: "flex", gap: 16, padding: "16px",
                    borderBottom: i < filteredNotifs.length - 1 ? "1px solid var(--border)" : "none",
                    background: n.unread ? "var(--accent-crm-light)" : "transparent",
                    borderRadius: 12,
                    cursor: "pointer",
                    transition: "all .15s"
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--bg3)" }}
                  onMouseLeave={e => { e.currentTarget.style.background = n.unread ? "var(--accent-crm-light)" : "transparent" }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: n.iconColor + "22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20, color: n.iconColor }}>{n.icon}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: n.unread ? 800 : 700, color: "var(--text)" }}>{n.title}</span>
                      {n.unread && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#6366f1", flexShrink: 0 }} />}
                    </div>
                    <p style={{ margin: "0 0 6px", fontSize: 13, color: "var(--text2)", lineHeight: 1.5 }}>{n.body}</p>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text3)" }}>{n.time}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
