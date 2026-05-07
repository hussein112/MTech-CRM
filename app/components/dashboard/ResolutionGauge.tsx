"use client"

import { useEffect, useRef } from "react"
import { Chart, DoughnutController, ArcElement, Tooltip } from "chart.js"

Chart.register(DoughnutController, ArcElement, Tooltip)

export interface ResolutionCounts {
  resolved:   number
  overdue:    number
  closed:     number
  inProgress: number
  open:       number
}

interface Props {
  counts: ResolutionCounts
}

const LEGEND = [
  { key: "resolved"   as const, label: "Resolved",   color: "#8b5cf6" },
  { key: "overdue"    as const, label: "Overdue",     color: "#94a3b8" },
  { key: "closed"     as const, label: "Closed",      color: "#64748b" },
  { key: "inProgress" as const, label: "In Progress", color: "#3b82f6" },
  { key: "open"       as const, label: "Open",        color: "#06b6d4" },
]

export function ResolutionGauge({ counts }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef  = useRef<Chart | null>(null)

  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  const pct   = total > 0 ? Math.round((counts.resolved / total) * 100) : 0

  useEffect(() => {
    if (!canvasRef.current) return
    const ctx = canvasRef.current.getContext("2d")
    if (!ctx) return
    chartRef.current?.destroy()

    chartRef.current = new Chart(ctx, {
      type: "doughnut",
      data: {
        datasets: [{
          data: LEGEND.map(l => counts[l.key]),
          backgroundColor: LEGEND.map(l => l.color),
          borderWidth: 0,
          circumference: 180,
          rotation: -90,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        cutout: "78%",
      },
    })

    return () => { chartRef.current?.destroy() }
  }, [counts])

  return (
    <div className="dash-card-v2" style={{ display: "flex", flexDirection: "column" }}>
      <div className="dv2-title" style={{ marginBottom: 0 }}>Resolution Health</div>

      <div style={{ padding: "22px 0 0", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ height: 170, maxWidth: 210, margin: "0 auto", position: "relative", width: "100%" }}>
          <canvas ref={canvasRef} aria-label={`Resolution gauge: ${pct}% resolved`} role="img" />
        </div>
        <div style={{ fontSize: 36, fontWeight: 900, color: "var(--text)", marginTop: -60, textAlign: "center" }}>
          {pct}%
        </div>
        <div style={{ fontSize: 13, color: "var(--text3)", fontWeight: 600, marginTop: 6, textAlign: "center" }}>
          Global Tickets Resolved
        </div>
      </div>

      <div style={{ background: "var(--bg)", borderRadius: 12, padding: 14, border: "1px solid var(--border)", marginTop: 24 }}>
        {LEGEND.map(({ key, label, color }) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "var(--text2)", flex: 1 }}>{label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{counts[key]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}