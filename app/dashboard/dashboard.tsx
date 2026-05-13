"use client"

import dynamic from "next/dynamic"
import "../styles/portal.css"
import type { DashboardStats, Ticket, ActivityItem, ChartPoint, ChartPeriod, TicketPriority } from "../types/dashboard"

const StatCards       = dynamic(() => import("../components/dashboard/StatCards").then(m => ({ default: m.StatCards })),             { ssr: false })
const ActivityChart   = dynamic(() => import("../components/dashboard/ActivityChart").then(m => ({ default: m.ActivityChart })),     { ssr: false })
const ResolutionGauge = dynamic(() => import("../components/dashboard/ResolutionGauge").then(m => ({ default: m.ResolutionGauge })), { ssr: false })
const LiveFeed        = dynamic(() => import("../components/dashboard/LiveFeed").then(m => ({ default: m.LiveFeed })),               { ssr: false })
const TicketQueue     = dynamic(() => import("../components/dashboard/TicketQueue").then(m => ({ default: m.TicketQueue })),         { ssr: false })

const PRIORITY_COLORS: Record<TicketPriority, string> = {
  Critical: "#7c3aed",
  High:     "#ef4444",
  Medium:   "#f59e0b",
  Low:      "#10b981",
}

const PRIORITY_COUNTS: Record<TicketPriority, number> = {
  Critical: 1,
  High:     3,
  Medium:   8,
  Low:      6,
}

interface Props {
  stats:     DashboardStats
  tickets:   Ticket[]
  activity:  ActivityItem[]
  chartData: Record<ChartPeriod, ChartPoint[]>
  today:     string
}

export function DashboardClient({ stats, tickets, activity, chartData, today }: Props) {
  return (
    <div style={{ padding: 24 }}>

      {/* Page Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "var(--text)", margin: 0, fontFamily: "'Mulish', sans-serif", letterSpacing: -0.5 }}>
            Dashboard
          </h1>
          <div style={{ fontSize: 13, color: "var(--text3)", marginTop: 2 }}>Home / Analytics</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 18px", color: "var(--text2)" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--accent-crm)" }}>calendar_month</span>
          <span style={{ fontWeight: 700 }}>Today — {today}</span>
        </div>
      </div>

      <StatCards stats={stats} />

      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

        {/* Row 1: Chart + Live Feed */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 28, alignItems: "stretch" }}>
          <ActivityChart data={chartData} />
          <LiveFeed items={activity} totalCount={589} />
        </div>

        {/* Row 2: Ticket Queue */}
        <TicketQueue tickets={tickets} />

        {/* Row 3: Resolution Health + Priority Breakdown */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, alignItems: "stretch" }}>
          <ResolutionGauge
            counts={{ resolved: stats.resolvedTotal, open: stats.openTickets, inProgress: 4, overdue: 0, closed: 0 }}
          />

          <div className="dash-card-v2" style={{ display: "flex", flexDirection: "column" }}>
            <div className="dv2-title" style={{ marginBottom: 18 }}>Open Priorities</div>
            {(["Critical", "High", "Medium", "Low"] as TicketPriority[]).map((p, i) => {
              const pct = Math.round((PRIORITY_COUNTS[p] / 18) * 100)
              return (
                <div key={p} style={{ marginBottom: i < 3 ? 16 : 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)" }}>{p}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text)" }}>{PRIORITY_COUNTS[p]}</span>
                  </div>
                  <div style={{ height: 6, background: "var(--bg3)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: PRIORITY_COLORS[p], borderRadius: 4, transition: ".4s" }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
