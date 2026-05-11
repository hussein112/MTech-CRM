"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { getSupabaseBrowser } from "@/lib/supabase-browser"

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewType     = "day" | "week" | "month"
type EventType    = "Event" | "Appointment" | "Reminder" | "Time Off" | "Task"
type CategoryType = "Event" | "Appointment" | "Reminder" | "Time Off"

interface CalEvent {
  id:          string
  type:        EventType
  title:       string
  dateStr:     string   // YYYY-MM-DD
  startHour:   number
  startMin:    number
  endHour:     number
  endMin:      number
  location?:   string
  merchant?:   string
  assignee?:   string
  priority?:   string
  notes?:      string
  createdBy?:  string
  // layout (computed)
  _col?:     number
  _numCols?: number
}

interface FormState {
  title:     string
  dateStr:   string
  startHour: number
  startMin:  number
  endHour:   number
  endMin:    number
  location:  string
  merchant:  string
  assignee:  string
  priority:  string
  notes:     string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const HOUR_HEIGHT = 80   // px per hour in time grid
const DAY_NAMES   = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const TYPE_COLOR: Record<string, { main: string; light: string }> = {
  Event:       { main: "#6366f1", light: "rgba(99,102,241,.14)"  },
  Appointment: { main: "#6366f1", light: "rgba(99,102,241,.14)"  },
  Reminder:    { main: "#f59e0b", light: "rgba(245,158,11,.14)"  },
  "Time Off":  { main: "#ef4444", light: "rgba(239,68,68,.14)"   },
  Task:        { main: "#8b5cf6", light: "rgba(139,92,246,.14)"  },
}

function ds(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`
}
function todayStr() { return ds(new Date()) }

function fmtHour(h: number, m: number) {
  const ap = h < 12 ? "AM" : "PM"
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${h12}:${String(m).padStart(2,"0")} ${ap}`
}
function fmtAxisLabel(h: number) {
  if (h === 0)  return "12 AM"
  if (h < 12)  return `${h} AM`
  if (h === 12) return "12 PM"
  return `${h - 12} PM`
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const today = new Date()
const MOCK_EVENTS: CalEvent[] = [
  { id:"m1", type:"Event",       title:"Team Stand-up",          dateStr:ds(today),                                                        startHour:9,  startMin:0,  endHour:9,  endMin:30,  notes:"Daily sync",                createdBy:"Admin" },
  { id:"m2", type:"Appointment", title:"Merchant Onboarding Call",dateStr:ds(today),                                                        startHour:11, startMin:0,  endHour:12, endMin:0,   merchant:"Pinnacle Sports Bar",    assignee:"Derek Foss", createdBy:"Admin" },
  { id:"m3", type:"Reminder",    title:"Submit Monthly Report",   dateStr:ds(new Date(today.getFullYear(),today.getMonth(),today.getDate()+1)), startHour:10, startMin:0, endHour:10, endMin:30,  notes:"Due EOD",                   createdBy:"Admin" },
  { id:"m4", type:"Time Off",    title:"Team Offsite",            dateStr:ds(new Date(today.getFullYear(),today.getMonth(),today.getDate()+3)), startHour:0,  startMin:0, endHour:23, endMin:59,                                    createdBy:"Admin" },
  { id:"m5", type:"Event",       title:"Product Review",          dateStr:ds(new Date(today.getFullYear(),today.getMonth(),today.getDate()-1)),startHour:14, startMin:0, endHour:15, endMin:0,   location:"Conference Room B",      createdBy:"Admin" },
  { id:"m6", type:"Appointment", title:"PAX Terminal Setup",      dateStr:ds(today),                                                        startHour:13, startMin:30, endHour:14, endMin:30,  merchant:"Fieldstone Bakery",      assignee:"Sarah Kim",  createdBy:"Admin" },
]

// ─── Shared styles ────────────────────────────────────────────────────────────

const iSt: React.CSSProperties = {
  width:"100%", padding:"9px 12px", background:"var(--bg3)",
  border:"1px solid var(--border)", borderRadius:8, color:"var(--text)",
  fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box",
}
const lblSt: React.CSSProperties = {
  display:"block", fontSize:11, fontWeight:700, color:"var(--text3)",
  textTransform:"uppercase", letterSpacing:".5px", marginBottom:5,
}
const HOURS   = Array.from({ length:24 }, (_,i) => i)
const MINUTES = [0, 15, 30, 45]

// ─── Main Component ───────────────────────────────────────────────────────────

export function CalendarClient() {
  const [view,     setView]     = useState<ViewType>("month")
  const [base,     setBase]     = useState(() => new Date())
  const [events,   setEvents]   = useState<CalEvent[]>(MOCK_EVENTS)
  const [loading,  setLoading]  = useState(false)

  // Modals
  const [createOpen,   setCreateOpen]   = useState(false)
  const [viewOpen,     setViewOpen]     = useState(false)
  const [viewEvt,      setViewEvt]      = useState<CalEvent | null>(null)
  const [editingId,    setEditingId]    = useState<string | null>(null)
  const [category,     setCategory]     = useState<CategoryType>("Event")
  const [delConfirm,   setDelConfirm]   = useState(false)
  const [form,         setForm]         = useState<FormState>({
    title:"", dateStr:todayStr(), startHour:9, startMin:0, endHour:10, endMin:0,
    location:"", merchant:"", assignee:"", priority:"Medium", notes:"",
  })

  const scrollRef = useRef<HTMLDivElement>(null)

  // ── Load from Supabase ──
  useEffect(() => {
    async function load() {
      const db = getSupabaseBrowser()
      if (!db) return
      setLoading(true)
      try {
        const { data } = await db.from("portal_calendar_events").select("*")
        if (data && data.length > 0) {
          setEvents(data.map((r: Record<string,unknown>) => ({
            id:        String(r.id),
            type:      (r.type  as EventType) || "Event",
            title:     String(r.title || ""),
            dateStr:   String(r.date_str || ""),
            startHour: Number(r.start_hour ?? 9),
            startMin:  Number(r.start_min  ?? 0),
            endHour:   Number(r.end_hour   ?? 10),
            endMin:    Number(r.end_min    ?? 0),
            location:  r.location  ? String(r.location)  : undefined,
            merchant:  r.merchant  ? String(r.merchant)  : undefined,
            assignee:  r.assignee  ? String(r.assignee)  : undefined,
            priority:  r.priority  ? String(r.priority)  : undefined,
            notes:     r.notes     ? String(r.notes)     : undefined,
            createdBy: r.created_by? String(r.created_by): undefined,
          })))
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // ── Scroll to 8 AM when switching to grid view ──
  useEffect(() => {
    if (view !== "month" && scrollRef.current) {
      scrollRef.current.scrollTop = 8 * HOUR_HEIGHT - 20
    }
  }, [view, base])

  // ── ESC closes modals ──
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      if (createOpen) { setCreateOpen(false); return }
      if (viewOpen)   { setViewOpen(false) }
    }
    window.addEventListener("keydown", h)
    return () => window.removeEventListener("keydown", h)
  }, [createOpen, viewOpen])

  // ── Navigation ──
  function navigate(dir: 1 | -1) {
    setBase(prev => {
      const d = new Date(prev)
      if (view === "day")   d.setDate(d.getDate()    + dir)
      if (view === "week")  d.setDate(d.getDate()    + dir * 7)
      if (view === "month") d.setMonth(d.getMonth()  + dir)
      return d
    })
  }

  // ── Header title ──
  const headerTitle = useMemo(() => {
    if (view === "month") return base.toLocaleDateString("en-US", { month:"long", year:"numeric" })
    if (view === "day")   return base.toLocaleDateString("en-US", { weekday:"long", month:"short", day:"numeric", year:"numeric" })
    const ws = new Date(base); ws.setDate(ws.getDate() - ws.getDay())
    const we = new Date(ws);   we.setDate(we.getDate() + 6)
    return `${ws.toLocaleDateString("en-US",{month:"short",day:"numeric"})} – ${we.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}`
  }, [view, base])

  // ── Open create ──
  function openCreate(prefillDate?: string) {
    setEditingId(null); setCategory("Event"); setDelConfirm(false)
    setForm({ title:"", dateStr: prefillDate || todayStr(), startHour:9, startMin:0, endHour:10, endMin:0, location:"", merchant:"", assignee:"", priority:"Medium", notes:"" })
    setCreateOpen(true)
  }

  // ── Open view ──
  function openView(evt: CalEvent) { setViewEvt(evt); setDelConfirm(false); setViewOpen(true) }

  // ── Start edit from view modal ──
  function startEdit() {
    if (!viewEvt) return
    setEditingId(viewEvt.id)
    setCategory(viewEvt.type === "Task" ? "Event" : viewEvt.type as CategoryType)
    setForm({
      title:     viewEvt.title,        dateStr:   viewEvt.dateStr,
      startHour: viewEvt.startHour,    startMin:  viewEvt.startMin,
      endHour:   viewEvt.endHour,      endMin:    viewEvt.endMin,
      location:  viewEvt.location  || "", merchant: viewEvt.merchant || "",
      assignee:  viewEvt.assignee  || "", priority: viewEvt.priority || "Medium",
      notes:     viewEvt.notes     || "",
    })
    setViewOpen(false); setCreateOpen(true)
  }

  // ── Save ──
  async function saveEvent() {
    if (!form.title.trim()) return
    const payload: CalEvent = {
      id: editingId || Date.now().toString(), type: category,
      title: form.title.trim(), dateStr: form.dateStr,
      startHour: form.startHour, startMin: form.startMin,
      endHour: form.endHour, endMin: form.endMin,
      location: form.location || undefined, merchant: form.merchant || undefined,
      assignee: form.assignee || undefined, priority: form.priority || undefined,
      notes: form.notes || undefined, createdBy: "You",
    }
    if (editingId) {
      setEvents(es => es.map(e => e.id === editingId ? payload : e))
    } else {
      setEvents(es => [payload, ...es])
    }
    // Persist to Supabase
    const db = getSupabaseBrowser()
    if (db) {
      const row = {
        type: payload.type, title: payload.title, date_str: payload.dateStr,
        start_hour: payload.startHour, start_min: payload.startMin,
        end_hour: payload.endHour, end_min: payload.endMin,
        location: payload.location, merchant: payload.merchant,
        assignee: payload.assignee, priority: payload.priority,
        notes: payload.notes, created_by: payload.createdBy,
      }
      if (editingId) {
        await db.from("portal_calendar_events").update(row).eq("id", editingId)
      } else {
        const { data } = await db.from("portal_calendar_events").insert(row).select("id").single()
        if (data) setEvents(es => es.map(e => e.title === payload.title && e.dateStr === payload.dateStr ? { ...e, id: String(data.id) } : e))
      }
    }
    setCreateOpen(false)
  }

  // ── Delete ──
  async function deleteEvent() {
    if (!viewEvt) return
    setEvents(es => es.filter(e => e.id !== viewEvt.id))
    const db = getSupabaseBrowser()
    if (db) await db.from("portal_calendar_events").delete().eq("id", viewEvt.id)
    setViewOpen(false)
  }

  // Current time indicator
  const nowDate = new Date()
  const nowTop  = nowDate.getHours() * HOUR_HEIGHT + (nowDate.getMinutes() / 60) * HOUR_HEIGHT
  const nowDs   = ds(nowDate)

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 56px)", fontFamily:"'Mulish', sans-serif", overflow:"hidden" }}>

      {/* ── Calendar Header ── */}
      <header style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px", height:58, background:"var(--bg2)", borderBottom:"1px solid var(--border)", flexShrink:0, gap:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>

          {/* Prev / Next */}
          <div style={{ display:"flex", alignItems:"center", border:"1px solid var(--border)", borderRadius:20, overflow:"hidden", background:"var(--bg)" }}>
            <button onClick={() => navigate(-1)} style={{ width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", background:"none", border:"none", cursor:"pointer", color:"var(--text3)" }}>
              <span className="material-symbols-outlined" style={{ fontSize:20 }}>chevron_left</span>
            </button>
            <div style={{ width:1, height:14, background:"var(--border)" }} />
            <button onClick={() => navigate(1)} style={{ width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", background:"none", border:"none", cursor:"pointer", color:"var(--text3)" }}>
              <span className="material-symbols-outlined" style={{ fontSize:20 }}>chevron_right</span>
            </button>
          </div>

          {/* Title */}
          <h2 style={{ margin:0, fontSize:17, fontWeight:800, color:"var(--text)", whiteSpace:"nowrap" }}>{headerTitle}</h2>

          {/* Today shortcut */}
          <button
            onClick={() => setBase(new Date())}
            style={{ padding:"4px 12px", fontSize:12, fontWeight:700, borderRadius:14, border:"1px solid var(--border)", background:"var(--bg)", color:"var(--text2)", cursor:"pointer" }}
          >Today</button>

          {/* View toggle */}
          <div style={{ display:"flex", gap:2, padding:3, background:"var(--bg3)", borderRadius:18, border:"1px solid var(--border)" }}>
            {(["day","week","month"] as ViewType[]).map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding:"4px 14px", fontSize:12, fontWeight:700, borderRadius:14, border:"none", cursor:"pointer",
                textTransform:"capitalize", transition:".15s",
                background: view === v ? "var(--bg2)" : "transparent",
                color:      view === v ? "var(--text)" : "var(--text3)",
                boxShadow:  view === v ? "0 1px 4px rgba(0,0,0,.1)" : "none",
              }}>
                {v.charAt(0).toUpperCase()+v.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {loading && <span style={{ fontSize:12, color:"var(--text3)" }}>Loading…</span>}
          <button onClick={() => openCreate()} style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 18px", background:"var(--accent-crm)", color:"#fff", border:"none", borderRadius:18, fontSize:13, fontWeight:700, cursor:"pointer" }}>
            <span className="material-symbols-outlined" style={{ fontSize:18 }}>add</span>
            Create
          </button>
        </div>
      </header>

      {/* ── Calendar Body ── */}
      <div style={{ flex:1, overflow:"hidden" }}>
        {view === "month"
          ? <MonthView  events={events} base={base} onEventClick={openView} onDayClick={openCreate} />
          : <TimeGrid   events={events} view={view} base={base} scrollRef={scrollRef} nowTop={nowTop} nowDs={nowDs} onEventClick={openView} onDayClick={openCreate} />
        }
      </div>

      {/* ── Create / Edit Modal ── */}
      {createOpen && (
        <div className="crm-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setCreateOpen(false) }}>
          <div className="crm-modal" style={{ width:"100%", maxWidth:520, padding:0, overflow:"hidden" }}>

            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 24px", borderBottom:"1px solid var(--border)" }}>
              <h3 style={{ margin:0, fontSize:16, fontWeight:800, color:"var(--text)" }}>{editingId ? "Edit Event" : "New Event"}</h3>
              <button onClick={() => setCreateOpen(false)} style={{ background:"var(--bg3)", border:"none", width:30, height:30, borderRadius:8, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <span className="material-symbols-outlined" style={{ fontSize:18, color:"var(--text3)" }}>close</span>
              </button>
            </div>

            {/* Category tabs */}
            <div style={{ padding:"14px 24px 0" }}>
              <div style={{ display:"flex", gap:3, padding:3, background:"var(--bg3)", borderRadius:10, border:"1px solid var(--border)" }}>
                {(["Event","Appointment","Reminder","Time Off"] as CategoryType[]).map(cat => (
                  <button key={cat} onClick={() => setCategory(cat)} style={{
                    flex:1, padding:"5px 6px", fontSize:11, fontWeight:700, textTransform:"uppercase",
                    letterSpacing:".4px", borderRadius:7, border:"none", cursor:"pointer", whiteSpace:"nowrap", transition:".15s",
                    background: category === cat ? "var(--bg2)" : "transparent",
                    color:      category === cat ? "var(--text)" : "var(--text3)",
                    boxShadow:  category === cat ? "0 1px 4px rgba(0,0,0,.08)" : "none",
                  }}>
                    {cat === "Appointment" ? "Appt." : cat}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ padding:"18px 24px", display:"flex", flexDirection:"column", gap:13, overflowY:"auto", maxHeight:"56vh" }}>
              <EventForm form={form} setForm={setForm} category={category} />
            </div>

            <div style={{ padding:"14px 24px", borderTop:"1px solid var(--border)", display:"flex", justifyContent:"flex-end", gap:10, background:"var(--bg3)" }}>
              <button onClick={() => setCreateOpen(false)} style={{ padding:"9px 18px", background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:9, fontSize:13, fontWeight:700, color:"var(--text2)", cursor:"pointer" }}>Cancel</button>
              <button onClick={saveEvent} style={{ padding:"9px 20px", background:"var(--accent-crm)", color:"#fff", border:"none", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer" }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* ── View Event Modal ── */}
      {viewOpen && viewEvt && (
        <div className="crm-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setViewOpen(false) }}>
          <div className="crm-modal" style={{ width:"100%", maxWidth:380, padding:0, overflow:"hidden" }}>

            <div style={{ padding:"20px 24px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
              <div>
                <span style={{
                  display:"inline-block", padding:"2px 8px", borderRadius:5, marginBottom:6,
                  fontSize:10, fontWeight:800, textTransform:"uppercase", letterSpacing:".5px",
                  background: TYPE_COLOR[viewEvt.type]?.light || "var(--bg3)",
                  color:      TYPE_COLOR[viewEvt.type]?.main  || "var(--text3)",
                }}>{viewEvt.type}</span>
                <h3 style={{ margin:0, fontSize:18, fontWeight:800, color:"var(--text)", lineHeight:1.2 }}>{viewEvt.title}</h3>
              </div>
              <button onClick={() => setViewOpen(false)} style={{ background:"var(--bg3)", border:"none", width:30, height:30, borderRadius:8, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:-2 }}>
                <span className="material-symbols-outlined" style={{ fontSize:18, color:"var(--text3)" }}>close</span>
              </button>
            </div>

            <div style={{ padding:"18px 24px", display:"flex", flexDirection:"column", gap:13 }}>
              <VRow icon="calendar_today" text={new Date(viewEvt.dateStr+"T12:00:00").toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})} />
              <VRow icon="schedule"       text={`${fmtHour(viewEvt.startHour,viewEvt.startMin)} – ${fmtHour(viewEvt.endHour,viewEvt.endMin)}`} />
              {viewEvt.location && <VRow icon="location_on"  text={viewEvt.location} />}
              {viewEvt.merchant && <VRow icon="storefront"   text={viewEvt.merchant} />}
              {viewEvt.assignee && <VRow icon="person"       text={viewEvt.assignee} />}
              {viewEvt.priority && <VRow icon="flag"         text={`Priority: ${viewEvt.priority}`} />}
              {viewEvt.notes    && <VRow icon="notes"        text={viewEvt.notes}    />}
              <div style={{ borderTop:"1px solid var(--border)", paddingTop:10 }}>
                <VRow icon="account_circle" text={`Created by ${viewEvt.createdBy || "System"}`} muted />
              </div>
            </div>

            <div style={{ padding:"12px 24px", borderTop:"1px solid var(--border)", display:"flex", alignItems:"center", background:"var(--bg3)", gap:8 }}>
              {!delConfirm ? (
                <button onClick={() => setDelConfirm(true)} style={{ marginRight:"auto", padding:"7px 14px", background:"rgba(239,68,68,.1)", border:"none", borderRadius:8, fontSize:12, fontWeight:700, color:"#ef4444", cursor:"pointer" }}>Delete</button>
              ) : (
                <div style={{ marginRight:"auto", display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:12, fontWeight:700, color:"#ef4444" }}>Delete?</span>
                  <button onClick={deleteEvent} style={{ padding:"5px 12px", background:"#ef4444", color:"#fff", border:"none", borderRadius:7, fontSize:12, fontWeight:700, cursor:"pointer" }}>Yes</button>
                  <button onClick={() => setDelConfirm(false)} style={{ padding:"5px 10px", background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:7, fontSize:12, fontWeight:700, color:"var(--text2)", cursor:"pointer" }}>No</button>
                </div>
              )}
              <button onClick={startEdit} style={{ padding:"8px 14px", background:"transparent", border:"none", borderRadius:8, fontSize:13, fontWeight:700, color:"var(--accent-crm)", cursor:"pointer" }}>Edit</button>
              <button onClick={() => setViewOpen(false)} style={{ padding:"8px 16px", background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:8, fontSize:13, fontWeight:700, color:"var(--text2)", cursor:"pointer" }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── View row helper ──────────────────────────────────────────────────────────

function VRow({ icon, text, muted=false }: { icon:string; text:string; muted?:boolean }) {
  return (
    <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
      <span className="material-symbols-outlined" style={{ fontSize:18, color:"var(--text3)", flexShrink:0, marginTop:1 }}>{icon}</span>
      <p style={{ margin:0, fontSize:13, fontWeight: muted ? 500 : 600, color: muted ? "var(--text3)" : "var(--text)", lineHeight:1.5 }}>{text}</p>
    </div>
  )
}

// ─── Event form ───────────────────────────────────────────────────────────────

function EventForm({ form, setForm, category }: {
  form: FormState
  setForm: React.Dispatch<React.SetStateAction<FormState>>
  category: CategoryType
}) {
  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm(s => ({ ...s, [k]: v }))
  }
  return (
    <>
      <div>
        <label style={lblSt}>{category} Title *</label>
        <input type="text" value={form.title} onChange={e => set("title",e.target.value)}
          placeholder={category==="Event"?"Team Meeting":category==="Appointment"?"Client Call":category==="Reminder"?"Review tickets":"Company Offsite"}
          style={iSt} />
      </div>

      <div style={{ display:"flex", gap:12 }}>
        <div style={{ flex:1 }}>
          <label style={lblSt}>Date</label>
          <input type="date" value={form.dateStr} onChange={e => set("dateStr",e.target.value)} style={iSt} />
        </div>
        {category !== "Time Off" && (
          <div style={{ flex:1 }}>
            <label style={lblSt}>Priority</label>
            <select value={form.priority} onChange={e => set("priority",e.target.value)} style={iSt}>
              <option>Low</option><option>Medium</option><option>High</option>
            </select>
          </div>
        )}
      </div>

      {category !== "Time Off" && (
        <div style={{ display:"flex", gap:12 }}>
          <div style={{ flex:1 }}>
            <label style={lblSt}>Start</label>
            <TimePicker h={form.startHour} m={form.startMin} onChange={(h,mn) => { set("startHour",h); set("startMin",mn) }} />
          </div>
          <div style={{ flex:1 }}>
            <label style={lblSt}>End</label>
            <TimePicker h={form.endHour} m={form.endMin} onChange={(h,mn) => { set("endHour",h); set("endMin",mn) }} />
          </div>
        </div>
      )}

      {category === "Appointment" && <>
        <div>
          <label style={lblSt}>Merchant</label>
          <input type="text" value={form.merchant} onChange={e => set("merchant",e.target.value)} placeholder="Merchant name or MID" style={iSt} />
        </div>
        <div>
          <label style={lblSt}>Assignee</label>
          <input type="text" value={form.assignee} onChange={e => set("assignee",e.target.value)} placeholder="Team member" style={iSt} />
        </div>
      </>}

      {(category === "Event") && (
        <div>
          <label style={lblSt}>Location</label>
          <input type="text" value={form.location} onChange={e => set("location",e.target.value)} placeholder="Room, address, or link" style={iSt} />
        </div>
      )}

      <div>
        <label style={lblSt}>Notes</label>
        <textarea value={form.notes} onChange={e => set("notes",e.target.value)} placeholder="Optional notes…" rows={2}
          style={{ ...iSt, resize:"vertical", minHeight:56 } as React.CSSProperties} />
      </div>
    </>
  )
}

function TimePicker({ h, m, onChange }: { h:number; m:number; onChange:(h:number,m:number)=>void }) {
  return (
    <div style={{ display:"flex", gap:6 }}>
      <select value={h} onChange={e => onChange(Number(e.target.value),m)} style={{ ...iSt, flex:1 }}>
        {HOURS.map(x => <option key={x} value={x}>{x===0?"12 AM":x<12?`${x} AM`:x===12?"12 PM":`${x-12} PM`}</option>)}
      </select>
      <select value={m} onChange={e => onChange(h,Number(e.target.value))} style={{ ...iSt, width:60, flex:"none" }}>
        {MINUTES.map(x => <option key={x} value={x}>{String(x).padStart(2,"0")}</option>)}
      </select>
    </div>
  )
}

// ─── Month View ───────────────────────────────────────────────────────────────

function MonthView({ events, base, onEventClick, onDayClick }: {
  events:       CalEvent[]
  base:         Date
  onEventClick: (e:CalEvent) => void
  onDayClick:   (d:string)   => void
}) {
  const today    = todayStr()
  const firstDay = new Date(base.getFullYear(), base.getMonth(), 1)
  const lastDay  = new Date(base.getFullYear(), base.getMonth()+1, 0)
  const pad      = firstDay.getDay()
  const total    = pad + lastDay.getDate() > 35 ? 42 : 35
  const cur      = new Date(firstDay); cur.setDate(cur.getDate() - pad)

  const cells = Array.from({ length:total }, () => {
    const d   = new Date(cur)
    const dStr = ds(d)
    cur.setDate(cur.getDate() + 1)
    return { dStr, date:d.getDate(), inMonth: d.getMonth()===base.getMonth(), isToday: dStr===today, evts: events.filter(e=>e.dateStr===dStr) }
  })

  return (
    <div style={{ height:"100%", overflow:"auto", padding:16, background:"var(--bg3)" }}>
      <div style={{ minWidth:560, border:"1px solid var(--border)", borderRadius:12, overflow:"hidden" }}>
        {/* Day name headers */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", background:"var(--bg2)", borderBottom:"1px solid var(--border)" }}>
          {DAY_NAMES.map(n => (
            <div key={n} style={{ padding:"8px 0", textAlign:"center", fontSize:11, fontWeight:700, color:"var(--text3)", textTransform:"uppercase" }}>{n}</div>
          ))}
        </div>
        {/* Day cells */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)" }}>
          {cells.map((c,i) => (
            <div key={i} onClick={() => onDayClick(c.dStr)} style={{
              minHeight:110, padding:8, borderRight:"1px solid var(--border)", borderBottom:"1px solid var(--border)",
              background: c.inMonth ? "var(--bg)" : "var(--bg3)", opacity: c.inMonth ? 1 : .55,
              cursor:"pointer", boxSizing:"border-box",
            }}>
              <div style={{ textAlign:"right", marginBottom:4 }}>
                <span style={{
                  display:"inline-flex", alignItems:"center", justifyContent:"center",
                  width:24, height:24, borderRadius:"50%", fontSize:12, fontWeight:800,
                  background: c.isToday ? "var(--accent-crm)" : "transparent",
                  color:      c.isToday ? "#fff"          : "var(--text)",
                }}>{c.date}</span>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                {c.evts.slice(0,3).map(evt => (
                  <div key={evt.id} onClick={e => { e.stopPropagation(); onEventClick(evt) }} style={{
                    fontSize:10, fontWeight:700, padding:"2px 6px", borderRadius:4,
                    background: TYPE_COLOR[evt.type]?.light || "var(--bg3)",
                    color:      TYPE_COLOR[evt.type]?.main  || "var(--text3)",
                    borderLeft:`2px solid ${TYPE_COLOR[evt.type]?.main||"var(--border)"}`,
                    cursor:"pointer", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                  }}>{evt.title}</div>
                ))}
                {c.evts.length > 3 && (
                  <div style={{ fontSize:9, fontWeight:700, color:"var(--text3)", paddingLeft:6 }}>+{c.evts.length-3} more</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Time Grid (Day / Week) ───────────────────────────────────────────────────

function TimeGrid({ events, view, base, scrollRef, nowTop, nowDs, onEventClick, onDayClick }: {
  events:       CalEvent[]
  view:         ViewType
  base:         Date
  scrollRef:    React.RefObject<HTMLDivElement>
  nowTop:       number
  nowDs:        string
  onEventClick: (e:CalEvent) => void
  onDayClick:   (d:string)   => void
}) {
  const days = useMemo(() => {
    if (view === "day") return [{ dStr:ds(base), d:new Date(base) }]
    const ws = new Date(base); ws.setDate(ws.getDate() - ws.getDay())
    return Array.from({ length:7 }, (_,i) => {
      const d = new Date(ws); d.setDate(d.getDate()+i)
      return { dStr:ds(d), d }
    })
  }, [view, base])

  const n     = days.length
  const today = todayStr()
  const minColW = view === "day" ? 240 : 130
  const minW    = 80 + n * minColW

  // Collision layout per day
  const layoutMap = useMemo(() => {
    const m: Record<string, (CalEvent & { _col:number; _numCols:number })[]> = {}
    days.forEach(({ dStr }) => {
      const src = events.filter(e => e.dateStr === dStr).map(e => ({ ...e, _col:0, _numCols:1 }))
      src.sort((a,b) => (a.startHour*60+a.startMin)-(b.startHour*60+b.startMin))
      const cols: typeof src[] = []
      src.forEach(evt => {
        const sm = evt.startHour*60+evt.startMin
        let placed = false
        for (let ci=0; ci<cols.length; ci++) {
          const last = cols[ci][cols[ci].length-1]
          if (sm >= last.endHour*60+last.endMin) { evt._col=ci; cols[ci].push(evt); placed=true; break }
        }
        if (!placed) { evt._col=cols.length; cols.push([evt]) }
      })
      src.forEach(e => { e._numCols = cols.length || 1 })
      m[dStr] = src
    })
    return m
  }, [events, days])

  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column", overflow:"hidden" }}>
      <div ref={scrollRef} style={{ flex:1, overflow:"auto" }}>
        <div style={{ minWidth:minW }}>

          {/* Sticky column-header row */}
          <div style={{
            position:"sticky", top:0, zIndex:30,
            display:"grid", gridTemplateColumns:`80px repeat(${n},1fr)`,
            background:"var(--bg2)", borderBottom:"1px solid var(--border)",
          }}>
            <div style={{ position:"sticky", left:0, zIndex:31, background:"var(--bg2)", borderRight:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontSize:9, fontWeight:800, color:"var(--text3)", textTransform:"uppercase", letterSpacing:".5px", opacity:.6 }}>EST</span>
            </div>
            {days.map(({ dStr, d }) => {
              const isToday = dStr === today
              return (
                <div key={dStr} onClick={() => onDayClick(dStr)} style={{
                  padding:"10px 0", textAlign:"center", borderRight:"1px solid var(--border)",
                  background: isToday ? "rgba(99,102,241,.06)" : "transparent", cursor:"pointer",
                }}>
                  <p style={{ margin:"0 0 2px", fontSize:10, fontWeight:800, textTransform:"uppercase", letterSpacing:".5px", color: isToday ? "var(--accent-crm)" : "var(--text3)" }}>{DAY_NAMES[d.getDay()]}</p>
                  <p style={{ margin:0, fontSize:20, fontWeight:800, color: isToday ? "var(--accent-crm)" : "var(--text)" }}>{d.getDate()}</p>
                </div>
              )
            })}
          </div>

          {/* Time body grid */}
          <div style={{ display:"grid", gridTemplateColumns:`80px repeat(${n},1fr)`, height:24*HOUR_HEIGHT, position:"relative" }}>

            {/* Sticky time axis */}
            <div style={{ position:"sticky", left:0, zIndex:10, background:"var(--bg2)", borderRight:"1px solid var(--border)" }}>
              {Array.from({ length:24 }, (_,h) => (
                <div key={h} style={{ height:HOUR_HEIGHT, display:"flex", alignItems:"flex-start", justifyContent:"center", paddingTop:8, borderBottom:"1px solid var(--border)", boxSizing:"border-box" }}>
                  <span style={{ fontSize:10, fontWeight:700, color:"var(--text3)", opacity:.7 }}>{fmtAxisLabel(h)}</span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            {days.map(({ dStr }) => {
              const isToday  = dStr === today
              const colEvts  = layoutMap[dStr] || []
              return (
                <div key={dStr} style={{ position:"relative", borderRight:"1px solid var(--border)", background: isToday ? "rgba(99,102,241,.025)" : "transparent" }}>
                  {/* Hour lines */}
                  {Array.from({ length:24 }, (_,h) => (
                    <div key={h} style={{ height:HOUR_HEIGHT, borderBottom:"1px solid var(--border)", boxSizing:"border-box", opacity:.25 }} />
                  ))}

                  {/* Current time line */}
                  {isToday && (
                    <div style={{ position:"absolute", left:0, right:0, top:nowTop, zIndex:25, pointerEvents:"none" }}>
                      <div style={{ position:"absolute", left:0, right:0, borderTop:"2px solid #ef4444", opacity:.8 }} />
                      <div style={{ position:"absolute", width:10, height:10, background:"#ef4444", borderRadius:"50%", top:-5, left:-5 }} />
                    </div>
                  )}

                  {/* Events */}
                  {colEvts.map(evt => {
                    const top     = evt.startHour*HOUR_HEIGHT + (evt.startMin/60)*HOUR_HEIGHT
                    const durH    = (evt.endHour-evt.startHour) + (evt.endMin-evt.startMin)/60
                    const height  = Math.max(36, durH*HOUR_HEIGHT)
                    const nc      = evt._numCols || 1
                    const c       = evt._col || 0
                    const w       = `calc(${100/nc}% - 4px)`
                    const l       = `calc(${c*(100/nc)}% + 2px)`
                    const col     = TYPE_COLOR[evt.type] || TYPE_COLOR.Event
                    const isShort = height <= 48

                    return (
                      <div key={evt.id} onClick={e => { e.stopPropagation(); onEventClick(evt) }} style={{
                        position:"absolute", top, height, left:l, width:w, boxSizing:"border-box",
                        background:"var(--bg2)", borderRadius:8, cursor:"pointer", overflow:"hidden", zIndex:20,
                        borderLeft:`3px solid ${col.main}`, border:`1px solid var(--border)`, borderLeftColor:col.main,
                        padding: isShort ? "3px 6px" : "6px 8px",
                        display:"flex", flexDirection: isShort ? "row" : "column",
                        alignItems: isShort ? "center" : "flex-start", gap: isShort ? 4 : 2,
                        transition:"box-shadow .15s",
                      }}>
                        <div style={{ display:"flex", alignItems:"center", gap:4, flexShrink:0 }}>
                          <span style={{ width:6, height:6, borderRadius:"50%", background:col.main, flexShrink:0 }} />
                          <span style={{ fontSize:9, fontWeight:800, color:col.main, textTransform:"uppercase", letterSpacing:".4px", whiteSpace:"nowrap" }}>{evt.type}</span>
                        </div>
                        <span style={{ fontSize:11, fontWeight:700, color:"var(--text)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", width:"100%" }}>{evt.title}</span>
                        {!isShort && (
                          <span style={{ fontSize:9, fontWeight:600, color:"var(--text3)", marginTop:"auto" }}>
                            {fmtHour(evt.startHour,evt.startMin)} – {fmtHour(evt.endHour,evt.endMin)}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
