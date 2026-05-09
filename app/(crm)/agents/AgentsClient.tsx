"use client"

import { useState, useMemo, useEffect } from "react"
import type { Agent } from "./page"

const COLORS = ["#6366f1","#8b5cf6","#06b6d4","#f43f5e","#f59e0b","#10b981","#3b82f6","#ec4899","#14b8a6","#f97316"]

const STATUS_STYLES: Record<string, React.CSSProperties> = {
  "Active":    { background: "rgba(16,185,129,.12)",  color: "#10b981" },
  "Inactive":  { background: "rgba(148,163,184,.12)", color: "var(--text3)" },
  "Suspended": { background: "rgba(239,68,68,.12)",   color: "#ef4444" },
  "Pending":   { background: "rgba(245,158,11,.12)",  color: "#f59e0b" },
}

const TABS = [
  { id: "overview",    label: "Overview",    icon: "person" },
  { id: "merchants",   label: "Merchants",   icon: "store" },
  { id: "sub-agents",  label: "Sub-Agents",  icon: "group" },
  { id: "performance", label: "Performance", icon: "bar_chart" },
  { id: "documents",   label: "Documents",   icon: "folder_open" },
  { id: "notes",       label: "Notes",       icon: "sticky_note_2" },
  { id: "residuals",   label: "Residuals",   icon: "payments" },
]

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase() || "??"
}

function formatDate(iso: string) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function tenure(joinDate: string) {
  if (!joinDate) return "—"
  const months = Math.floor((Date.now() - new Date(joinDate).getTime()) / (1000 * 60 * 60 * 24 * 30))
  return months >= 12 ? `${Math.floor(months / 12)}y ${months % 12}m` : `${months}m`
}

// ── Types ───────────────────────────────────────────────────
interface AgentForm {
  full_name: string; agent_code: string; email: string; phone: string
  status: string; tier: string; business_name: string; address: string
  tax_id: string; join_date: string; parent_agent_id: string
}

const EMPTY_FORM: AgentForm = {
  full_name: "", agent_code: "", email: "", phone: "",
  status: "Active", tier: "", business_name: "", address: "",
  tax_id: "", join_date: "", parent_agent_id: "",
}

// ── Mock merchant rows per agent ────────────────────────────
const AGENT_MERCHANTS: Record<number, { dba: string; mid: string; status: string }[]> = {
  1: [
    { dba: "El Rancho Cantina",      mid: "809234571", status: "Active" },
    { dba: "Pacific Rim Grocery",    mid: "701938462", status: "Active" },
    { dba: "Coastline Auto Detail",  mid: "583920471", status: "Active" },
    { dba: "Orange Blossom Bakery",  mid: "462810937", status: "Active" },
    { dba: "Sunset Nails & Spa",     mid: "349201837", status: "Active" },
  ],
  2: [
    { dba: "Harbor View Diner",         mid: "918273640", status: "Active" },
    { dba: "Brooklyn Print House",      mid: "731049285", status: "Active" },
    { dba: "Chelsea Wellness Studio",   mid: "649201837", status: "Inactive" },
  ],
  5: [
    { dba: "Peach State Florist",    mid: "968203714", status: "Active" },
    { dba: "Magnolia Music Studio",  mid: "820163947", status: "Active" },
    { dba: "Southern Comfort BBQ",   mid: "594038172", status: "Active" },
  ],
  9: [
    { dba: "Desert Bloom Gifts",     mid: "473920185", status: "Active" },
    { dba: "Cactus Auto Service",    mid: "374820196", status: "Active" },
    { dba: "Sonoran Craft Brewery",  mid: "284719063", status: "Active" },
  ],
}

// ── Main component ──────────────────────────────────────────
interface Props { agents: Agent[] }

export function AgentsClient({ agents: initial }: Props) {
  const [agents, setAgents]         = useState(initial)
  const [query, setQuery]           = useState("")
  const [statusFilter, setStatus]   = useState("")
  const [tierFilter, setTier]       = useState("")
  const [officeFilter, setOffice]   = useState("")
  const [selected, setSelected]     = useState<Agent | null>(null)
  const [activeTab, setActiveTab]   = useState("overview")
  const [formOpen, setFormOpen]     = useState(false)
  const [editingId, setEditingId]   = useState<number | null>(null)
  const [form, setForm]             = useState<AgentForm>(EMPTY_FORM)
  const [delId, setDelId]           = useState<number | null>(null)

  const offices = useMemo(() =>
    [...new Set(agents.map(a => a.whitelabel_office).filter(Boolean))].sort(),
  [agents])

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return agents.filter(a => {
      if (q && !a.full_name.toLowerCase().includes(q) && !a.email.toLowerCase().includes(q) && !a.agent_code.toLowerCase().includes(q)) return false
      if (statusFilter && a.status !== statusFilter) return false
      if (tierFilter && a.tier !== tierFilter) return false
      if (officeFilter && a.whitelabel_office !== officeFilter) return false
      return true
    })
  }, [agents, query, statusFilter, tierFilter, officeFilter])

  function openAdd() {
    setEditingId(null); setForm(EMPTY_FORM); setFormOpen(true)
  }

  function openEdit(agent: Agent) {
    setEditingId(agent.id)
    setForm({
      full_name: agent.full_name, agent_code: agent.agent_code,
      email: agent.email, phone: agent.phone, status: agent.status,
      tier: agent.tier, business_name: agent.business_name,
      address: agent.address, tax_id: "",
      join_date: agent.join_date,
      parent_agent_id: agent.parent_agent_id?.toString() ?? "",
    })
    setFormOpen(true)
  }

  function submitForm() {
    if (!form.full_name.trim() || !form.agent_code.trim()) {
      alert("Full Name and Agent Code are required.")
      return
    }
    const changes = {
      full_name: form.full_name.trim(), agent_code: form.agent_code.trim(),
      email: form.email.trim(), phone: form.phone.trim(),
      status: form.status as Agent["status"], tier: form.tier as Agent["tier"],
      business_name: form.business_name.trim(), address: form.address.trim(),
      join_date: form.join_date,
      parent_agent_id: form.parent_agent_id ? parseInt(form.parent_agent_id) : null,
    }
    if (editingId != null) {
      setAgents(prev => prev.map(a => a.id === editingId ? { ...a, ...changes } : a))
      setSelected(prev => prev?.id === editingId ? { ...prev, ...changes } : prev)
    } else {
      setAgents(prev => [...prev, {
        id: Date.now(), ...changes, merchant_count: 0,
        created_at: new Date().toISOString(), whitelabel_office: "",
      }])
    }
    setFormOpen(false); setEditingId(null)
  }

  function doDelete() {
    if (delId == null) return
    if (selected?.id === delId) setSelected(null)
    setAgents(prev => prev.filter(a => a.id !== delId))
    setDelId(null)
  }

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      if (formOpen)           setFormOpen(false)
      else if (delId != null) setDelId(null)
    }
    window.addEventListener("keydown", h)
    return () => window.removeEventListener("keydown", h)
  }, [formOpen, delId])

  const delAgent = agents.find(a => a.id === delId)

  // ── Detail view ─────────────────────────────────────────
  if (selected) {
    const agentIdx  = agents.findIndex(a => a.id === selected.id)
    const color     = COLORS[agentIdx % COLORS.length]
    const stStyle   = STATUS_STYLES[selected.status] ?? {}
    const subAgents = agents.filter(a => a.parent_agent_id === selected.id)
    const merchants = AGENT_MERCHANTS[selected.id] ?? []
    const parent    = selected.parent_agent_id ? agents.find(a => a.id === selected.parent_agent_id) : null

    return (
      <div className="dash-layout">
        <button className="tkt-back-btn" onClick={() => setSelected(null)}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
          Back to Agents
        </button>

        {/* Profile hero */}
        <div className="agt-profile-hero">
          <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
            <div className="agt-avatar-lg" style={{ background: color }}>
              {getInitials(selected.full_name)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", margin: 0 }}>{selected.full_name}</h2>
                <span className="agent-code">{selected.agent_code}</span>
                <span className="status-chip" style={stStyle}>{selected.status}</span>
                {selected.tier && <span className="tier-badge">{selected.tier}</span>}
              </div>
              {selected.business_name && (
                <div style={{ fontSize: 13, color: "var(--text3)", fontWeight: 500, marginBottom: 3 }}>{selected.business_name}</div>
              )}
              {selected.whitelabel_office && (
                <div style={{ fontSize: 12, color: "var(--text3)" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: "middle", marginRight: 3 }}>location_on</span>
                  {selected.whitelabel_office} Office
                </div>
              )}
            </div>
            <button
              onClick={() => openEdit(selected)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
              Edit Agent
            </button>
          </div>

          <div className="agt-stats-row">
            {[
              { num: selected.merchant_count, label: "Merchants" },
              { num: subAgents.length,         label: "Sub-Agents" },
              { num: selected.tier || "—",     label: "Residual Tier" },
              { num: tenure(selected.join_date), label: "Tenure" },
            ].map(s => (
              <div className="agt-stat" key={s.label}>
                <span className="agt-stat-num">{s.num}</span>
                <span className="agt-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tab bar */}
        <div className="agt-tabs">
          {TABS.map(tab => (
            <button key={tab.id} className={`agt-tab${activeTab === tab.id ? " active" : ""}`} onClick={() => setActiveTab(tab.id)}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{tab.icon}</span>
              {tab.label}
              {tab.id === "merchants"  && selected.merchant_count > 0 && <span className="agt-tab-count">{selected.merchant_count}</span>}
              {tab.id === "sub-agents" && subAgents.length > 0         && <span className="agt-tab-count">{subAgents.length}</span>}
            </button>
          ))}
        </div>

        {/* Tab panels */}
        <div style={{ marginTop: 20 }}>

          {activeTab === "overview" && (
            <div className="agt-overview-grid">
              <div className="dash-card-v2">
                <div className="dv2-title">Contact Information</div>
                <div className="agt-info-rows">
                  {[
                    { icon: "mail",        label: "Email",   val: selected.email || "—" },
                    { icon: "phone",       label: "Phone",   val: selected.phone || "—" },
                    { icon: "location_on", label: "Address", val: selected.address || "—" },
                  ].map(row => (
                    <div key={row.label} className="agt-info-row">
                      <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--text3)", marginTop: 1 }}>{row.icon}</span>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 2 }}>{row.label}</div>
                        <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 600 }}>{row.val}</div>
                      </div>
                    </div>
                  ))}
                  {parent && (
                    <div className="agt-info-row">
                      <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--text3)", marginTop: 1 }}>account_tree</span>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 2 }}>Parent Agent</div>
                        <button
                          onClick={() => { setSelected(parent); setActiveTab("overview") }}
                          style={{ fontSize: 13, color: "var(--accent)", fontWeight: 700, background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit" }}
                        >
                          {parent.full_name} ({parent.agent_code})
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="dash-card-v2">
                <div className="dv2-title">Agent Details</div>
                <div className="agt-info-rows">
                  {[
                    { icon: "badge",          label: "Agent Code",    val: selected.agent_code },
                    { icon: "business",       label: "Business Name", val: selected.business_name || "—" },
                    { icon: "calendar_today", label: "Join Date",     val: formatDate(selected.join_date) },
                    { icon: "corporate_fare", label: "Office",        val: selected.whitelabel_office || "—" },
                  ].map(row => (
                    <div key={row.label} className="agt-info-row">
                      <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--text3)", marginTop: 1 }}>{row.icon}</span>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 2 }}>{row.label}</div>
                        <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 600 }}>{row.val}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "merchants" && (
            <div className="dash-card-v2" style={{ animation: "fadeUp .3s ease" }}>
              <div className="dv2-title">
                Assigned Merchants
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text3)" }}>{selected.merchant_count} total</span>
              </div>
              {merchants.length === 0 ? (
                <EmptyState icon="store" title="No merchants assigned" sub="This agent has no merchants on record." />
              ) : (
                <>
                  {merchants.map((m, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: i < merchants.length - 1 ? "1px solid var(--border)" : "none" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(99,102,241,.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 17, color: "var(--accent)" }}>store</span>
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{m.dba}</div>
                          <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 1 }}>MID {m.mid}</div>
                        </div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 20, background: m.status === "Active" ? "rgba(16,185,129,.12)" : "rgba(148,163,184,.12)", color: m.status === "Active" ? "#10b981" : "var(--text3)" }}>{m.status}</span>
                    </div>
                  ))}
                  {selected.merchant_count > merchants.length && (
                    <div style={{ textAlign: "center", paddingTop: 12, color: "var(--text3)", fontSize: 12 }}>
                      +{selected.merchant_count - merchants.length} more merchants
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === "sub-agents" && (
            <div className="dash-card-v2" style={{ animation: "fadeUp .3s ease" }}>
              <div className="dv2-title">
                Sub-Agents
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text3)" }}>{subAgents.length} total</span>
              </div>
              {subAgents.length === 0 ? (
                <EmptyState icon="group" title="No sub-agents" sub="No agents are currently reporting to this agent." />
              ) : subAgents.map((sub, i) => {
                const subIdx   = agents.findIndex(a => a.id === sub.id)
                const subColor = COLORS[subIdx % COLORS.length]
                return (
                  <div key={sub.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: i < subAgents.length - 1 ? "1px solid var(--border)" : "none", cursor: "pointer" }} onClick={() => { setSelected(sub); setActiveTab("overview") }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: subColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                      {getInitials(sub.full_name)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{sub.full_name}</div>
                      <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{sub.agent_code}{sub.email ? ` · ${sub.email}` : ""}</div>
                    </div>
                    <span className="status-chip" style={STATUS_STYLES[sub.status] ?? {}}>{sub.status}</span>
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--text3)" }}>chevron_right</span>
                  </div>
                )
              })}
            </div>
          )}

          {activeTab === "performance" && (
            <div className="agt-overview-grid" style={{ animation: "fadeUp .3s ease" }}>
              <div className="dash-card-v2">
                <div className="dv2-title">Performance Summary</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  {[
                    { label: "Active Merchants", value: selected.merchant_count, icon: "store",       color: "#10b981" },
                    { label: "Sub-Agents",        value: subAgents.length,        icon: "group",       color: "#6366f1" },
                    { label: "Tier",              value: selected.tier || "N/A",  icon: "trending_up", color: "#f59e0b" },
                    { label: "YTD Residuals",     value: "$—",                    icon: "payments",    color: "#8b5cf6" },
                  ].map(s => (
                    <div key={s.label} style={{ padding: 16, background: "var(--bg3)", borderRadius: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18, color: s.color }}>{s.icon}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".5px" }}>{s.label}</span>
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: "var(--text)" }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="dash-card-v2">
                <div className="dv2-title">Activity Timeline</div>
                <EmptyState icon="bar_chart" title="No activity data" sub="Historical performance data will appear here." />
              </div>
            </div>
          )}

          {activeTab === "documents" && (
            <div className="dash-card-v2" style={{ animation: "fadeUp .3s ease" }}>
              <div className="dv2-title">
                Agent Documents
                <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>upload_file</span>
                  Upload Document
                </button>
              </div>
              <EmptyState icon="folder_open" title="No documents uploaded" sub="Upload W-9, agreements, and compliance files for this agent." />
            </div>
          )}

          {activeTab === "notes" && (
            <div className="dash-card-v2" style={{ animation: "fadeUp .3s ease" }}>
              <div className="dv2-title">
                Internal Notes
                <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>note_add</span>
                  Add Note
                </button>
              </div>
              <EmptyState icon="sticky_note_2" title="No notes yet" sub="Add internal notes to track important context for this agent." />
            </div>
          )}

          {activeTab === "residuals" && (
            <div className="dash-card-v2" style={{ animation: "fadeUp .3s ease" }}>
              <div className="dv2-title">Residuals</div>
              <EmptyState icon="payments" title="No residual data" sub="Residual statements will appear here once uploaded." />
            </div>
          )}

        </div>

        {formOpen && <AgentFormModal form={form} setForm={setForm} editingId={editingId} agents={agents} onClose={() => setFormOpen(false)} onSubmit={submitForm} />}
      </div>
    )
  }

  // ── List view ────────────────────────────────────────────
  return (
    <div className="dash-layout">

      <div className="dash-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", margin: 0, letterSpacing: -0.5 }}>Agents</h1>
          <p style={{ fontSize: 13, color: "var(--text3)", margin: "3px 0 0", fontWeight: 500 }}>
            Sales representatives & field agents
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13, color: "var(--text3)", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 8, padding: "7px 14px" }}>
            {agents.length} agent{agents.length !== 1 ? "s" : ""}
          </span>
          <button onClick={openAdd} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>person_add</span>
            Add Agent
          </button>
        </div>
      </div>

      <div className="tkt-filter-bar">
        <div className="tkt-search" style={{ flex: 1 }}>
          <span className="material-symbols-outlined">search</span>
          <input type="text" placeholder="Search by name, email, or agent code..." value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <div className="tkt-filters">
          <select className="tkt-filter-sel" value={statusFilter} onChange={e => setStatus(e.target.value)}>
            <option value="">All Status</option>
            <option>Active</option><option>Inactive</option><option>Suspended</option><option>Pending</option>
          </select>
          <select className="tkt-filter-sel" value={tierFilter} onChange={e => setTier(e.target.value)}>
            <option value="">All Tiers</option>
            <option>35%</option><option>45%</option><option>55%</option>
          </select>
          <select className="tkt-filter-sel" value={officeFilter} onChange={e => setOffice(e.target.value)}>
            <option value="">All Offices</option>
            {offices.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div className="tkt-filter-divider" />
        <span className="tkt-result-count">{filtered.length} agent{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Desktop table */}
      <div className="agt-table-outer">
        <div className="agt-table-wrap">
          <table className="agt-table">
            <thead>
              <tr>
                <th>Agent</th><th>Code</th><th>Email</th><th>Tier</th>
                <th>Status</th><th style={{ textAlign: "center" }}>Merchants</th>
                <th>Added</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: "48px 20px", color: "var(--text3)" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 36, display: "block", marginBottom: 10, opacity: 0.4 }}>support_agent</span>
                  No agents match your search.
                </td></tr>
              ) : filtered.map((a, i) => {
                const color   = COLORS[i % COLORS.length]
                const stStyle = STATUS_STYLES[a.status] ?? {}
                return (
                  <tr key={a.id} style={{ cursor: "pointer" }} onClick={() => { setSelected(a); setActiveTab("overview") }}>
                    <td>
                      <div className="agent-row-info">
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                          {getInitials(a.full_name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: "var(--text)" }}>{a.full_name}</div>
                          {a.whitelabel_office && <div style={{ fontSize: 11, color: "var(--text3)" }}>{a.whitelabel_office}</div>}
                        </div>
                      </div>
                    </td>
                    <td><span className="agent-code">{a.agent_code || "—"}</span></td>
                    <td style={{ color: "var(--text3)" }}>{a.email || "—"}</td>
                    <td>{a.tier ? <span className="tier-badge">{a.tier}</span> : <span style={{ color: "var(--text3)" }}>—</span>}</td>
                    <td><span className="status-chip" style={stStyle}>{a.status}</span></td>
                    <td style={{ textAlign: "center" }}>
                      <span style={{ fontWeight: 700, color: a.merchant_count > 0 ? "var(--accent)" : "var(--text3)" }}>{a.merchant_count}</span>
                    </td>
                    <td style={{ color: "var(--text3)" }}>{formatDate(a.created_at)}</td>
                    <td style={{ whiteSpace: "nowrap" }} onClick={e => e.stopPropagation()}>
                      <span className="material-symbols-outlined usr-action-icon" onClick={() => openEdit(a)} title="Edit agent">edit</span>
                      <span className="material-symbols-outlined usr-action-icon usr-action-danger" onClick={() => setDelId(a.id)} title="Delete agent">delete</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="agt-cards-outer">
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text3)", fontSize: 13 }}>No agents match your search.</div>
        )}
        {filtered.map((a, i) => {
          const color   = COLORS[i % COLORS.length]
          const stStyle = STATUS_STYLES[a.status] ?? {}
          return (
            <div key={a.id} className="tkt-card" style={{ padding: "14px 16px", cursor: "pointer" }} onClick={() => { setSelected(a); setActiveTab("overview") }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                  {getInitials(a.full_name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{a.full_name}</div>
                  <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.email || "—"}</div>
                </div>
                <span className="status-chip" style={stStyle}>{a.status}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="agent-code">{a.agent_code}</span>
                  {a.tier && <span className="tier-badge">{a.tier}</span>}
                  <span style={{ fontSize: 11, color: "var(--text3)" }}>{a.merchant_count} merchant{a.merchant_count !== 1 ? "s" : ""}</span>
                </div>
                <div style={{ display: "flex", gap: 8 }} onClick={e => e.stopPropagation()}>
                  <span className="material-symbols-outlined usr-action-icon" onClick={() => openEdit(a)} title="Edit">edit</span>
                  <span className="material-symbols-outlined usr-action-icon usr-action-danger" onClick={() => setDelId(a.id)} title="Delete">delete</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {formOpen && <AgentFormModal form={form} setForm={setForm} editingId={editingId} agents={agents} onClose={() => setFormOpen(false)} onSubmit={submitForm} />}

      {delId != null && (
        <div style={{ position: "fixed", inset: 0, zIndex: 20000, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeIn .18s ease" }} onClick={e => { if (e.target === e.currentTarget) setDelId(null) }}>
          <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 16, padding: "28px 32px", maxWidth: 380, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,.5)", textAlign: "center", animation: "fadeUp .2s ease" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 40, color: "#ef4444", display: "block", marginBottom: 12 }}>delete_forever</span>
            <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: "var(--text)" }}>Delete Agent?</h3>
            <p style={{ margin: "0 0 22px", fontSize: 13, color: "var(--text3)", lineHeight: 1.5 }}>
              Remove <strong>{delAgent?.full_name}</strong> ({delAgent?.agent_code}) from the system? This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={() => setDelId(null)} style={{ padding: "9px 22px", borderRadius: 10, fontWeight: 600, fontSize: 13, background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--text)", cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
              <button onClick={doDelete} style={{ padding: "9px 22px", borderRadius: 10, fontWeight: 700, fontSize: 13, background: "#ef4444", border: "none", color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────

function EmptyState({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text3)" }}>
      <span className="material-symbols-outlined" style={{ fontSize: 40, display: "block", marginBottom: 12, opacity: 0.35 }}>{icon}</span>
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text2)", marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 12 }}>{sub}</div>
    </div>
  )
}

// ── Agent Form Modal ─────────────────────────────────────────

interface FormModalProps {
  form: AgentForm
  setForm: React.Dispatch<React.SetStateAction<AgentForm>>
  editingId: number | null
  agents: Agent[]
  onClose: () => void
  onSubmit: () => void
}

function AgentFormModal({ form, setForm, editingId, agents, onClose, onSubmit }: FormModalProps) {
  const set = (field: keyof AgentForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))

  const inp: React.CSSProperties = {
    width: "100%", padding: "10px 14px", background: "var(--bg3)",
    border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)",
    fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box",
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 5000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.45)", backdropFilter: "blur(4px)", animation: "fadeIn .18s ease" }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 20, padding: 28, width: 560, maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,.2)", animation: "fadeUp .22s ease" }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", margin: "0 0 20px", display: "flex", alignItems: "center", gap: 8 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{editingId ? "edit" : "person_add"}</span>
          {editingId ? "Edit Agent" : "Add New Agent"}
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
          <FF label="Full Name *">
            <input type="text" placeholder="e.g. Sofia Reyes" value={form.full_name} onChange={set("full_name")} style={inp} />
          </FF>
          <FF label="Agent Code *">
            <input type="text" placeholder="e.g. 4521-011" value={form.agent_code} onChange={set("agent_code")} style={inp} />
          </FF>
          <FF label="Email">
            <input type="email" placeholder="agent@example.com" value={form.email} onChange={set("email")} style={inp} />
          </FF>
          <FF label="Phone">
            <input type="tel" placeholder="(555) 000-0000" value={form.phone} onChange={set("phone")} style={inp} />
          </FF>
          <FF label="Status">
            <select value={form.status} onChange={set("status")} style={{ ...inp, appearance: "none" as const }}>
              <option>Active</option><option>Inactive</option><option>Suspended</option><option>Pending</option>
            </select>
          </FF>
          <FF label="Tier">
            <select value={form.tier} onChange={set("tier")} style={{ ...inp, appearance: "none" as const }}>
              <option value="">— None —</option>
              <option>35%</option><option>45%</option><option>55%</option>
            </select>
          </FF>
          <FF label="Business Name" span>
            <input type="text" placeholder="Optional" value={form.business_name} onChange={set("business_name")} style={inp} />
          </FF>
          <FF label="Address" span>
            <input type="text" placeholder="123 Main St, City, ST 12345" value={form.address} onChange={set("address")} style={inp} />
          </FF>
          <FF label="Tax ID (masked)">
            <input type="text" placeholder="***-**-1234" value={form.tax_id} onChange={set("tax_id")} style={inp} />
          </FF>
          <FF label="Join Date">
            <input type="date" value={form.join_date} onChange={set("join_date")} style={inp} />
          </FF>
          <FF label="Parent Agent" span>
            <select value={form.parent_agent_id} onChange={set("parent_agent_id")} style={{ ...inp, appearance: "none" as const }}>
              <option value="">— None —</option>
              {agents.filter(a => a.id !== editingId).map(a => (
                <option key={a.id} value={a.id}>{a.full_name} ({a.agent_code})</option>
              ))}
            </select>
          </FF>
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20 }}>
          <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: 10, border: "1px solid var(--border)", background: "transparent", color: "var(--text3)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
          <button onClick={onSubmit} style={{ padding: "9px 18px", borderRadius: 10, border: "none", background: "var(--accent)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            {editingId ? "Save Changes" : "Add Agent"}
          </button>
        </div>
      </div>
    </div>
  )
}

function FF({ label, children, span }: { label: string; children: React.ReactNode; span?: boolean }) {
  return (
    <div style={{ marginBottom: 14, ...(span ? { gridColumn: "span 2" } : {}) }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  )
}
