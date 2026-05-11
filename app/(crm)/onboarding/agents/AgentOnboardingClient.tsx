"use client"

import { useState, useMemo, useRef } from "react"

// ── Types ───────────────────────────────────────────────────────────────────

export type OnboardingStatus =
  | "Submitted" | "Under Review" | "Awaiting Merchant"
  | "Awaiting Processor" | "Approved" | "Live" | "Declined" | "Withdrawn"

export interface AgentOnboardingTicket {
  id:          string
  agentName:   string
  submittedBy: string
  appStatus:   OnboardingStatus
  assignedTo:  string
  createdAt:   string
}

interface AgentForm {
  firstName:   string
  lastName:    string
  phone:       string
  email:       string
  companyName: string
  referrer:    string
  notes:       string
}

const EMPTY_FORM: AgentForm = {
  firstName: "", lastName: "", phone: "", email: "",
  companyName: "", referrer: "", notes: "",
}

const ALL_STATUSES: OnboardingStatus[] = [
  "Submitted", "Under Review", "Awaiting Merchant", "Awaiting Processor",
  "Approved", "Live", "Declined", "Withdrawn",
]

const AGENT_FORM_URL = "/agent-onboarding"

// ── Status styling ───────────────────────────────────────────────────────────

const STATUS_STYLE: Record<OnboardingStatus, { bg: string; color: string }> = {
  "Submitted":          { bg: "rgba(14,165,233,.12)",  color: "#0ea5e9" },
  "Under Review":       { bg: "rgba(99,102,241,.12)",  color: "#6366f1" },
  "Awaiting Merchant":  { bg: "rgba(245,158,11,.12)",  color: "#f59e0b" },
  "Awaiting Processor": { bg: "rgba(239,68,68,.12)",   color: "#ef4444" },
  "Approved":           { bg: "rgba(16,185,129,.12)",  color: "#10b981" },
  "Live":               { bg: "rgba(16,185,129,.20)",  color: "#059669" },
  "Declined":           { bg: "rgba(107,114,128,.12)", color: "#6b7280" },
  "Withdrawn":          { bg: "rgba(107,114,128,.12)", color: "#6b7280" },
}

const STATUS_KEY: Array<{ status: OnboardingStatus; desc: string; badgeClass: string }> = [
  { status: "Submitted",          desc: "Application received, not yet reviewed",                        badgeClass: "badge-pending"  },
  { status: "Under Review",       desc: "Onboarding team is actively working on the file",               badgeClass: "badge-progress" },
  { status: "Awaiting Merchant",  desc: "Documents, signatures, or info pending from the agent",         badgeClass: "badge-open"     },
  { status: "Awaiting Processor", desc: "Submitted to processor, pending approval decision",             badgeClass: "badge-open"     },
  { status: "Approved",           desc: "Approved; agent code and setup in progress",                    badgeClass: "badge-resolved" },
  { status: "Live",               desc: "Successfully boarded and actively processing",                  badgeClass: "badge-resolved" },
  { status: "Declined",           desc: "Application rejected by processor or risk team",                badgeClass: "badge-closed"   },
  { status: "Withdrawn",          desc: "Agent withdrew or abandoned prior to boarding",                 badgeClass: "badge-closed"   },
]

// ── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: OnboardingStatus }) {
  const s = STATUS_STYLE[status]
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: s.bg, color: s.color, whiteSpace: "nowrap", display: "inline-block" }}>
      {status}
    </span>
  )
}

function UploadField({ id, label, required }: { id: string; label: string; required?: boolean }) {
  const [fileName, setFileName] = useState("No file chosen")
  return (
    <div style={{ border: "1px dashed var(--border)", borderRadius: 8, padding: 12, textAlign: "center", background: "var(--bg3)" }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text)", display: "block", marginBottom: 8 }}>
        {label}{required && " *"}
      </div>
      <label style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "var(--bg2)", borderRadius: 8, fontSize: 11, fontWeight: 700, color: "var(--text)", border: "1px solid var(--border)" }}>
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>upload</span> Browse
        <input
          type="file" id={id} multiple accept=".pdf,.png,.jpg,.jpeg" style={{ display: "none" }}
          onChange={e => setFileName(e.target.files && e.target.files.length > 0 ? `${e.target.files.length} file(s) selected` : "No file chosen")}
        />
      </label>
      <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 6 }}>{fileName}</div>
    </div>
  )
}

function SectionHeader({ num, title }: { num: string; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "24px 0 14px", paddingBottom: 8, borderBottom: "1px solid var(--border)" }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--accent-crm-light)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent-crm)", fontWeight: 900, fontSize: 12 }}>{num}</div>
      <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "1.2px", color: "var(--text3)" }}>{title}</span>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

interface Props { initialTickets: AgentOnboardingTicket[] }

export function AgentOnboardingClient({ initialTickets }: Props) {
  const [tickets,      setTickets]      = useState<AgentOnboardingTicket[]>(initialTickets)
  const [query,        setQuery]        = useState("")
  const [statusFilt,   setStatusFilt]   = useState("")
  const [assignedFilt, setAssignedFilt] = useState("All")
  const [statusKeyOpen, setStatusKeyOpen] = useState(false)

  const [selected,     setSelected]     = useState<AgentOnboardingTicket | null>(null)
  const [detailStatus, setDetailStatus] = useState<OnboardingStatus>("Submitted")

  const [showFormLink, setShowFormLink] = useState(false)
  const [showWorkflow, setShowWorkflow] = useState(false)
  const [showInternal, setShowInternal] = useState(false)
  const [copyDone,     setCopyDone]     = useState(false)

  const [form,         setForm]         = useState<AgentForm>(EMPTY_FORM)
  const [formError,    setFormError]    = useState("")
  const [submitting,   setSubmitting]   = useState(false)

  const overlayRef = useRef<HTMLDivElement>(null)

  // ── Stats ──────────────────────────────────────────────────────────────────

  const stats = useMemo(() => ({
    pending:    tickets.filter(t => t.appStatus === "Submitted").length,
    inProgress: tickets.filter(t => ["Under Review", "Awaiting Merchant", "Awaiting Processor"].includes(t.appStatus)).length,
    accepted:   tickets.filter(t => ["Approved", "Live"].includes(t.appStatus)).length,
    rejected:   tickets.filter(t => ["Declined", "Withdrawn"].includes(t.appStatus)).length,
  }), [tickets])

  // ── Filtering ─────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return tickets.filter(t => {
      if (q && ![t.id, t.agentName, t.submittedBy, t.assignedTo].some(s => s.toLowerCase().includes(q))) return false
      if (statusFilt && t.appStatus !== statusFilt) return false
      if (assignedFilt === "Me" && t.assignedTo !== "Jordan Vance") return false
      return true
    })
  }, [tickets, query, statusFilt, assignedFilt])

  const hasFilters = query || statusFilt || assignedFilt !== "All"
  function clearFilters() { setQuery(""); setStatusFilt(""); setAssignedFilt("All") }

  // ── Form link copy ────────────────────────────────────────────────────────

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(AGENT_FORM_URL)
      setCopyDone(true)
      setTimeout(() => setCopyDone(false), 2000)
    } catch { /* ignore */ }
  }

  // ── Internal form ─────────────────────────────────────────────────────────

  function setF<K extends keyof AgentForm>(k: K, v: string) {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  async function submitForm() {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.phone.trim() || !form.email.trim()) {
      setFormError("Please fill in all required fields.")
      return
    }
    setFormError("")
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 700))
    const newTicket: AgentOnboardingTicket = {
      id:          `MTECH-AGT-${String(Math.floor(1000 + Math.random() * 9000))}`,
      agentName:   `${form.firstName.trim()} ${form.lastName.trim()}`,
      submittedBy: "Jordan Vance",
      appStatus:   "Submitted",
      assignedTo:  "Jordan Vance",
      createdAt:   new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    }
    setTickets(prev => [newTicket, ...prev])
    setForm(EMPTY_FORM)
    setSubmitting(false)
    setShowInternal(false)
  }

  // ── Detail view ───────────────────────────────────────────────────────────

  function openDetail(t: AgentOnboardingTicket) {
    setSelected(t)
    setDetailStatus(t.appStatus)
  }

  function saveDetailStatus() {
    if (!selected) return
    setTickets(prev => prev.map(t => t.id === selected.id ? { ...t, appStatus: detailStatus } : t))
    setSelected(prev => prev ? { ...prev, appStatus: detailStatus } : null)
  }

  // ── Detail page ───────────────────────────────────────────────────────────

  if (selected) {
    const s = STATUS_STYLE[selected.appStatus]
    return (
      <div className="dash-layout">
        <button className="tkt-back-btn" onClick={() => setSelected(null)}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
          Back to Agent Onboarding Queue
        </button>

        <div className="tkt-detail-hero">
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-crm)", marginBottom: 6 }}>{selected.id}</div>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--text)", margin: "0 0 8px", lineHeight: 1.3 }}>
                Agent Onboarding — {selected.agentName}
              </h2>
              <div style={{ fontSize: 13, color: "var(--text2)", fontWeight: 500 }}>{selected.agentName}</div>
            </div>
            <StatusBadge status={selected.appStatus} />
          </div>

          <div className="tkt-detail-meta-grid">
            <div className="tkt-detail-meta-item">
              <div className="meta-label">Submitted By</div>
              <div className="meta-val">{selected.submittedBy}</div>
            </div>
            <div className="tkt-detail-meta-item">
              <div className="meta-label">Assigned To</div>
              <div className="meta-val">{selected.assignedTo}</div>
            </div>
            <div className="tkt-detail-meta-item">
              <div className="meta-label">Created</div>
              <div className="meta-val">{selected.createdAt}</div>
            </div>
            <div className="tkt-detail-meta-item">
              <div className="meta-label">Application Status</div>
              <div className="meta-val">
                <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 12 }}>
                  {selected.appStatus}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Update */}
        <div className="tkt-detail-section">
          <div className="tkt-detail-section-title">Update Application Status</div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <select
              value={detailStatus}
              onChange={e => setDetailStatus(e.target.value as OnboardingStatus)}
              style={{ padding: "9px 28px 9px 12px", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: 13, fontWeight: 600, outline: "none", fontFamily: "inherit", appearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24'%3E%3Cpath fill='%2394a3b8' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" }}
            >
              {ALL_STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
            <button className="crm-btn crm-btn-primary" onClick={saveDetailStatus} style={{ padding: "9px 20px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>save</span>
              Save Status
            </button>
          </div>
        </div>

        {/* Activity */}
        <div className="tkt-detail-section">
          <div className="tkt-detail-section-title">Activity</div>
          {[
            { text: "Ticket created",                                color: "#8b5cf6"                          },
            { text: `Status set to ${selected.appStatus}`,          color: STATUS_STYLE[selected.appStatus].color },
            { text: `Assigned to ${selected.assignedTo}`,           color: "#f59e0b"                          },
          ].map((item, i) => (
            <div key={i} className="tkt-activity-item">
              <div className="tkt-activity-dot" style={{ background: item.color }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 600 }}>{item.text}</div>
                <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{selected.createdAt}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Queue view ────────────────────────────────────────────────────────────

  const COLS = "120px minmax(0,1fr) 150px 160px 150px 100px"

  return (
    <div className="dash-layout">

      {/* Page Header */}
      <div className="dash-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", margin: 0, letterSpacing: -0.5 }}>Agent Onboarding Queue</h1>
          <p style={{ fontSize: 13, color: "var(--text3)", margin: "3px 0 0", fontWeight: 500 }}>Manage incoming agent onboarding submissions</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={() => setShowWorkflow(true)}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, background: "var(--bg2)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 10, cursor: "pointer" }}
            title="Workflow Help"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: "var(--accent-crm)" }}>help</span>
          </button>
          <button
            onClick={() => setShowFormLink(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", background: "var(--bg2)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>link</span>
            Get Agent Form
          </button>
          <button
            className="tkt-btn-new"
            onClick={() => { setForm(EMPTY_FORM); setFormError(""); setShowInternal(true) }}
            style={{ marginLeft: 0 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>person_add</span>
            Internal Request
          </button>
        </div>
      </div>

      {/* Feature Banner */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "16px 20px", background: "var(--accent-crm-light)", border: "1px solid rgba(99,102,241,.2)", borderRadius: 14, marginBottom: 20 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(99,102,241,.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span className="material-symbols-outlined" style={{ color: "var(--accent-crm)", fontSize: 20 }}>new_releases</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>New: Application Status Tracking</div>
          <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.5 }}>
            We&rsquo;ve added a new &ldquo;App Status&rdquo; column to help you track where each agent application stands — from Submitted through review to Approved or Declined. Update the status directly from any ticket&rsquo;s detail view.
          </div>
        </div>
        <button
          onClick={() => {
            const banner = (document.currentScript?.parentElement) as HTMLElement | null
            if (banner) banner.style.display = "none"
          }}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)", padding: 4, flexShrink: 0 }}
          aria-label="Dismiss"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
        </button>
      </div>

      {/* Stat Cards */}
      <div className="obq-stat-row">
        {[
          { icon: "pending_actions", color: "#0ea5e9", bg: "rgba(14,165,233,.12)", num: stats.pending,    label: "Pending"           },
          { icon: "sync",            color: "#6366f1", bg: "rgba(99,102,241,.12)", num: stats.inProgress, label: "In Progress"       },
          { icon: "check_circle",    color: "#10b981", bg: "rgba(16,185,129,.12)", num: stats.accepted,   label: "Accepted"          },
          { icon: "cancel",          color: "#ef4444", bg: "rgba(239,68,68,.12)",  num: stats.rejected,   label: "Rejected / Closed" },
        ].map(card => (
          <div key={card.label} className="obq-stat">
            <div className="obq-stat-icon" style={{ background: card.bg }}>
              <span className="material-symbols-outlined" style={{ color: card.color, fontSize: 24 }}>{card.icon}</span>
            </div>
            <div>
              <div className="obq-stat-num">{card.num}</div>
              <div className="obq-stat-label">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="tkt-filter-bar">
        <div className="tkt-search">
          <span className="material-symbols-outlined">search</span>
          <input
            type="text"
            placeholder="Search agent onboarding tickets…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <div className="tkt-filters">
          <select className="tkt-filter-sel" value={statusFilt} onChange={e => setStatusFilt(e.target.value)}>
            <option value="">All Status</option>
            {ALL_STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          <select className="tkt-filter-sel" value={assignedFilt} onChange={e => setAssignedFilt(e.target.value)}>
            <option value="All">Anyone</option>
            <option value="Me">Assigned to Me</option>
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

      {/* Status Key */}
      <div style={{ marginBottom: 12 }}>
        <button
          onClick={() => setStatusKeyOpen(o => !o)}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 10, cursor: "pointer", width: "100%", fontFamily: "inherit" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--accent-crm)" }}>info</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Status Key</span>
          <span style={{ fontSize: 11, color: "var(--text3)", fontWeight: 500 }}>— What does each status mean?</span>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 18, color: "var(--text3)", marginLeft: "auto", transition: "transform .25s", transform: statusKeyOpen ? "rotate(180deg)" : "rotate(0deg)" }}
          >expand_more</span>
        </button>
        {statusKeyOpen && (
          <div className="statuskey-body" style={{ marginTop: 8, padding: "16px 20px", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {STATUS_KEY.map(({ status, desc, badgeClass }) => (
                <div key={status} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "var(--bg)", borderRadius: 8 }}>
                  <span className={`badge ${badgeClass}`} style={{ minWidth: 130, justifyContent: "center", flexShrink: 0 }}>{status}</span>
                  <span style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.4 }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Ticket Table */}
      <div className="tkt-table-wrap tkt-scroll-view">
        <div style={{ minWidth: 860 }}>
          <div className="obq-table-header" style={{ display: "grid", gridTemplateColumns: COLS }}>
            <div>Ticket ID</div>
            <div>Subject / Agent</div>
            <div>Submitted By</div>
            <div style={{ textAlign: "center" }}>App Status</div>
            <div>Assigned To</div>
            <div>Created</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", background: "var(--bg2)", borderRadius: "0 0 12px 12px" }}>
            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text3)", fontSize: 13 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 36, display: "block", marginBottom: 10, opacity: .4 }}>inbox</span>
                No tickets match your filters.
              </div>
            )}
            {filtered.map((t, i) => (
              <div
                key={t.id}
                className="ticket-row"
                role="button"
                tabIndex={0}
                onClick={() => openDetail(t)}
                onKeyDown={e => e.key === "Enter" && openDetail(t)}
                style={{
                  display: "grid", gridTemplateColumns: COLS, gap: 12,
                  padding: "12px 16px", borderBottom: "1px solid var(--border)",
                  alignItems: "center", cursor: "pointer",
                  animation: "fadeIn 0.3s ease both", animationDelay: `${i * 35}ms`,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-crm)" }}>{t.id}</div>
                <div style={{ overflow: "hidden" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    Agent Onboarding — {t.agentName}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {t.agentName}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "var(--text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.submittedBy}</div>
                <div style={{ textAlign: "center" }}><StatusBadge status={t.appStatus} /></div>
                <div style={{ fontSize: 12, color: "var(--text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.assignedTo}</div>
                <div style={{ fontSize: 11, color: "var(--text3)" }}>{t.createdAt}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="tkt-cards-view">
        {filtered.map((t, i) => (
          <div
            key={t.id}
            className="tkt-card"
            role="button"
            tabIndex={0}
            onClick={() => openDetail(t)}
            onKeyDown={e => e.key === "Enter" && openDetail(t)}
            style={{ animation: "fadeIn 0.3s ease both", animationDelay: `${i * 40}ms` }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--accent-crm)" }}>{t.id}</span>
              <StatusBadge status={t.appStatus} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>{t.agentName}</div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text3)" }}>
              <span>{t.submittedBy}</span>
              <span>{t.assignedTo} · {t.createdAt}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Agent Form Link Modal ─────────────────────────────── */}
      {showFormLink && (
        <div className="crm-modal-overlay" ref={overlayRef} onClick={e => e.target === overlayRef.current && setShowFormLink(false)}>
          <div className="crm-modal" style={{ maxWidth: 460, padding: 28, textAlign: "center", position: "relative" }} onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setShowFormLink(false)}
              style={{ position: "absolute", top: 16, right: 16, background: "var(--bg3)", border: "none", width: 30, height: 30, borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--text3)" }}>close</span>
            </button>

            <div style={{ width: 56, height: 56, borderRadius: 14, background: "var(--accent-crm-light)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <span className="material-symbols-outlined" style={{ color: "var(--accent-crm)", fontSize: 28 }}>link</span>
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", margin: "0 0 6px" }}>Agent Onboarding Form</h2>
            <p style={{ fontSize: 13, color: "var(--text3)", margin: "0 0 20px", lineHeight: 1.5 }}>
              Send this link to a new agent for self-service registration.
            </p>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px", marginBottom: 20, gap: 8 }}>
              <span style={{ fontSize: 12, color: "var(--text)", wordBreak: "break-all", fontFamily: "monospace", fontWeight: 600, letterSpacing: "0.5px", textAlign: "left" }}>
                {AGENT_FORM_URL}
              </span>
              <button onClick={copyLink} title="Copy Link" style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text3)", display: "flex", alignItems: "center", justifyContent: "center", padding: 4, borderRadius: 6, flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{copyDone ? "check" : "content_copy"}</span>
              </button>
            </div>

            <button
              className="crm-btn crm-btn-primary"
              style={{ width: "100%", justifyContent: "center", padding: 13 }}
              onClick={() => window.open(AGENT_FORM_URL, "_blank")}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>open_in_new</span>
              Open in Tab
            </button>
          </div>
        </div>
      )}

      {/* ── Workflow Help Modal ───────────────────────────────── */}
      {showWorkflow && (
        <div className="crm-modal-overlay" onClick={() => setShowWorkflow(false)}>
          <div className="crm-modal" style={{ maxWidth: 560, padding: 32, position: "relative" }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowWorkflow(false)} style={{ position: "absolute", top: 20, right: 20, background: "var(--bg3)", border: "none", width: 32, height: 32, borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: "var(--text3)" }}>close</span>
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(99,102,241,.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="material-symbols-outlined" style={{ color: "var(--accent-crm)", fontSize: 24 }}>help</span>
              </div>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", margin: 0 }}>Agent Onboarding Workflow</h2>
                <div style={{ fontSize: 13, color: "var(--text3)", marginTop: 2 }}>Understanding application statuses</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {STATUS_KEY.map(({ status, desc, badgeClass }) => (
                <div key={status} style={{ display: "flex", gap: 12, padding: 12, background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 10 }}>
                  <span className={`badge ${badgeClass}`} style={{ width: 140, justifyContent: "center", flexShrink: 0 }}>{status}</span>
                  <div style={{ fontSize: 12.5, color: "var(--text2)", lineHeight: 1.5 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Internal Agent Request Modal ──────────────────────── */}
      {showInternal && (
        <div className="crm-modal-overlay" onClick={() => setShowInternal(false)}>
          <div className="crm-modal" style={{ maxWidth: 700, width: "100%" }} onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{ padding: "22px 28px", display: "flex", alignItems: "center", gap: 14, borderBottom: "1px solid var(--border)" }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: "var(--green-light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="material-symbols-outlined" style={{ color: "var(--green)", fontSize: 22 }}>person_add</span>
              </div>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 800, color: "var(--text)", margin: 0 }}>Internal Agent Request</h2>
                <p style={{ fontSize: 12, color: "var(--text3)", margin: "2px 0 0", fontWeight: 500 }}>Complete the internal registration form to begin boarding a new agent</p>
              </div>
              <button onClick={() => setShowInternal(false)} style={{ marginLeft: "auto", background: "var(--bg3)", border: "none", width: 32, height: 32, borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--text3)" }}>close</span>
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: "8px 28px 28px", maxHeight: "72vh", overflowY: "auto" }}>

              <SectionHeader num="01" title="Personal Information" />
              <div className="crm-field-row">
                <div className="crm-field" style={{ marginBottom: 0 }}>
                  <label>First Name *</label>
                  <input type="text" value={form.firstName} onChange={e => setF("firstName", e.target.value)} />
                </div>
                <div className="crm-field" style={{ marginBottom: 0 }}>
                  <label>Last Name *</label>
                  <input type="text" value={form.lastName} onChange={e => setF("lastName", e.target.value)} />
                </div>
              </div>
              <div className="crm-field-row" style={{ marginTop: 0 }}>
                <div className="crm-field" style={{ marginBottom: 0 }}>
                  <label>Phone Number *</label>
                  <input type="text" value={form.phone} onChange={e => setF("phone", e.target.value)} />
                </div>
                <div className="crm-field" style={{ marginBottom: 0 }}>
                  <label>Email Address *</label>
                  <input type="text" value={form.email} onChange={e => setF("email", e.target.value)} />
                </div>
              </div>

              <SectionHeader num="02" title="Agency Identity" />
              <div className="crm-field-row">
                <div className="crm-field" style={{ marginBottom: 0 }}>
                  <label>Company Name (If Applicable)</label>
                  <input type="text" value={form.companyName} onChange={e => setF("companyName", e.target.value)} />
                </div>
                <div className="crm-field" style={{ marginBottom: 0 }}>
                  <label>Referred By</label>
                  <input type="text" value={form.referrer} onChange={e => setF("referrer", e.target.value)} />
                </div>
              </div>
              <div className="crm-field">
                <label>Additional Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => setF("notes", e.target.value)} />
              </div>

              <SectionHeader num="03" title="Documents" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                <UploadField id="aonb_idDoc"   label="ID / DRIVER LICENSE" required />
                <UploadField id="aonb_voided"  label="VOIDED CHECK"        required />
                <UploadField id="aonb_einFile" label="EIN / TAX ID" />
              </div>

              {formError && (
                <div style={{ color: "var(--red, #ef4444)", fontSize: 12, marginTop: 10, marginBottom: 8 }}>{formError}</div>
              )}

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20, paddingTop: 18, borderTop: "1px solid var(--border)" }}>
                <button className="crm-btn crm-btn-ghost" onClick={() => setShowInternal(false)} style={{ padding: "10px 22px" }}>Cancel</button>
                <button className="crm-btn crm-btn-green" onClick={submitForm} disabled={submitting} style={{ padding: "10px 24px" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>rocket_launch</span>
                  {submitting ? "Submitting…" : "Submit Request"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
