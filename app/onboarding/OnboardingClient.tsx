"use client"

import { useState, useMemo, type ChangeEvent } from "react"
import "@/app/styles/onboarding.css"

/* ── Types ── */
interface FileEntry { name: string; size: number; id: string }
type FileMap = Record<string, FileEntry[]>
type ErrorMap = Record<string, string>

interface FormFields {
  ownerStructure: string
  firstName: string;  lastName: string;  phone: string;  email: string;  role: string;  ssnDisplay: string
  firstName2: string; lastName2: string; phone2: string; email2: string; role2: string; ssnDisplay2: string
  pctOwner1: string; pctOwner2: string
  legalName: string; dba: string; bizType: string
  addressLine1: string; addressLine2: string; city: string; state: string; postal: string
  bizPhone: string; bizEmail: string; agent: string; website: string
  monthlyVol: string; avgTicket: string; highestTicket: string; processor: string; notes: string
  equipmentType: string
  consentNonmarketing: boolean; tcpa2: boolean; consentMarketing: boolean
}

const EMPTY: FormFields = {
  ownerStructure: "",
  firstName: "", lastName: "", phone: "", email: "", role: "", ssnDisplay: "",
  firstName2: "", lastName2: "", phone2: "", email2: "", role2: "", ssnDisplay2: "",
  pctOwner1: "", pctOwner2: "",
  legalName: "", dba: "", bizType: "",
  addressLine1: "", addressLine2: "", city: "", state: "", postal: "",
  bizPhone: "", bizEmail: "", agent: "", website: "",
  monthlyVol: "", avgTicket: "", highestTicket: "", processor: "", notes: "",
  equipmentType: "",
  consentNonmarketing: false, tcpa2: false, consentMarketing: false,
}

/* ── Helpers ── */
function toTitleCase(s: string): string {
  return s.toLowerCase().split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
}

function formatPhone(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 10)
  if (d.length === 0) return ""
  if (d.length <= 3) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
}

function formatSSN(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 9)
  if (d.length <= 3) return d
  if (d.length <= 5) return `${d.slice(0, 3)}-${d.slice(3)}`
  return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`
}

const GIBBERISH_RE = /(.)\1{4,}|qwerty|asdfg|zxcvb|<script|<\/script>|javascript:/i
function isGibberish(v: string): boolean {
  return GIBBERISH_RE.test(v) || v.includes("<") || v.includes(">")
}

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

/* ── Progress ── */
function computeProgress(f: FormFields, files: FileMap) {
  const hasOwner = f.ownerStructure !== ""
  const isMultiple = f.ownerStructure === "Multiple Owners"

  const sec1Fields = hasOwner
    ? [f.firstName, f.lastName, f.phone, f.email, f.role, f.ssnDisplay,
       ...(isMultiple ? [f.firstName2, f.lastName2, f.phone2, f.email2, f.role2, f.ssnDisplay2, f.pctOwner1, f.pctOwner2] : [])]
    : []
  const sec2Fields = [f.legalName, f.dba, f.bizType, f.addressLine1, f.city, f.state, f.postal, f.bizPhone, f.bizEmail, f.agent]
  const sec3Fields = [f.monthlyVol, f.avgTicket, f.highestTicket]

  const isFilled = (v: string) => v.trim() !== ""
  const sec1Done = hasOwner && sec1Fields.length > 0 && sec1Fields.every(isFilled)
  const sec2Done = sec2Fields.every(isFilled)
  const sec3Done = sec3Fields.every(isFilled)
  const sec4Done = (files.idDocument?.length ?? 0) > 0 && (files.ein?.length ?? 0) > 0

  let step = 0, stepLabel = "STEP 0 OF 4: NOT STARTED"
  if (sec3Done) { step = 4; stepLabel = "STEP 4 OF 4: REVIEWING" }
  else if (sec2Done) { step = 3; stepLabel = "STEP 3 OF 4: PROCESSING" }
  else if (sec1Done) { step = 2; stepLabel = "STEP 2 OF 4: BUSINESS" }
  else if (hasOwner) { step = 1; stepLabel = "STEP 1 OF 4: PERSONAL" }
  void sec4Done

  const allReq = [f.ownerStructure, ...sec1Fields, ...sec2Fields, ...sec3Fields]
  const filled = allReq.filter(isFilled).length + (sec4Done ? 3 : 0)
  const total  = allReq.length + 3
  const pct    = Math.min(100, Math.round((filled / total) * 100))

  return { step, pct, stepLabel }
}

/* ── File list sub-component ── */
function FileList({ fieldId, files, onRemove }: { fieldId: string; files: FileMap; onRemove: (id: string, fileId: string) => void }) {
  const items = files[fieldId] ?? []
  if (!items.length) return null
  return (
    <div>
      {items.map(f => (
        <div key={f.id} className="file-item">
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--primary)", flexShrink: 0 }}>description</span>
          <span className="name">{f.name}</span>
          <span className="size">{(f.size / 1024).toFixed(1)} KB</span>
          <span className="remove material-symbols-outlined" role="button" onClick={() => onRemove(fieldId, f.id)}>close</span>
        </div>
      ))}
    </div>
  )
}

/* ── Main component ── */
export function OnboardingClient() {
  const [fields, setFields] = useState<FormFields>(EMPTY)
  const [files,  setFiles]  = useState<FileMap>({})
  const [errors, setErrors] = useState<ErrorMap>({})
  const [isDark, setIsDark] = useState(true)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showSupport, setShowSupport] = useState(false)
  const [submitting,  setSubmitting]  = useState(false)
  const [ticketId,    setTicketId]    = useState("")

  const { pct, stepLabel } = useMemo(() => computeProgress(fields, files), [fields, files])

  const isMultiple = fields.ownerStructure === "Multiple Owners"
  const hasOwner   = fields.ownerStructure !== ""

  /* ── Field setters ── */
  function set<K extends keyof FormFields>(key: K, val: FormFields[K]) {
    setFields(prev => ({ ...prev, [key]: val }))
    setErrors(prev => { const n = { ...prev }; delete n[key as string]; return n })
  }

  function handlePhoneChange(key: keyof FormFields, e: ChangeEvent<HTMLInputElement>) {
    set(key, formatPhone(e.target.value) as FormFields[typeof key])
  }

  function handleSSNChange(key: keyof FormFields, e: ChangeEvent<HTMLInputElement>) {
    set(key, formatSSN(e.target.value) as FormFields[typeof key])
  }

  function handleTitleBlur(key: keyof FormFields) {
    const v = fields[key] as string
    if (v) set(key, toTitleCase(v) as FormFields[typeof key])
  }

  /* ── File handling ── */
  function handleFileChange(fieldId: string, fileList: FileList | null) {
    if (!fileList?.length) return
    const entries: FileEntry[] = Array.from(fileList).map(f => ({
      name: f.name, size: f.size, id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    }))
    setFiles(prev => ({ ...prev, [fieldId]: [...(prev[fieldId] ?? []), ...entries] }))
  }

  function removeFile(fieldId: string, fileId: string) {
    setFiles(prev => ({ ...prev, [fieldId]: (prev[fieldId] ?? []).filter(f => f.id !== fileId) }))
  }

  /* ── Validation ── */
  function validate(): ErrorMap {
    const e: ErrorMap = {}

    if (!fields.ownerStructure) { e.ownerStructure = "Ownership structure is required" }

    if (hasOwner) {
      if (!fields.firstName.trim()) e.firstName = "First name is required"
      else if (isGibberish(fields.firstName)) e.firstName = "Please enter valid information"
      if (!fields.lastName.trim()) e.lastName = "Last name is required"
      else if (isGibberish(fields.lastName)) e.lastName = "Please enter valid information"
      const ph1 = fields.phone.replace(/\D/g, "")
      if (!ph1) e.phone = "Valid phone number is required"
      else if (ph1.length !== 10) e.phone = "Enter a valid 10-digit phone number"
      if (!fields.email.trim()) e.email = "Valid email address is required"
      else if (!isValidEmail(fields.email)) e.email = "Enter a valid email address"
      if (!fields.role.trim()) e.role = "Role is required"
      if (fields.ssnDisplay.replace(/\D/g, "").length !== 9) e.ssnDisplay = "SSN must be exactly 9 digits"
    }

    if (isMultiple) {
      if (!fields.firstName2.trim()) e.firstName2 = "First name is required"
      if (!fields.lastName2.trim()) e.lastName2 = "Last name is required"
      const ph2 = fields.phone2.replace(/\D/g, "")
      if (!ph2) e.phone2 = "Valid phone number is required"
      else if (ph2.length !== 10) e.phone2 = "Enter a valid 10-digit phone number"
      if (!fields.email2.trim()) e.email2 = "Valid email address is required"
      else if (!isValidEmail(fields.email2)) e.email2 = "Enter a valid email address"
      if (!fields.role2.trim()) e.role2 = "Role is required"
      if (fields.ssnDisplay2.replace(/\D/g, "").length !== 9) e.ssnDisplay2 = "SSN must be exactly 9 digits"
      if (!fields.pctOwner1) e.pctOwner1 = "Percentage is required"
      if (!fields.pctOwner2) e.pctOwner2 = "Percentage is required"
      if (fields.pctOwner1 && fields.pctOwner2) {
        const total = (parseFloat(fields.pctOwner1) || 0) + (parseFloat(fields.pctOwner2) || 0)
        if (Math.abs(total - 100) > 0.01) e.pctOwner1 = `Total must equal 100% (currently ${total}%)`
      }
    }

    if (!fields.legalName.trim()) e.legalName = "Legal business name is required"
    if (!fields.dba.trim()) e.dba = "DBA is required"
    if (!fields.bizType) e.bizType = "Business type is required"
    if (!fields.addressLine1.trim()) e.addressLine1 = "Address is required"
    if (!fields.city.trim()) e.city = "City is required"
    if (!fields.state.trim()) e.state = "State is required"
    if (!fields.postal.trim()) e.postal = "Zip code is required"
    else if (!/^\d{5}$/.test(fields.postal)) e.postal = "Zip code must be exactly 5 digits"
    const bph = fields.bizPhone.replace(/\D/g, "")
    if (!bph) e.bizPhone = "Business phone is required"
    else if (bph.length !== 10) e.bizPhone = "Enter a valid 10-digit phone number"
    if (!fields.bizEmail.trim()) e.bizEmail = "Valid business email is required"
    else if (!isValidEmail(fields.bizEmail)) e.bizEmail = "Enter a valid email address"
    if (!fields.agent.trim()) e.agent = "Agent assignment is required"
    if (!fields.monthlyVol) e.monthlyVol = "Monthly volume is required"
    if (!fields.avgTicket) e.avgTicket = "Average ticket amount is required"
    if (!fields.highestTicket) e.highestTicket = "Highest ticket amount is required"
    if (!fields.consentNonmarketing) e.consentNonmarketing = "Please accept the text messaging consent."
    if (!fields.tcpa2) e.tcpa2 = "Please accept the terms of service."

    return e
  }

  /* ── Submit ── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      const firstKey = Object.keys(errs)[0]
      const el = document.getElementById(`ob_${firstKey}`) ?? document.getElementById(`ob_${firstKey}_display`)
      el?.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }
    setSubmitting(true)
    try {
      await new Promise(r => setTimeout(r, 800))
      const id = `MTECH-OB-${Math.floor(100000 + Math.random() * 900000)}`
      setTicketId(id)
      setShowSuccess(true)
    } finally {
      setSubmitting(false)
    }
  }

  /* ── Helpers for field class ── */
  const fc = (key: string) => `ob-field${errors[key] ? " error" : ""}`

  /* ── JSX ── */
  return (
    <div className={`ob-root${isDark ? "" : " light-mode"}`}>

      {/* ── Header ── */}
      <header className="ob-header">
        <div className="ob-logo">
          {isDark
            ? <img src="https://iili.io/qfBHbOG.png" alt="Mtech Distributors" style={{ height: 68 }} />
            : <img src="https://iili.io/qfBHDRs.png" alt="Mtech Distributors" style={{ height: 68 }} />
          }
        </div>
        <div className="ob-header-right">
          <button className="ob-theme-toggle" onClick={() => setIsDark(d => !d)} title="Toggle Light/Dark Mode">
            <span className="material-symbols-outlined">{isDark ? "light_mode" : "dark_mode"}</span>
          </button>
          <button className="ob-help-btn" onClick={() => setShowSupport(true)}>
            <span className="material-symbols-outlined">help_outline</span>
          </button>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="ob-main">

        {/* ── Aside ── */}
        <aside className="ob-aside">
          <div>
            <p className="ob-version">ONBOARDING</p>
            <h1 className="ob-headline">MERCHANT<br />REGIS&shy;TRATION.</h1>
            <p className="ob-subtitle">
              Complete the registration form to begin your merchant onboarding process with Mtech
              Distributors. Our team will review your application within 24–48 hours.
            </p>
          </div>
          <div className="ob-progress-wrap">
            <div className="ob-progress-label">
              <span>APPLICATION PROGRESS</span>
              <span>{pct}%</span>
            </div>
            <div className="ob-progress-bar">
              <div className="ob-progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <p className="ob-progress-step">{stepLabel}</p>
          </div>
        </aside>

        {/* ── Content ── */}
        <section className="ob-content">
          <form id="onboardingForm" noValidate onSubmit={handleSubmit}>

            {/* ── Section 01: Personal ── */}
            <div className="ob-section">
              <div className="ob-section-header">
                <span className="ob-section-num">01</span>
                <div className="ob-section-line" />
                <h2 className="ob-section-title">PERSONAL INFORMATION</h2>
              </div>

              <div className="ob-grid" style={{ gap: 32 }}>
                <div className={`ob-field ob-full${errors.ownerStructure ? " error" : ""}`} data-required>
                  <label htmlFor="ob_ownerStructure">OWNERSHIP STRUCTURE</label>
                  <select
                    id="ob_ownerStructure"
                    value={fields.ownerStructure}
                    onChange={e => set("ownerStructure", e.target.value)}
                  >
                    <option value="">SELECT STRUCTURE</option>
                    <option value="Single Owner">SINGLE OWNER</option>
                    <option value="Multiple Owners">MULTIPLE OWNERS</option>
                  </select>
                  {errors.ownerStructure && <span className="field-error" style={{ display: "block" }}>{errors.ownerStructure}</span>}
                </div>
              </div>

              {/* Owner 1 */}
              {hasOwner && (
                <div className="ob-grid" style={{ gap: 32, marginTop: 32 }}>
                  <div className="ob-field ob-full">
                    <h3 className="ob-owner-header">PRIMARY OWNER</h3>
                  </div>
                  <div className={fc("firstName")} data-required>
                    <label htmlFor="ob_firstName">FIRST NAME</label>
                    <input id="ob_firstName" type="text" placeholder="John" maxLength={100}
                      value={fields.firstName}
                      onChange={e => set("firstName", e.target.value)}
                      onBlur={() => handleTitleBlur("firstName")} />
                    {errors.firstName && <span className="field-error" style={{ display: "block" }}>{errors.firstName}</span>}
                  </div>
                  <div className={fc("lastName")} data-required>
                    <label htmlFor="ob_lastName">LAST NAME</label>
                    <input id="ob_lastName" type="text" placeholder="Doe" maxLength={100}
                      value={fields.lastName}
                      onChange={e => set("lastName", e.target.value)}
                      onBlur={() => handleTitleBlur("lastName")} />
                    {errors.lastName && <span className="field-error" style={{ display: "block" }}>{errors.lastName}</span>}
                  </div>
                  <div className={fc("phone")} data-required data-type="tel">
                    <label htmlFor="ob_phone">PHONE NUMBER</label>
                    <input id="ob_phone" type="tel" placeholder="(555) 000-0000" maxLength={14}
                      value={fields.phone}
                      onChange={e => handlePhoneChange("phone", e)} />
                    {errors.phone && <span className="field-error" style={{ display: "block" }}>{errors.phone}</span>}
                  </div>
                  <div className={fc("email")} data-required data-type="email">
                    <label htmlFor="ob_email">EMAIL ADDRESS</label>
                    <input id="ob_email" type="email" placeholder="you@personal.com" maxLength={200}
                      value={fields.email}
                      onChange={e => set("email", e.target.value)} />
                    {errors.email && <span className="field-error" style={{ display: "block" }}>{errors.email}</span>}
                  </div>
                  <div className={fc("role")} data-required>
                    <label htmlFor="ob_role">ROLE IN BUSINESS</label>
                    <input id="ob_role" type="text" placeholder="Owner / Manager / Agent" maxLength={100}
                      value={fields.role}
                      onChange={e => set("role", e.target.value)} />
                    {errors.role && <span className="field-error" style={{ display: "block" }}>{errors.role}</span>}
                  </div>
                  <div className={fc("ssnDisplay")} data-required>
                    <label htmlFor="ob_ssnDisplay">SSN</label>
                    <input id="ob_ssnDisplay" type="text" placeholder="XXX-XX-XXXX" maxLength={11}
                      value={fields.ssnDisplay}
                      onChange={e => handleSSNChange("ssnDisplay", e)} />
                    {errors.ssnDisplay && <span className="field-error" style={{ display: "block" }}>{errors.ssnDisplay}</span>}
                  </div>
                </div>
              )}

              {/* Owner 2 */}
              {isMultiple && (
                <div className="ob-grid" style={{ gap: 32, marginTop: 32, paddingTop: 32, borderTop: "1px solid var(--box-border)" }}>
                  <div className="ob-field ob-full">
                    <h3 className="ob-owner-header">SECONDARY OWNER</h3>
                  </div>
                  <div className={fc("firstName2")} data-required>
                    <label htmlFor="ob_firstName2">FIRST NAME</label>
                    <input id="ob_firstName2" type="text" placeholder="Jane" maxLength={100}
                      value={fields.firstName2}
                      onChange={e => set("firstName2", e.target.value)}
                      onBlur={() => handleTitleBlur("firstName2")} />
                    {errors.firstName2 && <span className="field-error" style={{ display: "block" }}>{errors.firstName2}</span>}
                  </div>
                  <div className={fc("lastName2")} data-required>
                    <label htmlFor="ob_lastName2">LAST NAME</label>
                    <input id="ob_lastName2" type="text" placeholder="Smith" maxLength={100}
                      value={fields.lastName2}
                      onChange={e => set("lastName2", e.target.value)}
                      onBlur={() => handleTitleBlur("lastName2")} />
                    {errors.lastName2 && <span className="field-error" style={{ display: "block" }}>{errors.lastName2}</span>}
                  </div>
                  <div className={fc("phone2")} data-required data-type="tel">
                    <label htmlFor="ob_phone2">PHONE NUMBER</label>
                    <input id="ob_phone2" type="tel" placeholder="(555) 000-0000" maxLength={14}
                      value={fields.phone2}
                      onChange={e => handlePhoneChange("phone2", e)} />
                    {errors.phone2 && <span className="field-error" style={{ display: "block" }}>{errors.phone2}</span>}
                  </div>
                  <div className={fc("email2")} data-required data-type="email">
                    <label htmlFor="ob_email2">EMAIL ADDRESS</label>
                    <input id="ob_email2" type="email" placeholder="jane@personal.com" maxLength={200}
                      value={fields.email2}
                      onChange={e => set("email2", e.target.value)} />
                    {errors.email2 && <span className="field-error" style={{ display: "block" }}>{errors.email2}</span>}
                  </div>
                  <div className={fc("role2")} data-required>
                    <label htmlFor="ob_role2">ROLE IN BUSINESS</label>
                    <input id="ob_role2" type="text" placeholder="Owner / Manager / Agent" maxLength={100}
                      value={fields.role2}
                      onChange={e => set("role2", e.target.value)} />
                    {errors.role2 && <span className="field-error" style={{ display: "block" }}>{errors.role2}</span>}
                  </div>
                  <div className={fc("ssnDisplay2")} data-required>
                    <label htmlFor="ob_ssnDisplay2">SSN</label>
                    <input id="ob_ssnDisplay2" type="text" placeholder="XXX-XX-XXXX" maxLength={11}
                      value={fields.ssnDisplay2}
                      onChange={e => handleSSNChange("ssnDisplay2", e)} />
                    {errors.ssnDisplay2 && <span className="field-error" style={{ display: "block" }}>{errors.ssnDisplay2}</span>}
                  </div>
                </div>
              )}

              {/* Ownership percentages */}
              {isMultiple && (
                <div className="ob-grid" style={{ gap: 32, marginTop: 32, paddingTop: 32, borderTop: "1px solid var(--box-border)" }}>
                  <div className="ob-field ob-full">
                    <h3 className="ob-pct-header">OWNERSHIP PERCENTAGES</h3>
                    <p className="ob-pct-hint">Total ownership must equal 100%.</p>
                  </div>
                  <div className={fc("pctOwner1")} data-required>
                    <label htmlFor="ob_pctOwner1">PRIMARY OWNER %</label>
                    <input id="ob_pctOwner1" type="number" placeholder="50" min={1} max={100}
                      value={fields.pctOwner1}
                      onChange={e => set("pctOwner1", e.target.value)} />
                    {errors.pctOwner1 && <span className="field-error" style={{ display: "block" }}>{errors.pctOwner1}</span>}
                  </div>
                  <div className={fc("pctOwner2")} data-required>
                    <label htmlFor="ob_pctOwner2">SECONDARY OWNER %</label>
                    <input id="ob_pctOwner2" type="number" placeholder="50" min={1} max={100}
                      value={fields.pctOwner2}
                      onChange={e => set("pctOwner2", e.target.value)} />
                    {errors.pctOwner2 && <span className="field-error" style={{ display: "block" }}>{errors.pctOwner2}</span>}
                  </div>
                </div>
              )}
            </div>

            {/* ── Section 02: Business Identity ── */}
            <div className="ob-section">
              <div className="ob-section-header">
                <span className="ob-section-num">02</span>
                <div className="ob-section-line" />
                <h2 className="ob-section-title">BUSINESS IDENTITY</h2>
              </div>
              <div className="ob-grid" style={{ gap: 32 }}>
                <div className={`ob-field ob-full${errors.legalName ? " error" : ""}`} data-required>
                  <label htmlFor="ob_legalName">LEGAL BUSINESS NAME</label>
                  <input id="ob_legalName" type="text" placeholder="Your Business LLC" maxLength={200}
                    value={fields.legalName}
                    onChange={e => set("legalName", e.target.value)}
                    onBlur={() => handleTitleBlur("legalName")} />
                  {errors.legalName && <span className="field-error" style={{ display: "block" }}>{errors.legalName}</span>}
                </div>
                <div className={fc("dba")} data-required>
                  <label htmlFor="ob_dba">DBA (DOING BUSINESS AS)</label>
                  <input id="ob_dba" type="text" placeholder="Your Business" maxLength={200}
                    value={fields.dba}
                    onChange={e => set("dba", e.target.value)}
                    onBlur={() => handleTitleBlur("dba")} />
                  {errors.dba && <span className="field-error" style={{ display: "block" }}>{errors.dba}</span>}
                </div>
                <div className={fc("bizType")} data-required>
                  <label htmlFor="ob_bizType">BUSINESS TYPE</label>
                  <select id="ob_bizType" value={fields.bizType} onChange={e => set("bizType", e.target.value)}>
                    <option value="">SELECT TYPE</option>
                    <option>LIMITED LIABILITY COMPANY</option>
                    <option>CORPORATION</option>
                    <option>SOLE PROPRIETORSHIP</option>
                    <option>PARTNERSHIP</option>
                    <option>NON-PROFIT</option>
                  </select>
                  {errors.bizType && <span className="field-error" style={{ display: "block" }}>{errors.bizType}</span>}
                </div>
                <div className={`ob-field ob-full${errors.addressLine1 ? " error" : ""}`} data-required>
                  <label htmlFor="ob_addressLine1">BUSINESS ADDRESS LINE 1</label>
                  <input id="ob_addressLine1" type="text" placeholder="123 Main St"
                    value={fields.addressLine1}
                    onChange={e => set("addressLine1", e.target.value)} />
                  {errors.addressLine1 && <span className="field-error" style={{ display: "block" }}>{errors.addressLine1}</span>}
                </div>
                <div className="ob-field ob-full">
                  <label htmlFor="ob_addressLine2">BUSINESS ADDRESS LINE 2</label>
                  <input id="ob_addressLine2" type="text" placeholder="Suite, Apt, etc."
                    value={fields.addressLine2}
                    onChange={e => set("addressLine2", e.target.value)} />
                </div>
                <div className={fc("city")} data-required>
                  <label htmlFor="ob_city">CITY</label>
                  <input id="ob_city" type="text" placeholder="Miami"
                    value={fields.city}
                    onChange={e => set("city", e.target.value)}
                    onBlur={() => handleTitleBlur("city")} />
                  {errors.city && <span className="field-error" style={{ display: "block" }}>{errors.city}</span>}
                </div>
                <div className={fc("state")} data-required>
                  <label htmlFor="ob_state">STATE</label>
                  <input id="ob_state" type="text" placeholder="Florida"
                    value={fields.state}
                    onChange={e => set("state", e.target.value)}
                    onBlur={() => handleTitleBlur("state")} />
                  {errors.state && <span className="field-error" style={{ display: "block" }}>{errors.state}</span>}
                </div>
                <div className={fc("postal")} data-required>
                  <label htmlFor="ob_postal">ZIP CODE</label>
                  <input id="ob_postal" type="text" placeholder="33132"
                    value={fields.postal}
                    onChange={e => set("postal", e.target.value.replace(/\D/g, "").slice(0, 5))} />
                  {errors.postal && <span className="field-error" style={{ display: "block" }}>{errors.postal}</span>}
                </div>
                <div className={fc("bizPhone")} data-required data-type="tel">
                  <label htmlFor="ob_bizPhone">BUSINESS PHONE</label>
                  <input id="ob_bizPhone" type="tel" placeholder="(555) 000-0000" maxLength={14}
                    value={fields.bizPhone}
                    onChange={e => handlePhoneChange("bizPhone", e)} />
                  {errors.bizPhone && <span className="field-error" style={{ display: "block" }}>{errors.bizPhone}</span>}
                </div>
                <div className={fc("bizEmail")} data-required data-type="email">
                  <label htmlFor="ob_bizEmail">BUSINESS EMAIL ADDRESS</label>
                  <input id="ob_bizEmail" type="email" placeholder="contact@yourbusiness.com" maxLength={200}
                    value={fields.bizEmail}
                    onChange={e => set("bizEmail", e.target.value)} />
                  {errors.bizEmail && <span className="field-error" style={{ display: "block" }}>{errors.bizEmail}</span>}
                </div>
                <div className={fc("agent")} data-required>
                  <label htmlFor="ob_agent">AGENT CODE / NAME</label>
                  <input id="ob_agent" type="text" placeholder="Search or Enter Agent Details"
                    value={fields.agent}
                    onChange={e => set("agent", e.target.value)} />
                  {errors.agent && <span className="field-error" style={{ display: "block" }}>{errors.agent}</span>}
                </div>
                <div className="ob-field ob-full">
                  <label htmlFor="ob_website">WEBSITE</label>
                  <input id="ob_website" type="url" placeholder="https://yourbusiness.com" maxLength={200}
                    value={fields.website}
                    onChange={e => set("website", e.target.value)} />
                </div>
              </div>
            </div>

            {/* ── Section 03: Processing Details ── */}
            <div className="ob-section">
              <div className="ob-section-header">
                <span className="ob-section-num">03</span>
                <div className="ob-section-line" />
                <h2 className="ob-section-title">PROCESSING DETAILS</h2>
              </div>
              <div className="ob-grid" style={{ gap: 32 }}>
                <div className={fc("monthlyVol")} data-required>
                  <label htmlFor="ob_monthlyVol">ESTIMATED MONTHLY VOLUME ($)</label>
                  <input id="ob_monthlyVol" type="number" placeholder="0" min={0} step={0.01}
                    value={fields.monthlyVol}
                    onChange={e => set("monthlyVol", e.target.value)} />
                  {errors.monthlyVol && <span className="field-error" style={{ display: "block" }}>{errors.monthlyVol}</span>}
                </div>
                <div className={fc("avgTicket")} data-required>
                  <label htmlFor="ob_avgTicket">AVERAGE TICKET AMOUNT ($)</label>
                  <input id="ob_avgTicket" type="number" placeholder="0.00" min={0} step={0.01}
                    value={fields.avgTicket}
                    onChange={e => set("avgTicket", e.target.value)} />
                  {errors.avgTicket && <span className="field-error" style={{ display: "block" }}>{errors.avgTicket}</span>}
                </div>
                <div className={fc("highestTicket")} data-required>
                  <label htmlFor="ob_highestTicket">HIGHEST TICKET AMOUNT ($)</label>
                  <input id="ob_highestTicket" type="number" placeholder="0.00" min={0} step={0.01}
                    value={fields.highestTicket}
                    onChange={e => set("highestTicket", e.target.value)} />
                  {errors.highestTicket && <span className="field-error" style={{ display: "block" }}>{errors.highestTicket}</span>}
                </div>
                <div className="ob-field">
                  <label htmlFor="ob_processor">CURRENT PROCESSOR</label>
                  <select id="ob_processor" value={fields.processor} onChange={e => set("processor", e.target.value)}>
                    <option value="">NONE / NOT SURE</option>
                    <option>FISERV</option><option>TSYS</option><option>WORLDPAY</option>
                    <option>SQUARE</option><option>STRIPE</option><option>OTHER</option>
                  </select>
                </div>
                <div className="ob-field ob-full">
                  <label htmlFor="ob_notes">ADDITIONAL NOTES</label>
                  <textarea id="ob_notes" placeholder="Any additional information about your business…" maxLength={2000} rows={3}
                    value={fields.notes}
                    onChange={e => set("notes", e.target.value)} />
                </div>
              </div>
            </div>

            {/* ── Section 04: Equipment ── */}
            <div className="ob-section">
              <div className="ob-section-header">
                <span className="ob-section-num">04</span>
                <div className="ob-section-line" />
                <h2 className="ob-section-title">EQUIPMENT (OPTIONAL)</h2>
              </div>
              <div className="ob-grid" style={{ gap: 32 }}>
                <div className="ob-field ob-full">
                  <label htmlFor="ob_equipmentType">WHAT TYPE OF TERMINAL DO YOU NEED?</label>
                  <select id="ob_equipmentType" value={fields.equipmentType} onChange={e => set("equipmentType", e.target.value)}>
                    <option value="">NONE / NOT SURE</option>
                    <option>STANDALONE TERMINAL</option>
                    <option>SMART POS SYSTEM</option>
                    <option>MOBILE/WIRELESS TERMINAL</option>
                    <option>VIRTUAL TERMINAL / E-COMMERCE</option>
                    <option>OTHER</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ── Section 05: Documents ── */}
            <div className="ob-section">
              <div className="ob-section-header">
                <span className="ob-section-num">05</span>
                <div className="ob-section-line" />
                <h2 className="ob-section-title">DOCUMENTS</h2>
              </div>
              <div className="ob-upload-grid">
                <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                  {/* ID Document - Owner 1 */}
                  <div className="ob-upload-box">
                    <div>
                      <h4>ID / DRIVER LICENSE <span style={{ color: "var(--primary)" }}>*</span></h4>
                      <p>Required for identity verification</p>
                    </div>
                    <label className="ob-upload-drop">
                      <span className="material-symbols-outlined">cloud_upload</span>
                      <span>BROWSE FILES</span>
                      <input type="file" multiple accept=".pdf,.png,.jpg,.jpeg" hidden
                        onChange={e => handleFileChange("idDocument", e.target.files)} />
                    </label>
                    <FileList fieldId="idDocument" files={files} onRemove={removeFile} />
                  </div>

                  {/* ID Document - Owner 2 (multiple owners only) */}
                  {isMultiple && (
                    <div className="ob-upload-box">
                      <div>
                        <h4>ID / DRIVER LICENSE (OWNER 2) <span style={{ color: "var(--primary)" }}>*</span></h4>
                        <p>Required for identity verification</p>
                      </div>
                      <label className="ob-upload-drop">
                        <span className="material-symbols-outlined">cloud_upload</span>
                        <span>BROWSE FILES</span>
                        <input type="file" multiple accept=".pdf,.png,.jpg,.jpeg" hidden
                          onChange={e => handleFileChange("idDocument2", e.target.files)} />
                      </label>
                      <FileList fieldId="idDocument2" files={files} onRemove={removeFile} />
                    </div>
                  )}

                  {/* Storefront */}
                  <div className="ob-upload-box">
                    <div>
                      <h4>STOREFRONT PICTURES <span style={{ color: "var(--primary)" }}>*</span></h4>
                      <p>Upload photos of your business exterior and interior</p>
                    </div>
                    <label className="ob-upload-drop">
                      <span className="material-symbols-outlined">cloud_upload</span>
                      <span>BROWSE FILES</span>
                      <input type="file" multiple accept=".pdf,.png,.jpg,.jpeg" hidden
                        onChange={e => handleFileChange("storefrontPictures", e.target.files)} />
                    </label>
                    <FileList fieldId="storefrontPictures" files={files} onRemove={removeFile} />
                  </div>
                </div>

                {/* Right column: small upload boxes */}
                <div className="ob-upload-small">
                  {/* EIN */}
                  <div className="ob-upload-small-box">
                    <div className="box-text">
                      <h4>EIN / TAX ID <span style={{ color: "var(--primary)" }}>*</span></h4>
                      <p>Required for verification</p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                      <label className="ob-upload-btn">
                        <span className="material-symbols-outlined">upload</span> UPLOAD FILE
                        <input type="file" multiple accept=".pdf,.png,.jpg,.jpeg" hidden
                          onChange={e => handleFileChange("ein", e.target.files)} />
                      </label>
                      <FileList fieldId="ein" files={files} onRemove={removeFile} />
                    </div>
                  </div>
                  {/* Voided Check */}
                  <div className="ob-upload-small-box">
                    <div className="box-text">
                      <h4>VOIDED CHECK <span style={{ color: "var(--primary)" }}>*</span></h4>
                      <p>Account validation</p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                      <label className="ob-upload-btn">
                        <span className="material-symbols-outlined">upload</span> UPLOAD FILE
                        <input type="file" multiple accept=".pdf,.png,.jpg,.jpeg" hidden
                          onChange={e => handleFileChange("businessVoided", e.target.files)} />
                      </label>
                      <FileList fieldId="businessVoided" files={files} onRemove={removeFile} />
                    </div>
                  </div>
                  {/* FNS */}
                  <div className="ob-upload-small-box">
                    <div className="box-text">
                      <h4>FNS DOCUMENT</h4>
                      <p>If applicable</p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                      <label className="ob-upload-btn">
                        <span className="material-symbols-outlined">upload</span> UPLOAD FILE
                        <input type="file" multiple accept=".pdf,.png,.jpg,.jpeg" hidden
                          onChange={e => handleFileChange("fnsDocument", e.target.files)} />
                      </label>
                      <FileList fieldId="fnsDocument" files={files} onRemove={removeFile} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Section 06: Consents ── */}
            <div className="ob-section">
              <div className="ob-section-header">
                <span className="ob-section-num">06</span>
                <div className="ob-section-line" />
                <h2 className="ob-section-title">CONSENTS &amp; AGREEMENTS</h2>
              </div>
              <div className="ob-legal-stack">

                {/* Notifications */}
                <label className="ob-consent-card">
                  <input type="checkbox" checked={fields.consentNonmarketing}
                    onChange={e => set("consentNonmarketing", e.target.checked)} />
                  <div className="ob-consent-box">
                    <span className="material-symbols-outlined">check</span>
                  </div>
                  <div className="ob-consent-text">
                    <h4>NOTIFICATIONS</h4>
                    <p>I agree to receive automated notifications and updates via text message to the phone number provided, standard rates apply.</p>
                  </div>
                </label>
                {errors.consentNonmarketing && (
                  <span style={{ color: "var(--red)", fontSize: 11, marginTop: -8, marginLeft: 20, fontWeight: 600, display: "block" }}>
                    {errors.consentNonmarketing}
                  </span>
                )}

                {/* Terms of Service */}
                <label className="ob-consent-card">
                  <input type="checkbox" checked={fields.tcpa2}
                    onChange={e => set("tcpa2", e.target.checked)} />
                  <div className="ob-consent-box">
                    <span className="material-symbols-outlined">check</span>
                  </div>
                  <div className="ob-consent-text">
                    <h4>TERMS OF SERVICE</h4>
                    <p>I verify that all provided information is accurate and agree to Mtech Distributors&rsquo; Terms of Service.</p>
                  </div>
                </label>
                {errors.tcpa2 && (
                  <span style={{ color: "var(--red)", fontSize: 11, marginTop: -8, marginLeft: 20, fontWeight: 600, display: "block" }}>
                    {errors.tcpa2}
                  </span>
                )}

                {/* Promotional (optional) */}
                <label className="ob-consent-card">
                  <input type="checkbox" checked={fields.consentMarketing}
                    onChange={e => set("consentMarketing", e.target.checked)} />
                  <div className="ob-consent-box">
                    <span className="material-symbols-outlined">check</span>
                  </div>
                  <div className="ob-consent-text">
                    <h4>PROMOTIONAL ALERTS</h4>
                    <p>(Optional) I consent to receive promotional texts regarding products and services from Mtech.</p>
                  </div>
                </label>

                {/* Submit */}
                <div className="ob-submit-wrap" style={{ marginTop: 12, width: "100%" }}>
                  <button
                    type="submit"
                    className="ob-submit-btn"
                    disabled={submitting}
                    style={{ height: 60, fontSize: 13, borderRadius: 12, boxShadow: "0 4px 16px rgba(99,102,241,0.2)" }}
                  >
                    {submitting ? "SUBMITTING…" : "SUBMIT APPLICATION"}
                    {!submitting && <span className="material-symbols-outlined">arrow_forward</span>}
                  </button>
                </div>
              </div>
            </div>

          </form>

          {/* ── Footer ── */}
          <footer className="ob-footer">
            <div>© 2026 MTECH DISTRIBUTORS LLC. ALL RIGHTS RESERVED.</div>
            <nav>
              <a href="https://www.mtechdistributors.com/pages/privacy-policy" target="_blank" rel="noreferrer">PRIVACY</a>
              <a href="https://www.mtechdistributors.com/pages/terms-of-use" target="_blank" rel="noreferrer">TERMS</a>
              <a href="#" onClick={e => { e.preventDefault(); setShowSupport(true) }}>SUPPORT</a>
            </nav>
          </footer>
        </section>
      </main>

      {/* ── Success Overlay ── */}
      <div className={`ob-success${showSuccess ? " active" : ""}`}>
        <div className="ob-success-box">
          <div className="ob-success-icon">
            <span className="material-symbols-outlined">check_circle</span>
          </div>
          <div className="ob-success-title">Application Submitted</div>
          <div className="ob-success-desc">
            Our team will review your application within 24–48 hours.
          </div>
          {ticketId && <div className="ob-success-ticket">{ticketId}</div>}
          <button className="ob-success-btn" onClick={() => setShowSuccess(false)}>
            CLOSE
          </button>
        </div>
      </div>

      {/* ── Support Modal ── */}
      <div className={`ob-support-modal${showSupport ? " active" : ""}`}>
        <div className="ob-support-box">
          <div className="ob-support-icon">
            <span className="material-symbols-outlined">support_agent</span>
          </div>
          <div className="ob-support-title">Mtech Support</div>
          <div className="ob-support-desc">
            Our dedicated ticketing system is currently under development.<br /><br />
            For immediate assistance, please reach out to our team during operating hours:<br /><br />
            <strong>Phone:</strong>{" "}
            <a href="tel:18884117583" style={{ color: "var(--text)", textDecoration: "none", fontWeight: 600 }}>(888) 411-7583</a><br />
            <strong>Email:</strong>{" "}
            <a href="mailto:support@mtechdistributors.com" style={{ color: "var(--text)", textDecoration: "none", fontWeight: 600 }}>support@mtechdistributors.com</a><br />
            <strong>Hours:</strong> Mon - Fri, 10:00 AM - 6:00 PM EST
          </div>
          <button className="ob-support-btn" onClick={() => setShowSupport(false)}>OK</button>
        </div>
      </div>

    </div>
  )
}
