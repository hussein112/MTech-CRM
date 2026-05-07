"use client"

import { useRouter } from "next/navigation"
import type { DashboardStats } from "@/app/types/dashboard"

const STATS = [
  { key: "openTickets" as const,    label: "Open Tickets",    icon: "confirmation_number", bg: "#ef4444", href: "/tickets?status=open"     },
  { key: "totalMerchants" as const, label: "Total Merchants", icon: "storefront",           bg: "#06b6d4", href: "/merchants"              },
  { key: "onboarding" as const,     label: "Onboarding",      icon: "assignment",           bg: "#10b981", href: "/merchants?tab=onboarding"},
  { key: "resolvedTotal" as const,  label: "Resolved (Total)",icon: "task_alt",             bg: "#8b5cf6", href: "/tickets?status=resolved" },
]

interface Props {
  stats: DashboardStats
  loading?: boolean
}

export function StatCards({ stats, loading }: Props) {
  const router = useRouter()

  return (
    <div className="stat-v2-row">
      {STATS.map(({ key, label, icon, bg, href }) => (
        <div
          key={key}
          className="stat-v2"
          style={{ background: bg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 26px", position: "relative" }}
          onClick={() => router.push(href)}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === "Enter" && router.push(href)}
          aria-label={`${label}: ${stats[key]}`}
        >
          <div
            className="stat-v2-icon"
            style={{ flexShrink: 0, width: 56, height: 56, borderRadius: 14, background: "rgba(255,255,255,0.25)", boxShadow: "inset 0 2px 4px rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 28, color: "#fff" }}>{icon}</span>
          </div>

          <div style={{ textAlign: "right" }}>
            <div className="stat-v2-num" style={{ color: "#fff", fontSize: 36, lineHeight: 1, fontWeight: 900 }}>
              {loading ? "—" : stats[key].toLocaleString()}
            </div>
            <div className="stat-v2-label" style={{ marginTop: 8, color: "rgba(255,255,255,.9)", fontWeight: 700, fontSize: 13 }}>
              {label}
            </div>
          </div>

          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 5, background: "rgba(255,255,255,.15)", borderRadius: "0 0 20px 20px" }} />
        </div>
      ))}
    </div>
  )
}
