"use client"

import Link from "next/link"
import type { ActivityItem } from "@/app/types/dashboard"

interface Props {
  items: ActivityItem[]
  loading?: boolean
  totalCount?: number
}

const DOT_COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#ef4444", "#f59e0b"]

export function LiveFeed({ items, loading, totalCount }: Props) {
  return (
    <div className="dash-card-v2" style={{ display: "flex", flexDirection: "column" }}>
      <div className="dv2-title" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--red)", boxShadow: "0 0 10px var(--red)", animation: "pulse 1.5s infinite" }} />
          <span>Live Activity</span>
        </div>
        <Link href="/activity" style={{ color: "var(--text2)", fontWeight: 700, fontSize: 12, textDecoration: "none" }}>
          View All{totalCount != null ? ` (${totalCount.toLocaleString()})` : ""}
        </Link>
      </div>

      <div id="dashActivityFeed" style={{ overflowY: "auto", flex: 1, paddingRight: 8, minHeight: 300 }}>
        {loading && (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="act-item-v2" style={{ opacity: 0.4 }}>
              <div className="act-dot-v2" style={{ background: "var(--border)", marginTop: 4 }} />
              <div>
                <div style={{ height: 12, width: 180, background: "var(--border)", borderRadius: 4, marginBottom: 6 }} />
                <div style={{ height: 10, width: 80, background: "var(--border)", borderRadius: 4 }} />
              </div>
            </div>
          ))
        )}

        {!loading && items.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text3)" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 40, display: "block", marginBottom: 10 }}>inbox</span>
            No recent activity
          </div>
        )}

        {!loading && items.map((item, i) => (
          <div key={item.id} className="act-item-v2">
            <div className="act-dot-v2" style={{ background: item.dotColor ?? DOT_COLORS[i % DOT_COLORS.length] }} />
            <div>
              <div className="act-text-v2">
                <strong style={{ color: "var(--text)", fontWeight: 800 }}>{item.userName}</strong>
                {" "}{item.action}{item.targetId ? (
                  <> <Link href={`/tickets/${item.targetId}`} style={{ color: "var(--accent)", fontWeight: 700, textDecoration: "none" }}>{item.targetId}</Link></>
                ) : item.target ? <> <span style={{ color: "var(--text)", fontWeight: 700 }}>{item.target}</span></> : null}
              </div>
              <div className="act-time-v2">{item.timestamp}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
