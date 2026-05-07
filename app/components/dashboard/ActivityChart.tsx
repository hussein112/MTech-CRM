"use client"

import { useEffect, useRef, useState } from "react"
import type { ChartPeriod, ChartPoint } from "@/app/types/dashboard"

// npm install chart.js chartjs-plugin-zoom hammerjs
// npm install --save-dev @types/hammerjs
import {
  Chart,
  BarController,
  LineController,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler,
  Tooltip,
  type ChartConfiguration,
} from "chart.js"

Chart.register(BarController, LineController, BarElement, LineElement, PointElement, CategoryScale, LinearScale, Filler, Tooltip)

interface Props {
  data: Record<ChartPeriod, ChartPoint[]>
}

const PERIODS: { value: ChartPeriod; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week",  label: "Past 7 Days" },
  { value: "1",     label: "Past 30 Days" },
  { value: "6",     label: "Past 6 Months" },
  { value: "12",    label: "Past 12 Months" },
]

export function ActivityChart({ data }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef  = useRef<Chart | null>(null)
  const [period, setPeriod] = useState<ChartPeriod>("week")

  useEffect(() => {
    if (!canvasRef.current) return
    const ctx = canvasRef.current.getContext("2d")
    if (!ctx) return

    // Destroy any stale instance still attached to this canvas element
    Chart.getChart(canvasRef.current)?.destroy()
    chartRef.current = null

    const pts = data[period] ?? []

    const config: ChartConfiguration = {
      type: "bar",
      data: {
        labels: pts.map(p => p.label),
        datasets: [
          {
            type: "bar" as const,
            label: "Created",
            data: pts.map(p => p.created),
            backgroundColor: "rgba(136,79,251,0.65)",
            borderRadius: 5,
            order: 2,
            yAxisID: "y",
          },
          {
            type: "line" as const,
            label: "Resolved",
            data: pts.map(p => p.resolved),
            borderColor: "#10b981",
            backgroundColor: "rgba(16,185,129,0.08)",
            fill: true,
            tension: 0.45,
            pointBackgroundColor: "#10b981",
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
            pointRadius: 4,
            yAxisID: "y2",
            order: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#1a1f3c",
            titleFont: { size: 11 },
            bodyFont:  { size: 11 },
            padding: 10,
            cornerRadius: 8,
          },
        },
        scales: {
          x: {
            grid:   { display: false },
            ticks:  { font: { size: 10 }, color: "#b0b5c8" },
            border: { display: false },
          },
          y: {
            position: "left",
            grid:     { color: "rgba(0,0,0,0.04)" },
            ticks:    { font: { size: 10 }, color: "#b0b5c8" },
            min: 0,
            border:   { display: false },
          },
          y2: {
            position: "right",
            grid:     { drawOnChartArea: false },
            ticks:    { font: { size: 10 }, color: "#10b981" },
            min: 0,
            border:   { display: false },
          },
        },
      },
    }

    chartRef.current = new Chart(ctx, config)

    return () => { chartRef.current?.destroy(); chartRef.current = null }
  }, [period, data])

  return (
    <div className="dash-card-v2" style={{ display: "flex", flexDirection: "column" }}>
      <div className="dv2-title" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--accent-crm-light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="material-symbols-outlined" style={{ color: "var(--accent-crm)", fontSize: 18 }}>monitoring</span>
          </div>
          <span>Activity Overview</span>
        </div>

        <select
          value={period}
          onChange={e => setPeriod(e.target.value as ChartPeriod)}
          style={{ fontSize: 12, padding: "6px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontWeight: 700, cursor: "pointer", outline: "none", boxShadow: "0 2px 8px rgba(0,0,0,.04)" }}
        >
          {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>

      <div className="chart-canvas-wrap" style={{ height: 260, flex: 1, position: "relative" }}>
        <canvas ref={canvasRef} aria-label="Activity overview chart" role="img" />
      </div>

      <div style={{ display: "flex", gap: 20, marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text2)", fontWeight: 700 }}>
          <div style={{ width: 14, height: 14, borderRadius: 4, background: "#884ffb" }} />
          Created
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text2)", fontWeight: 700 }}>
          <div style={{ width: 32, height: 4, background: "#10b981", borderRadius: 2 }} />
          Resolved
        </div>
        <div style={{ marginLeft: "auto", fontSize: 11, color: "var(--text3)", fontStyle: "italic" }}>
          Scroll to zoom, drag to pan
        </div>
      </div>
    </div>
  )
}
