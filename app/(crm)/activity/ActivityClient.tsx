"use client"

import { useState, useMemo, useRef, useEffect } from "react"

// ── Types ──────────────────────────────────────────────────────────────────

type ActivityType = "created" | "resolved" | "note" | "updated" | "merchant" | "closed"

interface ActivityChange { label: string; from?: string; to: string }

interface ActivityEntry {
  id:           string
  type:         ActivityType
  relTime:      string          // "2 days ago", "7 min ago"
  fullTs:       string          // "May 8, 2026, 10:44 PM"
  user:         string          // actor shown in inner card

  // Ticket context
  ticketId?:    string          // "MTECH-470501"
  merchant?:    string          // "Sara International Travel"
  ticketTitle?: string
  status?:      string
  priority?:    string
  mid?:         string          // MID display label e.g. "PENDING"
  assignedTo?:  string[]
  category?:    string
  dept?:        string
  escalation?:  string
  createdBy?:   string

  // System event (no ticket context)
  isSystem?:    boolean
  description?: string          // plain text; bold wraps handled by boldTerms
  boldTerms?:   string[]

  // Inner card detail
  changes?:     ActivityChange[]
  note?:        string
}

interface MerchantOption { id: string; mid: string; dba: string; status: string }

// ── Config ─────────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<ActivityType, string> = {
  created:  "TICKET CREATED",
  resolved: "TICKET RESOLVED",
  note:     "NOTE ADDED",
  updated:  "TICKET UPDATED",
  merchant: "MERCHANT CREATED",
  closed:   "TICKET CLOSED",
}

const TYPE_COLOR: Record<ActivityType, string> = {
  created:  "#10b981",
  resolved: "#6366f1",
  note:     "#06b6d4",
  updated:  "#6366f1",
  merchant: "#ec4899",
  closed:   "#6b7280",
}

const TYPE_ICON: Record<ActivityType, string> = {
  created:  "add_circle",
  resolved: "check_circle",
  note:     "sticky_note_2",
  updated:  "update",
  merchant: "storefront",
  closed:   "do_not_disturb_on",
}

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  "Open":             { color: "#ef4444", bg: "rgba(239,68,68,.1)"   },
  "In Progress":      { color: "#6366f1", bg: "rgba(99,102,241,.1)"  },
  "Pending Internal": { color: "#8b5cf6", bg: "rgba(139,92,246,.1)"  },
  "Resolved":         { color: "#10b981", bg: "rgba(16,185,129,.1)"  },
  "Closed":           { color: "#6b7280", bg: "rgba(107,114,128,.1)" },
}

const PRIORITY_STYLE: Record<string, { color: string; bg: string }> = {
  "Low":      { color: "#10b981", bg: "rgba(16,185,129,.1)"  },
  "Medium":   { color: "#f59e0b", bg: "rgba(245,158,11,.1)"  },
  "High":     { color: "#ef4444", bg: "rgba(239,68,68,.1)"   },
  "Critical": { color: "#7c3aed", bg: "rgba(124,58,237,.1)"  },
}

const CAT_COLOR: Record<string, string> = {
  "Onboarding": "#6366f1", "Technical": "#06b6d4",
  "Billing/Statement": "#f59e0b", "Equipment": "#ec4899",
  "Account": "#10b981", "General Inquiry": "#6b7280",
}

// ── Helpers ────────────────────────────────────────────────────────────────

function Boldify({ text, terms }: { text: string; terms?: string[] }) {
  if (!terms?.length) return <>{text}</>
  const re = new RegExp(`(${terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "g")
  const parts = text.split(re)
  return <>{parts.map((p, i) => terms.includes(p) ? <strong key={i}>{p}</strong> : p)}</>
}

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color, background: bg, padding: "3px 9px", borderRadius: 20, whiteSpace: "nowrap" }}>
      {label}
    </span>
  )
}

function MetaItem({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <span style={{ fontSize: 12, color: "var(--text3)", whiteSpace: "nowrap" }}>
      {label}:{" "}
      <span style={{ color: color ?? "var(--text2)", fontWeight: 600 }}>{value}</span>
    </span>
  )
}

// ── Shared constants ───────────────────────────────────────────────────────

const AGENTS     = ["Joan Huang", "Moe Kadi", "Zu Jia He Cen", "Hussein Khalil"]
const PROCESSORS = ["Fiserv", "TSYS", "Worldpay", "Global Payments", "Paysafe", "Maverick", "Elavon"]

const MOCK_MERCHANTS: MerchantOption[] = [
  { id: "m1",  mid: "800004521", dba: "Pinnacle Sports Bar",    status: "Active"   },
  { id: "m2",  mid: "800003847", dba: "Fieldstone Bakery",      status: "Active"   },
  { id: "m3",  mid: "800005102", dba: "Driftwood Tavern",       status: "Active"   },
  { id: "m4",  mid: "800002961", dba: "Saffron Threads",        status: "Active"   },
  { id: "m5",  mid: "800004388", dba: "Coppervine Wine Bar",    status: "Active"   },
  { id: "m6",  mid: "800003205", dba: "Bluewater Seafood",      status: "Inactive" },
  { id: "m7",  mid: "800005677", dba: "Cascadia Auto Service",  status: "Active"   },
  { id: "m8",  mid: "800001934", dba: "Helix Coworking",        status: "Active"   },
  { id: "m9",  mid: "800004019", dba: "Noma Nails & Beauty",    status: "Active"   },
  { id: "m10", mid: "800003512", dba: "Ironclad Fitness",       status: "Pending"  },
  { id: "m11", mid: "800002744", dba: "Vantage Optical",        status: "Active"   },
  { id: "m12", mid: "800005288", dba: "Luminary Photography",   status: "Active"   },
  { id: "m13", mid: "800001670", dba: "Terracycle Garden Shop", status: "Active"   },
  { id: "m14", mid: "800003091", dba: "Watershed Books",        status: "Active"   },
  { id: "m15", mid: "800004756", dba: "Barranca Taqueria",      status: "Active"   },
]

function statusDot(s: string) {
  if (s === "Active")   return "#10b981"
  if (s === "Inactive") return "#6b7280"
  if (s === "Pending")  return "#f59e0b"
  return "#6366f1"
}

// ── Mock data ──────────────────────────────────────────────────────────────

const MOCK_ACTIVITY: ActivityEntry[] = [
  {
    id: "A-001", type: "updated", relTime: "7 min ago", fullTs: "May 11, 2026, 9:46 AM",
    user: "Derek Foss",
    merchant: "Pinnacle Sports Bar", ticketId: "MTECH-470501",
    ticketTitle: "Clover terminal not connecting to network",
    status: "In Progress", priority: "High", mid: "800004521",
    assignedTo: ["Derek Foss"], category: "Technical", dept: "Tech",
    escalation: "Tier 2", createdBy: "Tomas Vega",
    changes: [{ label: "Status", from: "Open", to: "In Progress" }],
  },
  {
    id: "A-002", type: "note", relTime: "7 min ago", fullTs: "May 11, 2026, 9:45 AM",
    user: "Derek Foss",
    merchant: "Pinnacle Sports Bar", ticketId: "MTECH-470501",
    ticketTitle: "Clover terminal not connecting to network",
    status: "In Progress", priority: "High", mid: "800004521",
    assignedTo: ["Derek Foss"], category: "Technical", dept: "Tech",
    escalation: "Tier 2", createdBy: "Tomas Vega",
    note: "Contacted merchant, issue reproduced on their end. Escalating to Clover support.",
  },
  {
    id: "A-003", type: "resolved", relTime: "26 min ago", fullTs: "May 11, 2026, 9:27 AM",
    user: "Amara Singh",
    merchant: "Fieldstone Bakery", ticketId: "MTECH-470485",
    ticketTitle: "Missing batch settlement — March 28–31",
    status: "Resolved", priority: "Medium", mid: "800003847",
    assignedTo: ["Amara Singh"], category: "Billing/Statement", dept: "Operations",
    escalation: "Tier 1", createdBy: "Amara Singh",
    changes: [{ label: "Status", from: "In Progress", to: "Resolved" }],
  },
  {
    id: "A-004", type: "updated", relTime: "31 min ago", fullTs: "May 11, 2026, 9:22 AM",
    user: "Amara Singh",
    merchant: "Driftwood Tavern", ticketId: "MTECH-470483",
    ticketTitle: "Dual pricing not displaying correctly on receipts",
    status: "Open", priority: "High", mid: "800005102",
    assignedTo: ["Amara Singh"], category: "Technical", dept: "Tech",
    escalation: "Tier 1", createdBy: "Tomas Vega",
    changes: [{ label: "Priority", from: "Low", to: "High" }],
  },
  {
    id: "A-005", type: "updated", relTime: "2 hrs ago", fullTs: "May 11, 2026, 7:53 AM",
    user: "Amara Singh",
    merchant: "Coppervine Wine Bar", ticketId: "MTECH-470470",
    ticketTitle: "EBT transactions declining at POS",
    status: "In Progress", priority: "Medium", mid: "800004388",
    assignedTo: ["Amara Singh"], category: "Technical", dept: "Operations",
    escalation: "Tier 1", createdBy: "Tomas Vega",
    changes: [{ label: "Assigned To", from: "Tomas Vega", to: "Amara Singh" }],
  },
  {
    id: "A-006", type: "created", relTime: "54 min ago", fullTs: "May 11, 2026, 8:59 AM",
    user: "Tomas Vega",
    merchant: "Pinnacle Sports Bar", ticketId: "MTECH-470501",
    ticketTitle: "Clover terminal not connecting to network",
    status: "Open", priority: "Medium", mid: "800004521",
    assignedTo: [], category: "Technical", dept: "Tech",
    escalation: "Tier 1", createdBy: "Tomas Vega",
    changes: [{ label: "Ticket created", to: "MTECH-470501" }],
  },
  {
    id: "A-007", type: "merchant", relTime: "57 min ago", fullTs: "May 11, 2026, 8:56 AM",
    user: "Tomas Vega",
    merchant: "Pinnacle Sports Bar", mid: "800004521",
    ticketTitle: "Pinnacle Sports Bar",
    isSystem: false,
    changes: [
      { label: "Processor", to: "Fiserv" },
      { label: "Status", to: "Active" },
      { label: "Risk Level", to: "Low" },
    ],
  },
  {
    id: "A-008", type: "resolved", relTime: "1 hr ago", fullTs: "May 11, 2026, 8:53 AM",
    user: "Derek Foss",
    merchant: "Saffron Threads", ticketId: "MTECH-470439",
    ticketTitle: "Terminal offline — unable to process transactions",
    status: "Resolved", priority: "High", mid: "800002961",
    assignedTo: ["Derek Foss"], category: "Equipment", dept: "Tech",
    escalation: "Tier 2", createdBy: "Derek Foss",
    changes: [{ label: "Status", from: "In Progress", to: "Resolved" }],
  },
  {
    id: "A-009", type: "updated", relTime: "Yesterday", fullTs: "May 10, 2026, 4:12 PM",
    user: "Amara Singh",
    merchant: "Cascadia Auto Service", ticketId: "MTECH-470448",
    ticketTitle: "Merchant requesting rate review",
    status: "Open", priority: "Low", mid: "800005677",
    assignedTo: ["Amara Singh"], category: "Account", dept: "Operations",
    escalation: "Tier 1", createdBy: "Amara Singh",
    changes: [{ label: "Status", from: "Pending Internal", to: "Open" }],
  },
  {
    id: "A-010", type: "closed", relTime: "Yesterday", fullTs: "May 10, 2026, 2:48 PM",
    user: "Tomas Vega",
    merchant: "Helix Coworking", ticketId: "MTECH-470391",
    ticketTitle: "NFC tap-to-pay not working on PAX terminal",
    status: "Closed", priority: "Medium", mid: "800001934",
    assignedTo: ["Tomas Vega"], category: "Technical", dept: "Tech",
    escalation: "Tier 1", createdBy: "Derek Foss",
    changes: [{ label: "Status", from: "In Progress", to: "Closed" }],
  },
  {
    id: "A-011", type: "updated", relTime: "Yesterday", fullTs: "May 10, 2026, 10:20 AM",
    user: "Tomas Vega",
    merchant: "Pinnacle Sports Bar", ticketId: "MTECH-470431",
    ticketTitle: "POS software crash on end-of-day report",
    status: "In Progress", priority: "High", mid: "800004521",
    assignedTo: ["Derek Foss"], category: "Technical", dept: "Tech",
    escalation: "Tier 2", createdBy: "Amara Singh",
    changes: [
      { label: "Priority",    from: "Medium",      to: "High"      },
      { label: "Assigned To", from: "Amara Singh", to: "Derek Foss" },
    ],
  },
  {
    id: "A-012", type: "note", relTime: "Yesterday", fullTs: "May 10, 2026, 9:15 AM",
    user: "Derek Foss",
    merchant: "Watershed Books", ticketId: "MTECH-470422",
    ticketTitle: "SNAP transactions being declined",
    status: "In Progress", priority: "High", mid: "800003091",
    assignedTo: ["Derek Foss"], category: "Technical", dept: "Operations",
    escalation: "Tier 1", createdBy: "Derek Foss",
    note: "SNAP processor confirmed issue on their end. ETA for fix is 24–48 hours. Merchant notified.",
  },
  {
    id: "A-013", type: "merchant", relTime: "Yesterday", fullTs: "May 10, 2026, 8:30 AM",
    user: "Amara Singh",
    merchant: "Ironclad Fitness", mid: "800003512",
    ticketTitle: "Ironclad Fitness",
    changes: [
      { label: "Processor", to: "TSYS" },
      { label: "Status", to: "Pending" },
    ],
  },
  {
    id: "A-014",
    type: "updated", relTime: "2 days ago", fullTs: "May 9, 2026, 5:45 PM",
    user: "Tomas Vega",
    isSystem: true,
    description: "Tomas Vega updated residuals for 2026-04",
    boldTerms: ["Tomas Vega", "2026-04"],
    changes: [{ label: "Residuals period", to: "2026-04" }],
  },
  {
    id: "A-015", type: "resolved", relTime: "2 days ago", fullTs: "May 9, 2026, 4:20 PM",
    user: "Derek Foss",
    merchant: "Vantage Optical", ticketId: "MTECH-470377",
    ticketTitle: "Debit card surcharge showing on credit transactions",
    status: "Resolved", priority: "Medium", mid: "800002744",
    assignedTo: ["Derek Foss"], category: "Billing/Statement", dept: "Operations",
    escalation: "Tier 1", createdBy: "Amara Singh",
    changes: [{ label: "Status", from: "In Progress", to: "Resolved" }],
  },
  {
    id: "A-016", type: "updated", relTime: "2 days ago", fullTs: "May 9, 2026, 2:00 PM",
    user: "Tomas Vega",
    merchant: "Luminary Photography", ticketId: "MTECH-470404",
    ticketTitle: "SwipeSimple app not syncing with back-office",
    status: "In Progress", priority: "Medium", mid: "800005288",
    assignedTo: ["Tomas Vega"], category: "Technical", dept: "Tech",
    escalation: "Tier 1", createdBy: "Tomas Vega",
    changes: [
      { label: "Application Status", to: "Under Review" },
      { label: "Status", from: "Open", to: "In Progress" },
    ],
  },
]

// ── Field style ────────────────────────────────────────────────────────────

const fieldSt: React.CSSProperties = {
  width: "100%", padding: "9px 13px", background: "var(--bg3)",
  border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)",
  fontSize: 13, fontFamily: "'Mulish', sans-serif", outline: "none",
  boxSizing: "border-box", fontWeight: 600,
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  )
}

function FieldRow({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{children}</div>
}

function SectionDivider({ icon, label }: { icon: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "20px 0 14px", paddingBottom: 8, borderBottom: "1px solid var(--border)" }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--accent-crm-light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span className="material-symbols-outlined" style={{ fontSize: 15, color: "var(--accent-crm)" }}>{icon}</span>
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.2px", color: "var(--text3)" }}>{label}</span>
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

// ── Component ──────────────────────────────────────────────────────────────

export function ActivityClient() {
  const [search,     setSearch]     = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [activity,   setActivity]   = useState<ActivityEntry[]>(MOCK_ACTIVITY)

  // Merchant picker
  const [pickerOpen,   setPickerOpen]   = useState(false)
  const [pickerSearch, setPickerSearch] = useState("")
  const [selectedMerchant, setSelectedMerchant] = useState<MerchantOption | null>(null)

  // New Ticket
  const [ticketOpen,   setTicketOpen]   = useState(false)
  const [ntStatus,     setNtStatus]     = useState("Open")
  const [ntPriority,   setNtPriority]   = useState("Medium")
  const [ntCategory,   setNtCategory]   = useState("")
  const [ntDept,       setNtDept]       = useState("")
  const [ntAssigned,   setNtAssigned]   = useState("")
  const [ntEscalation, setNtEscalation] = useState("Tier 1")
  const [ntSubject,    setNtSubject]    = useState("")
  const [ntDesc,       setNtDesc]       = useState("")
  const [ntTags,       setNtTags]       = useState("")
  const [ntErr,        setNtErr]        = useState("")

  // New Merchant
  const [merchantOpen, setMerchantOpen] = useState(false)
  const [nmOwnerName,  setNmOwnerName]  = useState("")
  const [nmOwnerPhone, setNmOwnerPhone] = useState("")
  const [nmOwnerEmail, setNmOwnerEmail] = useState("")
  const [nmDba,        setNmDba]        = useState("")
  const [nmLegal,      setNmLegal]      = useState("")
  const [nmMid,        setNmMid]        = useState("")
  const [nmProcessor,  setNmProcessor]  = useState("Fiserv")
  const [nmStatus,     setNmStatus]     = useState("Active")
  const [nmBizType,    setNmBizType]    = useState("")
  const [nmMcc,        setNmMcc]        = useState("")
  const [nmBizPhone,   setNmBizPhone]   = useState("")
  const [nmWebsite,    setNmWebsite]    = useState("")
  const [nmAddress,    setNmAddress]    = useState("")
  const [nmSalesRep,   setNmSalesRep]   = useState("")
  const [nmAgentEmail, setNmAgentEmail] = useState("")
  const [nmAgentPhone, setNmAgentPhone] = useState("")
  const [nmAgentCode,  setNmAgentCode]  = useState("")
  const [nmMonthlyVol, setNmMonthlyVol] = useState("")
  const [nmAvgTicket,  setNmAvgTicket]  = useState("")
  const [nmRisk,       setNmRisk]       = useState("Low")
  const [nmContract,   setNmContract]   = useState("")
  const [nmBilling,    setNmBilling]    = useState("Monthly")
  const [nmPricing,    setNmPricing]    = useState("Dual Pricing")
  const [nmEbt,        setNmEbt]        = useState("Disabled")
  const [nmErr,        setNmErr]        = useState("")

  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3200)
  }

  const pickerResults = useMemo(() => {
    const q = pickerSearch.toLowerCase()
    return MOCK_MERCHANTS.filter(m => m.dba.toLowerCase().includes(q) || m.mid.includes(q))
  }, [pickerSearch])

  function openPicker() { setPickerSearch(""); setPickerOpen(true) }

  function pickMerchant(m: MerchantOption) {
    setSelectedMerchant(m)
    setPickerOpen(false)
    setNtStatus("Open"); setNtPriority("Medium"); setNtCategory("")
    setNtDept(""); setNtAssigned(""); setNtEscalation("Tier 1")
    setNtSubject(""); setNtDesc(""); setNtTags(""); setNtErr("")
    setTicketOpen(true)
  }

  function createTicket() {
    if (!ntSubject.trim()) return setNtErr("Subject is required.")
    if (!ntCategory)       return setNtErr("Please select a category.")
    const newId = `MTECH-${470531 + activity.filter(a => a.type === "created").length}`
    const now = new Date()
    const entry: ActivityEntry = {
      id: `A-${Date.now()}`, type: "created",
      relTime: "Just now",
      fullTs: now.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }),
      user: "Hussein Khalil",
      merchant: selectedMerchant?.dba,
      ticketId: newId, ticketTitle: ntSubject,
      status: ntStatus, priority: ntPriority, mid: selectedMerchant?.mid,
      assignedTo: ntAssigned ? [ntAssigned] : [],
      category: ntCategory, dept: ntDept,
      escalation: ntEscalation, createdBy: "Hussein Khalil",
      changes: [{ label: "Ticket created", to: newId }],
    }
    setActivity(prev => [entry, ...prev])
    setTicketOpen(false)
    showToast(`Ticket ${newId} created`)
  }

  function createMerchant() {
    if (!nmDba.trim()) return setNmErr("DBA Name is required.")
    if (!nmMid.trim()) return setNmErr("MID is required.")
    const now = new Date()
    const entry: ActivityEntry = {
      id: `A-${Date.now()}`, type: "merchant",
      relTime: "Just now",
      fullTs: now.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }),
      user: "Hussein Khalil",
      merchant: nmDba, ticketTitle: nmDba, mid: nmMid,
      changes: [
        { label: "Processor", to: nmProcessor },
        { label: "Status", to: nmStatus },
        ...(nmRisk ? [{ label: "Risk Level", to: nmRisk }] : []),
      ],
    }
    setActivity(prev => [entry, ...prev])
    setMerchantOpen(false)
    setNmOwnerName(""); setNmOwnerPhone(""); setNmOwnerEmail("")
    setNmDba(""); setNmLegal(""); setNmMid("")
    setNmBizType(""); setNmMcc(""); setNmBizPhone(""); setNmWebsite(""); setNmAddress("")
    setNmSalesRep(""); setNmAgentEmail(""); setNmAgentPhone(""); setNmAgentCode("")
    setNmMonthlyVol(""); setNmAvgTicket(""); setNmContract(""); setNmErr("")
    showToast(`Merchant "${nmDba}" created`)
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return activity.filter(e => {
      if (typeFilter && e.type !== typeFilter) return false
      if (q) {
        const hay = [e.user, e.merchant ?? "", e.ticketId ?? "", e.ticketTitle ?? "", e.description ?? ""]
          .join(" ").toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [activity, search, typeFilter])

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: 24, fontFamily: "'Mulish', sans-serif" }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)", background: "#10b981", color: "#fff", borderRadius: 14, padding: "11px 22px", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 8, zIndex: 9999, boxShadow: "0 8px 32px rgba(0,0,0,.2)", pointerEvents: "none" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span>
          {toast}
        </div>
      )}

      {/* ── Filter bar ─────────────────────────────────────────────────────── */}
      <div className="tkt-filter-bar" style={{ marginBottom: 20 }}>
        <div className="tkt-search" style={{ flex: 1 }}>
          <span className="material-symbols-outlined">search</span>
          <input type="text" placeholder="Search activity..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="tkt-filters">
          <select className="tkt-filter-sel" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">All Activity</option>
            <option value="created">Ticket Created</option>
            <option value="resolved">Resolved</option>
            <option value="note">Notes Added</option>
            <option value="updated">Updated</option>
            <option value="merchant">Merchant</option>
            <option value="closed">Closed</option>
          </select>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text3)", whiteSpace: "nowrap", padding: "0 4px" }}>
            {filtered.length} {filtered.length === 1 ? "event" : "events"}
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
          <button onClick={() => { setNmErr(""); setMerchantOpen(true) }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12, fontWeight: 700, color: "var(--text2)", cursor: "pointer", fontFamily: "inherit" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>storefront</span>New Merchant
          </button>
          <button onClick={openPicker} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "var(--accent-crm)", border: "none", borderRadius: 10, fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>add</span>New Ticket
          </button>
        </div>
      </div>

      {/* ── Feed ──────────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="dash-card-v2" style={{ textAlign: "center", padding: "56px 24px", color: "var(--text3)", fontSize: 14, fontWeight: 500 }}>
          No activity found
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map(entry => {
            const color = TYPE_COLOR[entry.type]
            const label = TYPE_LABEL[entry.type]
            const icon  = TYPE_ICON[entry.type]
            const sStyle = entry.status ? STATUS_STYLE[entry.status] : null
            const pStyle = entry.priority ? PRIORITY_STYLE[entry.priority] : null

            return (
              <div key={entry.id} style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 16, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,.04)" }}>

                {/* ── Card header ── */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color }}>{label}</span>
                  </div>
                  <span style={{ fontSize: 12, color: "var(--text3)" }}>{entry.relTime}</span>
                </div>

                {/* ── System event body ── */}
                {entry.isSystem && (
                  <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 16px", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "var(--accent-crm)", textTransform: "uppercase", letterSpacing: "0.07em" }}>System Event</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text3)", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 6, padding: "2px 8px", letterSpacing: "0.06em" }}>SYS-EVENT</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", lineHeight: 1.5 }}>
                      <Boldify text={entry.description ?? ""} terms={entry.boldTerms} />
                    </div>
                    <div style={{ textAlign: "right", fontSize: 11, color: "var(--text3)", marginTop: 8 }}>{entry.fullTs}</div>
                  </div>
                )}

                {/* ── Ticket context body ── */}
                {entry.ticketId && !entry.isSystem && (
                  <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px", marginBottom: 12 }}>
                    {/* Top row: merchant | ticketId + status/priority/mid chips */}
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{entry.merchant}</span>
                        <span style={{ color: "var(--border)", fontSize: 16, lineHeight: 1 }}>|</span>
                        <span style={{ fontSize: 11, fontWeight: 700, background: "var(--accent-crm-light)", color: "var(--accent-crm)", padding: "2px 9px", borderRadius: 6, fontFamily: "ui-monospace, monospace", letterSpacing: ".3px" }}>{entry.ticketId}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                        {sStyle && <Badge label={entry.status!} color={sStyle.color} bg={sStyle.bg} />}
                        {pStyle && <Badge label={entry.priority!} color={pStyle.color} bg={pStyle.bg} />}
                        {entry.mid && <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text3)" }}>MID: {entry.mid}</span>}
                      </div>
                    </div>
                    {/* Title */}
                    <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>{entry.ticketTitle}</div>
                    {/* Metadata strip */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px", marginBottom: 8 }}>
                      {entry.assignedTo && entry.assignedTo.length > 0 && <MetaItem label="Assigned" value={entry.assignedTo.join(", ")} />}
                      {entry.category && <MetaItem label="Category" value={entry.category} color={CAT_COLOR[entry.category] ?? "var(--text2)"} />}
                      {entry.dept && <MetaItem label="Dept" value={entry.dept} />}
                      {entry.escalation && <MetaItem label="Escalation" value={entry.escalation} />}
                      {entry.createdBy && <MetaItem label="Created by" value={entry.createdBy} />}
                    </div>
                    {/* Full timestamp */}
                    <div style={{ textAlign: "right", fontSize: 11, color: "var(--text3)" }}>{entry.fullTs}</div>
                  </div>
                )}

                {/* Merchant-only context (no ticketId) */}
                {entry.type === "merchant" && !entry.ticketId && (
                  <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{entry.merchant}</span>
                        {entry.mid && <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text3)" }}>MID: {entry.mid}</span>}
                      </div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>{entry.ticketTitle}</div>
                    <div style={{ textAlign: "right", fontSize: 11, color: "var(--text3)" }}>{entry.fullTs}</div>
                  </div>
                )}

                {/* ── Inner change card ── */}
                <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px", display: "flex", gap: 0 }}>

                  {/* Left: icon + label + entity + user */}
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flex: entry.changes || entry.note ? "0 0 auto" : "1", minWidth: 0, paddingRight: entry.changes || entry.note ? 20 : 0, borderRight: entry.changes || entry.note ? "1px solid var(--border)" : "none" }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: color + "22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color }}>{icon}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color, marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>
                        {entry.ticketTitle || entry.merchant || "System"}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 13, color: "var(--text3)" }}>person</span>
                        <span style={{ fontSize: 12, color: "var(--text3)", fontWeight: 600 }}>{entry.user}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: changes or note */}
                  {(entry.changes || entry.note) && (
                    <div style={{ flex: 1, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8, justifyContent: "center" }}>
                      {entry.note && (
                        <div style={{ fontSize: 13, color: "var(--text2)", fontStyle: "italic", lineHeight: 1.5 }}>
                          &ldquo;{entry.note}&rdquo;
                        </div>
                      )}
                      {entry.changes?.map((c, ci) => (
                        <div key={ci} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14, color: "var(--text3)", flexShrink: 0 }}>tune</span>
                          {c.from ? (
                            <>
                              <span style={{ color: "var(--text2)", fontWeight: 600 }}>{c.label}</span>
                              <span style={{ color: "#ef4444", fontWeight: 600 }}>{c.from}</span>
                              <span className="material-symbols-outlined" style={{ fontSize: 14, color: "var(--text3)" }}>arrow_forward</span>
                              <span style={{ color: "#10b981", fontWeight: 600 }}>{c.to}</span>
                            </>
                          ) : (
                            <>
                              <span style={{ color: "var(--text2)", fontWeight: 600 }}>{c.label}</span>
                              <span className="material-symbols-outlined" style={{ fontSize: 14, color: "var(--text3)" }}>arrow_forward</span>
                              <span style={{ color: "#10b981", fontWeight: 600 }}>{c.to}</span>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )
          })}
        </div>
      )}

      {/* ════ MODAL: Merchant Picker ════ */}
      {pickerOpen && (
        <Overlay onClose={() => setPickerOpen(false)}>
          <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 20, width: "100%", maxWidth: 520, maxHeight: "80vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,.25)" }}>
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--accent-crm-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ color: "var(--accent-crm)", fontSize: 20 }}>storefront</span>
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: "var(--text)" }}>Select Merchant for New Ticket</div>
                <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 1 }}>Search by name or MID</div>
              </div>
              <button onClick={() => setPickerOpen(false)} style={{ marginLeft: "auto", background: "var(--bg3)", border: "none", width: 32, height: 32, borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--text3)" }}>close</span>
              </button>
            </div>
            <div style={{ padding: "12px 24px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ position: "relative" }}>
                <span className="material-symbols-outlined" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: "var(--text3)", pointerEvents: "none" }}>search</span>
                <input autoFocus type="text" placeholder="Search merchants by name or MID..." value={pickerSearch} onChange={e => setPickerSearch(e.target.value)} style={{ ...fieldSt, paddingLeft: 34 }} />
              </div>
            </div>
            <div style={{ overflowY: "auto", flex: 1 }}>
              {pickerResults.length === 0 ? (
                <div style={{ padding: "32px 24px", textAlign: "center", fontSize: 13, color: "var(--text3)" }}>No merchants found</div>
              ) : pickerResults.map(m => (
                <div key={m.id} onClick={() => pickMerchant(m)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 24px", borderBottom: "1px solid var(--border)", cursor: "pointer", transition: ".12s" }} onMouseEnter={e => (e.currentTarget.style.background = "var(--bg3)")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: "var(--accent-crm-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 17, color: "var(--accent-crm)" }}>storefront</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{m.dba}</div>
                    <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 1 }}>MID: {m.mid}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: statusDot(m.status) }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: statusDot(m.status) }} />
                    {m.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Overlay>
      )}

      {/* ════ MODAL: New Ticket ════ */}
      {ticketOpen && selectedMerchant && (
        <Overlay onClose={() => setTicketOpen(false)}>
          <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 20, width: "100%", maxWidth: 600, maxHeight: "88vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,.25)" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(99,102,241,.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ color: "#6366f1", fontSize: 20 }}>confirmation_number</span>
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: "var(--text)" }}>Create New Ticket</div>
                <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 1 }}>{selectedMerchant.dba} · MID {selectedMerchant.mid}</div>
              </div>
              <button onClick={() => setTicketOpen(false)} style={{ marginLeft: "auto", background: "var(--bg3)", border: "none", width: 32, height: 32, borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--text3)" }}>close</span>
              </button>
            </div>
            <div style={{ overflowY: "auto", flex: 1, padding: "8px 24px 24px" }}>
              {ntErr && <div style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.25)", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#ef4444", fontWeight: 600, margin: "12px 0 4px" }}>{ntErr}</div>}
              <FieldRow>
                <Field label="Status"><select value={ntStatus} onChange={e => setNtStatus(e.target.value)} style={fieldSt}><option>Open</option><option>In Progress</option><option>Pending Internal</option></select></Field>
                <Field label="Priority"><select value={ntPriority} onChange={e => setNtPriority(e.target.value)} style={fieldSt}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></Field>
              </FieldRow>
              <FieldRow>
                <Field label="Category"><select value={ntCategory} onChange={e => setNtCategory(e.target.value)} style={fieldSt}><option value="">— Select —</option><option>Account</option><option>Billing/Statement</option><option>Equipment</option><option>Technical</option><option>General Inquiry</option></select></Field>
                <Field label="Department"><select value={ntDept} onChange={e => setNtDept(e.target.value)} style={fieldSt}><option value="">— Select —</option><option>Support</option><option>Risk</option><option>Tech</option><option>Operations</option></select></Field>
              </FieldRow>
              <FieldRow>
                <Field label="Assigned To"><select value={ntAssigned} onChange={e => setNtAssigned(e.target.value)} style={fieldSt}><option value="">— Unassigned —</option>{AGENTS.map(a => <option key={a}>{a}</option>)}</select></Field>
                <Field label="Escalation"><select value={ntEscalation} onChange={e => setNtEscalation(e.target.value)} style={fieldSt}><option>Tier 1</option><option>Tier 2</option><option>Tier 3</option><option>Management</option></select></Field>
              </FieldRow>
              <Field label="Subject *"><input type="text" placeholder="Brief summary" value={ntSubject} onChange={e => { setNtSubject(e.target.value); setNtErr("") }} style={{ ...fieldSt, borderColor: ntErr && !ntSubject ? "#ef4444" : "var(--border)" }} /></Field>
              <Field label="Description"><textarea rows={4} placeholder="Describe the issue..." value={ntDesc} onChange={e => setNtDesc(e.target.value)} style={{ ...fieldSt, resize: "vertical", lineHeight: 1.5 }} /></Field>
              <Field label="Tags"><input type="text" placeholder="Comma separated" value={ntTags} onChange={e => setNtTags(e.target.value)} style={fieldSt} /></Field>
            </div>
            <div style={{ padding: "14px 24px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, justifyContent: "flex-end", flexShrink: 0 }}>
              <button onClick={() => setTicketOpen(false)} style={{ padding: "9px 18px", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 13, fontWeight: 700, color: "var(--text2)", cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
              <button onClick={createTicket} style={{ padding: "9px 20px", background: "var(--accent-crm)", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>add</span>Create Ticket
              </button>
            </div>
          </div>
        </Overlay>
      )}

      {/* ════ MODAL: New Merchant ════ */}
      {merchantOpen && (
        <Overlay onClose={() => setMerchantOpen(false)}>
          <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 20, width: "100%", maxWidth: 680, maxHeight: "88vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,.25)" }}>
            <div style={{ padding: "20px 28px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: "var(--accent-crm-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ color: "var(--accent-crm)", fontSize: 22 }}>store</span>
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 17, color: "var(--text)" }}>Create New Merchant</div>
                <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>Fill in the details to onboard a new merchant</div>
              </div>
              <button onClick={() => setMerchantOpen(false)} style={{ marginLeft: "auto", background: "var(--bg3)", border: "none", width: 32, height: 32, borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--text3)" }}>close</span>
              </button>
            </div>
            <div style={{ overflowY: "auto", flex: 1, padding: "8px 28px 28px" }}>
              <SectionDivider icon="person" label="Owner / Principal" />
              <FieldRow>
                <Field label="Owner Name"><input type="text" value={nmOwnerName} onChange={e => setNmOwnerName(e.target.value)} style={fieldSt} /></Field>
                <Field label="Owner Phone"><input type="text" value={nmOwnerPhone} onChange={e => setNmOwnerPhone(e.target.value)} style={fieldSt} /></Field>
              </FieldRow>
              <Field label="Owner Email"><input type="email" value={nmOwnerEmail} onChange={e => setNmOwnerEmail(e.target.value)} style={fieldSt} /></Field>
              <SectionDivider icon="business" label="Business Information" />
              <FieldRow>
                <Field label="DBA Name *"><input type="text" value={nmDba} onChange={e => { setNmDba(e.target.value); setNmErr("") }} style={{ ...fieldSt, borderColor: nmErr && !nmDba ? "#ef4444" : "var(--border)" }} /></Field>
                <Field label="Legal Name"><input type="text" value={nmLegal} onChange={e => setNmLegal(e.target.value)} style={fieldSt} /></Field>
              </FieldRow>
              <FieldRow>
                <Field label="MID *"><input type="text" value={nmMid} onChange={e => { setNmMid(e.target.value); setNmErr("") }} style={{ ...fieldSt, borderColor: nmErr && !nmMid ? "#ef4444" : "var(--border)" }} /></Field>
                <Field label="Processor"><select value={nmProcessor} onChange={e => setNmProcessor(e.target.value)} style={fieldSt}>{PROCESSORS.map(p => <option key={p}>{p}</option>)}</select></Field>
              </FieldRow>
              <FieldRow>
                <Field label="Status"><select value={nmStatus} onChange={e => setNmStatus(e.target.value)} style={fieldSt}><option>Active</option><option>Inactive</option><option>Pending</option></select></Field>
                <Field label="Business Type"><input type="text" value={nmBizType} onChange={e => setNmBizType(e.target.value)} style={fieldSt} /></Field>
              </FieldRow>
              <FieldRow>
                <Field label="MCC Code"><input type="text" value={nmMcc} onChange={e => setNmMcc(e.target.value)} style={fieldSt} /></Field>
                <Field label="Business Phone"><input type="text" value={nmBizPhone} onChange={e => setNmBizPhone(e.target.value)} style={fieldSt} /></Field>
              </FieldRow>
              <FieldRow>
                <Field label="Website"><input type="text" value={nmWebsite} onChange={e => setNmWebsite(e.target.value)} style={fieldSt} /></Field>
                <Field label="Business Address"><input type="text" value={nmAddress} onChange={e => setNmAddress(e.target.value)} style={fieldSt} /></Field>
              </FieldRow>
              <SectionDivider icon="support_agent" label="Agent Details" />
              <Field label="Agent Name"><select value={nmSalesRep} onChange={e => setNmSalesRep(e.target.value)} style={fieldSt}><option value="">— Select Agent —</option>{AGENTS.map(a => <option key={a}>{a}</option>)}</select></Field>
              <FieldRow>
                <Field label="Agent Email"><input type="email" value={nmAgentEmail} onChange={e => setNmAgentEmail(e.target.value)} style={fieldSt} /></Field>
                <Field label="Agent Phone"><input type="text" value={nmAgentPhone} onChange={e => setNmAgentPhone(e.target.value)} style={fieldSt} /></Field>
              </FieldRow>
              <Field label="Agent Code"><input type="text" value={nmAgentCode} onChange={e => setNmAgentCode(e.target.value)} style={fieldSt} /></Field>
              <SectionDivider icon="settings" label="Account Details" />
              <FieldRow>
                <Field label="Monthly Volume ($)"><input type="number" placeholder="0" value={nmMonthlyVol} onChange={e => setNmMonthlyVol(e.target.value)} style={fieldSt} /></Field>
                <Field label="Avg Ticket ($)"><input type="number" placeholder="0.00" step="0.01" value={nmAvgTicket} onChange={e => setNmAvgTicket(e.target.value)} style={fieldSt} /></Field>
              </FieldRow>
              <FieldRow>
                <Field label="Risk Level"><select value={nmRisk} onChange={e => setNmRisk(e.target.value)} style={fieldSt}><option>Low</option><option>Medium</option><option>High</option></select></Field>
                <Field label="Contract Term"><input type="text" placeholder="e.g. 3-Year" value={nmContract} onChange={e => setNmContract(e.target.value)} style={fieldSt} /></Field>
              </FieldRow>
              <FieldRow>
                <Field label="Billing Cycle"><select value={nmBilling} onChange={e => setNmBilling(e.target.value)} style={fieldSt}><option>Monthly</option><option>Quarterly</option><option>Annual</option></select></Field>
                <Field label="Pricing Type"><select value={nmPricing} onChange={e => setNmPricing(e.target.value)} style={fieldSt}><option>Dual Pricing</option><option>Traditional</option></select></Field>
              </FieldRow>
              <Field label="EBT"><select value={nmEbt} onChange={e => setNmEbt(e.target.value)} style={fieldSt}><option>Disabled</option><option>Enabled</option></select></Field>
              {nmErr && <div style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.25)", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#ef4444", fontWeight: 600, marginTop: 4 }}>{nmErr}</div>}
            </div>
            <div style={{ padding: "14px 28px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, justifyContent: "flex-end", flexShrink: 0 }}>
              <button onClick={() => setMerchantOpen(false)} style={{ padding: "10px 22px", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 10, fontWeight: 600, fontSize: 13, color: "var(--text2)", cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
              <button onClick={createMerchant} style={{ padding: "10px 24px", background: "var(--accent-crm)", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 4px 14px rgba(99,102,241,.35)" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add_business</span>Create Merchant
              </button>
            </div>
          </div>
        </Overlay>
      )}

    </div>
  )
}
