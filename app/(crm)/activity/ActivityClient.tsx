"use client"

import { useState, useMemo } from "react"

export type ActivityType = "created" | "resolved" | "note" | "updated" | "merchant" | "closed"

export interface ActivityChange {
  field: string
  from:  string
  to:    string
}

export interface ActivityEntry {
  id:        string
  type:      ActivityType
  user:      string
  action:    string
  target:    string
  targetId?: string
  merchant?: string
  timestamp: string
  dateGroup: string
  detail?:   string
  changes?:  ActivityChange[]
}

interface Props {
  initialActivity: ActivityEntry[]
}

const TYPE_META: Record<ActivityType, { icon: string; color: string; bg: string }> = {
  created:  { icon: "confirmation_number", color: "#10b981", bg: "rgba(16,185,129,.13)"  },
  resolved: { icon: "check_circle",        color: "#6366f1", bg: "rgba(99,102,241,.13)"  },
  note:     { icon: "sticky_note_2",       color: "#06b6d4", bg: "rgba(6,182,212,.13)"   },
  updated:  { icon: "swap_horiz",          color: "#f59e0b", bg: "rgba(245,158,11,.13)"  },
  merchant: { icon: "storefront",          color: "#ec4899", bg: "rgba(236,72,153,.13)"  },
  closed:   { icon: "do_not_disturb_on",   color: "#6b7280", bg: "rgba(107,114,128,.13)" },
}

const USER_COLORS: Record<string, string> = {
  "Derek Foss":  "#6366f1",
  "Amara Singh": "#ec4899",
  "Tomas Vega":  "#10b981",
}

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
}

export function ActivityClient({ initialActivity }: Props) {
  const [search,     setSearch]     = useState("")
  const [typeFilter, setTypeFilter] = useState("")

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return initialActivity.filter(e => {
      if (typeFilter && e.type !== typeFilter) return false
      if (q) {
        const hay = [e.user, e.action, e.target, e.merchant ?? "", e.detail ?? ""]
          .join(" ").toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [initialActivity, search, typeFilter])

  const groups = useMemo(() => {
    const map = new Map<string, ActivityEntry[]>()
    for (const e of filtered) {
      if (!map.has(e.dateGroup)) map.set(e.dateGroup, [])
      map.get(e.dateGroup)!.push(e)
    }
    return Array.from(map.entries())
  }, [filtered])

  return (
    <div style={{ padding: 24 }}>
      <div className="tkt-filter-bar" style={{ marginBottom: 18 }}>
        <div className="tkt-search" style={{ flex: 1 }}>
          <span className="material-symbols-outlined">search</span>
          <input
            type="text"
            placeholder="Search activity..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="tkt-filter-sel"
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
        >
          <option value="">All Activity</option>
          <option value="created">Ticket Created</option>
          <option value="resolved">Resolved</option>
          <option value="note">Notes Added</option>
          <option value="updated">Updated</option>
          <option value="merchant">Merchant</option>
          <option value="closed">Closed</option>
        </select>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text3)", whiteSpace: "nowrap", padding: "0 4px" }}>
          {filtered.length} {filtered.length === 1 ? "event" : "events"}
        </span>
      </div>

      {groups.length === 0 ? (
        <div className="dash-card-v2" style={{ textAlign: "center", padding: "56px 24px", color: "var(--text3)", fontSize: 14, fontWeight: 500 }}>
          No activity found
        </div>
      ) : (
        groups.map(([dateLabel, entries]) => (
          <div key={dateLabel} style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "1.4px", color: "var(--text3)", marginBottom: 10, paddingLeft: 2 }}>
              {dateLabel}
            </div>
            <div className="dash-card-v2" style={{ padding: 0, overflow: "hidden" }}>
              {entries.map((entry, i) => {
                const meta  = TYPE_META[entry.type]
                const color = USER_COLORS[entry.user] ?? "#6366f1"
                return (
                  <div
                    key={entry.id}
                    className="act-item"
                    style={{ borderBottom: i < entries.length - 1 ? "1px solid var(--border)" : "none" }}
                  >
                    <div className="act-type-icon" style={{ background: meta.bg }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 15, color: meta.color }}>
                        {meta.icon}
                      </span>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "4px 8px" }}>
                          <div className="act-avatar" style={{ background: color }}>
                            {initials(entry.user)}
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{entry.user}</span>
                          <span style={{ fontSize: 13, color: "var(--text2)" }}>{entry.action}</span>
                          {entry.targetId
                            ? <span className="act-ticket-badge">{entry.targetId}</span>
                            : <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{entry.target}</span>
                          }
                        </div>
                        <span style={{ fontSize: 12, color: "var(--text3)", whiteSpace: "nowrap", flexShrink: 0 }}>
                          {entry.timestamp}
                        </span>
                      </div>

                      {entry.merchant && (
                        <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 3, marginLeft: 34 }}>
                          {entry.merchant}
                        </div>
                      )}

                      {entry.detail && (
                        <div className="act-note-preview">
                          &ldquo;{entry.detail}&rdquo;
                        </div>
                      )}

                      {entry.changes && entry.changes.length > 0 && (
                        <div className="act-changes">
                          {entry.changes.map((c, ci) => (
                            <div key={ci} className="act-change-pill">
                              <span className="act-pill-field">{c.field}</span>
                              <span className="act-pill-from">{c.from}</span>
                              <span className="material-symbols-outlined" style={{ fontSize: 13, color: "var(--text3)" }}>arrow_forward</span>
                              <span className="act-pill-to">{c.to}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
