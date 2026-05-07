"use client"

import { useEffect, useRef } from "react"
import { Chart, LineController, LineElement, PointElement, CategoryScale, LinearScale, Filler, Tooltip } from "chart.js"

Chart.register(LineController, LineElement, PointElement, CategoryScale, LinearScale, Filler, Tooltip)

export interface VolumePoint {
  label: string
  merchant: number
  agent: number
}

interface Props {
  data: VolumePoint[]
}

export function OnboardingVolumeChart({ data }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef  = useRef<Chart | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const ctx = canvasRef.current.getContext("2d")
    if (!ctx) return
    chartRef.current?.destroy()

    chartRef.current = new Chart(ctx, {
      type: "line",
      data: {
        labels: data.map(d => d.label),
        datasets: [
          {
            label: "Merchant Submissions",
            data: data.map(d => d.merchant),
            borderColor: "#10b981",
            backgroundColor: "rgba(16,185,129,0.06)",
            fill: true,
            tension: 0.45,
            pointRadius: 0,
            pointHoverRadius: 4,
            borderWidth: 2,
          },
          {
            label: "Agent Submissions",
            data: data.map(d => d.agent),
            borderColor: "#06b6d4",
            backgroundColor: "rgba(6,182,212,0.06)",
            fill: true,
            tension: 0.45,
            pointRadius: 0,
            pointHoverRadius: 4,
            borderWidth: 2,
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
          x: { grid: { display: false }, ticks: { font: { size: 10 }, color: "#b0b5c8", maxTicksLimit: 6 }, border: { display: false } },
          y: { grid: { color: "rgba(0,0,0,0.04)" }, ticks: { font: { size: 10 }, color: "#b0b5c8" }, min: 0, border: { display: false } },
        },
      },
    })

    return () => { chartRef.current?.destroy() }
  }, [data])

  return (
    <div className="dash-card-v2" style={{ display: "flex", flexDirection: "column" }}>
      <div className="dv2-title" style={{ marginBottom: 10 }}>Onboarding Volume (30 Days)</div>

      <div style={{ display: "flex", gap: 16, marginBottom: 20, fontSize: 11, fontWeight: 700, color: "var(--text2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 12, height: 4, borderRadius: 2, background: "#10b981" }} />
          Merchant Submissions
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 12, height: 4, borderRadius: 2, background: "#06b6d4" }} />
          Agent Submissions
        </div>
      </div>

      <div style={{ position: "relative", height: 220, flex: 1 }}>
        <canvas ref={canvasRef} aria-label="Onboarding volume chart over 30 days" role="img" />
      </div>
    </div>
  )
}
