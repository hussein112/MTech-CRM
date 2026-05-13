"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import type { Ticket } from "@/app/types/dashboard"

// ─── Types ────────────────────────────────────────────
export type MerchantStatus = "Active" | "Inactive" | "Pending" | "Closed"
type DeviceStatus  = "Active" | "Offline" | "Damaged" | "Returned" | "TBD"
type DeviceType    = "Terminal" | "POS" | "Printer" | "Pin Pad" | "Accessory" | "Service / Integration" | "Other"
type RiskLevel     = "Low" | "Medium" | "High"

export interface Device {
  id: string
  brand: string
  type: DeviceType
  model: string
  serial?: string
  invoice?: string
  unitId?: string
  tidType?: string
  tid?: string
  printerConn?: string
  printerIp?: string
  parentId?: string
  status: DeviceStatus
  activeDate?: string
  ticket?: string
  notes?: string
}

export interface MerchantDoc {
  id: string
  docType: string
  name: string
  uploadedAt: string
  size?: string
}

export interface MerchantNote {
  id: string
  author: string
  content: string
  createdAt: string
}

export interface Merchant {
  id: string
  mid: string
  dba: string
  legalName: string
  processor: string
  status: MerchantStatus
  ownerName?: string
  ownerPhone?: string
  ownerEmail?: string
  bizType?: string
  mcc?: string
  bizPhone?: string
  website?: string
  address?: string
  operatingHours?: string
  salesRep?: string
  agentEmail?: string
  agentPhone?: string
  agentCode?: string
  monthlyVol?: number
  avgTicket?: number
  riskLevel?: RiskLevel
  contractTerm?: string
  billingCycle?: "Monthly" | "Quarterly" | "Annual"
  onboardedDate?: string
  devices: Device[]
  docs: MerchantDoc[]
  notes: MerchantNote[]
  tickets: Ticket[]
  openTickets: number
}

// ─── Constants ────────────────────────────────────────
const PROCESSORS = ["Fiserv", "TSYS", "Maverick", "Elavon"]
const AGENTS     = ["Joan Huang", "Moe Kadi", "Zu Jia He Cen"]
const DEVICE_BRANDS = ["Clover", "Dejavoo", "PAX", "Ingenico", "Verifone", "Square", "SwipeSimple", "Epson", "Star", "Other"]
const DOC_TYPES  = ["FNS", "EIN", "Account Update Form", "Voided Check", "Bank Statement", "Contract", "Photo ID", "Application", "Other"]
const ID_TYPES   = ["TID", "TPN", "EPI", "Other", "None"]
const PRINTER_CONNS = ["Ethernet (LAN)", "WiFi", "Bluetooth", "USB", "Other"]
const MERCH_COLS = "120px minmax(0,1fr) minmax(0,1fr) 110px 90px minmax(0,1fr) 70px"

function merchantStatusStyle(s: MerchantStatus) {
  const m: Record<MerchantStatus, { background: string; color: string }> = {
    Active:   { background: "rgba(16,185,129,.12)",  color: "#10b981" },
    Inactive: { background: "rgba(107,114,128,.12)", color: "#6b7280" },
    Pending:  { background: "rgba(245,158,11,.12)",  color: "#f59e0b" },
    Closed:   { background: "rgba(239,68,68,.12)",   color: "#ef4444" },
  }
  return m[s]
}

function deviceStatusStyle(s: DeviceStatus) {
  const m: Record<DeviceStatus, { background: string; color: string }> = {
    Active:   { background: "rgba(16,185,129,.12)",  color: "#10b981" },
    Offline:  { background: "rgba(245,158,11,.12)",  color: "#f59e0b" },
    Damaged:  { background: "rgba(239,68,68,.12)",   color: "#ef4444" },
    Returned: { background: "rgba(107,114,128,.12)", color: "#6b7280" },
    TBD:      { background: "rgba(99,102,241,.12)",  color: "#6366f1" },
  }
  return m[s]
}

function docIcon(type: string) {
  const m: Record<string, string> = {
    Contract: "description", "Photo ID": "badge", Application: "assignment",
    "Voided Check": "account_balance", "Bank Statement": "account_balance",
    EIN: "fingerprint", FNS: "receipt_long", "Account Update Form": "edit_document",
  }
  return m[type] ?? "attach_file"
}

const PRIORITY_COLORS: Record<string, string> = {
  Low: "#10b981", Medium: "#f59e0b", High: "#ef4444", Critical: "#7c3aed",
}
const STATUS_COLORS: Record<string, string> = {
  Open: "#ef4444", "In Progress": "#f59e0b", "Pending Internal": "#8b5cf6",
  Resolved: "#10b981", Closed: "#6b7280",
}

// ─── Form types ───────────────────────────────────────
interface MerchantForm {
  ownerName: string; ownerPhone: string; ownerEmail: string
  dba: string; legalName: string; mid: string; processor: string; status: MerchantStatus
  bizType: string; mcc: string; bizPhone: string; website: string
  address: string; operatingHours: string
  salesRep: string; agentEmail: string; agentPhone: string; agentCode: string
  monthlyVol: string; avgTicket: string; riskLevel: RiskLevel
  contractTerm: string; billingCycle: "Monthly" | "Quarterly" | "Annual"
  onboardedDate: string; closureTicket: string; closureReason: string
}

const EMPTY_FORM: MerchantForm = {
  ownerName: "", ownerPhone: "", ownerEmail: "",
  dba: "", legalName: "", mid: "", processor: "", status: "Active",
  bizType: "", mcc: "", bizPhone: "", website: "", address: "", operatingHours: "",
  salesRep: "", agentEmail: "", agentPhone: "", agentCode: "",
  monthlyVol: "", avgTicket: "", riskLevel: "Low",
  contractTerm: "", billingCycle: "Monthly", onboardedDate: "",
  closureTicket: "", closureReason: "",
}

interface DeviceForm {
  brand: string; type: DeviceType; model: string
  serial: string; invoice: string; unitId: string; tidType: string; tid: string
  printerConn: string; printerIp: string; parentId: string
  status: DeviceStatus; activeDate: string; ticket: string; notes: string
}

const EMPTY_DEVICE: DeviceForm = {
  brand: "", type: "Terminal", model: "",
  serial: "", invoice: "", unitId: "", tidType: "TID", tid: "",
  printerConn: "Ethernet (LAN)", printerIp: "", parentId: "",
  status: "Active", activeDate: "", ticket: "", notes: "",
}

interface DocForm { docType: string; name: string; fileName: string }
const EMPTY_DOC: DocForm = { docType: "", name: "", fileName: "" }

// ─── Utility sub-components ───────────────────────────

function SectionHead({ icon, label }: { icon: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "12px 0 14px", paddingBottom: 8, borderBottom: "1px solid var(--border)" }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--accent-crm-light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span className="material-symbols-outlined" style={{ fontSize: 15, color: "var(--accent-crm)" }}>{icon}</span>
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.2px", color: "var(--text3)" }}>{label}</span>
    </div>
  )
}

function CField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="crm-field">
      <label>{label}</label>
      {children}
    </div>
  )
}

function CRow({ children }: { children: React.ReactNode }) {
  return <div className="crm-field-row">{children}</div>
}

function InfoCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--accent-crm)" }}>{icon}</span>
        <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text)", textTransform: "uppercase" as const, letterSpacing: 0.5 }}>{title}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>{children}</div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value?: string | number }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
      <span style={{ fontSize: 12, color: "var(--text3)", fontWeight: 500, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 12, color: "var(--text)", fontWeight: 600, textAlign: "right" as const }}>{value ?? "—"}</span>
    </div>
  )
}

function ModalHeader({ icon, title, subtitle, onClose }: { icon: string; title: string; subtitle: string; onClose: () => void }) {
  return (
    <div style={{ padding: "22px 28px", display: "flex", alignItems: "center", gap: 14, borderBottom: "1px solid var(--border)" }}>
      <div style={{ width: 42, height: 42, borderRadius: 12, background: "var(--accent-crm-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span className="material-symbols-outlined" style={{ color: "var(--accent-crm)", fontSize: 22 }}>{icon}</span>
      </div>
      <div>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: "var(--text)", margin: 0 }}>{title}</h2>
        <p style={{ fontSize: 12, color: "var(--text3)", margin: "2px 0 0", fontWeight: 500 }}>{subtitle}</p>
      </div>
      <button onClick={onClose} style={{ marginLeft: "auto", background: "var(--bg3)", border: "none", width: 32, height: 32, borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--text3)" }}>close</span>
      </button>
    </div>
  )
}

function ModalFooter({ onCancel, onConfirm, confirmLabel, confirmIcon }: {
  onCancel: () => void; onConfirm: () => void; confirmLabel: string; confirmIcon: string
}) {
  return (
    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", padding: "18px 28px", borderTop: "1px solid var(--border)" }}>
      <button className="crm-btn crm-btn-ghost" onClick={onCancel}>Cancel</button>
      <button className="crm-btn crm-btn-primary" onClick={onConfirm} style={{ boxShadow: "0 4px 14px rgba(99,102,241,.3)" }}>
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{confirmIcon}</span>
        {confirmLabel}
      </button>
    </div>
  )
}

function ModalWrap({ children, onClose, maxWidth = 680 }: { children: React.ReactNode; onClose: () => void; maxWidth?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", h)
    return () => window.removeEventListener("keydown", h)
  }, [onClose])
  return (
    <div className="crm-modal-overlay" ref={ref} onClick={e => { if (e.target === ref.current) onClose() }}>
      <div className="crm-modal" style={{ maxWidth, width: "100%", overflow: "hidden" }}>
        {children}
      </div>
    </div>
  )
}

// ─── Merchant form body (shared by New + Edit) ────────
function MerchantFormBody({
  f, set, isEdit = false, error,
}: {
  f: MerchantForm
  set: <K extends keyof MerchantForm>(k: K, v: MerchantForm[K]) => void
  isEdit?: boolean
  error?: string
}) {
  const inp = (id: keyof MerchantForm, placeholder?: string, type = "text") => (
    <input
      type={type}
      value={f[id] as string}
      placeholder={placeholder}
      onChange={e => set(id, e.target.value as MerchantForm[typeof id])}
      autoComplete="off"
    />
  )

  return (
    <div style={{ padding: "8px 28px 0", maxHeight: "65vh", overflowY: "auto" }}>
      <SectionHead icon="person" label="Owner / Principal" />
      <CRow><CField label="Owner Name">{inp("ownerName")}</CField><CField label="Owner Phone">{inp("ownerPhone")}</CField></CRow>
      <CField label="Owner Email">{inp("ownerEmail", "", "email")}</CField>

      <SectionHead icon="business" label="Business Information" />
      <CRow>
        <CField label="DBA Name *">{inp("dba")}</CField>
        <CField label="Legal Name">{inp("legalName")}</CField>
      </CRow>
      <CRow>
        <CField label="MID *">{inp("mid")}</CField>
        <CField label="Processor">
          <input list="mf_proc_list" value={f.processor} placeholder="Select or type…" onChange={e => set("processor", e.target.value)} autoComplete="off" style={{ appearance: "none" as const }} />
          <datalist id="mf_proc_list">{PROCESSORS.map(p => <option key={p} value={p} />)}</datalist>
        </CField>
      </CRow>
      <CRow>
        <CField label="Status">
          <select value={f.status} onChange={e => set("status", e.target.value as MerchantStatus)}>
            <option>Active</option><option>Inactive</option><option>Pending</option>
            {isEdit && <option>Closed</option>}
          </select>
        </CField>
        <CField label="Business Type">{inp("bizType")}</CField>
      </CRow>

      {isEdit && f.status === "Closed" && (
        <div style={{ background: "var(--bg)", padding: 14, borderRadius: 10, border: "1px dashed var(--border)", marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--red)", textTransform: "uppercase" as const, marginBottom: 10, paddingBottom: 6, borderBottom: "1px solid var(--border)" }}>Account Closure Details</div>
          <CField label="Ticket Reference *">{inp("closureTicket", "e.g. MTECH-12345")}</CField>
          <CField label="Closure Reason *">
            <textarea value={f.closureReason} onChange={e => set("closureReason", e.target.value)} rows={3} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)", fontSize: 13, background: "var(--bg2)", color: "var(--text)", outline: "none", fontFamily: "inherit", resize: "vertical" as const, boxSizing: "border-box" as const }} />
          </CField>
        </div>
      )}

      <CRow>
        <CField label="MCC Code">{inp("mcc")}</CField>
        <CField label="Business Phone">{inp("bizPhone")}</CField>
      </CRow>
      <CField label="Website">{inp("website")}</CField>
      <CField label="Business Address">{inp("address", "123 Main St, City, ST 12345")}</CField>
      <CField label="Operating Hours">{inp("operatingHours", "e.g. Mon–Fri 9am–6pm")}</CField>

      <SectionHead icon="support_agent" label="Agent Details" />
      <CField label="Agent Name">
        <select value={f.salesRep} onChange={e => set("salesRep", e.target.value)}>
          <option value="">— Select Agent —</option>
          {AGENTS.map(a => <option key={a}>{a}</option>)}
        </select>
      </CField>
      <CRow>
        <CField label="Agent Email">{inp("agentEmail", "", "email")}</CField>
        <CField label="Agent Phone">{inp("agentPhone")}</CField>
      </CRow>
      <CField label="Agent Code">{inp("agentCode")}</CField>

      <SectionHead icon="settings" label="Account Details" />
      <CRow>
        <CField label="Monthly Volume ($)"><input type="number" value={f.monthlyVol} placeholder="0" onChange={e => set("monthlyVol", e.target.value)} /></CField>
        <CField label="Avg Ticket ($)"><input type="number" step="0.01" value={f.avgTicket} placeholder="0.00" onChange={e => set("avgTicket", e.target.value)} /></CField>
      </CRow>
      <CRow>
        <CField label="Risk Level">
          <select value={f.riskLevel} onChange={e => set("riskLevel", e.target.value as RiskLevel)}>
            <option>Low</option><option>Medium</option><option>High</option>
          </select>
        </CField>
        <CField label="Contract Term">{inp("contractTerm", "e.g. 3-Year")}</CField>
      </CRow>
      <CRow>
        <CField label="Billing Cycle">
          <select value={f.billingCycle} onChange={e => set("billingCycle", e.target.value as MerchantForm["billingCycle"])}>
            <option>Monthly</option><option>Quarterly</option><option>Annual</option>
          </select>
        </CField>
        <CField label="Onboarded Date"><input type="date" value={f.onboardedDate} onChange={e => set("onboardedDate", e.target.value)} /></CField>
      </CRow>

      {error && <div style={{ color: "var(--red)", fontSize: 12, marginBottom: 12 }}>{error}</div>}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────
type ActiveTab = "overview" | "equipment" | "tickets" | "documents" | "notes"

interface Props { initialMerchants: Merchant[] }

export function MerchantsClient({ initialMerchants }: Props) {
  // Data
  const [merchants, setMerchants] = useState(initialMerchants)

  // Filters
  const [query,         setQuery]         = useState("")
  const [statusFilt,    setStatusFilt]    = useState("")
  const [agentFilt,     setAgentFilt]     = useState("")
  const [processorFilt, setProcessorFilt] = useState("")

  // Navigation
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null)
  const [selectedTicket,   setSelectedTicket]   = useState<Ticket | null>(null)
  const [activeTab,        setActiveTab]        = useState<ActiveTab>("overview")

  // Modals
  const [showNew,       setShowNew]       = useState(false)
  const [showEdit,      setShowEdit]      = useState(false)
  const [showSelection, setShowSelection] = useState(false)
  const [showDevice,    setShowDevice]    = useState(false)
  const [showUploadDoc, setShowUploadDoc] = useState(false)
  const [showEditDoc,   setShowEditDoc]   = useState(false)
  const [showAddNote,   setShowAddNote]   = useState(false)

  // Forms
  const [newForm,    setNewFormRaw]  = useState<MerchantForm>(EMPTY_FORM)
  const [editForm,   setEditFormRaw] = useState<MerchantForm>(EMPTY_FORM)
  const [deviceForm, setDeviceFormRaw] = useState<DeviceForm>(EMPTY_DEVICE)
  const [docForm,    setDocFormRaw]  = useState<DocForm>(EMPTY_DOC)
  const [editDocId,  setEditDocId]   = useState("")
  const [editDocForm, setEditDocFormRaw] = useState<DocForm>(EMPTY_DOC)
  const [noteContent, setNoteContent] = useState("")
  const [newError,    setNewError]   = useState("")
  const [editError,   setEditError]  = useState("")
  const [deviceError, setDeviceError] = useState("")
  const [docError,    setDocError]   = useState("")

  function setNew<K extends keyof MerchantForm>(k: K, v: MerchantForm[K]) { setNewFormRaw(f => ({ ...f, [k]: v })) }
  function setEdit<K extends keyof MerchantForm>(k: K, v: MerchantForm[K]) { setEditFormRaw(f => ({ ...f, [k]: v })) }
  function setDev<K extends keyof DeviceForm>(k: K, v: DeviceForm[K]) { setDeviceFormRaw(f => ({ ...f, [k]: v })) }
  function setDoc<K extends keyof DocForm>(k: K, v: DocForm[K]) { setDocFormRaw(f => ({ ...f, [k]: v })) }
  function setEditDoc<K extends keyof DocForm>(k: K, v: DocForm[K]) { setEditDocFormRaw(f => ({ ...f, [k]: v })) }

  // Filtered merchant list
  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return merchants.filter(m => {
      if (q && ![m.mid, m.dba, m.legalName, m.processor, m.salesRep ?? ""].some(s => s.toLowerCase().includes(q))) return false
      if (statusFilt    && m.status    !== statusFilt)    return false
      if (agentFilt     && m.salesRep  !== agentFilt)     return false
      if (processorFilt && m.processor !== processorFilt) return false
      return true
    })
  }, [merchants, query, statusFilt, agentFilt, processorFilt])

  const hasFilters = query || statusFilt || agentFilt || processorFilt

  function clearFilters() {
    setQuery(""); setStatusFilt(""); setAgentFilt(""); setProcessorFilt("")
  }

  // Handlers
  function openDetail(m: Merchant) {
    setSelectedMerchant(m); setActiveTab("overview"); setSelectedTicket(null)
  }

  function openEditModal(m: Merchant) {
    setEditFormRaw({
      ownerName: m.ownerName ?? "", ownerPhone: m.ownerPhone ?? "", ownerEmail: m.ownerEmail ?? "",
      dba: m.dba, legalName: m.legalName, mid: m.mid, processor: m.processor, status: m.status,
      bizType: m.bizType ?? "", mcc: m.mcc ?? "", bizPhone: m.bizPhone ?? "",
      website: m.website ?? "", address: m.address ?? "", operatingHours: m.operatingHours ?? "",
      salesRep: m.salesRep ?? "", agentEmail: m.agentEmail ?? "",
      agentPhone: m.agentPhone ?? "", agentCode: m.agentCode ?? "",
      monthlyVol: m.monthlyVol?.toString() ?? "", avgTicket: m.avgTicket?.toString() ?? "",
      riskLevel: m.riskLevel ?? "Low", contractTerm: m.contractTerm ?? "",
      billingCycle: m.billingCycle ?? "Monthly", onboardedDate: m.onboardedDate ?? "",
      closureTicket: "", closureReason: "",
    })
    setEditError("")
    setShowEdit(true)
  }

  function createMerchant() {
    if (!newForm.dba.trim())  { setNewError("DBA Name is required."); return }
    if (!newForm.mid.trim())  { setNewError("MID is required."); return }
    const newM: Merchant = {
      id: `M-${String(merchants.length + 1).padStart(3, "0")}`,
      mid: newForm.mid, dba: newForm.dba, legalName: newForm.legalName,
      processor: newForm.processor, status: newForm.status,
      ownerName: newForm.ownerName, ownerPhone: newForm.ownerPhone, ownerEmail: newForm.ownerEmail,
      bizType: newForm.bizType, mcc: newForm.mcc, bizPhone: newForm.bizPhone,
      website: newForm.website, address: newForm.address, operatingHours: newForm.operatingHours,
      salesRep: newForm.salesRep, agentEmail: newForm.agentEmail,
      agentPhone: newForm.agentPhone, agentCode: newForm.agentCode,
      monthlyVol: newForm.monthlyVol ? Number(newForm.monthlyVol) : undefined,
      avgTicket: newForm.avgTicket ? Number(newForm.avgTicket) : undefined,
      riskLevel: newForm.riskLevel, contractTerm: newForm.contractTerm,
      billingCycle: newForm.billingCycle, onboardedDate: newForm.onboardedDate,
      devices: [], docs: [], notes: [], tickets: [], openTickets: 0,
    }
    setMerchants(prev => [newM, ...prev])
    setShowNew(false); setNewFormRaw(EMPTY_FORM); setNewError("")
  }

  function saveEditMerchant() {
    if (!editForm.dba.trim()) { setEditError("DBA Name is required."); return }
    if (!editForm.mid.trim()) { setEditError("MID is required."); return }
    setMerchants(prev => prev.map(m => {
      if (m.id !== selectedMerchant?.id) return m
      const updated: Merchant = {
        ...m,
        mid: editForm.mid, dba: editForm.dba, legalName: editForm.legalName,
        processor: editForm.processor, status: editForm.status,
        ownerName: editForm.ownerName, ownerPhone: editForm.ownerPhone, ownerEmail: editForm.ownerEmail,
        bizType: editForm.bizType, mcc: editForm.mcc, bizPhone: editForm.bizPhone,
        website: editForm.website, address: editForm.address, operatingHours: editForm.operatingHours,
        salesRep: editForm.salesRep, agentEmail: editForm.agentEmail,
        agentPhone: editForm.agentPhone, agentCode: editForm.agentCode,
        monthlyVol: editForm.monthlyVol ? Number(editForm.monthlyVol) : undefined,
        avgTicket: editForm.avgTicket ? Number(editForm.avgTicket) : undefined,
        riskLevel: editForm.riskLevel, contractTerm: editForm.contractTerm,
        billingCycle: editForm.billingCycle, onboardedDate: editForm.onboardedDate,
      }
      return updated
    }))
    if (selectedMerchant) {
      setSelectedMerchant(prev => prev ? {
        ...prev,
        mid: editForm.mid, dba: editForm.dba, legalName: editForm.legalName,
        processor: editForm.processor, status: editForm.status,
        salesRep: editForm.salesRep,
      } : null)
    }
    setShowEdit(false); setEditError("")
  }

  function addDevice() {
    if (!deviceForm.model.trim()) { setDeviceError("Model is required."); return }
    const d: Device = {
      id: `D-${Date.now()}`,
      brand: deviceForm.brand, type: deviceForm.type, model: deviceForm.model,
      serial: deviceForm.serial, invoice: deviceForm.invoice, unitId: deviceForm.unitId,
      tidType: deviceForm.tidType, tid: deviceForm.tid,
      printerConn: deviceForm.printerConn, printerIp: deviceForm.printerIp,
      parentId: deviceForm.parentId, status: deviceForm.status,
      activeDate: deviceForm.activeDate, ticket: deviceForm.ticket, notes: deviceForm.notes,
    }
    updateSelected(m => ({ ...m, devices: [...m.devices, d] }))
    setShowDevice(false); setDeviceFormRaw(EMPTY_DEVICE); setDeviceError("")
  }

  function removeDevice(did: string) {
    updateSelected(m => ({ ...m, devices: m.devices.filter(d => d.id !== did) }))
  }

  function uploadDoc() {
    if (!docForm.docType) { setDocError("Document type is required."); return }
    if (!docForm.fileName) { setDocError("Please select a file."); return }
    const doc: MerchantDoc = {
      id: `DOC-${Date.now()}`,
      docType: docForm.docType,
      name: docForm.name || docForm.fileName,
      uploadedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      size: "—",
    }
    updateSelected(m => ({ ...m, docs: [...m.docs, doc] }))
    setShowUploadDoc(false); setDocFormRaw(EMPTY_DOC); setDocError("")
  }

  function openEditDoc(doc: MerchantDoc) {
    setEditDocId(doc.id)
    setEditDocFormRaw({ docType: doc.docType, name: doc.name, fileName: doc.name })
    setShowEditDoc(true)
  }

  function saveEditDoc() {
    updateSelected(m => ({
      ...m,
      docs: m.docs.map(d => d.id === editDocId
        ? { ...d, docType: editDocForm.docType, name: editDocForm.name || d.name }
        : d
      ),
    }))
    setShowEditDoc(false)
  }

  function removeDoc(did: string) {
    updateSelected(m => ({ ...m, docs: m.docs.filter(d => d.id !== did) }))
  }

  function addNote() {
    if (!noteContent.trim()) return
    const note: MerchantNote = {
      id: `N-${Date.now()}`,
      author: "Joan Huang",
      content: noteContent.trim(),
      createdAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    }
    updateSelected(m => ({ ...m, notes: [note, ...m.notes] }))
    setShowAddNote(false); setNoteContent("")
  }

  function removeNote(nid: string) {
    updateSelected(m => ({ ...m, notes: m.notes.filter(n => n.id !== nid) }))
  }

  function updateSelected(updater: (m: Merchant) => Merchant) {
    if (!selectedMerchant) return
    const next = updater(selectedMerchant)
    setSelectedMerchant(next)
    setMerchants(prev => prev.map(m => m.id === next.id ? next : m))
  }

  // ── Ticket detail within merchant context ─────────────
  if (selectedTicket && selectedMerchant) {
    const sc = STATUS_COLORS[selectedTicket.status] ?? "#6b7280"
    const pc = PRIORITY_COLORS[selectedTicket.priority] ?? "#6b7280"
    return (
      <div className="dash-layout">
        <button className="tkt-back-btn" onClick={() => setSelectedTicket(null)}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
          Back to {selectedMerchant.dba}
        </button>
        <div className="tkt-detail-hero">
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-crm)", marginBottom: 6 }}>{selectedTicket.id}</div>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--text)", margin: "0 0 8px" }}>{selectedTicket.subject}</h2>
              <div style={{ fontSize: 13, color: "var(--text2)", fontWeight: 500 }}>{selectedTicket.merchant}</div>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <span style={{ fontSize: 12, fontWeight: 700, padding: "5px 14px", borderRadius: 20, background: `${sc}1a`, color: sc }}>{selectedTicket.status}</span>
              <span style={{ fontSize: 12, fontWeight: 700, padding: "5px 14px", borderRadius: 20, background: `${pc}1a`, color: pc }}>{selectedTicket.priority}</span>
            </div>
          </div>
          <div className="tkt-detail-meta-grid">
            <div className="tkt-detail-meta-item"><div className="meta-label">Assigned To</div><div className="meta-val">{selectedTicket.assignedTo}</div></div>
            <div className="tkt-detail-meta-item"><div className="meta-label">Brand</div><div className="meta-val">{selectedTicket.brand ?? "—"}</div></div>
            <div className="tkt-detail-meta-item"><div className="meta-label">Created</div><div className="meta-val">{selectedTicket.createdAt}</div></div>
            <div className="tkt-detail-meta-item"><div className="meta-label">Due Date</div><div className="meta-val">{selectedTicket.dueDate ?? "Not set"}</div></div>
          </div>
        </div>
        <div className="tkt-detail-section">
          <div className="tkt-detail-section-title">Description</div>
          <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.7, margin: 0 }}>No description provided.</p>
        </div>
      </div>
    )
  }

  // ── Merchant detail view ──────────────────────────────
  if (selectedMerchant) {
    const m = selectedMerchant
    const mSty = merchantStatusStyle(m.status)

    const initials = m.dba.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase()
    const AVATAR_COLORS = ["#6366f1","#8b5cf6","#ec4899","#f59e0b","#10b981","#06b6d4","#ef4444"]
    const avatarColor = AVATAR_COLORS[m.dba.charCodeAt(0) % AVATAR_COLORS.length]
    const riskColor = m.riskLevel === "High" ? "#ef4444" : m.riskLevel === "Medium" ? "#f59e0b" : "#10b981"

    let activeSince = "—"
    if (m.onboardedDate) {
      const d = new Date(m.onboardedDate)
      const now = new Date()
      const mo = (now.getFullYear() - d.getFullYear()) * 12 + now.getMonth() - d.getMonth()
      activeSince = mo >= 12 ? `${Math.floor(mo / 12)} yr` : `${mo} mo`
    }

    function FieldBox({ label, value, icon }: { label: string; value?: string; icon: string }) {
      return (
        <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14, color: "var(--text3)" }}>{icon}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase" as const, letterSpacing: "0.07em" }}>{label}</span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{value || "—"}</div>
        </div>
      )
    }

    function SectionCard({ icon, iconColor, iconBg, title, children }: { icon: string; iconColor: string; iconBg: string; title: string; children: React.ReactNode }) {
      return (
        <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 16, padding: 24, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: iconColor }}>{icon}</span>
            </div>
            <span style={{ fontSize: 15, fontWeight: 800, color: "var(--text)" }}>{title}</span>
          </div>
          {children}
        </div>
      )
    }

    return (
      <div className="dash-layout">
        <button className="tkt-back-btn" onClick={() => setSelectedMerchant(null)}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
          Back to Merchants
        </button>

        {/* ── Hero card ── */}
        <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 20, padding: "22px 28px", marginBottom: 16, display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
          {/* Avatar */}
          <div style={{ width: 80, height: 80, borderRadius: 20, background: avatarColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 900, color: "#fff", flexShrink: 0, letterSpacing: -1, boxShadow: `0 4px 20px ${avatarColor}55` }}>
            {initials}
          </div>

          {/* Identity */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 24, fontWeight: 900, color: "var(--text)", letterSpacing: -0.5 }}>{m.dba}</span>
              <button onClick={() => openEditModal(m)} style={{ width: 32, height: 32, borderRadius: 8, background: "var(--bg3)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--text3)" }}>edit</span>
              </button>
              <button style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: "#ef4444" }}>delete</span>
              </button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, fontWeight: 800, background: "rgba(99,102,241,.12)", color: "#6366f1", padding: "3px 10px", borderRadius: 20 }}>MID: {m.mid || "LEAD"}</span>
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--border)", flexShrink: 0, display: "inline-block" }} />
              <span className="material-symbols-outlined" style={{ fontSize: 14, color: "var(--text3)" }}>corporate_fare</span>
              <span style={{ fontSize: 13, color: "var(--text2)", fontWeight: 500 }}>{m.legalName || "—"}</span>
            </div>
          </div>

          {/* Right stat boxes */}
          <div style={{ display: "flex", alignItems: "stretch", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", flexShrink: 0 }}>
            {[
              { value: String(m.devices.length), label: "EQUIPMENT" },
              { value: String(m.openTickets),    label: "OPEN TICKETS" },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", padding: "14px 26px", borderRight: "1px solid var(--border)" }}>
                <span style={{ fontSize: 26, fontWeight: 900, color: "var(--text)", lineHeight: 1 }}>{s.value}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginTop: 4 }}>{s.label}</span>
              </div>
            ))}
            <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", padding: "14px 26px" }}>
              <select
                value={m.status}
                onChange={e => updateSelected(prev => ({ ...prev, status: e.target.value as MerchantStatus }))}
                style={{ fontSize: 12, fontWeight: 800, padding: "5px 14px", borderRadius: 20, border: "none", cursor: "pointer", background: mSty.background, color: mSty.color, outline: "none", fontFamily: "inherit", appearance: "none" as const, textAlign: "center" as const }}
              >
                <option>Active</option><option>Inactive</option><option>Pending</option><option>Closed</option>
              </select>
              <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginTop: 6 }}>STATUS</span>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: "flex", gap: 2, borderBottom: "2px solid var(--border)", marginBottom: 20, overflowX: "auto" }}>
          {(["overview", "equipment", "tickets", "documents", "notes"] as ActiveTab[]).map(tab => (
            <button key={tab} className={`merch-tab${activeTab === tab ? " active" : ""}`} onClick={() => setActiveTab(tab)}>
              {tab === "equipment" ? "Equipment & Services" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* ── Overview ── */}
        {activeTab === "overview" && (
          <div>
            {/* 4 stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
              {[
                { label: "MONTHLY VOLUME", value: m.monthlyVol != null ? `$${m.monthlyVol.toLocaleString()}` : "—", icon: "bar_chart",       iconColor: "#6366f1", iconBg: "rgba(99,102,241,.1)" },
                { label: "AVG. TICKET",    value: m.avgTicket  != null ? `$${m.avgTicket.toFixed(2)}` : "—",    icon: "receipt_long",   iconColor: "#10b981", iconBg: "rgba(16,185,129,.1)" },
                { label: "ACTIVE SINCE",   value: activeSince,                                                   icon: "hourglass_empty", iconColor: "var(--text2)", iconBg: "var(--bg3)" },
                { label: "RISK LEVEL",     value: m.riskLevel ?? "—",                                           icon: "security",        iconColor: riskColor, iconBg: `${riskColor}1a`, valueColor: riskColor },
              ].map((s, i) => (
                <div key={i} style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 22px", display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: s.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 22, color: s.iconColor }}>{s.icon}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text3)", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: (s as { valueColor?: string }).valueColor ?? "var(--text)" }}>{s.value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Owner */}
            <SectionCard icon="person" iconColor="#10b981" iconBg="rgba(16,185,129,.12)" title="Owner">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                <FieldBox label="Owner Name"  value={m.ownerName}  icon="badge" />
                <FieldBox label="Owner Phone" value={m.ownerPhone} icon="phone_iphone" />
                <FieldBox label="Owner Email" value={m.ownerEmail} icon="mail" />
              </div>
            </SectionCard>

            {/* Business Details */}
            <SectionCard icon="business" iconColor="#6366f1" iconBg="rgba(99,102,241,.12)" title="Business Details">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 12 }}>
                <FieldBox label="DBA Name"      value={m.dba}       icon="storefront" />
                <FieldBox label="Legal Name"    value={m.legalName} icon="gavel" />
                <FieldBox label="Business Type" value={m.bizType}   icon="category" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: m.address || m.operatingHours ? 12 : 0 }}>
                <FieldBox label="MCC Code"       value={m.mcc}     icon="tag" />
                <FieldBox label="Business Phone" value={m.bizPhone} icon="call" />
                <FieldBox label="Website"        value={m.website}  icon="language" />
              </div>
              {(m.address || m.operatingHours) && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <FieldBox label="Address"         value={m.address}        icon="location_on" />
                  <FieldBox label="Operating Hours" value={m.operatingHours} icon="schedule" />
                </div>
              )}
            </SectionCard>

            {/* Agent & Account side by side */}
            <SectionCard icon="support_agent" iconColor="#f59e0b" iconBg="rgba(245,158,11,.12)" title="Agent">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <FieldBox label="Agent Name"  value={m.salesRep}   icon="person" />
                <FieldBox label="Agent Code"  value={m.agentCode}  icon="badge" />
                <FieldBox label="Agent Email" value={m.agentEmail} icon="mail" />
                <FieldBox label="Agent Phone" value={m.agentPhone} icon="call" />
              </div>
            </SectionCard>
            <SectionCard icon="settings" iconColor="#06b6d4" iconBg="rgba(6,182,212,.12)" title="Account Data">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <FieldBox label="Processor"     value={m.processor}     icon="corporate_fare" />
                <FieldBox label="Contract Term" value={m.contractTerm}  icon="contract" />
                <FieldBox label="Billing Cycle" value={m.billingCycle}  icon="calendar_month" />
                <FieldBox label="Onboarded"     value={m.onboardedDate} icon="event_available" />
              </div>
            </SectionCard>
          </div>
        )}

        {/* ── Equipment ── */}
        {activeTab === "equipment" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: 0 }}>Equipment &amp; Services</h3>
              <button className="crm-btn crm-btn-primary" style={{ padding: "7px 16px", fontSize: 12 }} onClick={() => { setShowSelection(true) }}>
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>add</span>
                Add
              </button>
            </div>
            {m.devices.length === 0 && (
              <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text3)", fontSize: 13 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 36, display: "block", marginBottom: 10, opacity: 0.4 }}>point_of_sale</span>
                No equipment or services registered.
              </div>
            )}
            {m.devices.map(d => {
              const ds = deviceStatusStyle(d.status)
              return (
                <div key={d.id} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 16px", border: "1px solid var(--border)", borderRadius: 12, background: "var(--bg2)", marginBottom: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--accent-crm-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20, color: "var(--accent-crm)" }}>
                      {d.type === "POS" ? "point_of_sale" : d.type === "Printer" ? "print" : d.type === "Service / Integration" ? "hub" : "payment"}
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{d.brand ? `${d.brand} ${d.model}` : d.model}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, ...ds }}>{d.status}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text3)", display: "flex", gap: 14, flexWrap: "wrap" }}>
                      <span>{d.type}</span>
                      {d.serial && <span>S/N: {d.serial}</span>}
                      {d.unitId && <span>Unit: {d.unitId}</span>}
                      {d.tid && <span>{d.tidType || "TID"}: {d.tid}</span>}
                      {d.activeDate && <span>Active: {d.activeDate}</span>}
                    </div>
                    {d.notes && <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>{d.notes}</div>}
                  </div>
                  <button onClick={() => removeDevice(d.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)", padding: 4, borderRadius: 6, flexShrink: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 17 }}>delete</span>
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Tickets */}
        {activeTab === "tickets" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: 0 }}>Support Tickets</h3>
            </div>
            {m.tickets.length === 0 && (
              <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text3)", fontSize: 13 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 36, display: "block", marginBottom: 10, opacity: 0.4 }}>confirmation_number</span>
                No tickets for this merchant.
              </div>
            )}
            <div className="tkt-table-wrap">
              {m.tickets.map((t, i) => {
                const sc2 = STATUS_COLORS[t.status] ?? "#6b7280"
                const pc2 = PRIORITY_COLORS[t.priority] ?? "#6b7280"
                return (
                  <div
                    key={t.id}
                    className="ticket-row"
                    role="button" tabIndex={0}
                    onClick={() => setSelectedTicket(t)}
                    onKeyDown={e => e.key === "Enter" && setSelectedTicket(t)}
                    style={{ display: "grid", gridTemplateColumns: "110px minmax(0,1fr) 120px 100px 110px", gap: 12, padding: "12px 16px", borderBottom: "1px solid var(--border)", alignItems: "center", cursor: "pointer", animation: "fadeIn 0.3s ease both", animationDelay: `${i * 35}ms` }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-crm)" }}>{t.id}</div>
                    <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.subject}</div>
                    <div><span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: `${sc2}1a`, color: sc2 }}>{t.status}</span></div>
                    <div><span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: `${pc2}1a`, color: pc2 }}>{t.priority}</span></div>
                    <div style={{ fontSize: 11, color: "var(--text3)" }}>{t.createdAt}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Documents */}
        {activeTab === "documents" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: 0 }}>Documents</h3>
              <button className="crm-btn crm-btn-primary" style={{ padding: "7px 16px", fontSize: 12 }} onClick={() => { setDocFormRaw(EMPTY_DOC); setDocError(""); setShowUploadDoc(true) }}>
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>upload_file</span>
                Upload
              </button>
            </div>
            {m.docs.length === 0 && (
              <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text3)", fontSize: 13 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 36, display: "block", marginBottom: 10, opacity: 0.4 }}>folder_open</span>
                No documents uploaded.
              </div>
            )}
            {m.docs.map(doc => (
              <div key={doc.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", border: "1px solid var(--border)", borderRadius: 12, background: "var(--bg2)", marginBottom: 8 }}>
                <div style={{ width: 38, height: 38, borderRadius: 9, background: "var(--accent-crm-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--accent-crm)" }}>{docIcon(doc.docType)}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{doc.docType} · {doc.uploadedAt}{doc.size ? ` · ${doc.size}` : ""}</div>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button onClick={() => openEditDoc(doc)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)", padding: 4, borderRadius: 6 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 17 }}>edit</span>
                  </button>
                  <button onClick={() => removeDoc(doc.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)", padding: 4, borderRadius: 6 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 17 }}>delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Notes */}
        {activeTab === "notes" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: 0 }}>Merchant Notes</h3>
              <button className="crm-btn crm-btn-primary" style={{ padding: "7px 16px", fontSize: 12 }} onClick={() => { setNoteContent(""); setShowAddNote(true) }}>
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>add</span>
                Add Note
              </button>
            </div>
            {m.notes.length === 0 && (
              <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text3)", fontSize: 13 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 36, display: "block", marginBottom: 10, opacity: 0.4 }}>sticky_note_2</span>
                No notes yet.
              </div>
            )}
            {m.notes.map(n => (
              <div key={n.id} style={{ padding: "14px 18px", border: "1px solid var(--border)", borderRadius: 12, background: "var(--bg2)", marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-crm)" }}>{n.author}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, color: "var(--text3)" }}>{n.createdAt}</span>
                    <button onClick={() => removeNote(n.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)", padding: 2 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                    </button>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: "var(--text2)", margin: 0, lineHeight: 1.6 }}>{n.content}</p>
              </div>
            ))}
          </div>
        )}

        {/* Edit Merchant Modal */}
        {showEdit && (
          <ModalWrap onClose={() => setShowEdit(false)}>
            <ModalHeader icon="edit" title="Edit Merchant" subtitle="Update merchant details" onClose={() => setShowEdit(false)} />
            <MerchantFormBody f={editForm} set={setEdit} isEdit error={editError} />
            <ModalFooter onCancel={() => setShowEdit(false)} onConfirm={saveEditMerchant} confirmLabel="Save Changes" confirmIcon="save" />
          </ModalWrap>
        )}

        {/* Add Selection Modal */}
        {showSelection && (
          <ModalWrap onClose={() => setShowSelection(false)}>
            <ModalHeader icon="category" title="Add Configuration" subtitle="What would you like to add?" onClose={() => setShowSelection(false)} />
            <div style={{ padding: 28, display: "flex", gap: 14 }}>
              {[
                { icon: "point_of_sale", label: "Hardware Device", desc: "Terminal, POS System,\nPin Pad, Register." },
                { icon: "hub", label: "Software & Services", desc: "Online Ordering, Delivery,\nAnalytics, Accounting." },
                { icon: "loyalty", label: "Loyalty Program", desc: "Rewards, Gift Cards,\nPoints Settings." },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={() => { setShowSelection(false); setDeviceFormRaw({ ...EMPTY_DEVICE, type: item.icon === "hub" ? "Service / Integration" : "Terminal" }); setDeviceError(""); setShowDevice(true) }}
                  style={{ flex: 1, background: "var(--bg)", border: "1px solid var(--border)", padding: "22px 14px", borderRadius: 14, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, transition: ".2s", fontFamily: "inherit" }}
                  onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent-crm)"; (e.currentTarget as HTMLButtonElement).style.background = "var(--bg2)" }}
                  onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLButtonElement).style.background = "var(--bg)" }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 30, color: "var(--text2)" }}>{item.icon}</span>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: "var(--text3)", lineHeight: 1.4, whiteSpace: "pre-line", textAlign: "center" }}>{item.desc}</div>
                </button>
              ))}
            </div>
          </ModalWrap>
        )}

        {/* Add Device Modal */}
        {showDevice && (
          <ModalWrap onClose={() => setShowDevice(false)} maxWidth={520}>
            <ModalHeader icon="point_of_sale" title="Add Device / Service" subtitle="Register new equipment or integration" onClose={() => setShowDevice(false)} />
            <div style={{ padding: "8px 28px 0", maxHeight: "65vh", overflowY: "auto" }}>
              <SectionHead icon="settings_suggest" label="Device Information" />
              <CRow>
                <CField label="Brand / Provider">
                  <input list="dev_brand_list" value={deviceForm.brand} placeholder="Select or type…" onChange={e => setDev("brand", e.target.value)} autoComplete="off" style={{ appearance: "none" as const }} />
                  <datalist id="dev_brand_list">{DEVICE_BRANDS.map(b => <option key={b} value={b} />)}</datalist>
                </CField>
                <CField label="Type">
                  <select value={deviceForm.type} onChange={e => setDev("type", e.target.value as DeviceType)}>
                    {["Terminal","POS","Printer","Pin Pad","Accessory","Service / Integration","Other"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </CField>
              </CRow>
              <CField label="Model *">
                <input value={deviceForm.model} placeholder="e.g. A920, Station Duo" onChange={e => setDev("model", e.target.value)} autoComplete="off" />
              </CField>
              <CRow>
                <CField label="Serial #"><input value={deviceForm.serial} onChange={e => setDev("serial", e.target.value)} autoComplete="off" /></CField>
                <CField label="Invoice #"><input value={deviceForm.invoice} placeholder="Optional" onChange={e => setDev("invoice", e.target.value)} autoComplete="off" /></CField>
              </CRow>
              <CRow>
                <CField label="Unit ID"><input value={deviceForm.unitId} placeholder="e.g. U-100" onChange={e => setDev("unitId", e.target.value)} autoComplete="off" /></CField>
                <CField label="Identifier">
                  <div style={{ display: "flex", gap: 8 }}>
                    <select value={deviceForm.tidType} onChange={e => setDev("tidType", e.target.value)} style={{ width: 90 }}>
                      {ID_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                    <input value={deviceForm.tid} placeholder="Value…" onChange={e => setDev("tid", e.target.value)} autoComplete="off" style={{ flex: 1 }} />
                  </div>
                </CField>
              </CRow>
              {deviceForm.type === "Printer" && (
                <div style={{ background: "var(--bg)", padding: 12, borderRadius: 10, border: "1px dashed var(--border)", marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase" as const, marginBottom: 10, paddingBottom: 4, borderBottom: "1px solid var(--border)" }}>Printer Configuration</div>
                  <CRow>
                    <CField label="Connection"><select value={deviceForm.printerConn} onChange={e => setDev("printerConn", e.target.value)}>{PRINTER_CONNS.map(c => <option key={c}>{c}</option>)}</select></CField>
                    <CField label="IP Address"><input value={deviceForm.printerIp} placeholder="e.g. 192.168.1.100" onChange={e => setDev("printerIp", e.target.value)} autoComplete="off" /></CField>
                  </CRow>
                </div>
              )}
              <CRow>
                <CField label="Status">
                  <select value={deviceForm.status} onChange={e => setDev("status", e.target.value as DeviceStatus)}>
                    {["Active","Offline","Damaged","Returned","TBD"].map(s => <option key={s}>{s}</option>)}
                  </select>
                </CField>
                <CField label="Active Date"><input value={deviceForm.activeDate} placeholder="e.g. Mar 15, 2024" onChange={e => setDev("activeDate", e.target.value)} autoComplete="off" /></CField>
              </CRow>
              <CField label="Ticket ID">
                <input value={deviceForm.ticket} placeholder="e.g. MTECH-12345" onChange={e => setDev("ticket", e.target.value)} autoComplete="off" />
              </CField>
              <CField label="Notes">
                <textarea value={deviceForm.notes} rows={2} placeholder="Optional notes…" onChange={e => setDev("notes", e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)", fontSize: 13, background: "var(--bg)", color: "var(--text)", outline: "none", fontFamily: "inherit", resize: "vertical" as const, boxSizing: "border-box" as const }} />
              </CField>
              {deviceError && <div style={{ color: "var(--red)", fontSize: 12, marginBottom: 8 }}>{deviceError}</div>}
            </div>
            <ModalFooter onCancel={() => setShowDevice(false)} onConfirm={addDevice} confirmLabel="Add Device" confirmIcon="add" />
          </ModalWrap>
        )}

        {/* Upload Document Modal */}
        {showUploadDoc && (
          <ModalWrap onClose={() => setShowUploadDoc(false)} maxWidth={520}>
            <ModalHeader icon="upload_file" title="Upload Document" subtitle="Attach a file to this merchant profile" onClose={() => setShowUploadDoc(false)} />
            <div style={{ padding: "8px 28px 0" }}>
              <SectionHead icon="description" label="Document Details" />
              <CField label="Document Type *">
                <select value={docForm.docType} onChange={e => setDoc("docType", e.target.value)}>
                  <option value="">— Select Type —</option>
                  {DOC_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </CField>
              <CField label="Display Name (optional)">
                <input value={docForm.name} placeholder="e.g. Voided Check — March 2026" onChange={e => setDoc("name", e.target.value)} autoComplete="off" />
              </CField>
              <CField label="File *">
                <div
                  style={{ border: "2px dashed var(--border)", borderRadius: 10, padding: 18, textAlign: "center" as const, cursor: "pointer", background: "var(--bg3)", transition: ".15s" }}
                  onClick={() => document.getElementById("docFileInput")?.click()}
                  onMouseOver={e => (e.currentTarget.style.borderColor = "var(--accent-crm)")}
                  onMouseOut={e => (e.currentTarget.style.borderColor = "var(--border)")}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 30, color: "var(--text3)", display: "block", marginBottom: 8 }}>attach_file</span>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text2)" }}>Click to choose a file</div>
                  <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>PDF, PNG, JPG, DOCX, XLSX — max 20 MB</div>
                  <input type="file" id="docFileInput" style={{ display: "none" }} accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx" onChange={e => { const f2 = e.target.files?.[0]; if (f2) setDoc("fileName", f2.name) }} />
                </div>
                {docForm.fileName && (
                  <div style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: "var(--accent-crm)", padding: "6px 10px", background: "var(--accent-crm-light)", borderRadius: 6, wordBreak: "break-all" as const }}>{docForm.fileName}</div>
                )}
              </CField>
              {docError && <div style={{ color: "var(--red)", fontSize: 12, marginBottom: 8, padding: "8px 12px", background: "rgba(239,68,68,.08)", borderRadius: 8 }}>{docError}</div>}
            </div>
            <ModalFooter onCancel={() => setShowUploadDoc(false)} onConfirm={uploadDoc} confirmLabel="Upload" confirmIcon="upload" />
          </ModalWrap>
        )}

        {/* Edit Document Modal */}
        {showEditDoc && (
          <ModalWrap onClose={() => setShowEditDoc(false)} maxWidth={520}>
            <ModalHeader icon="edit_document" title="Edit Document" subtitle="Update document details" onClose={() => setShowEditDoc(false)} />
            <div style={{ padding: "8px 28px 0" }}>
              <SectionHead icon="description" label="Document Details" />
              <CField label="Document Type *">
                <select value={editDocForm.docType} onChange={e => setEditDoc("docType", e.target.value)}>
                  <option value="">— Select Type —</option>
                  {DOC_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </CField>
              <CField label="Display Name *">
                <input value={editDocForm.name} onChange={e => setEditDoc("name", e.target.value)} autoComplete="off" />
              </CField>
            </div>
            <ModalFooter onCancel={() => setShowEditDoc(false)} onConfirm={saveEditDoc} confirmLabel="Save Changes" confirmIcon="save" />
          </ModalWrap>
        )}

        {/* Add Note Modal */}
        {showAddNote && (
          <ModalWrap onClose={() => setShowAddNote(false)} maxWidth={480}>
            <ModalHeader icon="sticky_note_2" title="Add Note" subtitle="Add an internal note to this merchant" onClose={() => setShowAddNote(false)} />
            <div style={{ padding: "16px 28px 0" }}>
              <CField label="Note">
                <textarea value={noteContent} rows={5} placeholder="Type your note here…" onChange={e => setNoteContent(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)", fontSize: 13, background: "var(--bg)", color: "var(--text)", outline: "none", fontFamily: "inherit", resize: "vertical" as const, boxSizing: "border-box" as const }} />
              </CField>
            </div>
            <ModalFooter onCancel={() => setShowAddNote(false)} onConfirm={addNote} confirmLabel="Add Note" confirmIcon="add" />
          </ModalWrap>
        )}
      </div>
    )
  }

  // ── Merchant list view ────────────────────────────────
  return (
    <div className="dash-layout">
      <div className="dash-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", margin: 0, letterSpacing: -0.5 }}>Merchants</h1>
          <p style={{ fontSize: 13, color: "var(--text3)", margin: "3px 0 0", fontWeight: 500 }}>
            Manage merchant accounts, equipment, and documents
          </p>
        </div>
        <button className="tkt-btn-new" onClick={() => { setNewFormRaw(EMPTY_FORM); setNewError(""); setShowNew(true) }} style={{ marginLeft: 0 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          New Merchant
        </button>
      </div>

      {/* Filter bar */}
      <div className="tkt-filter-bar">
        <div className="tkt-search">
          <span className="material-symbols-outlined">search</span>
          <input type="text" placeholder="Search merchants…" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <div className="tkt-filters">
          <select className="tkt-filter-sel" value={statusFilt} onChange={e => setStatusFilt(e.target.value)}>
            <option value="">All Status</option>
            <option>Active</option><option>Inactive</option><option>Pending</option><option>Closed</option>
          </select>
          <select className="tkt-filter-sel" value={agentFilt} onChange={e => setAgentFilt(e.target.value)}>
            <option value="">All Agents</option>
            {AGENTS.map(a => <option key={a}>{a}</option>)}
          </select>
          <select className="tkt-filter-sel" value={processorFilt} onChange={e => setProcessorFilt(e.target.value)}>
            <option value="">All Processors</option>
            {PROCESSORS.map(p => <option key={p}>{p}</option>)}
          </select>
          {hasFilters && (
            <button className="tkt-reset-btn" onClick={clearFilters}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>filter_alt_off</span>
              Reset
            </button>
          )}
        </div>
        <div className="tkt-filter-divider" />
        <span className="tkt-result-count">{filtered.length} {filtered.length === 1 ? "merchant" : "merchants"}</span>
      </div>

      {/* Table */}
      <div className="tkt-scroll-view tkt-table-wrap">
        <div style={{ minWidth: 860 }}>
          {/* Header */}
          <div style={{ display: "grid", gridTemplateColumns: MERCH_COLS, gap: 12, padding: "10px 16px", fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".5px", borderBottom: "1px solid var(--border)", background: "var(--bg3)" }}>
            <div>MID</div><div>DBA Name</div><div>Legal Name</div>
            <div>Processor</div><div>Status</div><div>Agent</div><div style={{ textAlign: "right" }}>Tickets</div>
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text3)", fontSize: 13 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 36, display: "block", marginBottom: 10, opacity: 0.4 }}>storefront</span>
              No merchants match your filters.
            </div>
          )}

          {filtered.map((m, i) => {
            const ms = merchantStatusStyle(m.status)
            return (
              <div
                key={m.id}
                className="merch-row"
                role="button" tabIndex={0}
                onClick={() => openDetail(m)}
                onKeyDown={e => e.key === "Enter" && openDetail(m)}
                style={{ display: "grid", gridTemplateColumns: MERCH_COLS, gap: 12, padding: "12px 16px", borderBottom: "1px solid var(--border)", alignItems: "center", animation: "fadeIn 0.3s ease both", animationDelay: `${i * 30}ms` }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", fontFamily: "monospace" }}>{m.mid}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.dba}</div>
                <div style={{ fontSize: 12, color: "var(--text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.legalName}</div>
                <div style={{ fontSize: 12, color: "var(--text2)" }}>{m.processor || "—"}</div>
                <div><span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20, ...ms }}>{m.status}</span></div>
                <div style={{ fontSize: 12, color: "var(--text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.salesRep || "—"}</div>
                <div style={{ textAlign: "right", fontSize: 12, fontWeight: 700, color: m.openTickets > 0 ? "var(--red)" : "var(--text3)" }}>{m.openTickets}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Mobile card view */}
      <div className="tkt-cards-view">
        {filtered.map((m, i) => {
          const ms = merchantStatusStyle(m.status)
          return (
            <div key={m.id} className="tkt-card" role="button" tabIndex={0} onClick={() => openDetail(m)} onKeyDown={e => e.key === "Enter" && openDetail(m)} style={{ animation: "fadeIn 0.3s ease both", animationDelay: `${i * 40}ms`, cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", fontFamily: "monospace" }}>{m.mid}</span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, ...ms }}>{m.status}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>{m.dba}</div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text3)" }}>
                <span>{m.processor || "—"}</span>
                <span>{m.salesRep || "—"} · {m.openTickets} ticket{m.openTickets !== 1 ? "s" : ""}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* New Merchant Modal */}
      {showNew && (
        <ModalWrap onClose={() => setShowNew(false)}>
          <ModalHeader icon="store" title="Create New Merchant" subtitle="Fill in the details to onboard a new merchant" onClose={() => setShowNew(false)} />
          <MerchantFormBody f={newForm} set={setNew} error={newError} />
          <ModalFooter onCancel={() => setShowNew(false)} onConfirm={createMerchant} confirmLabel="Create Merchant" confirmIcon="add_business" />
        </ModalWrap>
      )}
    </div>
  )
}
