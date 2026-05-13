"use client"

import { useState, useMemo, useRef, useEffect } from "react"

// ── Types ──────────────────────────────────────────────────────────────────

type Stage =
  | "New Inquiry" | "Qualified" | "Proposal Sent" | "Site Planning"
  | "Awaiting Approval" | "Approved" | "Installation Scheduled"

type Priority = "Low" | "Medium" | "High"
type LeadView = "pipeline" | "list"
type DetailTab = "overview" | "proposal" | "equipment" | "costing" | "floorplan"

interface EquipmentItem { name: string; qty: number; unitPrice: number }

interface Lead {
  id: string
  companyName: string
  industry: string
  locations: number
  website?: string
  contactName: string
  contactPhone?: string
  contactEmail?: string
  leadSource?: string
  budget?: number
  services?: string
  notes?: string
  assignedRep?: string
  priority: Priority
  stage: Stage
  createdAt: string
  updatedAt: string
  equipment?: EquipmentItem[]
  proposalNotes?: string
  contractTerm?: string
  monthlyFee?: number
  setupFee?: number
}

// ── Config ─────────────────────────────────────────────────────────────────

const STAGES: Stage[] = [
  "New Inquiry", "Qualified", "Proposal Sent", "Site Planning",
  "Awaiting Approval", "Approved", "Installation Scheduled",
]

const STAGE_COLOR: Record<Stage, string> = {
  "New Inquiry": "#6366f1",
  "Qualified": "#06b6d4",
  "Proposal Sent": "#f59e0b",
  "Site Planning": "#8b5cf6",
  "Awaiting Approval": "#f97316",
  "Approved": "#10b981",
  "Installation Scheduled": "#3b82f6",
}

const STAGE_ICON: Record<Stage, string> = {
  "New Inquiry": "person_add",
  "Qualified": "verified",
  "Proposal Sent": "send",
  "Site Planning": "map",
  "Awaiting Approval": "pending",
  "Approved": "check_circle",
  "Installation Scheduled": "build",
}

const PRIORITY_STYLE: Record<Priority, { color: string; bg: string }> = {
  Low: { color: "#10b981", bg: "rgba(16,185,129,.1)" },
  Medium: { color: "#f59e0b", bg: "rgba(245,158,11,.1)" },
  High: { color: "#ef4444", bg: "rgba(239,68,68,.1)" },
}

const REPS = ["Hussein Khalil", "Joan Huang", "Moe Kadi", "Zu Jia He Cen", "Tomas Vega", "Amara Singh"]

// ── Mock data ──────────────────────────────────────────────────────────────

const MOCK_LEADS: Lead[] = [
  {
    id: "L-001", companyName: "Sunrise Bistro", industry: "Restaurant", locations: 2,
    website: "sunrisebistro.com", contactName: "Marco Deluca",
    contactPhone: "+1 (312) 555-0182", contactEmail: "marco@sunrisebistro.com",
    leadSource: "Referral", budget: 8500, services: "POS System, Kitchen Display",
    notes: "Expanding to a second location. Interested in tableside ordering.",
    assignedRep: "Hussein Khalil", priority: "High", stage: "Proposal Sent",
    createdAt: "Apr 28, 2026", updatedAt: "May 9, 2026",
    equipment: [
      { name: "Clover Station Duo", qty: 2, unitPrice: 1299 },
      { name: "Kitchen Display System", qty: 1, unitPrice: 899 },
      { name: "Receipt Printer", qty: 2, unitPrice: 249 },
    ],
    proposalNotes: "Custom dual-pricing setup requested. Reviewed kitchen display placement with chef.",
    contractTerm: "3-Year", monthlyFee: 89, setupFee: 350,
  },
  {
    id: "L-002", companyName: "Ironforge Fitness", industry: "Gym & Fitness", locations: 1,
    contactName: "Dana Perkins", contactPhone: "+1 (415) 555-0247",
    contactEmail: "dana@ironforge.io", leadSource: "Website", budget: 4200,
    services: "POS System, Membership Terminal",
    notes: "New gym opening June 15. Needs full POS + recurring billing integration.",
    assignedRep: "Joan Huang", priority: "High", stage: "Site Planning",
    createdAt: "May 1, 2026", updatedAt: "May 10, 2026",
    equipment: [
      { name: "PAX A920 Terminal", qty: 3, unitPrice: 549 },
      { name: "Receipt Printer", qty: 1, unitPrice: 249 },
    ],
    proposalNotes: "Awaiting floor plan from contractor. Equipment placement TBD.",
    contractTerm: "2-Year", monthlyFee: 69, setupFee: 200,
  },
  {
    id: "L-003", companyName: "Harvest Table", industry: "Restaurant", locations: 1,
    website: "harvesttablecafe.com", contactName: "Priya Anand",
    contactPhone: "+1 (617) 555-0391", contactEmail: "priya@harvesttable.com",
    leadSource: "Trade Show", budget: 3500, services: "POS System, Online Ordering",
    notes: "Interested in QR code ordering and loyalty program integration.",
    assignedRep: "Moe Kadi", priority: "Medium", stage: "Qualified",
    createdAt: "May 3, 2026", updatedAt: "May 8, 2026",
    equipment: [
      { name: "Clover Mini", qty: 2, unitPrice: 799 },
      { name: "Customer Display", qty: 2, unitPrice: 199 },
    ],
    contractTerm: "2-Year", monthlyFee: 59, setupFee: 150,
  },
  {
    id: "L-004", companyName: "NovaMed Pharmacy", industry: "Healthcare / Retail", locations: 3,
    website: "novamed.com", contactName: "Dr. Sam Wu",
    contactPhone: "+1 (718) 555-0128", contactEmail: "swu@novamed.com",
    leadSource: "Cold Outreach", budget: 15000,
    services: "Multi-location POS, Inventory Management",
    notes: "HIPAA compliance is a key requirement. Needs inventory synced across 3 locations.",
    assignedRep: "Hussein Khalil", priority: "High", stage: "Awaiting Approval",
    createdAt: "Apr 22, 2026", updatedAt: "May 11, 2026",
    equipment: [
      { name: "Clover Station Solo", qty: 3, unitPrice: 999 },
      { name: "Barcode Scanner", qty: 6, unitPrice: 149 },
      { name: "Cash Drawer", qty: 3, unitPrice: 119 },
      { name: "Receipt Printer", qty: 3, unitPrice: 249 },
    ],
    proposalNotes: "Legal team reviewing contract. HIPAA compliance addendum attached.",
    contractTerm: "4-Year", monthlyFee: 149, setupFee: 750,
  },
  {
    id: "L-005", companyName: "Coastal Threads", industry: "Retail / Apparel", locations: 1,
    website: "coastalthreads.com", contactName: "Mia Torres",
    contactPhone: "+1 (305) 555-0463", contactEmail: "mia@coastalthreads.com",
    leadSource: "Instagram Ad", budget: 2800, services: "POS System, Inventory",
    notes: "Boutique clothing store. Interested in e-commerce integration.",
    assignedRep: "Amara Singh", priority: "Medium", stage: "New Inquiry",
    createdAt: "May 7, 2026", updatedAt: "May 7, 2026",
    equipment: [
      { name: "Clover Mini", qty: 1, unitPrice: 799 },
      { name: "Barcode Scanner", qty: 1, unitPrice: 149 },
    ],
  },
  {
    id: "L-006", companyName: "Vertex Auto Group", industry: "Automotive", locations: 4,
    website: "vertexauto.com", contactName: "James Okafor",
    contactPhone: "+1 (214) 555-0779", contactEmail: "j.okafor@vertexauto.com",
    leadSource: "Partner Referral", budget: 22000,
    services: "Multi-location POS, Service Desk Terminals",
    notes: "Large deal. Decision by end of May. Competitor quote in hand from Square.",
    assignedRep: "Hussein Khalil", priority: "High", stage: "Approved",
    createdAt: "Apr 15, 2026", updatedAt: "May 10, 2026",
    equipment: [
      { name: "Clover Station Duo", qty: 4, unitPrice: 1299 },
      { name: "PAX A920 Terminal", qty: 8, unitPrice: 549 },
      { name: "Receipt Printer", qty: 4, unitPrice: 249 },
      { name: "Cash Drawer", qty: 4, unitPrice: 119 },
    ],
    proposalNotes: "Contract signed. Scheduling site survey for all 4 locations.",
    contractTerm: "4-Year", monthlyFee: 249, setupFee: 1200,
  },
  {
    id: "L-007", companyName: "Luminary Spa & Salon", industry: "Beauty & Wellness", locations: 1,
    contactName: "Sophie Laurent", contactPhone: "+1 (310) 555-0552",
    contactEmail: "sophie@luminaryspa.com", leadSource: "Referral", budget: 3000,
    services: "POS System, Appointment Booking",
    notes: "Day spa + hair salon. Wants integrated booking and payment.",
    assignedRep: "Joan Huang", priority: "Medium", stage: "New Inquiry",
    createdAt: "May 9, 2026", updatedAt: "May 9, 2026",
  },
  {
    id: "L-008", companyName: "Ridgeline Brewing Co.", industry: "Food & Beverage", locations: 2,
    website: "ridgelinebrewing.com", contactName: "Kyle Baxter",
    contactPhone: "+1 (503) 555-0841", contactEmail: "kyle@ridgelinebrewing.com",
    leadSource: "Website", budget: 6500, services: "POS System, Tab Management, Online Menu",
    notes: "Taproom + outdoor beer garden. Needs mobile terminals for outdoor service.",
    assignedRep: "Moe Kadi", priority: "Medium", stage: "Proposal Sent",
    createdAt: "May 2, 2026", updatedAt: "May 8, 2026",
    equipment: [
      { name: "PAX A920 Terminal", qty: 4, unitPrice: 549 },
      { name: "Clover Mini", qty: 2, unitPrice: 799 },
      { name: "Receipt Printer", qty: 2, unitPrice: 249 },
    ],
    proposalNotes: "Waiting on decision from ownership group. Follow up scheduled May 14.",
    contractTerm: "3-Year", monthlyFee: 99, setupFee: 300,
  },
  {
    id: "L-009", companyName: "Peak Summit Hotels", industry: "Hospitality", locations: 2,
    website: "peaksummithotels.com", contactName: "Rachel Kim",
    contactPhone: "+1 (702) 555-0334", contactEmail: "rkim@peaksummit.com",
    leadSource: "Cold Outreach", budget: 18000,
    services: "Front Desk POS, Restaurant POS, Bar Terminals",
    notes: "Two boutique hotels. Need separate systems for restaurant, bar, and front desk.",
    assignedRep: "Hussein Khalil", priority: "High", stage: "Installation Scheduled",
    createdAt: "Apr 10, 2026", updatedAt: "May 11, 2026",
    equipment: [
      { name: "Clover Station Duo", qty: 4, unitPrice: 1299 },
      { name: "PAX A920 Terminal", qty: 6, unitPrice: 549 },
      { name: "Kitchen Display System", qty: 2, unitPrice: 899 },
      { name: "Receipt Printer", qty: 6, unitPrice: 249 },
      { name: "Cash Drawer", qty: 4, unitPrice: 119 },
    ],
    proposalNotes: "Installation scheduled May 20–22. Site survey completed.",
    contractTerm: "4-Year", monthlyFee: 229, setupFee: 1000,
  },
  {
    id: "L-010", companyName: "Metro Deli & Market", industry: "Grocery / Deli", locations: 1,
    contactName: "Ari Goldberg", contactPhone: "+1 (212) 555-0617",
    contactEmail: "ari@metrodeli.com", leadSource: "Cold Outreach", budget: 5000,
    services: "POS System, EBT, Scale Integration",
    notes: "Needs EBT/SNAP support and scale integration for deli counter.",
    assignedRep: "Zu Jia He Cen", priority: "Medium", stage: "Qualified",
    createdAt: "May 5, 2026", updatedAt: "May 9, 2026",
    equipment: [
      { name: "Clover Station Solo", qty: 2, unitPrice: 999 },
      { name: "Receipt Printer", qty: 2, unitPrice: 249 },
      { name: "Barcode Scanner", qty: 2, unitPrice: 149 },
    ],
    contractTerm: "3-Year", monthlyFee: 79, setupFee: 250,
  },
  {
    id: "L-011", companyName: "Greenway Childcare", industry: "Education / Childcare", locations: 1,
    contactName: "Patricia Osei", contactPhone: "+1 (404) 555-0282",
    contactEmail: "patricia@greenway.edu", leadSource: "Referral", budget: 1800,
    services: "Payment Terminal, Parent App Integration",
    notes: "Non-profit childcare. Budget is tight. Needs simple payment solution.",
    assignedRep: "Amara Singh", priority: "Low", stage: "New Inquiry",
    createdAt: "May 10, 2026", updatedAt: "May 10, 2026",
  },
  {
    id: "L-012", companyName: "Titanium CrossFit", industry: "Gym & Fitness", locations: 1,
    website: "titaniumcrossfit.com", contactName: "Derrick Moore",
    contactPhone: "+1 (480) 555-0995", contactEmail: "d.moore@titaniumcf.com",
    leadSource: "Social Media", budget: 3200, services: "POS System, Membership Management",
    notes: "Fast-growing gym. Needs POS with membership tracking.",
    assignedRep: "Tomas Vega", priority: "Medium", stage: "Site Planning",
    createdAt: "May 4, 2026", updatedAt: "May 9, 2026",
    equipment: [
      { name: "PAX A920 Terminal", qty: 2, unitPrice: 549 },
      { name: "Receipt Printer", qty: 1, unitPrice: 249 },
    ],
    contractTerm: "2-Year", monthlyFee: 59, setupFee: 150,
  },
]

// ── Shared field style ─────────────────────────────────────────────────────

const fieldSt: React.CSSProperties = {
  width: "100%", padding: "9px 13px", background: "var(--bg3)",
  border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)",
  fontSize: 13, fontFamily: "'Mulish', sans-serif", outline: "none",
  boxSizing: "border-box", fontWeight: 600,
}

// ── Small reusables ────────────────────────────────────────────────────────

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color, background: bg, padding: "3px 9px", borderRadius: 20, whiteSpace: "nowrap" }}>
      {label}
    </span>
  )
}

function SectionHeader({ icon, label }: { icon: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "20px 0 14px", paddingBottom: 8, borderBottom: "1px solid var(--border)" }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--accent-crm-light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span className="material-symbols-outlined" style={{ fontSize: 15, color: "var(--accent-crm)" }}>{icon}</span>
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1.2px", color: "var(--text3)" }}>{label}</span>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  )
}

function FieldRow({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{children}</div>
}

function InfoTile({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 12, padding: "13px 15px", display: "flex", gap: 11, alignItems: "center" }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: color + "22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 17, color }}>{icon}</span>
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>{label}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{value}</div>
      </div>
    </div>
  )
}

function Overlay({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose])
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 5000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.45)", backdropFilter: "blur(4px)", padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      {children}
    </div>
  )
}

function Toast({ msg }: { msg: string }) {
  return (
    <div style={{ position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)", background: "#10b981", color: "#fff", borderRadius: 14, padding: "11px 22px", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 8, zIndex: 9999, boxShadow: "0 8px 32px rgba(0,0,0,.2)", pointerEvents: "none" as const }}>
      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span>
      {msg}
    </div>
  )
}

// ── Lead Card (Kanban) ─────────────────────────────────────────────────────

function LeadCard({ lead, onOpen, onDragStart }: {
  lead: Lead
  onOpen: (l: Lead) => void
  onDragStart: (e: React.DragEvent, id: string) => void
}) {
  const pStyle = PRIORITY_STYLE[lead.priority]
  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, lead.id)}
      onClick={() => onOpen(lead)}
      style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px", cursor: "pointer", transition: ".15s", marginBottom: 8, boxShadow: "0 1px 6px rgba(0,0,0,.05)" }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = STAGE_COLOR[lead.stage]; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,.1)" }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 6px rgba(0,0,0,.05)" }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", lineHeight: 1.3 }}>{lead.companyName}</div>
        <Badge label={lead.priority} color={pStyle.color} bg={pStyle.bg} />
      </div>
      <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 8, fontWeight: 600 }}>{lead.industry}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text2)", marginBottom: 8 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 13, color: "var(--text3)" }}>person</span>
        {lead.contactName}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid var(--border)" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#10b981" }}>
          {lead.budget ? `$${lead.budget.toLocaleString()}` : "—"}
        </span>
        {lead.assignedRep && (
          <span style={{ fontSize: 11, color: "var(--text3)", fontWeight: 600 }}>{lead.assignedRep.split(" ")[0]}</span>
        )}
      </div>
    </div>
  )
}

// ── Kanban Column ──────────────────────────────────────────────────────────

function KanbanColumn({ stage, leads, onDrop, onOpen, onDragStart }: {
  stage: Stage; leads: Lead[]
  onDrop: (stage: Stage) => void
  onOpen: (l: Lead) => void
  onDragStart: (e: React.DragEvent, id: string) => void
}) {
  const color = STAGE_COLOR[stage]
  const total = leads.reduce((s, l) => s + (l.budget ?? 0), 0)
  const [over, setOver] = useState(false)

  return (
    <div
      onDragOver={e => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={() => { setOver(false); onDrop(stage) }}
      style={{ minWidth: 230, flex: "0 0 230px", background: over ? color + "0a" : "var(--bg3)", border: `1px solid ${over ? color + "55" : "var(--border)"}`, borderRadius: 14, transition: ".15s" }}
    >
      <div style={{ padding: "12px 14px 10px", borderBottom: "1px solid var(--border)", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
            <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text)" }}>{stage}</span>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, background: color + "22", color, padding: "2px 8px", borderRadius: 20 }}>{leads.length}</span>
        </div>
        {total > 0 && (
          <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 3, fontWeight: 600 }}>${total.toLocaleString()}</div>
        )}
      </div>
      <div style={{ padding: "0 8px 8px" }}>
        {leads.map(l => (
          <LeadCard key={l.id} lead={l} onOpen={onOpen} onDragStart={onDragStart} />
        ))}
        {leads.length === 0 && (
          <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text3)", fontSize: 12 }}>No leads</div>
        )}
      </div>
    </div>
  )
}

// ── Lead Detail ────────────────────────────────────────────────────────────

function LeadDetail({ lead, onClose, onStageChange }: {
  lead: Lead; onClose: () => void; onStageChange: (id: string, s: Stage) => void
}) {
  const [tab, setTab] = useState<DetailTab>("overview")
  const color = STAGE_COLOR[lead.stage]
  const pStyle = PRIORITY_STYLE[lead.priority]
  const stageIdx = STAGES.indexOf(lead.stage)
  const eqTotal = (lead.equipment ?? []).reduce((s, e) => s + e.qty * e.unitPrice, 0)
  const annualRevenue = (lead.monthlyFee ?? 0) * 12
  const contractYears = lead.contractTerm ? parseInt(lead.contractTerm) : 0

  const TABS: { id: DetailTab; icon: string; label: string }[] = [
    { id: "overview", icon: "dashboard", label: "Overview" },
    { id: "proposal", icon: "handshake", label: "Proposal" },
    { id: "equipment", icon: "devices", label: "Equipment" },
    { id: "costing", icon: "analytics", label: "Costing & ROI" },
    { id: "floorplan", icon: "map", label: "Floor Plan" },
  ]

  return (
    <div>
      {/* Back */}
      <button onClick={onClose} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 9, fontSize: 12, fontWeight: 700, color: "var(--text2)", cursor: "pointer", fontFamily: "inherit", marginBottom: 18 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
        Back to Pipeline
      </button>

      {/* Hero */}
      <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 16, padding: "22px 24px", marginBottom: 12, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: color }} />
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: color + "22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 26, color }}>{STAGE_ICON[lead.stage]}</span>
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", lineHeight: 1.2 }}>{lead.companyName}</div>
              <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 4, display: "flex", gap: 10, flexWrap: "wrap" as const }}>
                <span>{lead.industry}</span>
                <span>·</span>
                <span>{lead.locations} location{lead.locations > 1 ? "s" : ""}</span>
                {lead.website && <><span>·</span><span>{lead.website}</span></>}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" as const }}>
                <Badge label={lead.stage} color={color} bg={color + "18"} />
                <Badge label={lead.priority} color={pStyle.color} bg={pStyle.bg} />
                {lead.assignedRep && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text3)", display: "flex", alignItems: "center", gap: 4 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 13 }}>person</span>
                    {lead.assignedRep}
                  </span>
                )}
              </div>
            </div>
          </div>
          {/* KPI tiles */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const }}>
            {lead.budget && (
              <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 16px", textAlign: "center" as const, minWidth: 90 }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#10b981" }}>${lead.budget.toLocaleString()}</div>
                <div style={{ fontSize: 10, color: "var(--text3)", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginTop: 2 }}>Budget</div>
              </div>
            )}
            {lead.monthlyFee && (
              <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 16px", textAlign: "center" as const, minWidth: 90 }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: "var(--accent-crm)" }}>${lead.monthlyFee}/mo</div>
                <div style={{ fontSize: 10, color: "var(--text3)", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginTop: 2 }}>Monthly</div>
              </div>
            )}
            <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 16px", textAlign: "center" as const, minWidth: 80 }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: "var(--text)" }}>{lead.locations}</div>
              <div style={{ fontSize: 10, color: "var(--text3)", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginTop: 2 }}>Locations</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stage tracker */}
      <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 20px", marginBottom: 12, overflowX: "auto" as const }}>
        <div style={{ display: "flex", alignItems: "center", minWidth: "max-content" }}>
          {STAGES.map((s, i) => {
            const past = i < stageIdx
            const current = i === stageIdx
            const sc = STAGE_COLOR[s]
            return (
              <div key={s} style={{ display: "flex", alignItems: "center" }}>
                <button
                  onClick={() => onStageChange(lead.id, s)}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "6px 10px", borderRadius: 8, border: "none", cursor: "pointer", background: current ? sc + "18" : "transparent", outline: current ? `2px solid ${sc}` : "2px solid transparent", outlineOffset: -2, transition: ".15s", fontFamily: "inherit" }}
                >
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: past || current ? sc : "var(--bg3)", border: `2px solid ${past || current ? sc : "var(--border)"}`, display: "flex", alignItems: "center", justifyContent: "center", transition: ".15s" }}>
                    {past
                      ? <span className="material-symbols-outlined" style={{ fontSize: 14, color: "#fff" }}>check</span>
                      : <span className="material-symbols-outlined" style={{ fontSize: 14, color: current ? sc : "var(--text3)" }}>{STAGE_ICON[s]}</span>
                    }
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 700, color: current ? sc : past ? "var(--text2)" : "var(--text3)", textTransform: "uppercase" as const, letterSpacing: "0.05em", whiteSpace: "nowrap" as const }}>{s}</span>
                </button>
                {i < STAGES.length - 1 && (
                  <div style={{ width: 20, height: 2, background: i < stageIdx ? STAGE_COLOR[STAGES[i]] : "var(--border)", flexShrink: 0, transition: ".3s" }} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 14, background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 12, padding: 4 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 10px", borderRadius: 9, border: "none", cursor: "pointer", background: tab === t.id ? "var(--bg3)" : "transparent", color: tab === t.id ? "var(--text)" : "var(--text3)", fontFamily: "inherit", fontSize: 12, fontWeight: 700, boxShadow: tab === t.id ? "0 1px 4px rgba(0,0,0,.1)" : "none", transition: ".15s" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab body */}
      <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 14, padding: 24 }}>

        {/* ── Overview ── */}
        {tab === "overview" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 10, marginBottom: 20 }}>
              <InfoTile icon="phone" label="Phone" value={lead.contactPhone ?? "—"} color="#6366f1" />
              <InfoTile icon="email" label="Email" value={lead.contactEmail ?? "—"} color="#06b6d4" />
              <InfoTile icon="source" label="Source" value={lead.leadSource ?? "—"} color="#f59e0b" />
              <InfoTile icon="devices" label="Services" value={lead.services ?? "—"} color="#8b5cf6" />
            </div>
            {lead.notes && (
              <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px", marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 6 }}>Notes</div>
                <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6 }}>{lead.notes}</div>
              </div>
            )}
            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", marginBottom: 12 }}>Activity</div>
            {[
              { icon: "person_add", color: "#6366f1", text: `Lead created — ${lead.contactName} added by ${lead.assignedRep ?? "system"}`, time: lead.createdAt },
              { icon: "update", color: "#f59e0b", text: `Stage set to "${lead.stage}"`, time: lead.updatedAt },
              ...(lead.proposalNotes ? [{ icon: "handshake", color: "#10b981", text: "Proposal notes added", time: lead.updatedAt }] : []),
            ].map((a, i, arr) => (
              <div key={i} style={{ display: "flex", gap: 10, paddingBottom: 12, marginBottom: 12, borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none" }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: a.color + "22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: a.color }}>{a.icon}</span>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", lineHeight: 1.4 }}>{a.text}</div>
                  <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 2 }}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Proposal ── */}
        {tab === "proposal" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
              {[
                { label: "Monthly Fee", value: lead.monthlyFee ? `$${lead.monthlyFee}/mo` : "—", color: "var(--accent-crm)" },
                { label: "Setup Fee", value: lead.setupFee ? `$${lead.setupFee}` : "—", color: "var(--text)" },
                { label: "Contract Term", value: lead.contractTerm ?? "—", color: "var(--text)" },
              ].map(c => (
                <div key={c.label} style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase" as const, marginBottom: 4 }}>{c.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: c.color }}>{c.value}</div>
                </div>
              ))}
            </div>
            {lead.proposalNotes
              ? <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase" as const, marginBottom: 6 }}>Proposal Notes</div>
                <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6 }}>{lead.proposalNotes}</div>
              </div>
              : <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text3)", fontSize: 13 }}>No proposal details yet</div>
            }
          </div>
        )}

        {/* ── Equipment ── */}
        {tab === "equipment" && (
          <div>
            {lead.equipment && lead.equipment.length > 0 ? (
              <div style={{ background: "var(--bg3)", borderRadius: 10, overflow: "hidden", border: "1px solid var(--border)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 120px 120px", padding: "10px 16px", borderBottom: "1px solid var(--border)", fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>
                  <div>Item</div><div>Qty</div><div>Unit Price</div><div>Total</div>
                </div>
                {lead.equipment.map((eq, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 70px 120px 120px", padding: "12px 16px", borderBottom: i < lead.equipment!.length - 1 ? "1px solid var(--border)" : "none", fontSize: 13, alignItems: "center" }}>
                    <div style={{ fontWeight: 600, color: "var(--text)" }}>{eq.name}</div>
                    <div style={{ color: "var(--text2)", fontWeight: 600 }}>{eq.qty}</div>
                    <div style={{ color: "var(--text2)" }}>${eq.unitPrice.toLocaleString()}</div>
                    <div style={{ fontWeight: 700, color: "#10b981" }}>${(eq.qty * eq.unitPrice).toLocaleString()}</div>
                  </div>
                ))}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 120px 120px", padding: "12px 16px", background: "var(--bg2)", borderTop: "2px solid var(--border)" }}>
                  <div style={{ gridColumn: "3", fontSize: 12, fontWeight: 800, color: "var(--text3)", textTransform: "uppercase" as const }}>Total</div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: "#10b981" }}>${eqTotal.toLocaleString()}</div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text3)", fontSize: 13 }}>No equipment added yet</div>
            )}
          </div>
        )}

        {/* ── Costing & ROI ── */}
        {tab === "costing" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", marginBottom: 12 }}>Cost Breakdown</div>
              {[
                { label: "Equipment Total", value: eqTotal, color: "#ef4444" },
                { label: "Setup Fee", value: lead.setupFee ?? 0, color: "#f59e0b" },
                { label: "First Year Monthly", value: annualRevenue, color: "#6366f1" },
              ].map((row, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontSize: 13, color: "var(--text2)", fontWeight: 600 }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: row.color }}>${row.value.toLocaleString()}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", fontSize: 14, fontWeight: 900 }}>
                <span style={{ color: "var(--text)" }}>Total Year 1</span>
                <span style={{ color: "#ef4444" }}>${(eqTotal + (lead.setupFee ?? 0) + annualRevenue).toLocaleString()}</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", marginBottom: 12 }}>Revenue Projection</div>
              <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 10, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 12, color: "var(--text3)" }}>Annual Recurring</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#10b981" }}>${annualRevenue.toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 12, color: "var(--text3)" }}>Contract Duration</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>{lead.contractTerm ?? "—"}</span>
                </div>
                {contractYears > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                    <span style={{ fontSize: 12, color: "var(--text3)" }}>Total Contract Value</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "var(--accent-crm)" }}>${(annualRevenue * contractYears).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Floor Plan ── */}
        {tab === "floorplan" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>Floor Planning Workspace</div>
              <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "var(--accent-crm)", border: "none", borderRadius: 9, fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>upload</span>
                Upload Floor Plan
              </button>
            </div>
            <div style={{ border: "2px dashed var(--border)", borderRadius: 12, height: 400, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: "var(--text3)", background: "var(--bg3)" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 52, opacity: 0.35 }}>map</span>
              <div style={{ fontSize: 14, fontWeight: 700 }}>No floor plan uploaded</div>
              <div style={{ fontSize: 12 }}>Upload a PDF or image to start planning equipment placement</div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

// ── New Lead Modal ─────────────────────────────────────────────────────────

function NewLeadModal({ onClose, onCreate }: { onClose: () => void; onCreate: (l: Lead) => void }) {
  const [companyName, setCompanyName] = useState("")
  const [industry, setIndustry] = useState("")
  const [locations, setLocations] = useState("1")
  const [website, setWebsite] = useState("")
  const [contactName, setContactName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [leadSource, setLeadSource] = useState("")
  const [budget, setBudget] = useState("")
  const [services, setServices] = useState("")
  const [notes, setNotes] = useState("")
  const [assignedRep, setAssignedRep] = useState("")
  const [priority, setPriority] = useState<Priority>("Medium")
  const [error, setError] = useState("")

  function create() {
    if (!companyName.trim()) return setError("Company name is required.")
    if (!contactName.trim()) return setError("Contact name is required.")
    const now = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    onCreate({
      id: `L-${Date.now()}`,
      companyName: companyName.trim(), industry: industry.trim(),
      locations: parseInt(locations) || 1, website: website.trim() || undefined,
      contactName: contactName.trim(), contactPhone: phone.trim() || undefined,
      contactEmail: email.trim() || undefined, leadSource: leadSource.trim() || undefined,
      budget: budget ? parseFloat(budget) : undefined, services: services.trim() || undefined,
      notes: notes.trim() || undefined, assignedRep: assignedRep || undefined,
      priority, stage: "New Inquiry", createdAt: now, updatedAt: now,
    })
  }

  return (
    <Overlay onClose={onClose}>
      <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 20, width: "100%", maxWidth: 680, maxHeight: "88vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,.25)" }}>
        <div style={{ padding: "20px 28px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: "var(--accent-crm-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span className="material-symbols-outlined" style={{ color: "var(--accent-crm)", fontSize: 22 }}>add_business</span>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, color: "var(--text)" }}>Create New Lead</div>
            <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>Capture a new opportunity</div>
          </div>
          <button onClick={onClose} style={{ marginLeft: "auto", background: "var(--bg3)", border: "none", width: 32, height: 32, borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--text3)" }}>close</span>
          </button>
        </div>

        <div style={{ overflowY: "auto", flex: 1, padding: "8px 28px 28px" }} className="sidebar-nav">
          <SectionHeader icon="business" label="Business Info" />
          <FieldRow>
            <Field label="Company Name *">
              <input type="text" value={companyName} onChange={e => { setCompanyName(e.target.value); setError("") }} style={{ ...fieldSt, borderColor: error && !companyName.trim() ? "#ef4444" : "var(--border)" }} />
            </Field>
            <Field label="Industry">
              <input type="text" value={industry} onChange={e => setIndustry(e.target.value)} style={fieldSt} />
            </Field>
          </FieldRow>
          <FieldRow>
            <Field label="Number of Locations">
              <input type="number" min={1} value={locations} onChange={e => setLocations(e.target.value)} style={fieldSt} />
            </Field>
            <Field label="Website">
              <input type="text" value={website} onChange={e => setWebsite(e.target.value)} style={fieldSt} />
            </Field>
          </FieldRow>

          <SectionHeader icon="person" label="Contact Info" />
          <Field label="Contact Name *">
            <input type="text" value={contactName} onChange={e => { setContactName(e.target.value); setError("") }} style={{ ...fieldSt, borderColor: error && !contactName.trim() ? "#ef4444" : "var(--border)" }} />
          </Field>
          <FieldRow>
            <Field label="Phone">
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} style={fieldSt} />
            </Field>
            <Field label="Email">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={fieldSt} />
            </Field>
          </FieldRow>

          <SectionHeader icon="receipt_long" label="Project Details" />
          <FieldRow>
            <Field label="Lead Source">
              <input type="text" placeholder="e.g. Website, Referral" value={leadSource} onChange={e => setLeadSource(e.target.value)} style={fieldSt} />
            </Field>
            <Field label="Estimated Budget ($)">
              <input type="number" placeholder="0" value={budget} onChange={e => setBudget(e.target.value)} style={fieldSt} />
            </Field>
          </FieldRow>
          <Field label="Interested Products / Services">
            <input type="text" placeholder="e.g. POS System, Kiosks" value={services} onChange={e => setServices(e.target.value)} style={fieldSt} />
          </Field>
          <Field label="Notes">
            <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} style={{ ...fieldSt, resize: "vertical", lineHeight: 1.5 }} />
          </Field>

          <SectionHeader icon="assignment_ind" label="Assignment" />
          <FieldRow>
            <Field label="Assigned Rep">
              <select value={assignedRep} onChange={e => setAssignedRep(e.target.value)} style={fieldSt}>
                <option value="">— Unassigned —</option>
                {REPS.map(r => <option key={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="Priority">
              <select value={priority} onChange={e => setPriority(e.target.value as Priority)} style={fieldSt}>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </Field>
          </FieldRow>

          {error && (
            <div style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.25)", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#ef4444", fontWeight: 600, marginTop: 4 }}>{error}</div>
          )}
        </div>

        <div style={{ padding: "14px 28px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, justifyContent: "flex-end", flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: "10px 22px", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 10, fontWeight: 600, fontSize: 13, color: "var(--text2)", cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
          <button onClick={create} style={{ padding: "10px 24px", background: "var(--accent-crm)", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 4px 14px rgba(99,102,241,.35)" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>save</span>
            Create Lead
          </button>
        </div>
      </div>
    </Overlay>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export function LeadsClient() {
  const [leads, setLeads] = useState<Lead[]>(MOCK_LEADS)
  const [view, setView] = useState<LeadView>("pipeline")
  const [search, setSearch] = useState("")
  const [stageFilter, setStageFilter] = useState<Stage | "">("")
  const [detailLead, setDetailLead] = useState<Lead | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dragId = useRef<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3000)
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return leads.filter(l => {
      if (stageFilter && l.stage !== stageFilter) return false
      if (q && ![l.companyName, l.contactName, l.industry, l.assignedRep ?? ""].some(s => s.toLowerCase().includes(q))) return false
      return true
    })
  }, [leads, search, stageFilter])

  function handleDragStart(e: React.DragEvent, id: string) {
    dragId.current = id
    e.dataTransfer.effectAllowed = "move"
  }

  function handleDrop(targetStage: Stage) {
    if (!dragId.current) return
    const now = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    setLeads(prev => prev.map(l => l.id === dragId.current ? { ...l, stage: targetStage, updatedAt: now } : l))
    showToast(`Lead moved to "${targetStage}"`)
    dragId.current = null
  }

  function handleStageChange(id: string, stage: Stage) {
    const now = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    setLeads(prev => prev.map(l => l.id === id ? { ...l, stage, updatedAt: now } : l))
    setDetailLead(prev => prev?.id === id ? { ...prev, stage, updatedAt: now } : prev)
    showToast(`Stage updated to "${stage}"`)
  }

  function handleCreate(lead: Lead) {
    setLeads(prev => [lead, ...prev])
    setModalOpen(false)
    showToast(`Lead "${lead.companyName}" created`)
  }

  // Sync detail view when stage changes from tracker
  const currentDetail = detailLead ? leads.find(l => l.id === detailLead.id) ?? detailLead : null

  return (
    <div style={{ padding: 24, fontFamily: "'Mulish', sans-serif" }}>

      {toast && <Toast msg={toast} />}

      {/* ── Detail view ── */}
      {currentDetail ? (
        <LeadDetail lead={currentDetail} onClose={() => setDetailLead(null)} onStageChange={handleStageChange} />
      ) : (
        <>
          {/* ── Filter bar ── */}
          <div className="tkt-filter-bar" style={{ marginBottom: 20 }}>
            <div className="tkt-search" style={{ flex: 1 }}>
              <span className="material-symbols-outlined">search</span>
              <input type="text" placeholder="Search leads..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="tkt-filters">
              <select className="tkt-filter-sel" value={stageFilter} onChange={e => setStageFilter(e.target.value as Stage | "")}>
                <option value="">All Stages</option>
                {STAGES.map(s => <option key={s}>{s}</option>)}
              </select>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text3)", whiteSpace: "nowrap", padding: "0 4px" }}>
                {filtered.length} {filtered.length === 1 ? "lead" : "leads"}
              </span>
            </div>
            {/* View toggle */}
            <div style={{ display: "flex", gap: 2, padding: 3, background: "var(--bg3)", borderRadius: 8, border: "1px solid var(--border)" }}>
              {(["pipeline", "list"] as LeadView[]).map(v => (
                <button key={v} onClick={() => setView(v)} title={v === "pipeline" ? "Pipeline view" : "List view"}
                  style={{ padding: "5px 7px", borderRadius: 6, background: view === v ? "var(--bg2)" : "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", boxShadow: view === v ? "0 1px 4px rgba(0,0,0,.1)" : "none", transition: ".15s" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: view === v ? "var(--text)" : "var(--text3)" }}>
                    {v === "pipeline" ? "view_kanban" : "table_rows"}
                  </span>
                </button>
              ))}
            </div>
            <button onClick={() => setModalOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "var(--accent-crm)", border: "none", borderRadius: 10, fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>add</span>
              New Lead
            </button>
          </div>

          {/* ── Pipeline view ── */}
          {view === "pipeline" && (
            <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 12, alignItems: "flex-start" }} className="sidebar-nav">
              {STAGES.map(stage => (
                <KanbanColumn
                  key={stage} stage={stage}
                  leads={filtered.filter(l => l.stage === stage)}
                  onDrop={handleDrop} onOpen={setDetailLead} onDragStart={handleDragStart}
                />
              ))}
            </div>
          )}

          {/* ── List view ── */}
          {view === "list" && (
            <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 1.4fr 1.2fr 100px 120px", padding: "11px 16px", borderBottom: "1px solid var(--border)", fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase" as const, letterSpacing: "0.5px", background: "var(--bg3)" }}>
                <div>Lead</div><div>Contact</div><div>Stage</div><div>Assigned To</div><div>Budget</div><div>Updated</div>
              </div>
              {filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text3)", fontSize: 13 }}>No leads found</div>
              ) : filtered.map((lead, i) => {
                const sc = STAGE_COLOR[lead.stage]
                return (
                  <div key={lead.id} onClick={() => setDetailLead(lead)}
                    style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 1.4fr 1.2fr 100px 120px", padding: "13px 16px", borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none", alignItems: "center", cursor: "pointer", transition: ".12s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--bg3)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{lead.companyName}</div>
                      <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 1 }}>{lead.industry}</div>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text2)", fontWeight: 600 }}>{lead.contactName}</div>
                    <div><span style={{ fontSize: 11, fontWeight: 700, color: sc, background: sc + "18", padding: "3px 9px", borderRadius: 20 }}>{lead.stage}</span></div>
                    <div style={{ fontSize: 12, color: "var(--text2)", fontWeight: 600 }}>{lead.assignedRep ?? "—"}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#10b981" }}>{lead.budget ? `$${lead.budget.toLocaleString()}` : "—"}</div>
                    <div style={{ fontSize: 11, color: "var(--text3)" }}>{lead.updatedAt}</div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {modalOpen && <NewLeadModal onClose={() => setModalOpen(false)} onCreate={handleCreate} />}
    </div>
  )
}
