"use client"

import type { DashboardStats, Ticket, ActivityItem, ChartPoint, ChartPeriod, TicketPriority } from "../../types/dashboard"
import type { VolumePoint } from "./OnboardingVolumeChart"
import type { MerchantRow } from "./RecentMerchants"
import type { Brand } from "./BrandsAffected"
import type { ResolutionCounts } from "./ResolutionGauge"

import { StatCards }             from "./StatCards"
import { ActivityChart }         from "./ActivityChart"
import { LiveFeed }              from "./LiveFeed"
import { TicketQueue }           from "./TicketQueue"
import { ResolutionGauge }       from "./ResolutionGauge"
import { OnboardingPipeline }    from "./OnboardingPieline"
import { OnboardingVolumeChart } from "./OnboardingVolumeChart"
import { RecentMerchants }       from "./RecentMerchants"
import { BrandsAffected }        from "./BrandsAffected"

interface Props {
  stats:            DashboardStats
  tickets:          Ticket[]
  activity:         ActivityItem[]
  chartData:        Record<ChartPeriod, ChartPoint[]>
  today:            string
  onboardingVolume: VolumePoint[]
  resolution:       ResolutionCounts
  merchants:        MerchantRow[]
  brands:           Brand[]
}

export function DashboardClient({ stats, tickets, activity, chartData, today, onboardingVolume, resolution, merchants, brands }: Props) {
  return (
    <div className="dash-layout">

      {/* Page Header */}
      <div className="dash-header">
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "var(--text)", margin: 0, fontFamily: "'Mulish', sans-serif", letterSpacing: -0.5 }}>
            Dashboard
          </h1>
          <div style={{ fontSize: 13, color: "var(--text3)", marginTop: 2 }}>Home / Analytics</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 18px", color: "var(--text2)", whiteSpace: "nowrap" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--accent-crm)" }}>calendar_month</span>
          <span style={{ fontWeight: 700 }}>Today — {today}</span>
        </div>
      </div>

      <StatCards stats={stats} />

      <div className="dash-rows">

        {/* Row 1: Activity Chart + Live Feed */}
        <div className="dash-grid dash-grid-2-1">
          <ActivityChart data={chartData} />
          <LiveFeed items={activity} totalCount={589} />
        </div>

        {/* Row 2: Ticket Queue */}
        <TicketQueue tickets={tickets} />

        {/* Row 3: Onboarding Pipeline + Volume Chart */}
        <div className="dash-grid dash-grid-1-2">
          <OnboardingPipeline
            merchantActive={2}
            merchantResolved={4}
            agentActive={0}
            agentResolved={0}
            merchantStatuses={[{ label: "In Progress", count: 2, color: "#8b5cf6" }]}
            agentStatuses={[]}
          />
          <OnboardingVolumeChart data={onboardingVolume} />
        </div>

        {/* Row 4: Resolution Health + Open Priorities */}
        <div className="dash-grid dash-grid-2-1">
          <ResolutionGauge counts={resolution} />

          <div className="dash-card-v2" style={{ display: "flex", flexDirection: "column" }}>
            <div className="dv2-title">Open Priorities</div>
            {(["Critical", "High", "Medium", "Low", "Onboarding"] as const).map((p, i, arr) => {
              const colors: Record<string, string> = { Critical: "#ef4444", High: "#f97316", Medium: "#eab308", Low: "#10b981", Onboarding: "#6b7280" }
              const counts: Record<string, number> = { Critical: 1, High: 2, Medium: 3, Low: 11, Onboarding: 1 }
              const max = Math.max(...Object.values(counts))
              const pct = Math.round((counts[p] / max) * 100)
              return (
                <div key={p} style={{ marginBottom: i < arr.length - 1 ? 16 : 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{p}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: colors[p] }}>{counts[p]}</span>
                  </div>
                  <div style={{ height: 6, background: "var(--bg3)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: colors[p], borderRadius: 4, transition: "width .4s" }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Row 5: Recent Closed/Resolved + Brands Affected */}
        <div className="dash-grid dash-grid-2-1">
          <RecentMerchants merchants={merchants} />
          <BrandsAffected  brands={brands} />
        </div>

      </div>
    </div>
  )
}
