"use client"

import { useState, useMemo, useRef, useEffect, Suspense } from "react"
import { useRouter } from "next/navigation"
import { useSearchParams } from "next/navigation"
import type { Ticket, TicketPriority, TicketStatus, TicketBrand } from "@/app/types/dashboard"

// ─── Types ────────────────────────────────────────────
export interface MerchantSummary {
  id: string
  mid: string
  dba: string
  legalName: string
  processor: string
  status: string
}

const PRIORITY_COLORS: Record<TicketPriority, string> = {
  Low:      "#10b981",
  Medium:   "#f59e0b",
  High:     "#ef4444",
  Critical: "#7c3aed",
}

const STATUS_COLORS: Record<TicketStatus, string> = {
  "Open":             "#ef4444",
  "In Progress":      "#f59e0b",
  "Pending Internal": "#8b5cf6",
  "Resolved":         "#10b981",
  "Closed":           "#6b7280",
}

const BRANDS: TicketBrand[] = [
  "Clover", "Dejavoo", "Dexa", "Figure", "Ingenico",
  "PAX", "Square", "Supersonic", "SwipeSimple", "Valor", "Verifone", "Other",
]

const AGENTS = ["Joan Huang", "Moe Kadi", "Zu Jia He Cen"]
const COLS   = "110px minmax(0,1fr) 160px 140px 100px 160px 110px"
const VALID_STATUSES: TicketStatus[] = ["Open", "In Progress", "Pending Internal", "Resolved", "Closed"]

function merchantStatusStyle(s: string) {
  if (s === "Active")   return { background: "rgba(16,185,129,.12)",  color: "#10b981" }
  if (s === "Inactive") return { background: "rgba(107,114,128,.12)", color: "#6b7280" }
  if (s === "Pending")  return { background: "rgba(245,158,11,.12)",  color: "#f59e0b" }
  if (s === "Closed")   return { background: "rgba(239,68,68,.12)",   color: "#ef4444" }
  return { background: "rgba(99,102,241,.12)", color: "#6366f1" }
}

// ─── New Ticket form ──────────────────────────────────
interface NewTicket {
  subject:     string
  priority:    TicketPriority | ""
  brand:       TicketBrand | ""
  assignedTo:  string
  description: string
}

const EMPTY_TICKET: NewTicket = {
  subject: "", priority: "", brand: "", assignedTo: "", description: "",
}

const MOCK_ACTIVITY = [
  { text: "Ticket created",     time: "Just now", color: "#8b5cf6" },
  { text: "Status set to Open", time: "Just now", color: "#ef4444" },
  { text: "Assigned to agent",  time: "Just now", color: "#f59e0b" },
]

// ─── Component ────────────────────────────────────────
interface Props { tickets: Ticket[]; merchants: MerchantSummary[] }

function TicketsInner({ tickets, merchants }: Props) {
  const searchParams  = useSearchParams()
  const router        = useRouter()
  const initialStatus = VALID_STATUSES.find(s => s === searchParams.get("status")) ?? ""

  // Filters
  const [query,    setQuery]    = useState("")
  const [status,   setStatus]   = useState(initialStatus)
  const [priority, setPriority] = useState("")
  const [assigned, setAssigned] = useState("All")
  const [brand,    setBrand]    = useState("All")

  // Detail view
  const [selected, setSelected] = useState<Ticket | null>(null)

  // Step 1 – merchant picker
  const [showPicker,   setShowPicker]   = useState(false)
  const [pickerQuery,  setPickerQuery]  = useState("")
  const [pickedMerchant, setPickedMerchant] = useState<MerchantSummary | null>(null)

  // Step 2 – ticket form
  const [showForm,   setShowForm]   = useState(false)
  const [form,       setFormState]  = useState<NewTicket>(EMPTY_TICKET)
  const [submitted,  setSubmitted]  = useState(false)

  const pickerRef = useRef<HTMLDivElement>(null)
  const formRef   = useRef<HTMLDivElement>(null)

  // Close on backdrop click
  function handlePickerBackdrop(e: React.MouseEvent) { if (e.target === pickerRef.current) closeAll() }
  function handleFormBackdrop(e: React.MouseEvent)   { if (e.target === formRef.current)   closeForm() }

  // ESC
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      if (showForm)   closeForm()
      else if (showPicker) closeAll()
    }
    window.addEventListener("keydown", h)
    return () => window.removeEventListener("keydown", h)
  }, [showPicker, showForm])

  function openPicker() {
    setPickerQuery(""); setPickedMerchant(null)
    setFormState(EMPTY_TICKET); setSubmitted(false)
    setShowPicker(true)
  }

  function selectMerchant(m: MerchantSummary) {
    setPickedMerchant(m)
    setShowPicker(false)
    setShowForm(true)
  }

  function closeAll() { setShowPicker(false); setShowForm(false); setPickedMerchant(null) }
  function closeForm() { setShowPicker(true); setShowForm(false) }  // back to picker

  function setField<K extends keyof NewTicket>(k: K, v: NewTicket[K]) {
    setFormState(f => ({ ...f, [k]: v }))
  }

  function handleCreate() {
    setSubmitted(true)
    if (!form.subject.trim() || !form.priority || !pickedMerchant) return
    closeAll()
  }

  // Filtered merchant list in picker
  const filteredMerchants = useMemo(() => {
    const q = pickerQuery.toLowerCase()
    if (!q) return merchants
    return merchants.filter(m =>
      m.dba.toLowerCase().includes(q) ||
      m.mid.toLowerCase().includes(q) ||
      m.legalName.toLowerCase().includes(q)
    )
  }, [merchants, pickerQuery])

  // Filtered ticket list
  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return tickets.filter(t => {
      if (q && ![t.id, t.subject, t.merchant, t.assignedTo].some(s => s.toLowerCase().includes(q))) return false
      if (status   && t.status   !== status)   return false
      if (priority && t.priority !== priority) return false
      if (assigned === "Me" && t.assignedTo !== "Joan Huang") return false
      if (brand !== "All" && t.brand !== brand) return false
      return true
    })
  }, [tickets, query, status, priority, assigned, brand])

  function clearFilters() { setQuery(""); setStatus(""); setPriority(""); setAssigned("All"); setBrand("All") }
  const hasFilters = query || status || priority || assigned !== "All" || brand !== "All"

  // ── Ticket Detail View ────────────────────────────────
  if (selected) {
    const sc = STATUS_COLORS[selected.status]
    const pc = PRIORITY_COLORS[selected.priority]
    return (
      <div className="dash-layout">
        <button className="tkt-back-btn" onClick={() => setSelected(null)}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
          Back to Tickets
        </button>
        <div className="tkt-detail-hero">
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-crm)", marginBottom: 6 }}>{selected.id}</div>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--text)", margin: "0 0 8px", lineHeight: 1.3 }}>{selected.subject}</h2>
              <div style={{ fontSize: 13, color: "var(--text2)", fontWeight: 500 }}>{selected.merchant}</div>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, fontWeight: 700, padding: "5px 14px", borderRadius: 20, background: `${sc}1a`, color: sc }}>{selected.status}</span>
              <span style={{ fontSize: 12, fontWeight: 700, padding: "5px 14px", borderRadius: 20, background: `${pc}1a`, color: pc }}>{selected.priority}</span>
            </div>
          </div>
          <div className="tkt-detail-meta-grid">
            <div className="tkt-detail-meta-item"><div className="meta-label">Assigned To</div><div className="meta-val">{selected.assignedTo}</div></div>
            <div className="tkt-detail-meta-item"><div className="meta-label">Brand</div><div className="meta-val">{selected.brand ?? "—"}</div></div>
            <div className="tkt-detail-meta-item"><div className="meta-label">Created</div><div className="meta-val">{selected.createdAt}</div></div>
            <div className="tkt-detail-meta-item"><div className="meta-label">Due Date</div><div className="meta-val">{selected.dueDate ?? "Not set"}</div></div>
          </div>
        </div>
        <div className="tkt-detail-section">
          <div className="tkt-detail-section-title">Description</div>
          <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.7, margin: 0 }}>No description provided.</p>
        </div>
        <div className="tkt-detail-section">
          <div className="tkt-detail-section-title">Activity</div>
          {MOCK_ACTIVITY.map((item, i) => (
            <div key={i} className="tkt-activity-item">
              <div className="tkt-activity-dot" style={{ background: item.color }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 600 }}>{item.text}</div>
                <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{item.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── List View ─────────────────────────────────────────
  return (
    <div className="dash-layout">

      <div className="dash-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", margin: 0, letterSpacing: -0.5 }}>Tickets</h1>
          <p style={{ fontSize: 13, color: "var(--text3)", margin: "3px 0 0", fontWeight: 500 }}>
            Manage and track all merchant support tickets
          </p>
        </div>
        <button className="tkt-btn-new" onClick={openPicker} style={{ marginLeft: 0 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          New Ticket
        </button>
      </div>

      {/* Filter bar */}
      <div className="tkt-filter-bar">
        <div className="tkt-search">
          <span className="material-symbols-outlined">search</span>
          <input type="text" placeholder="Search tickets…" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <div className="tkt-filters">
          <select className="tkt-filter-sel" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">All Status</option>
            <option>Open</option><option>In Progress</option>
            <option>Pending Internal</option><option>Resolved</option><option>Closed</option>
          </select>
          <select className="tkt-filter-sel" value={priority} onChange={e => setPriority(e.target.value)}>
            <option value="">All Priority</option>
            <option>Critical</option><option>High</option><option>Medium</option><option>Low</option>
          </select>
          <select className="tkt-filter-sel" value={assigned} onChange={e => setAssigned(e.target.value)}>
            <option value="All">Anyone</option>
            <option value="Me">Assigned to Me</option>
          </select>
          <select className="tkt-filter-sel" value={brand} onChange={e => setBrand(e.target.value)}>
            <option value="All">All Brands</option>
            {BRANDS.map(b => <option key={b}>{b}</option>)}
          </select>
          {hasFilters && (
            <button className="tkt-reset-btn" onClick={clearFilters}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>filter_alt_off</span>
              Reset
            </button>
          )}
        </div>
        <div className="tkt-filter-divider" />
        <span className="tkt-result-count">{filtered.length} {filtered.length === 1 ? "ticket" : "tickets"}</span>
      </div>

      {/* Table (desktop) */}
      <div className="tkt-scroll-view tkt-table-wrap">
        <div style={{ minWidth: 800 }}>
          <div style={{ display: "grid", gridTemplateColumns: COLS, gap: 12, padding: "10px 16px", fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".5px", borderBottom: "1px solid var(--border)", background: "var(--bg3)" }}>
            <div>Ticket ID</div><div>Subject</div><div>Merchant</div>
            <div>Status</div><div>Priority</div><div>Assigned To</div><div>Created</div>
          </div>
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text3)", fontSize: 13 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 36, display: "block", marginBottom: 10, opacity: 0.4 }}>inbox</span>
              No tickets match your filters.
            </div>
          )}
          {filtered.map((ticket, i) => (
            <div
              key={ticket.id}
              className="ticket-row"
              role="button" tabIndex={0}
              onClick={() => setSelected(ticket)}
              onKeyDown={e => e.key === "Enter" && setSelected(ticket)}
              style={{ display: "grid", gridTemplateColumns: COLS, gap: 12, padding: "12px 16px", borderBottom: "1px solid var(--border)", alignItems: "center", cursor: "pointer", transition: ".12s", animation: "fadeIn 0.3s ease both", animationDelay: `${i * 35}ms` }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-crm)" }}>{ticket.id}</div>
              <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ticket.subject}</div>
              <div style={{ fontSize: 12, color: "var(--text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ticket.merchant}</div>
              <div><span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: `${STATUS_COLORS[ticket.status]}1a`, color: STATUS_COLORS[ticket.status] }}>{ticket.status}</span></div>
              <div><span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: `${PRIORITY_COLORS[ticket.priority]}1a`, color: PRIORITY_COLORS[ticket.priority] }}>{ticket.priority}</span></div>
              <div style={{ fontSize: 12, color: "var(--text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ticket.assignedTo}</div>
              <div style={{ fontSize: 11, color: "var(--text3)" }}>{ticket.createdAt}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Cards (mobile) */}
      <div className="tkt-cards-view">
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text3)", fontSize: 13 }}>No tickets match your filters.</div>
        )}
        {filtered.map((ticket, i) => (
          <div key={ticket.id} className="tkt-card" role="button" tabIndex={0} onClick={() => setSelected(ticket)} onKeyDown={e => e.key === "Enter" && setSelected(ticket)} style={{ animation: "fadeIn 0.3s ease both", animationDelay: `${i * 40}ms`, cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--accent-crm)" }}>{ticket.id}</span>
              <div style={{ display: "flex", gap: 5 }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: `${STATUS_COLORS[ticket.status]}1a`, color: STATUS_COLORS[ticket.status] }}>{ticket.status}</span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: `${PRIORITY_COLORS[ticket.priority]}1a`, color: PRIORITY_COLORS[ticket.priority] }}>{ticket.priority}</span>
              </div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>{ticket.subject}</div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text3)" }}>
              <span>{ticket.merchant}</span>
              <span>{ticket.assignedTo} · {ticket.createdAt}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Step 1: Merchant Picker ────────────────────── */}
      {showPicker && (
        <div
          ref={pickerRef}
          onClick={handlePickerBackdrop}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(5px)", WebkitBackdropFilter: "blur(5px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, boxSizing: "border-box", animation: "fadeIn 0.18s ease" }}
        >
          <div style={{ background: "var(--bg2)", borderRadius: 20, border: "1px solid var(--border)", boxShadow: "0 24px 64px rgba(0,0,0,0.28)", maxWidth: 480, width: "100%", maxHeight: "80vh", display: "flex", flexDirection: "column", overflow: "hidden", animation: "fadeUp 0.25s ease" }}>

            {/* Header */}
            <div style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--accent-crm-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ color: "var(--accent-crm)", fontSize: 20 }}>storefront</span>
              </div>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 900, color: "var(--text)", margin: 0 }}>Select Merchant</h2>
                <p style={{ fontSize: 12, color: "var(--text3)", margin: "2px 0 0", fontWeight: 500 }}>Choose the merchant for this ticket</p>
              </div>
              <button onClick={closeAll} style={{ marginLeft: "auto", background: "var(--bg3)", border: "none", width: 30, height: 30, borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 17, color: "var(--text3)" }}>close</span>
              </button>
            </div>

            {/* Search */}
            <div style={{ padding: "14px 24px 8px", flexShrink: 0 }}>
              <div className="tkt-search" style={{ flex: "unset" as const }}>
                <span className="material-symbols-outlined">search</span>
                <input
                  type="text"
                  placeholder="Search by name or MID…"
                  value={pickerQuery}
                  onChange={e => setPickerQuery(e.target.value)}
                  autoFocus
                  style={{ width: "100%" }}
                />
              </div>
            </div>

            {/* Merchant list */}
            <div style={{ overflowY: "auto", flex: 1, padding: "4px 16px 8px" }}>
              {filteredMerchants.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text3)", fontSize: 13 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 28, display: "block", marginBottom: 8, opacity: 0.4 }}>storefront</span>
                  No merchants match your search.
                </div>
              ) : filteredMerchants.map(m => {
                const ms = merchantStatusStyle(m.status)
                return (
                  <button
                    key={m.id}
                    onClick={() => selectMerchant(m)}
                    style={{ display: "flex", alignItems: "center", width: "100%", padding: "10px 12px", borderRadius: 10, border: "none", background: "transparent", cursor: "pointer", gap: 12, textAlign: "left", transition: "background .12s", fontFamily: "inherit" }}
                    onMouseOver={e => (e.currentTarget.style.background = "var(--bg3)")}
                    onMouseOut={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: "var(--accent-crm-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 17, color: "var(--accent-crm)" }}>store</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.dba}</div>
                      <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{m.mid} · {m.processor}</div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 9px", borderRadius: 20, flexShrink: 0, ...ms }}>{m.status}</span>
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--text3)", flexShrink: 0 }}>chevron_right</span>
                  </button>
                )
              })}
            </div>

            {/* Footer */}
            <div style={{ padding: "12px 24px 16px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, gap: 10 }}>
              <span style={{ fontSize: 12, color: "var(--text3)" }}>Merchant not listed?</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={closeAll} style={{ padding: "8px 16px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  Cancel
                </button>
                <button
                  onClick={() => router.push("/merchants")}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, border: "none", background: "var(--accent-crm)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>add_business</span>
                  New Merchant
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 2: Ticket Form ────────────────────────── */}
      {showForm && pickedMerchant && (
        <div
          ref={formRef}
          onClick={handleFormBackdrop}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(5px)", WebkitBackdropFilter: "blur(5px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, boxSizing: "border-box", animation: "fadeIn 0.18s ease" }}
        >
          <div className="tkt-modal-panel">

            {/* Header */}
            <div style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: 14, borderBottom: "1px solid var(--border)" }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--accent-crm-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ color: "var(--accent-crm)", fontSize: 20 }}>confirmation_number</span>
              </div>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 900, color: "var(--text)", margin: 0 }}>New Ticket</h2>
                <p style={{ fontSize: 12, color: "var(--text3)", margin: "2px 0 0", fontWeight: 500 }}>Create a support ticket for a merchant</p>
              </div>
              <button onClick={closeAll} style={{ marginLeft: "auto", background: "var(--bg3)", border: "none", width: 30, height: 30, borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 17, color: "var(--text3)" }}>close</span>
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Selected merchant chip */}
              <div className="tkt-modal-field">
                <label>Merchant</label>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", background: "var(--accent-crm-light)", border: "1px solid var(--accent-crm)", borderRadius: 10, gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--accent-crm)", flexShrink: 0 }}>store</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent-crm)" }}>{pickedMerchant.dba}</div>
                      <div style={{ fontSize: 11, color: "var(--accent-crm)", opacity: 0.75 }}>MID {pickedMerchant.mid} · {pickedMerchant.processor}</div>
                    </div>
                  </div>
                  <button onClick={closeForm} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 700, color: "var(--accent-crm)", fontFamily: "inherit", padding: "2px 6px", borderRadius: 6, flexShrink: 0 }}>
                    Change
                  </button>
                </div>
              </div>

              {/* Subject */}
              <div className="tkt-modal-field">
                <label>Subject *</label>
                <input
                  className="tkt-modal-input"
                  type="text"
                  placeholder="e.g. Terminal not connecting"
                  value={form.subject}
                  onChange={e => setField("subject", e.target.value)}
                  style={submitted && !form.subject.trim() ? { borderColor: "#ef4444" } : {}}
                  autoFocus
                />
                {submitted && !form.subject.trim() && <span style={{ fontSize: 11, color: "#ef4444" }}>Subject is required</span>}
              </div>

              {/* Priority + Brand */}
              <div className="tkt-modal-row">
                <div className="tkt-modal-field">
                  <label>Priority *</label>
                  <select
                    className="tkt-modal-input tkt-filter-sel"
                    value={form.priority}
                    onChange={e => setField("priority", e.target.value as TicketPriority | "")}
                    style={submitted && !form.priority ? { borderColor: "#ef4444", padding: "10px 28px 10px 12px" } : { padding: "10px 28px 10px 12px" }}
                  >
                    <option value="">— Select priority —</option>
                    <option>Critical</option><option>High</option><option>Medium</option><option>Low</option>
                  </select>
                  {submitted && !form.priority && <span style={{ fontSize: 11, color: "#ef4444" }}>Priority is required</span>}
                </div>
                <div className="tkt-modal-field">
                  <label>Brand / Product</label>
                  <select
                    className="tkt-modal-input tkt-filter-sel"
                    value={form.brand}
                    onChange={e => setField("brand", e.target.value as TicketBrand | "")}
                    style={{ padding: "10px 28px 10px 12px" }}
                  >
                    <option value="">— Select brand —</option>
                    {BRANDS.map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
              </div>

              {/* Assign To */}
              <div className="tkt-modal-field">
                <label>Assign To</label>
                <select
                  className="tkt-modal-input tkt-filter-sel"
                  value={form.assignedTo}
                  onChange={e => setField("assignedTo", e.target.value)}
                  style={{ padding: "10px 28px 10px 12px" }}
                >
                  <option value="">— Unassigned —</option>
                  {AGENTS.map(a => <option key={a}>{a}</option>)}
                </select>
              </div>

              {/* Description */}
              <div className="tkt-modal-field">
                <label>Description</label>
                <textarea
                  className="tkt-modal-input"
                  placeholder="Describe the issue in detail…"
                  rows={4}
                  value={form.description}
                  onChange={e => setField("description", e.target.value)}
                  style={{ resize: "vertical" }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 6, borderTop: "1px solid var(--border)" }}>
                <button onClick={closeForm} style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  Back
                </button>
                <button onClick={handleCreate} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 22px", borderRadius: 10, border: "none", background: "var(--accent-crm)", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
                  Create Ticket
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}

export function TicketsClient(props: Props) {
  return (
    <Suspense fallback={null}>
      <TicketsInner {...props} />
    </Suspense>
  )
}
