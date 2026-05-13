"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"

// ── Types ──────────────────────────────────────────────────────────────────

interface TCEntry {
  date:     string
  clockIn:  string
  clockOut: string | null
  hours:    number | null
  status:   "On Time" | "Late" | "Active"
}

// ── Mock data ──────────────────────────────────────────────────────────────

const MOCK: Record<string, TCEntry> = {
  "2026-05-11": { date:"2026-05-11", clockIn:"2026-05-11T09:58:00", clockOut: null,                  hours: null, status:"Active"  },
  "2026-05-08": { date:"2026-05-08", clockIn:"2026-05-08T10:25:00", clockOut:"2026-05-08T17:45:00",  hours: 7.33, status:"Late"    },
  "2026-05-07": { date:"2026-05-07", clockIn:"2026-05-07T09:52:00", clockOut:"2026-05-07T18:10:00",  hours: 8.30, status:"On Time" },
  "2026-05-06": { date:"2026-05-06", clockIn:"2026-05-06T10:00:00", clockOut:"2026-05-06T18:00:00",  hours: 8.00, status:"On Time" },
  "2026-05-05": { date:"2026-05-05", clockIn:"2026-05-05T09:55:00", clockOut:"2026-05-05T18:15:00",  hours: 8.33, status:"On Time" },
  "2026-05-04": { date:"2026-05-04", clockIn:"2026-05-04T10:12:00", clockOut:"2026-05-04T18:00:00",  hours: 7.87, status:"Late"    },
  "2026-05-01": { date:"2026-05-01", clockIn:"2026-05-01T09:50:00", clockOut:"2026-05-01T17:55:00",  hours: 8.08, status:"On Time" },
  "2026-04-30": { date:"2026-04-30", clockIn:"2026-04-30T10:05:00", clockOut:"2026-04-30T18:30:00",  hours: 8.42, status:"Late"    },
  // 2026-04-29: absent
  "2026-04-28": { date:"2026-04-28", clockIn:"2026-04-28T10:00:00", clockOut:"2026-04-28T18:00:00",  hours: 8.00, status:"On Time" },
  "2026-04-27": { date:"2026-04-27", clockIn:"2026-04-27T09:58:00", clockOut:"2026-04-27T18:05:00",  hours: 8.12, status:"On Time" },
  "2026-04-24": { date:"2026-04-24", clockIn:"2026-04-24T10:03:00", clockOut:"2026-04-24T17:58:00",  hours: 7.92, status:"On Time" },
  "2026-04-23": { date:"2026-04-23", clockIn:"2026-04-23T09:45:00", clockOut:"2026-04-23T18:20:00",  hours: 8.58, status:"On Time" },
  "2026-04-22": { date:"2026-04-22", clockIn:"2026-04-22T10:15:00", clockOut:"2026-04-22T18:00:00",  hours: 7.75, status:"Late"    },
  "2026-04-21": { date:"2026-04-21", clockIn:"2026-04-21T10:00:00", clockOut:"2026-04-21T18:00:00",  hours: 8.00, status:"On Time" },
  "2026-04-20": { date:"2026-04-20", clockIn:"2026-04-20T09:55:00", clockOut:"2026-04-20T18:10:00",  hours: 8.25, status:"On Time" },
  "2026-04-17": { date:"2026-04-17", clockIn:"2026-04-17T10:00:00", clockOut:"2026-04-17T17:50:00",  hours: 7.83, status:"On Time" },
  "2026-04-16": { date:"2026-04-16", clockIn:"2026-04-16T10:08:00", clockOut:"2026-04-16T18:00:00",  hours: 7.87, status:"Late"    },
  "2026-04-15": { date:"2026-04-15", clockIn:"2026-04-15T09:52:00", clockOut:"2026-04-15T18:15:00",  hours: 8.38, status:"On Time" },
  "2026-04-14": { date:"2026-04-14", clockIn:"2026-04-14T10:00:00", clockOut:"2026-04-14T18:00:00",  hours: 8.00, status:"On Time" },
  "2026-04-13": { date:"2026-04-13", clockIn:"2026-04-13T09:58:00", clockOut:"2026-04-13T18:05:00",  hours: 8.12, status:"On Time" },
}

// ── Helpers ────────────────────────────────────────────────────────────────

function toDs(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`
}

function isWeekend(d: Date) { const w = d.getDay(); return w === 0 || w === 6 }

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour:"numeric", minute:"2-digit" })
}

function fmtHrs(h: number) {
  const hr = Math.floor(h)
  const min = Math.round((h - hr) * 60)
  return min > 0 ? `${hr}h ${min}m` : `${hr}h`
}

type DayStatus = "active" | "worked" | "late" | "absent" | "off" | "future"

function getDayStatus(ds: string, nowDs: string, isClockedIn: boolean): DayStatus {
  const d = new Date(ds + "T00:00:00")
  if (isWeekend(d)) return ds <= nowDs ? "off" : "future"
  if (ds > nowDs)   return "future"
  const entry = MOCK[ds]
  if (!entry) return "absent"
  if (ds === nowDs && !entry.clockOut && isClockedIn) return "active"
  return entry.status === "Late" ? "late" : "worked"
}

const STATUS_COLOR: Record<DayStatus, string> = {
  active:  "#6366f1",
  worked:  "#10b981",
  late:    "#f59e0b",
  absent:  "#ef4444",
  off:     "var(--text3)",
  future:  "var(--border)",
}
const STATUS_BG: Record<DayStatus, string> = {
  active:  "rgba(99,102,241,.1)",
  worked:  "rgba(16,185,129,.1)",
  late:    "rgba(245,158,11,.1)",
  absent:  "rgba(239,68,68,.1)",
  off:     "var(--bg3)",
  future:  "var(--bg3)",
}

// ── Component ──────────────────────────────────────────────────────────────

export function TimecardClient() {
  const [now, setNow]                 = useState(() => new Date())
  const [isClockedIn, setIsClockedIn] = useState(true)
  const [thumbX, setThumbX]           = useState(0)
  const [isDragging, setIsDragging]   = useState(false)
  const [activeDay, setActiveDay]     = useState<string | null>(null)
  const [attModal, setAttModal]       = useState(false)
  const [hoursModal, setHoursModal]   = useState(false)
  const [breakModal, setBreakModal]   = useState(false)
  const [attMonth, setAttMonth]       = useState({ year: 2026, month: 4 }) // May 2026 (0-indexed)
  const [reportRange, setReportRange] = useState("this_week")
  const [reportStart, setReportStart] = useState("")
  const [reportEnd, setReportEnd]     = useState("")
  const [toast, setToast]             = useState<{ msg:string; type:"success"|"error"|"info" } | null>(null)

  const trackRef   = useRef<HTMLDivElement>(null)
  const startXRef  = useRef(0)
  const toastTimer = useRef<ReturnType<typeof setTimeout>|null>(null)

  // Live clock
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // ESC closes modals
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key !== "Escape") return
      if (attModal)   { setAttModal(false);   return }
      if (hoursModal) { setHoursModal(false);  return }
      if (breakModal) { setBreakModal(false);  return }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [attModal, hoursModal, breakModal])

  const showToast = useCallback((msg: string, type: "success"|"error"|"info" = "success") => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ msg, type })
    toastTimer.current = setTimeout(() => setToast(null), 3200)
  }, [])

  // ── Derived display values ────────────────────────────────────────────────

  const nowDs    = toDs(now)
  const h12      = now.getHours() % 12 || 12
  const ampm     = now.getHours() >= 12 ? "PM" : "AM"
  const mins     = String(now.getMinutes()).padStart(2, "0")
  const dateLabel = now.toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric" })

  const elapsed = useMemo(() => {
    const entry = MOCK[nowDs]
    if (!isClockedIn || !entry?.clockIn) return ""
    const diff = Math.max(0, (now.getTime() - new Date(entry.clockIn).getTime()) / 1000)
    const h = Math.floor(diff / 3600)
    const m = Math.floor((diff % 3600) / 60)
    const s = Math.floor(diff % 60)
    return `${h}h ${m}m ${s}s`
  }, [now, isClockedIn, nowDs])

  // Current week Mon–Sun
  const weekDays = useMemo(() => {
    const today = new Date(now)
    today.setHours(0,0,0,0)
    const monday = new Date(today)
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      return d
    })
  }, [now])

  // Weekly hours (current week)
  const weeklyHours = useMemo(() => {
    let total = 0
    for (const d of weekDays) {
      const ds    = toDs(d)
      const entry = MOCK[ds]
      if (!entry) continue
      if (entry.hours !== null) {
        total += entry.hours
      } else if (entry.clockIn && isClockedIn) {
        total += (now.getTime() - new Date(entry.clockIn).getTime()) / 3_600_000
      }
    }
    return total
  }, [weekDays, now, isClockedIn])

  // Attendance (last 28 work days)
  const { attPct, attAbsent, attLate } = useMemo(() => {
    const today = new Date(now)
    today.setHours(0,0,0,0)
    const start = new Date(today)
    start.setDate(today.getDate() - 28)
    let worked = 0, absent = 0, late = 0, total = 0
    for (const d = new Date(start); d <= today; d.setDate(d.getDate()+1)) {
      if (isWeekend(d)) continue
      total++
      const entry = MOCK[toDs(new Date(d))]
      if (!entry) { absent++ }
      else { worked++; if (entry.status === "Late") late++ }
    }
    return {
      attPct:    total > 0 ? Math.round((worked/total)*100) : 0,
      attAbsent: absent,
      attLate:   late,
    }
  }, [now])

  // Attendance modal: stats for selected month
  const attStats = useMemo(() => {
    const { year, month } = attMonth
    const daysInMonth = new Date(year, month+1, 0).getDate()
    const today = new Date(now); today.setHours(0,0,0,0)
    let worked = 0, late = 0, absent = 0, totalHours = 0, workDays = 0
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day)
      if (d > today || isWeekend(d)) continue
      workDays++
      const ds    = toDs(d)
      const entry = MOCK[ds]
      if (!entry) { absent++ }
      else {
        worked++
        if (entry.status === "Late") late++
        totalHours += entry.hours ?? (isClockedIn && ds === nowDs
          ? (now.getTime() - new Date(entry.clockIn).getTime()) / 3_600_000
          : 0)
      }
    }
    const rate = workDays > 0 ? Math.round((worked/workDays)*100) : 0
    const avg  = worked > 0 ? totalHours / worked : 0
    return { rate, worked, late, absent, totalHours, avg }
  }, [attMonth, now, isClockedIn, nowDs])

  // Calendar cells for attendance modal
  const calCells = useMemo(() => {
    const { year, month } = attMonth
    const firstDay   = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month+1, 0).getDate()
    const cells: (Date|null)[] = []
    for (let i = 0; i < firstDay; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
    return cells
  }, [attMonth])

  // Report entries
  const reportEntries = useMemo(() => {
    if (!reportStart || !reportEnd) return []
    const [sy,sm,sd] = reportStart.split("-").map(Number)
    const [ey,em,ed] = reportEnd.split("-").map(Number)
    const start = new Date(sy,sm-1,sd,0,0,0)
    const end   = new Date(ey,em-1,ed,23,59,59)
    return Object.values(MOCK)
      .filter(tc => { const d = new Date(tc.clockIn); return d >= start && d <= end })
      .sort((a,b) => new Date(a.clockIn).getTime() - new Date(b.clockIn).getTime())
  }, [reportStart, reportEnd])

  const reportTotal = useMemo(() =>
    reportEntries.reduce((sum, tc) => {
      if (tc.hours !== null) return sum + tc.hours
      if (!tc.clockOut && isClockedIn) return sum + (now.getTime()-new Date(tc.clockIn).getTime())/3_600_000
      return sum
    }, 0)
  , [reportEntries, now, isClockedIn])

  function applyQuickRange(range: string) {
    setReportRange(range)
    const today = new Date(now); today.setHours(0,0,0,0)
    const dow   = today.getDay()
    let start   = new Date(today)
    let end     = new Date(today)
    switch (range) {
      case "this_week":  start.setDate(today.getDate()-dow); break
      case "last_week":  start.setDate(today.getDate()-dow-7); end=new Date(start); end.setDate(start.getDate()+6); break
      case "this_month": start=new Date(today.getFullYear(),today.getMonth(),1); end=new Date(today.getFullYear(),today.getMonth()+1,0); break
      case "last_month": start=new Date(today.getFullYear(),today.getMonth()-1,1); end=new Date(today.getFullYear(),today.getMonth(),0); break
    }
    setReportStart(toDs(start))
    setReportEnd(toDs(end))
  }

  // ── Slider ───────────────────────────────────────────────────────────────

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    setIsDragging(true)
    startXRef.current = e.clientX
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging || !trackRef.current) return
    const dx      = e.clientX - startXRef.current
    const maxLeft = trackRef.current.offsetWidth - 64 - 8
    const newLeft = Math.max(0, Math.min(dx, maxLeft))
    setThumbX(newLeft)
    if (newLeft >= maxLeft * 0.92) {
      setIsDragging(false)
      const next = !isClockedIn
      setIsClockedIn(next)
      showToast(next ? "Clocked in successfully" : "Clocked out successfully")
      setThumbX(0)
    }
  }

  function onPointerUp() { setIsDragging(false); setThumbX(0) }

  // ── Shared styles ─────────────────────────────────────────────────────────

  const card: React.CSSProperties = {
    background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 16, padding: 24,
  }
  const btnClose: React.CSSProperties = {
    width:32, height:32, borderRadius:"50%", border:"none",
    background:"var(--bg3)", cursor:"pointer", color:"var(--text2)",
    display:"flex", alignItems:"center", justifyContent:"center",
  }
  const chip: (color: string) => React.CSSProperties = (color) => ({
    fontSize:10, fontWeight:800, textTransform:"uppercase" as const, letterSpacing:"0.08em",
    color, background: color + "20", padding:"3px 8px", borderRadius:6,
  })

  const DAYS_SHORT = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ fontFamily:"'Mulish',sans-serif", padding: 24 }}>

      {/* Toast */}
      {toast && (
        <div className="tc-toast" style={{ background: toast.type==="success" ? "#10b981" : toast.type==="error" ? "#ef4444" : "#6366f1" }}>
          <span className="material-symbols-outlined" style={{ fontSize:18 }}>
            {toast.type==="success" ? "check_circle" : toast.type==="error" ? "error" : "info"}
          </span>
          {toast.msg}
        </div>
      )}

      {/* Beta banner */}
      <div style={{ background:"rgba(245,158,11,.08)", border:"1px solid rgba(245,158,11,.2)", borderRadius:12, padding:"10px 16px", marginBottom:16, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
        <span className="material-symbols-outlined" style={{ fontSize:18, color:"#f59e0b" }}>biotech</span>
        <span style={{ fontSize:13, fontWeight:700, color:"#b45309" }}>Testing Mode — This feature is in beta and actively being improved.</span>
      </div>

      {/* ── Hero ── */}
      <div style={{ ...card, marginBottom:20, textAlign:"center", padding:"48px 32px 36px" }}>

        {/* Status badge */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", marginBottom:16 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:10, background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:99, padding:"6px 16px 6px 10px" }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background: isClockedIn ? "#10b981" : "#ef4444", animation:"tcPulse 2s infinite" }} />
            <span style={{ fontSize:13, fontWeight:700, color:"var(--text)" }}>
              {isClockedIn ? "Currently Clocked In" : "Currently Clocked Out"}
            </span>
          </div>
          {isClockedIn && MOCK[nowDs]?.clockIn && (
            <div style={{ marginTop:6, fontSize:11, fontWeight:700, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.08em" }}>
              Clocked in at {fmtTime(MOCK[nowDs].clockIn)}
            </div>
          )}
          {isClockedIn && elapsed && (
            <div style={{ marginTop:8 }}>
              <span style={{ fontSize:13, fontWeight:700, color:"#6366f1", background:"rgba(99,102,241,.1)", padding:"6px 16px", borderRadius:99, display:"inline-flex", alignItems:"center", gap:6 }}>
                <span className="material-symbols-outlined" style={{ fontSize:14 }}>timer</span>
                {elapsed}
              </span>
            </div>
          )}
        </div>

        {/* Clock display */}
        <div style={{ marginBottom:8 }}>
          <div style={{ fontSize:72, fontWeight:900, color:"var(--text)", lineHeight:1, letterSpacing:"-0.02em" }}>
            {h12}:{mins}
            <span style={{ fontSize:24, fontWeight:600, color:"var(--text3)", marginLeft:8 }}>{ampm}</span>
          </div>
          <div style={{ fontSize:18, color:"var(--text2)", marginTop:4 }}>{dateLabel}</div>
        </div>

        {/* Drag slider */}
        <div style={{ maxWidth:380, margin:"32px auto 0" }}>
          <div
            ref={trackRef}
            style={{ position:"relative", height:64, background:"var(--bg3)", borderRadius:99, padding:4, border:`1px solid ${isDragging ? "#6366f1" : "var(--border)"}`, transition:isDragging ? "none" : "border-color .2s", overflow:"hidden", userSelect:"none" }}
          >
            <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", pointerEvents:"none", fontSize:14, fontWeight:700, color:"var(--text2)" }}>
              {isClockedIn ? "Slide to Clock Out →" : "Slide to Clock In →"}
            </div>
            <div
              className={!isClockedIn && !isDragging ? "tc-thumb-idle" : ""}
              style={{
                position:"relative", zIndex:10, width:56, height:56,
                background: isClockedIn ? "#ef4444" : "#6366f1",
                borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center",
                color:"#fff", boxShadow:"0 4px 16px rgba(0,0,0,.2)",
                cursor: isDragging ? "grabbing" : "grab",
                transform:`translateX(${thumbX}px)`,
                transition: isDragging ? "none" : "transform .3s cubic-bezier(.16,1,.3,1), background .2s",
                touchAction:"none",
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <span className="material-symbols-outlined" style={{ fontSize:24 }}>arrow_forward</span>
            </div>
          </div>
          <div style={{ textAlign:"center", fontSize:13, color:"var(--text3)", marginTop:10 }}>
            Shift: 10:00 AM – 6:00 PM
          </div>
        </div>
      </div>

      {/* ── Weekly Strip ── */}
      <div style={{ marginBottom:20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <span style={{ fontSize:12, fontWeight:800, color:"var(--text)", letterSpacing:"0.08em", textTransform:"uppercase" }}>This Week&apos;s Activity</span>
          <button onClick={() => setAttModal(true)} style={{ fontSize:12, fontWeight:700, color:"#6366f1", background:"none", border:"none", cursor:"pointer" }}>
            View Month
          </button>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:8 }}>
          {weekDays.map((d, i) => {
            const ds     = toDs(d)
            const status = getDayStatus(ds, nowDs, isClockedIn)
            const color  = STATUS_COLOR[status]
            const bg     = STATUS_BG[status]
            const isToday   = ds === nowDs
            const isActive  = activeDay === ds
            const clickable = status !== "future" && status !== "off"

            return (
              <div
                key={ds}
                className="tc-day-card"
                onClick={() => clickable && setActiveDay(isActive ? null : ds)}
                style={{
                  background: isActive ? bg : "var(--bg2)",
                  border:`1px solid ${isActive ? color : "var(--border)"}`,
                  borderRadius:12, padding:"10px 6px", textAlign:"center",
                  cursor: clickable ? "pointer" : "default",
                  opacity: status === "future" ? 0.45 : 1,
                }}
              >
                <div style={{ fontSize:10, fontWeight:800, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.05em" }}>
                  {DAYS_SHORT[i]}
                </div>
                <div style={{ fontSize:17, fontWeight:900, color: isToday ? "#6366f1" : "var(--text)", margin:"4px 0" }}>
                  {d.getDate()}
                </div>
                <div style={{ width:8, height:8, borderRadius:"50%", background:color, margin:"0 auto", animation: status==="active" ? "tcPulse 2s infinite" : undefined }} />
              </div>
            )
          })}
        </div>

        {/* Day detail card */}
        {activeDay && MOCK[activeDay] && (() => {
          const entry  = MOCK[activeDay]
          const status = getDayStatus(activeDay, nowDs, isClockedIn)
          const color  = STATUS_COLOR[status]
          return (
            <div style={{ marginTop:12, background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:14, padding:"20px 20px 20px 28px", position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:0, left:0, width:4, height:"100%", background:color }} />
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <span style={{ fontSize:14, fontWeight:800, color:"var(--text)" }}>
                  {new Date(activeDay+"T00:00:00").toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}
                </span>
                <span style={chip(color)}>
                  {status === "active" ? "Active" : entry.status}
                </span>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px 24px" }}>
                {[
                  { label:"Shift",       val:"10:00 AM – 6:00 PM" },
                  { label:"Total Hours", val: entry.hours !== null ? fmtHrs(entry.hours) : (elapsed || "Active") },
                  { label:"Clock In",    val: fmtTime(entry.clockIn) },
                  { label:"Clock Out",   val: entry.clockOut ? fmtTime(entry.clockOut) : "Active" },
                ].map(({ label, val }) => (
                  <div key={label}>
                    <div style={{ fontSize:11, color:"var(--text3)", marginBottom:2 }}>{label}</div>
                    <div style={{ fontSize:14, fontWeight:700, color: label==="Clock Out" && !entry.clockOut ? "#10b981" : "var(--text)" }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          )
        })()}
      </div>

      {/* ── Stats Grid ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(196px,1fr))", gap:16, marginBottom:32 }}>

        {/* Weekly Hours */}
        <div style={card}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <span style={{ fontSize:12, fontWeight:800, color:"var(--text)", textTransform:"uppercase", letterSpacing:"0.06em" }}>Weekly Hours</span>
            <span className="material-symbols-outlined" style={{ fontSize:18, color:"#6366f1" }}>schedule</span>
          </div>
          <div style={{ display:"flex", alignItems:"flex-end", gap:4, marginBottom:4 }}>
            <span style={{ fontSize:32, fontWeight:900, color:"var(--text)", lineHeight:1 }}>{weeklyHours.toFixed(1)}</span>
            <span style={{ fontSize:13, color:"var(--text3)", paddingBottom:4 }}>/ 40h</span>
          </div>
          {weeklyHours > 40 && (
            <div style={{ fontSize:12, color:"#ef4444", display:"flex", alignItems:"center", gap:4, marginBottom:4 }}>
              <span className="material-symbols-outlined" style={{ fontSize:14 }}>warning</span>
              {(weeklyHours-40).toFixed(1)}h overtime
            </div>
          )}
          <div style={{ borderTop:"1px solid var(--border)", marginTop:12, paddingTop:12 }}>
            <button onClick={() => { setHoursModal(true); applyQuickRange("this_week") }}
              style={{ fontSize:11, fontWeight:800, color:"#6366f1", background:"none", border:"none", cursor:"pointer", letterSpacing:"0.08em", textTransform:"uppercase" }}>
              Breakdown
            </button>
          </div>
        </div>

        {/* Attendance */}
        <div style={card}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <span style={{ fontSize:12, fontWeight:800, color:"var(--text)", textTransform:"uppercase", letterSpacing:"0.06em" }}>Attendance</span>
            <span className="material-symbols-outlined" style={{ fontSize:18, color:"#68dba9" }}>trending_up</span>
          </div>
          <div style={{ marginBottom:4 }}>
            <span style={{ fontSize:32, fontWeight:900, color:"#68dba9", lineHeight:1 }}>{attPct}%</span>
          </div>
          <div style={{ borderTop:"1px solid var(--border)", marginTop:12, paddingTop:12, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:12, display:"flex", gap:10 }}>
              <span style={{ color:"#ef4444", fontWeight:700 }}>{attAbsent} Absent</span>
              <span style={{ color:"#f59e0b", fontWeight:700 }}>{attLate} Late</span>
            </span>
            <button onClick={() => setBreakModal(true)}
              style={{ fontSize:11, fontWeight:800, color:"#6366f1", background:"none", border:"none", cursor:"pointer", letterSpacing:"0.08em", textTransform:"uppercase" }}>
              Breakdown
            </button>
          </div>
        </div>

        {/* PTO */}
        <div style={card}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <span style={{ fontSize:12, fontWeight:800, color:"var(--text)", textTransform:"uppercase", letterSpacing:"0.06em" }}>PTO Hours</span>
            <span className="material-symbols-outlined" style={{ fontSize:18, color:"#6366f1" }}>flight_takeoff</span>
          </div>
          <div style={{ fontSize:32, fontWeight:900, color:"var(--text3)", lineHeight:1, opacity:.35 }}>--</div>
          <div style={{ fontSize:12, color:"var(--text3)", marginTop:10, opacity:.7 }}>Coming soon</div>
        </div>

        {/* Sick */}
        <div style={card}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <span style={{ fontSize:12, fontWeight:800, color:"var(--text)", textTransform:"uppercase", letterSpacing:"0.06em" }}>Sick Hours</span>
            <span className="material-symbols-outlined" style={{ fontSize:18, color:"#f59e0b" }}>medical_services</span>
          </div>
          <div style={{ fontSize:32, fontWeight:900, color:"var(--text3)", lineHeight:1, opacity:.35 }}>--</div>
          <div style={{ fontSize:12, color:"var(--text3)", marginTop:10, opacity:.7 }}>Coming soon</div>
        </div>
      </div>

      {/* ══════════ Attendance History Modal ══════════ */}
      {attModal && (
        <div className="crm-modal-overlay" onClick={e => { if (e.target===e.currentTarget) setAttModal(false) }}>
          <div className="crm-modal tc-modal-enter" style={{ maxWidth:680, padding:0, maxHeight:"90vh", display:"flex", flexDirection:"column" }}>
            {/* Header */}
            <div style={{ padding:"20px 24px 16px", borderBottom:"1px solid var(--border)", background:"var(--bg2)", flexShrink:0 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <h2 style={{ margin:0, fontSize:18, fontWeight:900, color:"var(--text)", display:"flex", alignItems:"center", gap:8 }}>
                    <span className="material-symbols-outlined" style={{ color:"#6366f1" }}>bar_chart</span>
                    Attendance History
                  </h2>
                  <div style={{ fontSize:13, fontWeight:700, color:"#6366f1", marginTop:3 }}>
                    {new Date(attMonth.year, attMonth.month).toLocaleDateString("en-US",{month:"long",year:"numeric"})}
                  </div>
                </div>
                <div style={{ display:"flex", gap:6 }}>
                  <button style={{ ...btnClose, borderRadius:8, border:"1px solid var(--border)" }} onClick={() => setAttMonth(({ year, month }) => month===0 ? {year:year-1,month:11} : {year,month:month-1})}>
                    <span className="material-symbols-outlined" style={{ fontSize:18 }}>chevron_left</span>
                  </button>
                  <button style={{ ...btnClose, borderRadius:8, border:"1px solid var(--border)" }} onClick={() => setAttMonth(({ year, month }) => month===11 ? {year:year+1,month:0} : {year,month:month+1})}>
                    <span className="material-symbols-outlined" style={{ fontSize:18 }}>chevron_right</span>
                  </button>
                  <button style={btnClose} onClick={() => setAttModal(false)}>
                    <span className="material-symbols-outlined" style={{ fontSize:18 }}>close</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Body */}
            <div style={{ overflowY:"auto", flex:1 }}>
              {/* Stats strip */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:8, padding:"14px 24px", borderBottom:"1px solid var(--border)", background:"var(--bg3)" }}>
                {([
                  { label:"Rate",      value:`${attStats.rate}%`,               color:"#10b981" },
                  { label:"Worked",    value:String(attStats.worked),           color:"var(--text)" },
                  { label:"Late",      value:String(attStats.late),             color:"#f59e0b" },
                  { label:"Absent",    value:String(attStats.absent),           color:"#ef4444" },
                  { label:"Total Hrs", value:attStats.totalHours.toFixed(1),    color:"#6366f1" },
                  { label:"Avg/Day",   value:`${attStats.avg.toFixed(1)}h`,     color:"var(--text)" },
                ] as const).map(s => (
                  <div key={s.label} style={{ background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:10, padding:"8px 4px", textAlign:"center" }}>
                    <div style={{ fontSize:9, fontWeight:800, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.1em" }}>{s.label}</div>
                    <div style={{ fontSize:18, fontWeight:900, color:s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div style={{ padding:"10px 24px", display:"flex", gap:16, flexWrap:"wrap" }}>
                {([ ["#10b981","Worked"], ["#f59e0b","Late"], ["#ef4444","Absent"], ["var(--text3)","Off"] ] as [string,string][]).map(([color,label]) => (
                  <div key={label} style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, fontWeight:700, color:"var(--text3)", textTransform:"uppercase" }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:color }} />
                    {label}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div style={{ padding:"0 24px 16px" }}>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4, marginBottom:8 }}>
                  {["SUN","MON","TUE","WED","THU","FRI","SAT"].map(d => (
                    <div key={d} style={{ textAlign:"center", fontSize:10, fontWeight:800, color:"var(--text3)" }}>{d}</div>
                  ))}
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4 }}>
                  {calCells.map((d, i) => {
                    if (!d) return <div key={i} />
                    const ds     = toDs(d)
                    const status = getDayStatus(ds, nowDs, isClockedIn)
                    const color  = STATUS_COLOR[status]
                    const bg     = STATUS_BG[status]
                    const future = status === "future"
                    const off    = isWeekend(d)
                    return (
                      <div key={ds} style={{ aspectRatio:"1", borderRadius:8, background: future||off ? "transparent" : bg, border:`1px solid ${future ? "transparent" : off ? "var(--border)" : color+"40"}`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", opacity: future ? 0.3 : 1 }}>
                        <span style={{ fontSize:12, fontWeight:800, color: ds===nowDs ? "#6366f1" : "var(--text)" }}>{d.getDate()}</span>
                        {!future && !off && <div style={{ width:5, height:5, borderRadius:"50%", background:color, marginTop:2 }} />}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Daily log */}
              <div style={{ padding:"12px 24px 28px", borderTop:"1px solid var(--border)" }}>
                <div style={{ fontSize:11, fontWeight:800, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:12 }}>Daily Log</div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {Object.values(MOCK)
                    .filter(tc => { const d = new Date(tc.clockIn); return d.getFullYear()===attMonth.year && d.getMonth()===attMonth.month })
                    .sort((a,b) => new Date(a.clockIn).getTime()-new Date(b.clockIn).getTime())
                    .map(tc => (
                      <div key={tc.date} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:10 }}>
                        <div>
                          <div style={{ fontSize:13, fontWeight:700, color:"var(--text)", display:"flex", alignItems:"center", gap:6 }}>
                            {new Date(tc.clockIn).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}
                            {tc.status==="Late" && <span style={chip("#b45309")}>Late</span>}
                          </div>
                          <div style={{ fontSize:12, color:"var(--text3)", marginTop:2 }}>
                            In: {fmtTime(tc.clockIn)} · Out: {tc.clockOut ? fmtTime(tc.clockOut) : <span style={{ color:"#10b981" }}>Active</span>}
                          </div>
                        </div>
                        <div style={{ fontSize:18, fontWeight:900, color:"var(--text)" }}>
                          {tc.hours !== null ? `${tc.hours.toFixed(2)}h` : elapsed}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding:"12px 24px", borderTop:"1px solid var(--border)", display:"flex", justifyContent:"flex-end", background:"var(--bg2)", flexShrink:0 }}>
              <button onClick={() => setAttModal(false)} style={{ padding:"8px 20px", background:"var(--bg3)", border:"none", borderRadius:10, fontSize:13, fontWeight:700, color:"var(--text2)", cursor:"pointer" }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ Hours Breakdown Modal ══════════ */}
      {hoursModal && (
        <div className="crm-modal-overlay" onClick={e => { if (e.target===e.currentTarget) setHoursModal(false) }}>
          <div className="crm-modal tc-modal-enter" style={{ maxWidth:540, padding:0, maxHeight:"90vh", display:"flex", flexDirection:"column" }}>
            <div style={{ padding:"20px 24px", borderBottom:"1px solid var(--border)", background:"var(--bg2)", flexShrink:0 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                <h2 style={{ margin:0, fontSize:18, fontWeight:900, color:"var(--text)", display:"flex", alignItems:"center", gap:8 }}>
                  <span className="material-symbols-outlined" style={{ color:"#6366f1" }}>analytics</span>
                  Timecard Reports
                </h2>
                <button style={btnClose} onClick={() => setHoursModal(false)}>
                  <span className="material-symbols-outlined" style={{ fontSize:18 }}>close</span>
                </button>
              </div>

              {/* Range controls */}
              <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"flex-end" }}>
                <div style={{ flex:"1 1 100px" }}>
                  <div style={{ fontSize:10, fontWeight:800, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:4 }}>Quick Range</div>
                  <select value={reportRange} onChange={e => applyQuickRange(e.target.value)} style={{ width:"100%", fontSize:13, background:"var(--bg)", border:"1px solid var(--border)", borderRadius:8, padding:"7px 10px", color:"var(--text)", outline:"none", fontFamily:"inherit" }}>
                    <option value="this_week">This Week</option>
                    <option value="last_week">Last Week</option>
                    <option value="this_month">This Month</option>
                    <option value="last_month">Last Month</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>
                <div style={{ flex:"1 1 110px" }}>
                  <div style={{ fontSize:10, fontWeight:800, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:4 }}>Start</div>
                  <input type="date" value={reportStart} onChange={e => { setReportStart(e.target.value); setReportRange("custom") }} style={{ width:"100%", fontSize:13, background:"var(--bg)", border:"1px solid var(--border)", borderRadius:8, padding:"7px 10px", color:"var(--text)", outline:"none", fontFamily:"inherit", boxSizing:"border-box" }} />
                </div>
                <div style={{ flex:"1 1 110px" }}>
                  <div style={{ fontSize:10, fontWeight:800, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:4 }}>End</div>
                  <input type="date" value={reportEnd} onChange={e => { setReportEnd(e.target.value); setReportRange("custom") }} style={{ width:"100%", fontSize:13, background:"var(--bg)", border:"1px solid var(--border)", borderRadius:8, padding:"7px 10px", color:"var(--text)", outline:"none", fontFamily:"inherit", boxSizing:"border-box" }} />
                </div>
              </div>
            </div>

            <div style={{ overflowY:"auto", flex:1, padding:24, background:"var(--bg)" }}>
              {reportEntries.length > 0 ? (
                <>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:20 }}>
                    {[
                      { label:"Total Hours", value:reportTotal.toFixed(1), color:"#6366f1", bg:"rgba(99,102,241,.08)", border:"rgba(99,102,241,.2)" },
                      { label:"Shifts",      value:String(reportEntries.length), color:"var(--text)", bg:"var(--bg2)", border:"var(--border)" },
                      { label:"Avg/Shift",   value:`${(reportTotal/reportEntries.length).toFixed(1)}h`, color:"var(--text)", bg:"var(--bg2)", border:"var(--border)" },
                    ].map(s => (
                      <div key={s.label} style={{ background:s.bg, border:`1px solid ${s.border}`, borderRadius:12, padding:14, textAlign:"center" }}>
                        <div style={{ fontSize:10, fontWeight:800, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:4 }}>{s.label}</div>
                        <div style={{ fontSize:24, fontWeight:900, color:s.color }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize:11, fontWeight:800, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:10 }}>Daily Log</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {reportEntries.map(tc => {
                      const hrs = tc.hours !== null ? tc.hours : isClockedIn ? (now.getTime()-new Date(tc.clockIn).getTime())/3_600_000 : 0
                      return (
                        <div key={tc.date} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:12 }}>
                          <div>
                            <div style={{ fontSize:13, fontWeight:700, color:"var(--text)", display:"flex", alignItems:"center", gap:6 }}>
                              {new Date(tc.clockIn).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}
                              {tc.status==="Late"   && <span style={chip("#b45309")}>Late</span>}
                              {!tc.clockOut         && <span style={chip("#059669")}>Active</span>}
                            </div>
                            <div style={{ fontSize:12, color:"var(--text3)", marginTop:2 }}>
                              In: {fmtTime(tc.clockIn)} · Out: {tc.clockOut ? fmtTime(tc.clockOut) : "Active"}
                            </div>
                          </div>
                          <div style={{ fontSize:20, fontWeight:900, color:"var(--text)" }}>{hrs.toFixed(2)}h</div>
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : (
                <div style={{ textAlign:"center", padding:"48px 20px", color:"var(--text3)", fontSize:14, fontWeight:600 }}>
                  No shifts found for this period.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════ Attendance Breakdown Modal ══════════ */}
      {breakModal && (
        <div className="crm-modal-overlay" onClick={e => { if (e.target===e.currentTarget) setBreakModal(false) }}>
          <div className="crm-modal tc-modal-enter" style={{ maxWidth:460, padding:0, maxHeight:"85vh", display:"flex", flexDirection:"column" }}>
            <div style={{ padding:"20px 24px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center", background:"var(--bg2)", flexShrink:0 }}>
              <h2 style={{ margin:0, fontSize:18, fontWeight:900, color:"var(--text)", display:"flex", alignItems:"center", gap:8 }}>
                <span className="material-symbols-outlined" style={{ color:"#6366f1" }}>trending_up</span>
                Attendance Breakdown
              </h2>
              <button style={btnClose} onClick={() => setBreakModal(false)}>
                <span className="material-symbols-outlined" style={{ fontSize:18 }}>close</span>
              </button>
            </div>
            <div style={{ overflowY:"auto", flex:1, padding:24 }}>
              <div style={{ fontSize:12, fontWeight:700, color:"var(--text2)", textTransform:"uppercase", letterSpacing:"0.08em", textAlign:"center", marginBottom:16 }}>Current Week</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {weekDays.filter(d => !isWeekend(d)).map(d => {
                  const ds     = toDs(d)
                  const status = getDayStatus(ds, nowDs, isClockedIn)
                  const color  = STATUS_COLOR[status]
                  const entry  = MOCK[ds]
                  const label  = status==="active" ? "Active" : status==="worked" ? "On Time" : status==="late" ? "Late" : status==="absent" ? "Absent" : "Upcoming"
                  return (
                    <div key={ds} style={{ display:"flex", alignItems:"center", padding:"12px 16px", background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:12, gap:12 }}>
                      <div style={{ width:8, height:8, borderRadius:"50%", background:color, flexShrink:0 }} />
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:700, color:"var(--text)" }}>
                          {d.toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"})}
                        </div>
                        <div style={{ fontSize:12, color:"var(--text3)", marginTop:2 }}>
                          {entry ? `${fmtTime(entry.clockIn)} – ${entry.clockOut ? fmtTime(entry.clockOut) : "Active"}` : status==="future" ? "Upcoming" : "No record"}
                        </div>
                      </div>
                      <span style={chip(color)}>{label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
