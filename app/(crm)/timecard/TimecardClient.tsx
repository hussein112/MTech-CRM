"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"

// ── Types ──────────────────────────────────────────────────────────────────

interface TCLog {
  in: string
  out: string | null
}

interface TCEntry {
  date: string
  logs: TCLog[]
  status: "Worked" | "Late" | "Absent" | "Sick" | "Pending"
}

// ── Mock Initial Data ──────────────────────────────────────────────────────

const INITIAL_MOCK: Record<string, TCEntry> = {
  "2026-05-13": { date: "2026-05-13", logs: [{ in: "2026-05-13T09:58:00", out: null }], status: "Worked" },
  "2026-05-12": { date: "2026-05-12", logs: [{ in: "2026-05-12T10:25:00", out: "2026-05-12T13:00:00" }, { in: "2026-05-12T13:45:00", out: "2026-05-12T18:00:00" }], status: "Late" },
  "2026-05-11": { date: "2026-05-11", logs: [{ in: "2026-05-11T09:52:00", out: "2026-05-11T12:30:00" }, { in: "2026-05-11T13:30:00", out: "2026-05-11T18:10:00" }], status: "Worked" },
  "2026-05-08": { date: "2026-05-08", logs: [{ in: "2026-05-08T10:00:00", out: "2026-05-08T13:00:00" }, { in: "2026-05-08T14:00:00", out: "2026-05-08T18:00:00" }], status: "Worked" },
  "2026-05-07": { date: "2026-05-07", logs: [{ in: "2026-05-07T09:55:00", out: "2026-05-07T12:00:00" }, { in: "2026-05-07T12:30:00", out: "2026-05-07T18:15:00" }], status: "Worked" },
  "2026-05-06": { date: "2026-05-06", logs: [{ in: "2026-05-06T10:12:00", out: "2026-05-06T14:00:00" }, { in: "2026-05-06T15:00:00", out: "2026-05-06T18:00:00" }], status: "Late" },
  "2026-05-05": { date: "2026-05-05", logs: [{ in: "2026-05-05T09:50:00", out: "2026-05-05T17:55:00" }], status: "Worked" },
  "2026-05-04": { date: "2026-05-04", logs: [{ in: "2026-05-04T10:05:00", out: "2026-05-04T18:30:00" }], status: "Late" },
}

// ── Helpers ────────────────────────────────────────────────────────────────

function toDs(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function isWeekend(d: Date) { const w = d.getDay(); return w === 0 || w === 6 }

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
}

function fmtHrs(h: number) {
  const hr = Math.floor(h)
  const min = Math.round((h - hr) * 60)
  return min > 0 ? `${hr}h ${min}m` : `${hr}h`
}

function calcHours(logs: TCLog[], nowTime: number): number {
  return logs.reduce((sum, log) => {
    const start = new Date(log.in).getTime()
    const end = log.out ? new Date(log.out).getTime() : nowTime
    return sum + Math.max(0, (end - start) / 3600000)
  }, 0)
}

const STATUS_COLOR: Record<string, string> = {
  Worked: "#10b981",
  Late: "#f59e0b",
  Sick: "#b45309",
  Absent: "#ef4444",
  Pending: "var(--text3)",
  Off: "var(--bg3)",
}

// ── Component ──────────────────────────────────────────────────────────────

export function TimecardClient() {
  const [now, setNow] = useState<Date | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [mockData, setMockData] = useState(INITIAL_MOCK)
  const [isClockedIn, setIsClockedIn] = useState(false)
  const [thumbX, setThumbX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    setNow(new Date())
  }, [])

  // Modals & Popups
  const [activeModal, setActiveModal] = useState<"attendance" | "reports" | "breakdown" | "alert" | "timeoff" | null>(null)
  const [alertInfo, setAlertInfo] = useState({ title: "", msg: "", icon: "warning", type: "error" })
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null)
  const [dayDetails, setDayDetails] = useState<{ dateStr: string, status: string, shift: string, total: string, inTime: string, outTime: string } | null>(null)

  // Report state
  const [reportRange, setReportRange] = useState("this_week")
  const [reportStart, setReportStart] = useState("")
  const [reportEnd, setReportEnd] = useState("")
  const [attTab, setAttTab] = useState<"month" | "year">("month")
  const [attMonthOffset, setAttMonthOffset] = useState(0)

  const trackRef = useRef<HTMLDivElement>(null)
  const startXRef = useRef(0)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Live clock
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // Initialize clocked in status from today's data
  useEffect(() => {
    if (!isMounted) return
    const entry = mockData[toDs(new Date())]
    if (entry && entry.logs.length > 0) {
      const last = entry.logs[entry.logs.length - 1]
      setIsClockedIn(!last.out)
    }
  }, [mockData, isMounted])

  const showToast = useCallback((msg: string, type: "success" | "error" | "info" = "success") => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ msg, type })
    toastTimer.current = setTimeout(() => setToast(null), 3200)
  }, [])

  // ── Derived display values ────────────────────────────────────────────────

  const nowDs = now ? toDs(now) : ""
  const h12 = now ? (now.getHours() % 12 || 12) : "--"
  const ampm = now ? (now.getHours() >= 12 ? "PM" : "AM") : ""
  const mins = now ? String(now.getMinutes()).padStart(2, "0") : "--"
  const secs = now ? String(now.getSeconds()).padStart(2, "0") : "--"
  const dateLabel = now ? now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) : "Loading time..."

  const elapsedObj = useMemo(() => {
    if (!now || !isMounted) return null
    const entry = mockData[nowDs]
    if (!entry) return null
    const diffHours = calcHours(entry.logs, now.getTime())
    if (diffHours === 0) return null
    const h = Math.floor(diffHours)
    const m = Math.floor((diffHours * 60) % 60)
    const s = Math.floor((diffHours * 3600) % 60)
    return { text: `${h}h ${m}m ${s}s`, raw: diffHours }
  }, [now, isClockedIn, nowDs, mockData])

  // Current week Mon–Sun
  const weekDays = useMemo(() => {
    if (!now) return []
    const today = new Date(now)
    today.setHours(0, 0, 0, 0)
    const monday = new Date(today)
    monday.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)) // Mon-Sun
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      return d
    })
  }, [now])

  // Stats
  const { weeklyHours, overtime, attPct, attAbsent, attLate, workedDays } = useMemo(() => {
    if (!isMounted || !now || weekDays.length === 0) return { weeklyHours: 0, overtime: 0, attPct: 100, attAbsent: 0, attLate: 0, workedDays: 0 }

    let wHours = 0
    let wDays = 0, lates = 0, absents = 0, expected = 0

    for (const d of weekDays) {
      const ds = toDs(d)
      if (d <= now && !isWeekend(d)) expected++
      const entry = mockData[ds]
      if (entry) {
        wHours += calcHours(entry.logs, now.getTime())
        if (entry.status === "Worked") wDays++
        if (entry.status === "Late") { wDays++; lates++ }
        if (entry.status === "Absent" || entry.status === "Sick") absents++
      } else if (d < now && !isWeekend(d)) {
        absents++
      }
    }

    return {
      weeklyHours: wHours,
      overtime: Math.max(0, wHours - 40),
      attPct: expected > 0 ? Math.round(((wDays) / expected) * 100) : 100,
      attAbsent: absents,
      attLate: lates,
      workedDays: wDays
    }
  }, [weekDays, now, mockData])

  // ── Slider Logic ─────────────────────────────────────────────────────────

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    setIsDragging(true)
    startXRef.current = e.clientX
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging || !trackRef.current) return
    const dx = e.clientX - startXRef.current
    const maxLeft = trackRef.current.offsetWidth - 64 - 8 // 64 thumb width
    const newLeft = Math.max(0, Math.min(dx, maxLeft))
    setThumbX(newLeft)

    if (newLeft >= maxLeft * 0.95) {
      setIsDragging(false)
      const next = !isClockedIn

      if (next) {
        const shiftStart = new Date(now)
        shiftStart.setHours(10, 0, 0, 0)
        const diffMins = (now.getTime() - shiftStart.getTime()) / 60000
        const gracePeriod = 15

        if (diffMins < -gracePeriod) {
          const waitMins = Math.abs(Math.floor(diffMins)) - gracePeriod
          setAlertInfo({
            title: "Shift Hasn't Started",
            msg: `You're early! You cannot clock in until <b>9:45 AM</b>.<br><br>Please wait ${waitMins} more minutes.`,
            icon: "block",
            type: "warning"
          })
          setActiveModal("alert")
          setThumbX(0)
          return
        }

        const status = diffMins > 10 ? "Late" : "Worked"
        const newLog = { in: now.toISOString(), out: null }
        setMockData(prev => {
          const existing = prev[nowDs]
          return {
            ...prev,
            [nowDs]: {
              date: nowDs,
              logs: existing ? [...existing.logs, newLog] : [newLog],
              status: existing && existing.status === "Late" ? "Late" : status
            }
          }
        })
        setIsClockedIn(true)
        showToast("Successfully Clocked In", "success")
        setDayDetails(null)
      } else {
        setMockData(prev => {
          const existing = prev[nowDs]
          if (!existing) return prev
          const logs = [...existing.logs]
          logs[logs.length - 1].out = now.toISOString()
          return { ...prev, [nowDs]: { ...existing, logs } }
        })
        setIsClockedIn(false)
        showToast("Successfully Clocked Out", "success")
      }
      setThumbX(0)
    }
  }

  function onPointerUp() { setIsDragging(false); setThumbX(0) }

  // ── Reporting Logic ─────────────────────────────────────────────────────

  function applyQuickRange(range: string) {
    setReportRange(range)
    const today = new Date(now); today.setHours(0, 0, 0, 0)
    const dow = today.getDay() || 7 // Mon = 1, Sun = 7
    let start = new Date(today)
    let end = new Date(today)
    switch (range) {
      case "this_week": start.setDate(today.getDate() - dow + 1); break
      case "last_week": start.setDate(today.getDate() - dow - 6); end = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23, 59, 59); break
      case "this_month": start = new Date(today.getFullYear(), today.getMonth(), 1); end = new Date(today.getFullYear(), today.getMonth() + 1, 0); end.setHours(23, 59, 59); break
      case "last_month": start = new Date(today.getFullYear(), today.getMonth() - 1, 1); end = new Date(today.getFullYear(), today.getMonth(), 0); end.setHours(23, 59, 59); break
    }
    setReportStart(toDs(start))
    setReportEnd(toDs(end))
  }

  const reportEntries = useMemo(() => {
    if (!reportStart || !reportEnd) return []
    const [sy, sm, sd] = reportStart.split("-").map(Number)
    const [ey, em, ed] = reportEnd.split("-").map(Number)
    const start = new Date(sy, sm - 1, sd, 0, 0, 0)
    const end = new Date(ey, em - 1, ed, 23, 59, 59)
    return Object.values(mockData)
      .filter(tc => { const d = new Date(tc.logs[0]?.in || tc.date + "T00:00:00"); return d >= start && d <= end })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [reportStart, reportEnd, mockData])

  function handleDayClick(d: Date, isToday: boolean, isFuture: boolean) {
    if (isFuture) return
    const ds = toDs(d)
    const card = mockData[ds]
    let status = "Absent", total = "0h 0m", inTime = "--", outTime = "--"

    if (card) {
      status = card.status
      const diffHours = calcHours(card.logs, now.getTime())
      total = fmtHrs(diffHours)
      inTime = fmtTime(card.logs[0].in)
      const lastOut = card.logs[card.logs.length - 1].out
      outTime = lastOut ? fmtTime(lastOut) : "Active"
    } else if (isToday) {
      status = "Pending"
    } else if (!isWeekend(d)) {
      status = "Absent"
    } else {
      status = "Off"
    }

    setDayDetails({
      dateStr: d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }),
      status, shift: "10:00 AM - 6:00 PM", total, inTime, outTime
    })
  }

  // ── Month Calendar Logic ────────────────────────────────────────────────
  const calendarDays = useMemo(() => {
    if (!now) return { cells: [], monthName: "" }
    const targetDate = new Date(now.getFullYear(), now.getMonth() + attMonthOffset, 1)
    const year = targetDate.getFullYear()
    const month = targetDate.getMonth()

    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDay = new Date(year, month, 1).getDay() // 0 = Sun

    // Adjust so week starts on Mon
    const startOffset = firstDay === 0 ? 6 : firstDay - 1

    const cells = []
    for (let i = 0; i < startOffset; i++) cells.push(null)
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i)
      cells.push(d)
    }
    return { cells, monthName: targetDate.toLocaleDateString("en-US", { month: "long", year: "numeric" }) }
  }, [now, attMonthOffset])

  // ── Render Helpers ──────────────────────────────────────────────────────

  const shiftStatusText = isClockedIn ? "End your shift by 6:00 PM" : "Your shift begins at 10:00 AM"
  const currentInTime = isClockedIn && nowDs && mockData[nowDs]?.logs[0]?.in ? `Clocked in since ${fmtTime(mockData[nowDs].logs[0].in)}` : ""

  if (!isMounted) return <div style={{ minHeight: "80vh" }} /> // Minimal skeleton to avoid layout shift

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", width: "100%", padding: "24px 16px" }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)", zIndex: 9999, background: toast.type === "success" ? "#10b981" : toast.type === "error" ? "#ef4444" : "#3b82f6", color: "#fff", padding: "16px 32px", borderRadius: 99, fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 12, boxShadow: "0 10px 40px rgba(0,0,0,0.2)", animation: "tcToastIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{toast.type === "success" ? "check_circle" : toast.type === "error" ? "error" : "info"}</span>
          {toast.msg}
        </div>
      )}

      {/* Beta Banner */}
      <div style={{ background: "linear-gradient(90deg, rgba(245,158,11,0.1), rgba(217,119,6,0.1))", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 16, padding: "14px 20px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "#d97706", boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>science</span>
        <span style={{ fontSize: 14, fontWeight: 700 }}>Testing Mode: This redesigned experience is in beta.</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

        {/* ── 1 Hero Section ── */}
        <section style={{
          position: "relative",
          background: isClockedIn ? "linear-gradient(135deg, #064e3b 0%, #065f46 100%)" : "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
          borderRadius: 32,
          padding: "56px 40px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          overflow: "hidden",
          boxShadow: isClockedIn ? "0 20px 50px rgba(16, 185, 129, 0.2)" : "0 20px 50px rgba(79, 70, 229, 0.2)",
          transition: "all 0.5s ease"
        }}>
          {/* Decorative Blobs */}
          <div style={{ position: "absolute", top: -100, right: -100, width: 400, height: 400, background: isClockedIn ? "rgba(16, 185, 129, 0.4)" : "rgba(99, 102, 241, 0.4)", filter: "blur(100px)", borderRadius: "50%", pointerEvents: "none", transition: "background 0.5s ease" }} />
          <div style={{ position: "absolute", bottom: -100, left: -100, width: 300, height: 300, background: isClockedIn ? "rgba(52, 211, 153, 0.3)" : "rgba(139, 92, 246, 0.3)", filter: "blur(100px)", borderRadius: "50%", pointerEvents: "none", transition: "background 0.5s ease" }} />

          <div style={{ position: "relative", zIndex: 10, width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>

            {/* Status Indicator */}
            <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", backdropFilter: "blur(10px)", padding: "8px 20px", borderRadius: 99, color: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: isClockedIn ? "#34d399" : "#f87171", animation: "tcPulse 2s infinite" }} />
                <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "0.02em" }}>{isClockedIn ? "Active Shift" : "Currently Offline"}</span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.7)", marginTop: 12, opacity: isClockedIn ? 1 : 0, transition: ".3s" }}>
                {currentInTime}
              </div>
            </div>

            {/* Giant Clock */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 40, color: "#fff" }}>
              <h2 style={{ fontSize: 80, fontWeight: 900, lineHeight: 1, letterSpacing: "-0.04em", margin: "0 0 8px 0", textShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
                {h12}:{mins}<span style={{ opacity: 0.5 }}>:{secs}</span>
                <span style={{ fontSize: 24, fontWeight: 700, opacity: 0.8, marginLeft: 12 }}>{ampm}</span>
              </h2>
              <p style={{ fontSize: 20, fontWeight: 600, color: "rgba(255,255,255,0.8)", margin: 0 }}>{dateLabel}</p>
            </div>

            {/* Live Elapsed Badge */}
            {isClockedIn && elapsedObj && (
              <div style={{ marginBottom: 32, animation: "tcFadeIn 0.4s ease" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "12px 24px", borderRadius: 99, fontSize: 20, fontWeight: 800, backdropFilter: "blur(10px)" }}>
                  <span className="material-symbols-outlined" style={{ color: "#34d399" }}>timer</span>
                  {elapsedObj.text}
                </div>
              </div>
            )}

            {/* Slider Component */}
            <div style={{ width: "100%", maxWidth: 420, userSelect: "none", touchAction: "none" }}>
              <div ref={trackRef} style={{ position: "relative", height: 72, background: "rgba(255,255,255,0.1)", backdropFilter: "blur(12px)", borderRadius: 99, border: "1px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", padding: 6, overflow: "hidden", boxShadow: "inset 0 4px 10px rgba(0,0,0,0.1)" }}>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    {isClockedIn ? "Slide to Clock Out" : "Slide to Start Shift"}
                  </span>
                </div>
                {/* Thumb Fill */}
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: thumbX + 64, background: isClockedIn ? "linear-gradient(90deg, transparent, rgba(248, 113, 113, 0.4))" : "linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.4))", zIndex: 5, borderRadius: 99, pointerEvents: "none" }} />

                <div
                  style={{
                    position: "relative", zIndex: 10, width: 60, height: 60, borderRadius: "50%",
                    background: isClockedIn ? "#f87171" : "#fff",
                    color: isClockedIn ? "#fff" : "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: isDragging ? "grabbing" : "grab",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                    transform: `translateX(${thumbX}px)`,
                    transition: isDragging ? "none" : "transform .3s cubic-bezier(.16,1,.3,1), background .3s",
                  }}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 28 }}>{isClockedIn ? "power_settings_new" : "fingerprint"}</span>
                </div>
              </div>
              <p style={{ textAlign: "center", fontSize: 14, color: "rgba(255,255,255,0.6)", marginTop: 16, fontWeight: 600 }}>
                {shiftStatusText}
              </p>
            </div>

          </div>
        </section>

        {/* ── 2. Weekly Timeline ── */}
        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", display: "flex", alignItems: "center", gap: 8 }}>
              <span className="material-symbols-outlined" style={{ color: "var(--accent-crm)" }}>calendar_view_week</span>
              Timeline
            </h3>
            <button onClick={() => setActiveModal("attendance")} className="crm-button-outline" style={{ padding: "6px 16px", borderRadius: 99, fontSize: 13, fontWeight: 700 }}>
              View History
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 12 }}>
            {weekDays.map((d, i) => {
              const isFuture = d > now
              const isToday = d.toDateString() === now.toDateString()
              const ds = toDs(d)
              const card = mockData[ds]

              let statusColor = "var(--border)"
              let statusText = "Absent"
              let hoursLabel = "0h"
              let icon = "close"

              if (card) {
                statusText = card.status
                statusColor = STATUS_COLOR[card.status] || "var(--accent-crm)"
                hoursLabel = fmtHrs(calcHours(card.logs, now.getTime()))
                icon = card.status === "Late" ? "schedule" : "check_circle"
              } else {
                if (isToday) { statusText = "Today"; statusColor = "var(--accent-crm)"; icon = "today" }
                else if (isWeekend(d)) { statusText = "Off"; statusColor = "var(--border)"; icon = "weekend" }
                else if (isFuture) { statusText = ""; icon = "" }
                else { statusColor = "#ef4444" } // Absent
              }

              return (
                <div key={i} onClick={() => handleDayClick(d, isToday, isFuture)} style={{ background: isToday ? "var(--bg)" : "var(--bg2)", border: `2px solid ${isToday ? "var(--accent-crm)" : "var(--border)"}`, borderRadius: 24, padding: "16px 8px", display: "flex", flexDirection: "column", alignItems: "center", cursor: isFuture ? "default" : "pointer", opacity: isFuture ? 0.5 : 1, transition: "all 0.2s", boxShadow: isToday ? "0 8px 20px rgba(99,102,241,0.15)" : "none" }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: isToday ? "var(--accent-crm)" : "var(--text3)", textTransform: "uppercase" }}>{d.toLocaleDateString("en-US", { weekday: "short" })}</span>
                  <span style={{ fontSize: 28, fontWeight: 900, color: isToday ? "var(--text)" : "var(--text)", margin: "8px 0" }}>{d.getDate()}</span>

                  {!isFuture && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, background: `${statusColor}20`, color: statusColor, padding: "4px 8px", borderRadius: 99 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 12 }}>{icon}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>{hoursLabel}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Animated Day Details Card */}
          {dayDetails && (
            <div style={{ marginTop: 16, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 24, padding: 24, position: "relative", overflow: "hidden", boxShadow: "0 12px 30px rgba(0,0,0,0.05)", animation: "tcFadeIn .3s cubic-bezier(0.16, 1, 0.3, 1)" }}>
              <div style={{ position: "absolute", top: 0, left: 0, width: 6, height: "100%", background: STATUS_COLOR[dayDetails.status] || "var(--accent-crm)" }} />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingLeft: 12 }}>
                <div>
                  <h4 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", margin: 0 }}>{dayDetails.dateStr}</h4>
                  <p style={{ fontSize: 13, color: "var(--text3)", margin: "4px 0 0", fontWeight: 600 }}>Shift: {dayDetails.shift}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: `${STATUS_COLOR[dayDetails.status] || "var(--accent-crm)"}15`, color: STATUS_COLOR[dayDetails.status] || "var(--accent-crm)", padding: "6px 12px", borderRadius: 99, fontWeight: 800, fontSize: 12, textTransform: "uppercase" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: STATUS_COLOR[dayDetails.status] || "var(--accent-crm)" }} />
                  {dayDetails.status}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, paddingLeft: 12 }}>
                <div style={{ background: "var(--bg2)", padding: 16, borderRadius: 16, border: "1px solid var(--border)" }}>
                  <p style={{ fontSize: 12, color: "var(--text3)", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Clock In</p>
                  <p style={{ fontSize: 18, fontWeight: 800, color: "var(--text)" }}>{dayDetails.inTime}</p>
                </div>
                <div style={{ background: "var(--bg2)", padding: 16, borderRadius: 16, border: "1px solid var(--border)" }}>
                  <p style={{ fontSize: 12, color: "var(--text3)", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Clock Out</p>
                  <p style={{ fontSize: 18, fontWeight: 800, color: "var(--text)" }}>{dayDetails.outTime}</p>
                </div>
                <div style={{ background: "var(--bg2)", padding: 16, borderRadius: 16, border: "1px solid var(--border)" }}>
                  <p style={{ fontSize: 12, color: "var(--text3)", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Total Logged</p>
                  <p style={{ fontSize: 18, fontWeight: 800, color: "var(--text)" }}>{dayDetails.total}</p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ── 3. Advanced Stats Overview ── */}
        <section>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <span className="material-symbols-outlined" style={{ color: "var(--accent-crm)" }}>monitoring</span>
            Overview
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>

            {/* Weekly Hours Card */}
            <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 24, padding: 24, display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", right: -20, top: -20, opacity: 0.05, transform: "scale(2)", pointerEvents: "none" }}><span className="material-symbols-outlined" style={{ fontSize: 100 }}>schedule</span></div>

              <div>
                <p style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text3)", margin: "0 0 16px 0" }}>Weekly Hours</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span style={{ fontSize: 40, fontWeight: 900, color: "var(--text)", lineHeight: 1 }}>{weeklyHours.toFixed(1)}</span>
                  <span style={{ fontSize: 16, color: "var(--text3)", fontWeight: 600 }}>/ 40h</span>
                </div>
              </div>

              <div style={{ marginTop: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                {overtime > 0 ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", padding: "4px 10px", borderRadius: 99, fontSize: 12, fontWeight: 800 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>warning</span> {overtime.toFixed(1)}h Overtime
                  </div>
                ) : <span />}
                <button onClick={() => { setActiveModal("reports"); applyQuickRange("this_week") }} className="crm-button-outline" style={{ padding: "6px 12px", fontSize: 12, borderRadius: 99, border: "none", background: "var(--bg)", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", cursor: "pointer" }}>Detailed Report</button>
              </div>
            </div>

            {/* Attendance Rate Card */}
            <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 24, padding: 24, display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", right: -20, top: -20, opacity: 0.05, transform: "scale(2)", pointerEvents: "none" }}><span className="material-symbols-outlined" style={{ fontSize: 100 }}>verified</span></div>

              <div>
                <p style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text3)", margin: "0 0 16px 0" }}>Attendance Rate</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span style={{ fontSize: 40, fontWeight: 900, color: attPct < 90 ? "#f59e0b" : "#10b981", lineHeight: 1 }}>{attPct}%</span>
                </div>
              </div>

              <div style={{ marginTop: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", gap: 8 }}>
                  {attAbsent > 0 && <span style={{ fontSize: 12, fontWeight: 800, color: "#ef4444", background: "rgba(239, 68, 68, 0.1)", padding: "4px 8px", borderRadius: 99 }}>{attAbsent} Absent</span>}
                  {attLate > 0 && <span style={{ fontSize: 12, fontWeight: 800, color: "#f59e0b", background: "rgba(245, 158, 11, 0.1)", padding: "4px 8px", borderRadius: 99 }}>{attLate} Late</span>}
                </div>
                <button onClick={() => setActiveModal("breakdown")} className="crm-button-outline" style={{ padding: "6px 12px", fontSize: 12, borderRadius: 99, border: "none", background: "var(--bg)", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", cursor: "pointer" }}>Breakdown</button>
              </div>
            </div>

            {/* Balances Card */}
            <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 24, padding: 24, display: "flex", flexDirection: "column", justifyContent: "space-between", gridColumn: "span auto" }}>
              <p style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text3)", margin: "0 0 16px 0" }}>Time Balances</p>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div onClick={() => setActiveModal("timeoff")} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg)", padding: "12px 16px", borderRadius: 16, border: "1px solid var(--border)", cursor: "pointer", transition: "transform 0.2s" }} onMouseOver={e => e.currentTarget.style.transform = "scale(1.02)"} onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(99, 102, 241, 0.1)", color: "var(--accent-crm)", display: "flex", alignItems: "center", justifyContent: "center" }}><span className="material-symbols-outlined" style={{ fontSize: 18 }}>flight_takeoff</span></div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>PTO Remaining</span>
                  </div>
                  <span style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", display: "flex", alignItems: "center", gap: 8 }}>48h <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--text3)" }}>chevron_right</span></span>
                </div>

                <div onClick={() => setActiveModal("timeoff")} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg)", padding: "12px 16px", borderRadius: 16, border: "1px solid var(--border)", cursor: "pointer", transition: "transform 0.2s" }} onMouseOver={e => e.currentTarget.style.transform = "scale(1.02)"} onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center" }}><span className="material-symbols-outlined" style={{ fontSize: 18 }}>medical_services</span></div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Sick Time</span>
                  </div>
                  <span style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", display: "flex", alignItems: "center", gap: 8 }}>24h <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--text3)" }}>chevron_right</span></span>
                </div>
              </div>
            </div>

          </div>
        </section>

        <div style={{ height: 40 }} /> {/* Bottom padding */}
      </div>

      {/* ── Modals ── */}

      {/* Clock Alert Modal */}
      {activeModal === "alert" && (
        <div style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 32, padding: 40, width: "100%", maxWidth: 400, textAlign: "center", boxShadow: "0 24px 48px rgba(0,0,0,0.4)", animation: "tcZoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: alertInfo.type === "error" ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)", color: alertInfo.type === "error" ? "#ef4444" : "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 40 }}>{alertInfo.icon}</span>
            </div>
            <h3 style={{ fontSize: 24, fontWeight: 900, color: "var(--text)", margin: "0 0 12px 0" }}>{alertInfo.title}</h3>
            <p style={{ fontSize: 15, color: "var(--text3)", margin: "0 0 32px 0", lineHeight: 1.6, fontWeight: 500 }} dangerouslySetInnerHTML={{ __html: alertInfo.msg }} />
            <button onClick={() => setActiveModal(null)} style={{ width: "100%", padding: "16px", background: "var(--text)", color: "var(--bg)", borderRadius: 99, fontSize: 16, fontWeight: 800, border: "none", cursor: "pointer", transition: "transform 0.2s" }} onMouseOver={e => e.currentTarget.style.transform = "scale(1.02)"} onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}>Understood</button>
          </div>
        </div>
      )}

      {/* Attendance History Calendar Modal */}
      {activeModal === "attendance" && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 32, width: "100%", maxWidth: 900, maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 60px rgba(0,0,0,0.4)", animation: "tcFadeIn 0.3s ease" }}>

            <div style={{ padding: "24px 32px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: 24, fontWeight: 900, margin: 0, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(99,102,241,0.1)", color: "var(--accent-crm)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span className="material-symbols-outlined">calendar_month</span>
                </div>
                Attendance History
              </h2>
              <button onClick={() => setActiveModal(null)} style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--bg2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text)" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
              </button>
            </div>

            <div style={{ padding: "20px 32px", background: "var(--bg2)", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setAttMonthOffset(p => p - 1)} className="crm-button-outline" style={{ width: 36, height: 36, padding: 0, borderRadius: 8 }}><span className="material-symbols-outlined">chevron_left</span></button>
                <button onClick={() => setAttMonthOffset(p => p + 1)} className="crm-button-outline" style={{ width: 36, height: 36, padding: 0, borderRadius: 8 }}><span className="material-symbols-outlined">chevron_right</span></button>
                <button onClick={() => setAttMonthOffset(0)} className="crm-button-outline" style={{ height: 36, padding: "0 16px", borderRadius: 8, fontSize: 13, fontWeight: 700 }}>Today</button>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", margin: 0 }}>{calendarDays.monthName}</h3>
              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "var(--text3)" }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} /> Worked</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "var(--text3)" }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b" }} /> Late</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "var(--text3)" }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} /> Absent</div>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: 32 }}>
              {/* Calendar Grid Header */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 12, marginBottom: 12 }}>
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
                  <div key={day} style={{ textAlign: "right", fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: "var(--text3)", paddingRight: 8 }}>{day}</div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 12 }}>
                {calendarDays.cells.map((d, i) => {
                  if (!d) return <div key={i} style={{ minHeight: 100, borderRadius: 16, background: "var(--bg2)", opacity: 0.3 }} />

                  const ds = toDs(d)
                  const card = mockData[ds]
                  const isToday = d.toDateString() === now.toDateString()

                  return (
                    <div key={i} style={{ minHeight: 100, borderRadius: 16, background: isToday ? "rgba(99,102,241,0.05)" : "var(--bg)", border: `2px solid ${isToday ? "var(--accent-crm)" : "var(--border)"}`, padding: 12, display: "flex", flexDirection: "column", position: "relative" }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: isToday ? "var(--accent-crm)" : "var(--text3)", alignSelf: "flex-end" }}>{d.getDate()}</span>

                      {card && (
                        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 4, background: `${STATUS_COLOR[card.status]}15`, color: STATUS_COLOR[card.status], padding: "4px 8px", borderRadius: 8, fontSize: 11, fontWeight: 800 }}>
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: STATUS_COLOR[card.status] }} />
                            {card.status}
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", paddingLeft: 4 }}>{fmtHrs(calcHours(card.logs, now.getTime()))}</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Reports Modal (Detailed Logs) */}
      {activeModal === "reports" && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 32, width: "100%", maxWidth: 900, maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 60px rgba(0,0,0,0.4)", animation: "tcFadeIn 0.3s ease" }}>

            <div style={{ padding: "32px", borderBottom: "1px solid var(--border)", background: "var(--bg2)", borderTopLeftRadius: 32, borderTopRightRadius: 32 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                <div>
                  <h3 style={{ fontSize: 24, fontWeight: 900, margin: "0 0 8px 0", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(99,102,241,0.1)", color: "var(--accent-crm)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span className="material-symbols-outlined">analytics</span>
                    </div>
                    Detailed Timecard Report
                  </h3>
                  <p style={{ fontSize: 14, color: "var(--text3)", margin: 0, fontWeight: 500 }}>Comprehensive breakdown of all punch segments, durations, and statuses.</p>
                </div>
                <button onClick={() => setActiveModal(null)} style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--bg)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text)" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, background: "var(--bg)", padding: 16, borderRadius: 16, border: "1px solid var(--border)" }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--text3)", marginBottom: 8, display: "block" }}>Quick Range</label>
                  <select value={reportRange} onChange={e => applyQuickRange(e.target.value)} className="crm-input" style={{ width: "100%", padding: "10px 16px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--bg2)", color: "var(--text)", fontWeight: 600 }}>
                    <option value="this_week">This Week</option>
                    <option value="last_week">Last Week</option>
                    <option value="this_month">This Month</option>
                    <option value="last_month">Last Month</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--text3)", marginBottom: 8, display: "block" }}>Start Date</label>
                  <input type="date" value={reportStart} onChange={e => { setReportStart(e.target.value); setReportRange("custom") }} className="crm-input" style={{ width: "100%", padding: "10px 16px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--bg2)", color: "var(--text)", fontWeight: 600 }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--text3)", marginBottom: 8, display: "block" }}>End Date</label>
                  <input type="date" value={reportEnd} onChange={e => { setReportEnd(e.target.value); setReportRange("custom") }} className="crm-input" style={{ width: "100%", padding: "10px 16px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--bg2)", color: "var(--text)", fontWeight: 600 }} />
                </div>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: 32 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <p style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", background: "var(--bg2)", padding: "8px 16px", borderRadius: 99 }}>{new Date(reportStart + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} <span style={{ color: "var(--text3)", margin: "0 8px" }}>to</span> {new Date(reportEnd + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
                <div style={{ display: "flex", gap: 12 }}>
                  <button className="crm-button-outline" style={{ padding: "8px 16px", borderRadius: 99, fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}><span className="material-symbols-outlined" style={{ fontSize: 18 }}>download</span> Export CSV</button>
                  <button className="crm-button" style={{ padding: "8px 16px", borderRadius: 99, fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}><span className="material-symbols-outlined" style={{ fontSize: 18 }}>print</span> Print Report</button>
                </div>
              </div>

              {reportEntries.length === 0 ? (
                <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--text3)" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 48, opacity: 0.5, marginBottom: 16 }}>assignment</span>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>No tracked shifts found for this period.</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  {reportEntries.map(tc => {
                    const hrs = calcHours(tc.logs, now.getTime())
                    return (
                      <div key={tc.date} style={{ border: "1px solid var(--border)", borderRadius: 24, background: "var(--bg2)", overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
                        <div style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", background: "var(--bg)" }}>
                          <div>
                            <span style={{ fontSize: 16, fontWeight: 900, color: "var(--text)", display: "flex", alignItems: "center", gap: 12 }}>
                              {new Date(tc.logs[0].in).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                              <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", background: `${STATUS_COLOR[tc.status]}15`, color: STATUS_COLOR[tc.status], padding: "4px 10px", borderRadius: 99 }}>{tc.status}</span>
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text3)", marginTop: 6, display: "block" }}>{tc.logs.length} punch segment{tc.logs.length !== 1 ? "s" : ""} recorded</span>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <span style={{ fontSize: 24, fontWeight: 900, color: "var(--text)" }}>{hrs.toFixed(2)}<span style={{ fontSize: 14, color: "var(--text3)", fontWeight: 700 }}>h</span></span>
                          </div>
                        </div>

                        <div style={{ padding: "16px 24px" }}>
                          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px" }}>
                            <thead>
                              <tr>
                                <th style={{ textAlign: "left", fontSize: 11, color: "var(--text3)", padding: "0 16px", fontWeight: 800, textTransform: "uppercase" }}>Segment</th>
                                <th style={{ textAlign: "left", fontSize: 11, color: "var(--text3)", padding: "0 16px", fontWeight: 800, textTransform: "uppercase" }}>Punch In</th>
                                <th style={{ textAlign: "left", fontSize: 11, color: "var(--text3)", padding: "0 16px", fontWeight: 800, textTransform: "uppercase" }}>Punch Out</th>
                                <th style={{ textAlign: "right", fontSize: 11, color: "var(--text3)", padding: "0 16px", fontWeight: 800, textTransform: "uppercase" }}>Duration</th>
                              </tr>
                            </thead>
                            <tbody>
                              {tc.logs.map((log, i) => {
                                const start = new Date(log.in).getTime()
                                const end = log.out ? new Date(log.out).getTime() : now.getTime()
                                const dur = Math.max(0, (end - start) / 3600000)
                                return (
                                  <tr key={i} style={{ background: "var(--bg)", borderRadius: 12 }}>
                                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 800, color: "var(--text3)", borderRadius: "12px 0 0 12px" }}>#{i + 1}</td>
                                    <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{fmtTime(log.in)}</td>
                                    <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 700, color: log.out ? "var(--text)" : "#10b981", display: "flex", alignItems: "center", gap: 8 }}>
                                      {!log.out && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", animation: "tcPulse 2s infinite" }} />}
                                      {log.out ? fmtTime(log.out) : "Active Now"}
                                    </td>
                                    <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 800, color: "var(--text)", textAlign: "right", borderRadius: "0 12px 12px 0" }}>{fmtHrs(dur)}</td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Attendance Breakdown Modal (Weekly Overview) */}
      {activeModal === "breakdown" && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 32, width: "100%", maxWidth: 500, maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 60px rgba(0,0,0,0.4)", animation: "tcFadeIn 0.3s ease" }}>
            <div style={{ padding: "24px 32px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg2)", borderTopLeftRadius: 32, borderTopRightRadius: 32 }}>
              <h3 style={{ fontSize: 20, fontWeight: 900, margin: 0, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(16, 185, 129, 0.1)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span className="material-symbols-outlined">trending_up</span>
                </div>
                Attendance Summary
              </h3>
              <button onClick={() => setActiveModal(null)} style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--bg)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text)" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: 32 }}>

              {/* Summary Badges */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 32 }}>
                <div style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: 16, padding: "16px 12px", textAlign: "center" }}>
                  <span style={{ fontSize: 24, fontWeight: 900, color: "#10b981", display: "block", marginBottom: 4 }}>{workedDays}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--text)" }}>Worked</span>
                </div>
                <div style={{ background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.2)", borderRadius: 16, padding: "16px 12px", textAlign: "center" }}>
                  <span style={{ fontSize: 24, fontWeight: 900, color: "#f59e0b", display: "block", marginBottom: 4 }}>{attLate}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--text)" }}>Late</span>
                </div>
                <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: 16, padding: "16px 12px", textAlign: "center" }}>
                  <span style={{ fontSize: 24, fontWeight: 900, color: "#ef4444", display: "block", marginBottom: 4 }}>{attAbsent}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--text)" }}>Absent</span>
                </div>
              </div>

              <p style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text3)", marginBottom: 16 }}>This Week's Log</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {weekDays.filter(d => !isWeekend(d) && d <= now).reverse().map((d, i) => {
                  const card = mockData[toDs(d)]
                  let status = "Absent", icon = "cancel", color = "#ef4444", detail = "No shift recorded"
                  if (card) {
                    status = card.status
                    if (status === "Worked") { icon = "check_circle"; color = "#10b981" }
                    if (status === "Late") { icon = "schedule"; color = "#f59e0b" }
                    detail = `First punch at ${fmtTime(card.logs[0].in)}`
                  }
                  return (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 20 }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", display: "flex", alignItems: "center", gap: 8 }}>
                          {d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                          {d.toDateString() === now.toDateString() && <span style={{ fontSize: 10, background: "var(--accent-crm)", color: "#fff", padding: "2px 6px", borderRadius: 4, textTransform: "uppercase" }}>Today</span>}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text3)", marginTop: 4 }}>{detail}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, color, background: `${color}15`, padding: "6px 12px", borderRadius: 99 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{icon}</span>
                        <span style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase" }}>{status}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Time Off Modal */}
      {activeModal === "timeoff" && (
        <div style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 32, padding: 40, width: "100%", maxWidth: 500, boxShadow: "0 24px 60px rgba(0,0,0,0.4)", animation: "tcZoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
              <div>
                <h3 style={{ fontSize: 24, fontWeight: 900, color: "var(--text)", margin: "0 0 8px 0" }}>Request Time Off</h3>
                <p style={{ fontSize: 14, color: "var(--text3)", margin: 0, fontWeight: 500 }}>Submit a new PTO or Sick Leave request.</p>
              </div>
              <button onClick={() => setActiveModal(null)} style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--bg2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text)" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--text3)", marginBottom: 8, display: "block" }}>Type of Leave</label>
                <select className="crm-input" style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--bg2)", color: "var(--text)", fontWeight: 600 }}>
                  <option>PTO (Paid Time Off)</option>
                  <option>Sick Leave</option>
                  <option>Unpaid Leave</option>
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--text3)", marginBottom: 8, display: "block" }}>Start Date</label>
                  <input type="date" className="crm-input" style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--bg2)", color: "var(--text)", fontWeight: 600 }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--text3)", marginBottom: 8, display: "block" }}>End Date</label>
                  <input type="date" className="crm-input" style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--bg2)", color: "var(--text)", fontWeight: 600 }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--text3)", marginBottom: 8, display: "block" }}>Reason / Notes</label>
                <textarea rows={3} className="crm-input" placeholder="Optional notes for your manager..." style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--bg2)", color: "var(--text)", fontWeight: 500, resize: "none" }} />
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
              <button onClick={() => setActiveModal(null)} className="crm-button-outline" style={{ flex: 1, padding: "16px", borderRadius: 99, fontSize: 15, fontWeight: 800 }}>Cancel</button>
              <button onClick={() => { showToast("Time off request submitted!", "success"); setActiveModal(null) }} className="crm-button" style={{ flex: 2, padding: "16px", borderRadius: 99, fontSize: 15, fontWeight: 800 }}>Submit Request</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
