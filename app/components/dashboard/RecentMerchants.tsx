"use client"

import Link from "next/link"

export interface MerchantRow {
  id:          string
  name:        string
  mid:         string
  initials:    string
  avatarColor: string
  ticketCount: number
  barColor:    string
  status:      "Active" | "Inactive"
}

interface Props {
  merchants: MerchantRow[]
}

const STATUS_COLORS = { Active: "#10b981", Inactive: "#6b7280" }

export function RecentMerchants({ merchants }: Props) {
  return (
    <div className="dash-card-v2" style={{ display: "flex", flexDirection: "column", flex: 1, overflowX: "auto" }}>
      <div className="dv2-title" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(6,182,212,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="material-symbols-outlined" style={{ color: "#06b6d4", fontSize: 18 }}>history</span>
          </div>
          <span>Recent Closed/Resolved</span>
        </div>
        <Link href="/tickets?status=resolved" style={{ color: "var(--text2)", fontWeight: 700, fontSize: 12, textDecoration: "none" }}>
          View All
        </Link>
      </div>

      <table className="tkt-table-v2" style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".5px", padding: "0 8px 12px", textAlign: "left", borderBottom: "1px solid var(--border)" }}>Merchant</th>
            <th style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".5px", padding: "0 8px 12px", textAlign: "left", borderBottom: "1px solid var(--border)" }}>Ticket Load</th>
            <th style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".5px", padding: "0 8px 12px", textAlign: "left", borderBottom: "1px solid var(--border)" }}>Status</th>
            <th style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".5px", padding: "0 8px 12px", textAlign: "right", borderBottom: "1px solid var(--border)" }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {merchants.map(m => (
            <tr key={m.id} style={{ cursor: "pointer", transition: ".12s" }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--bg3)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <td style={{ padding: "11px 8px", borderBottom: "1px solid var(--border)", verticalAlign: "middle" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: m.avatarColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                    {m.initials}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{m.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 1 }}>MID: {m.mid}</div>
                  </div>
                </div>
              </td>

              <td style={{ padding: "11px 8px", borderBottom: "1px solid var(--border)", verticalAlign: "middle" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1, height: 4, background: "var(--bg3)", borderRadius: 4, overflow: "hidden", maxWidth: 120 }}>
                    <div style={{ height: "100%", width: `${Math.min(m.ticketCount * 20, 100)}%`, background: m.barColor, borderRadius: 4 }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text)", minWidth: 14 }}>{m.ticketCount}</span>
                </div>
              </td>

              <td style={{ padding: "11px 8px", borderBottom: "1px solid var(--border)", verticalAlign: "middle" }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: `${STATUS_COLORS[m.status]}22`, color: STATUS_COLORS[m.status] }}>
                  {m.status}
                </span>
              </td>

              <td style={{ padding: "11px 8px", borderBottom: "1px solid var(--border)", verticalAlign: "middle", textAlign: "right" }}>
                <Link href={`/merchants/${m.id}`} style={{ color: "var(--text3)", display: "inline-flex" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>open_in_new</span>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
