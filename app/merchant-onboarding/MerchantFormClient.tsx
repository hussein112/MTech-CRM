"use client"

import { useState, useRef, useCallback, useMemo } from "react"
import "./form.css"

// ── Types ────────────────────────────────────────────────────────────────────

interface FormFields {
  ownerStructure: string
  firstName: string; lastName: string; phone: string; email: string; role: string; ssn: string
  firstName2: string; lastName2: string; phone2: string; email2: string; role2: string; ssn2: string
  pct1: string; pct2: string
  legalName: string; dba: string; bizType: string
  address1: string; address2: string; city: string; state: string; zip: string
  bizPhone: string; bizEmail: string; agent: string; website: string
  monthlyVol: string; avgTicket: string; highestTicket: string; processor: string; notes: string
  equipmentType: string
}

const EMPTY_FORM: FormFields = {
  ownerStructure: "", firstName: "", lastName: "", phone: "", email: "", role: "", ssn: "",
  firstName2: "", lastName2: "", phone2: "", email2: "", role2: "", ssn2: "",
  pct1: "", pct2: "",
  legalName: "", dba: "", bizType: "", address1: "", address2: "", city: "", state: "", zip: "",
  bizPhone: "", bizEmail: "", agent: "", website: "",
  monthlyVol: "", avgTicket: "", highestTicket: "", processor: "", notes: "",
  equipmentType: "",
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatPhone(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 10)
  if (d.length <= 3) return d.length ? `(${d}` : ""
  if (d.length <= 6) return `(${d.slice(0,3)}) ${d.slice(3)}`
  return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`
}

function formatSSN(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 9)
  if (d.length <= 3) return d
  if (d.length <= 5) return `${d.slice(0,3)}-${d.slice(3)}`
  return `${d.slice(0,3)}-${d.slice(3,5)}-${d.slice(5)}`
}

function toTitleCase(s: string): string {
  return s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

// ── Sub-components ────────────────────────────────────────────────────────────

function UploadDrop({
  id, title, subtitle, required,
  files, onAdd, onRemove,
}: {
  id: string; title: string; subtitle: string; required?: boolean
  files: File[]; onAdd: (f: File[]) => void; onRemove: (i: number) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div className="ob-upload-box">
      <div>
        <h4>{title}{required && <span style={{ color: "var(--primary)" }}> *</span>}</h4>
        <p>{subtitle}</p>
      </div>
      <label
        className="ob-upload-drop"
        onClick={e => { e.preventDefault(); inputRef.current?.click() }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 24 }}>cloud_upload</span>
        <span>Browse Files</span>
        <input
          ref={inputRef}
          type="file" id={id} multiple accept=".pdf,.png,.jpg,.jpeg"
          style={{ display: "none" }}
          onChange={e => { if (e.target.files) onAdd(Array.from(e.target.files)); e.target.value = "" }}
        />
      </label>
      {files.map((f, i) => (
        <div key={i} className="ob-file-item">
          <span className="ob-file-name">{f.name}</span>
          <span className="ob-file-size">{fmtSize(f.size)}</span>
          <button className="ob-file-remove" onClick={() => onRemove(i)}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
          </button>
        </div>
      ))}
    </div>
  )
}

function UploadSmallSlot({
  id, title, subtitle, required,
  files, onAdd, onRemove,
}: {
  id: string; title: string; subtitle: string; required?: boolean
  files: File[]; onAdd: (f: File[]) => void; onRemove: (i: number) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div className="ob-upload-small-box">
      <div>
        <h4>{title}{required && <span style={{ color: "var(--primary)" }}> *</span>}</h4>
        <p>{subtitle}</p>
        {files.map((f, i) => (
          <div key={i} className="ob-file-item" style={{ textAlign: "left" }}>
            <span className="ob-file-name">{f.name}</span>
            <span className="ob-file-size">{fmtSize(f.size)}</span>
            <button className="ob-file-remove" onClick={() => onRemove(i)}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
            </button>
          </div>
        ))}
      </div>
      <div style={{ flexShrink: 0 }}>
        <label className="ob-upload-btn" onClick={e => { e.preventDefault(); inputRef.current?.click() }}>
          <span className="material-symbols-outlined">upload</span> Upload
          <input
            ref={inputRef}
            type="file" id={id} multiple accept=".pdf,.png,.jpg,.jpeg"
            style={{ display: "none" }}
            onChange={e => { if (e.target.files) onAdd(Array.from(e.target.files)); e.target.value = "" }}
          />
        </label>
      </div>
    </div>
  )
}

function ConsentCard({
  checked, onChange, title, description,
}: {
  checked: boolean; onChange: (v: boolean) => void
  title: string; description: string
}) {
  return (
    <div className={`ob-consent-card${checked ? " checked" : ""}`} onClick={() => onChange(!checked)}>
      <div className="ob-consent-box">
        <span className="material-symbols-outlined">check</span>
      </div>
      <div className="ob-consent-text">
        <h4>{title}</h4>
        <p>{description}</p>
      </div>
    </div>
  )
}

function SectionHeader({ num, title }: { num: string; title: string }) {
  return (
    <div className="ob-section-header">
      <span className="ob-section-num">{num}</span>
      <div className="ob-section-line" />
      <h2 className="ob-section-title">{title}</h2>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function MerchantFormClient() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [isLight, setIsLight] = useState(false)

  const [form, setForm] = useState<FormFields>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof FormFields | "consents", string>>>({})

  const [consentNotif,    setConsentNotif]    = useState(false)
  const [consentTerms,    setConsentTerms]    = useState(false)
  const [consentMarketing, setConsentMarketing] = useState(false)

  const [idFiles,         setIdFiles]         = useState<File[]>([])
  const [id2Files,        setId2Files]        = useState<File[]>([])
  const [storefrontFiles, setStorefrontFiles] = useState<File[]>([])
  const [einFiles,        setEinFiles]        = useState<File[]>([])
  const [voidedFiles,     setVoidedFiles]     = useState<File[]>([])
  const [fnsFiles,        setFnsFiles]        = useState<File[]>([])

  const [showSuccess,  setShowSuccess]  = useState(false)
  const [ticketId,     setTicketId]     = useState("")
  const [showSupport,  setShowSupport]  = useState(false)
  const [submitting,   setSubmitting]   = useState(false)

  const isMulti = form.ownerStructure === "Multiple Owners"
  const ownerSelected = !!form.ownerStructure

  // ── Field updater ────────────────────────────────────────────────────────

  function setF<K extends keyof FormFields>(k: K, v: string) {
    setForm(prev => ({ ...prev, [k]: v }))
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: undefined }))
  }

  // ── Phone / SSN formatters ───────────────────────────────────────────────

  const handlePhone = useCallback((k: keyof FormFields) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setF(k, formatPhone(e.target.value))
  }, [])

  const handleSSN = useCallback((k: keyof FormFields) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setF(k, formatSSN(e.target.value))
  }, [])

  const titleCaseBlur = useCallback((k: keyof FormFields) => (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value) setF(k, toTitleCase(e.target.value))
  }, [])

  // ── Progress ─────────────────────────────────────────────────────────────

  const { progress, step } = useMemo(() => {
    const req: string[] = [form.ownerStructure]
    if (ownerSelected) req.push(form.firstName, form.lastName, form.phone, form.email, form.role, form.ssn)
    if (isMulti) req.push(form.firstName2, form.lastName2, form.phone2, form.email2, form.role2, form.ssn2, form.pct1, form.pct2)
    if (ownerSelected) req.push(form.legalName, form.dba, form.bizType, form.address1, form.city, form.state, form.zip, form.bizPhone, form.bizEmail, form.agent)
    if (ownerSelected) req.push(form.monthlyVol, form.avgTicket, form.highestTicket)
    const pct = req.length ? Math.round(req.filter(Boolean).length / req.length * 100) : 0
    let stepLabel = "STEP 0 OF 4: NOT STARTED"
    if (pct > 0 && pct <= 25)  stepLabel = "STEP 1 OF 4: PERSONAL INFORMATION"
    if (pct > 25 && pct <= 55) stepLabel = "STEP 2 OF 4: BUSINESS IDENTITY"
    if (pct > 55 && pct <= 80) stepLabel = "STEP 3 OF 4: PROCESSING DETAILS"
    if (pct > 80 && pct < 100) stepLabel = "STEP 4 OF 4: REVIEW & SUBMIT"
    if (pct === 100)            stepLabel = "COMPLETE — READY TO SUBMIT"
    return { progress: pct, step: stepLabel }
  }, [form, ownerSelected, isMulti])

  // ── Theme toggle ─────────────────────────────────────────────────────────

  function toggleTheme() {
    setIsLight(v => {
      wrapperRef.current?.classList.toggle("theme-light", !v)
      return !v
    })
  }

  // ── Validation ───────────────────────────────────────────────────────────

  function validate(): boolean {
    const errs: typeof errors = {}
    const req = (k: keyof FormFields, label: string) => {
      if (!form[k]?.toString().trim()) errs[k] = `${label} is required`
    }
    req("ownerStructure", "Ownership structure")
    if (ownerSelected) {
      req("firstName", "First name"); req("lastName", "Last name")
      req("phone", "Phone number"); req("email", "Email"); req("role", "Role"); req("ssn", "SSN")
      if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Enter a valid email address"
      if (form.phone && form.phone.replace(/\D/g, "").length !== 10) errs.phone = "Enter a valid 10-digit phone"
      if (form.ssn && form.ssn.replace(/\D/g, "").length !== 9) errs.ssn = "SSN must be 9 digits"
    }
    if (isMulti) {
      req("firstName2", "First name"); req("lastName2", "Last name")
      req("phone2", "Phone number"); req("email2", "Email"); req("role2", "Role"); req("ssn2", "SSN")
      req("pct1", "Primary owner %"); req("pct2", "Secondary owner %")
    }
    if (ownerSelected) {
      req("legalName", "Legal business name"); req("dba", "DBA"); req("bizType", "Business type")
      req("address1", "Business address"); req("city", "City"); req("state", "State"); req("zip", "Zip")
      req("bizPhone", "Business phone"); req("bizEmail", "Business email"); req("agent", "Agent code / name")
      if (form.bizEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.bizEmail)) errs.bizEmail = "Enter a valid email"
      req("monthlyVol", "Monthly volume"); req("avgTicket", "Avg ticket"); req("highestTicket", "Highest ticket")
    }
    if (!consentNotif) errs.consents = "Please accept the notifications consent to proceed"
    if (!consentTerms) errs.consents = "Please accept the terms of service to proceed"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) {
      const first = document.querySelector(".ob-wrapper .ob-field.error")
      first?.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 900))
    const id = `MTECH-ONB-${String(Math.floor(1000 + Math.random() * 9000))}`
    setTicketId(id)
    setSubmitting(false)
    setShowSuccess(true)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const ErrMsg = ({ field }: { field: keyof typeof errors }) =>
    errors[field] ? <div className="ob-field-error">{errors[field]}</div> : null

  return (
    <div ref={wrapperRef} className="ob-wrapper">

      {/* Header */}
      <header className="ob-header">
        <div className="ob-logo">
          <img
            src={isLight ? "https://iili.io/qfBHDRs.png" : "https://iili.io/qfBHbOG.png"}
            alt="Mtech Distributors" style={{ height: 68 }}
          />
        </div>
        <div className="ob-header-right">
          <button className="ob-theme-toggle" onClick={toggleTheme} title="Toggle theme">
            <span className="material-symbols-outlined">{isLight ? "dark_mode" : "light_mode"}</span>
          </button>
          <button className="ob-help-btn" onClick={() => setShowSupport(true)} title="Support">
            <span className="material-symbols-outlined">help_outline</span>
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="ob-main">

        {/* Aside */}
        <aside className="ob-aside">
          <div>
            <p className="ob-version">Onboarding</p>
            <h1 className="ob-headline">MERCHANT<br />REGIS&shy;TRATION.</h1>
            <p className="ob-subtitle">Complete the registration form to begin your merchant onboarding process with Mtech Distributors. Our team will review your application within 24–48 hours.</p>
          </div>
          <div>
            <div className="ob-progress-label">
              <span>Application Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="ob-progress-bar">
              <div className="ob-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <p className="ob-progress-step">{step}</p>
          </div>
        </aside>

        {/* Form content */}
        <section className="ob-content">
          <form className="ob-form" onSubmit={handleSubmit} noValidate>

            {/* ── 01 PERSONAL ── */}
            <div className="ob-section">
              <SectionHeader num="01" title="Personal Information" />
              <div className="ob-grid">
                <div className={`ob-field ob-full${errors.ownerStructure ? " error" : ""}`}>
                  <label>Ownership Structure <span style={{ color: "var(--primary)" }}>*</span></label>
                  <select value={form.ownerStructure} onChange={e => setF("ownerStructure", e.target.value)}>
                    <option value="">Select Structure</option>
                    <option value="Single Owner">Single Owner</option>
                    <option value="Multiple Owners">Multiple Owners</option>
                  </select>
                  <ErrMsg field="ownerStructure" />
                </div>
              </div>

              {ownerSelected && (
                <div className="ob-grid" style={{ marginTop: 32 }}>
                  <div className="ob-field ob-full">
                    <h3 style={{ fontSize: 11, fontWeight: 800, color: "var(--text)", letterSpacing: ".1em" }}>Primary Owner</h3>
                  </div>
                  <div className={`ob-field${errors.firstName ? " error" : ""}`}>
                    <label>First Name <span style={{ color: "var(--primary)" }}>*</span></label>
                    <input type="text" value={form.firstName} placeholder="John" maxLength={100}
                      onChange={e => setF("firstName", e.target.value)}
                      onBlur={titleCaseBlur("firstName")} />
                    <ErrMsg field="firstName" />
                  </div>
                  <div className={`ob-field${errors.lastName ? " error" : ""}`}>
                    <label>Last Name <span style={{ color: "var(--primary)" }}>*</span></label>
                    <input type="text" value={form.lastName} placeholder="Doe" maxLength={100}
                      onChange={e => setF("lastName", e.target.value)}
                      onBlur={titleCaseBlur("lastName")} />
                    <ErrMsg field="lastName" />
                  </div>
                  <div className={`ob-field${errors.phone ? " error" : ""}`}>
                    <label>Phone Number <span style={{ color: "var(--primary)" }}>*</span></label>
                    <input type="tel" value={form.phone} placeholder="(555) 000-0000" maxLength={14}
                      onChange={handlePhone("phone")} />
                    <ErrMsg field="phone" />
                  </div>
                  <div className={`ob-field${errors.email ? " error" : ""}`}>
                    <label>Email Address <span style={{ color: "var(--primary)" }}>*</span></label>
                    <input type="email" value={form.email} placeholder="you@personal.com" maxLength={200}
                      onChange={e => setF("email", e.target.value)} />
                    <ErrMsg field="email" />
                  </div>
                  <div className={`ob-field${errors.role ? " error" : ""}`}>
                    <label>Role In Business <span style={{ color: "var(--primary)" }}>*</span></label>
                    <input type="text" value={form.role} placeholder="Owner / Manager" maxLength={100}
                      onChange={e => setF("role", e.target.value)} />
                    <ErrMsg field="role" />
                  </div>
                  <div className={`ob-field${errors.ssn ? " error" : ""}`}>
                    <label>SSN <span style={{ color: "var(--primary)" }}>*</span></label>
                    <input type="text" value={form.ssn} placeholder="XXX-XX-XXXX" maxLength={11}
                      onChange={handleSSN("ssn")} />
                    <ErrMsg field="ssn" />
                  </div>
                </div>
              )}

              {isMulti && (
                <>
                  <div className="ob-grid" style={{ marginTop: 32, paddingTop: 32, borderTop: "1px solid var(--box-border)" }}>
                    <div className="ob-field ob-full">
                      <h3 style={{ fontSize: 11, fontWeight: 800, color: "var(--text)", letterSpacing: ".1em" }}>Secondary Owner</h3>
                    </div>
                    <div className={`ob-field${errors.firstName2 ? " error" : ""}`}>
                      <label>First Name <span style={{ color: "var(--primary)" }}>*</span></label>
                      <input type="text" value={form.firstName2} placeholder="Jane" maxLength={100}
                        onChange={e => setF("firstName2", e.target.value)}
                        onBlur={titleCaseBlur("firstName2")} />
                      <ErrMsg field="firstName2" />
                    </div>
                    <div className={`ob-field${errors.lastName2 ? " error" : ""}`}>
                      <label>Last Name <span style={{ color: "var(--primary)" }}>*</span></label>
                      <input type="text" value={form.lastName2} placeholder="Smith" maxLength={100}
                        onChange={e => setF("lastName2", e.target.value)}
                        onBlur={titleCaseBlur("lastName2")} />
                      <ErrMsg field="lastName2" />
                    </div>
                    <div className={`ob-field${errors.phone2 ? " error" : ""}`}>
                      <label>Phone Number <span style={{ color: "var(--primary)" }}>*</span></label>
                      <input type="tel" value={form.phone2} placeholder="(555) 000-0000" maxLength={14}
                        onChange={handlePhone("phone2")} />
                      <ErrMsg field="phone2" />
                    </div>
                    <div className={`ob-field${errors.email2 ? " error" : ""}`}>
                      <label>Email Address <span style={{ color: "var(--primary)" }}>*</span></label>
                      <input type="email" value={form.email2} placeholder="jane@personal.com" maxLength={200}
                        onChange={e => setF("email2", e.target.value)} />
                      <ErrMsg field="email2" />
                    </div>
                    <div className={`ob-field${errors.role2 ? " error" : ""}`}>
                      <label>Role In Business <span style={{ color: "var(--primary)" }}>*</span></label>
                      <input type="text" value={form.role2} placeholder="Owner / Manager" maxLength={100}
                        onChange={e => setF("role2", e.target.value)} />
                      <ErrMsg field="role2" />
                    </div>
                    <div className={`ob-field${errors.ssn2 ? " error" : ""}`}>
                      <label>SSN <span style={{ color: "var(--primary)" }}>*</span></label>
                      <input type="text" value={form.ssn2} placeholder="XXX-XX-XXXX" maxLength={11}
                        onChange={handleSSN("ssn2")} />
                      <ErrMsg field="ssn2" />
                    </div>
                  </div>
                  <div className="ob-grid" style={{ marginTop: 32, paddingTop: 32, borderTop: "1px solid var(--box-border)" }}>
                    <div className="ob-field ob-full">
                      <h3 style={{ fontSize: 11, fontWeight: 800, color: "var(--primary)", letterSpacing: ".1em" }}>Ownership Percentages</h3>
                      <p style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 4 }}>Total ownership must equal 100%.</p>
                    </div>
                    <div className={`ob-field${errors.pct1 ? " error" : ""}`}>
                      <label>Primary Owner % <span style={{ color: "var(--primary)" }}>*</span></label>
                      <input type="number" value={form.pct1} placeholder="50" min={1} max={100}
                        onChange={e => setF("pct1", e.target.value)} />
                      <ErrMsg field="pct1" />
                    </div>
                    <div className={`ob-field${errors.pct2 ? " error" : ""}`}>
                      <label>Secondary Owner % <span style={{ color: "var(--primary)" }}>*</span></label>
                      <input type="number" value={form.pct2} placeholder="50" min={1} max={100}
                        onChange={e => setF("pct2", e.target.value)} />
                      <ErrMsg field="pct2" />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* ── 02 BUSINESS ── */}
            {ownerSelected && (
              <div className="ob-section">
                <SectionHeader num="02" title="Business Identity" />
                <div className="ob-grid">
                  <div className={`ob-field ob-full${errors.legalName ? " error" : ""}`}>
                    <label>Legal Business Name <span style={{ color: "var(--primary)" }}>*</span></label>
                    <input type="text" value={form.legalName} placeholder="Your Business LLC" maxLength={200}
                      onChange={e => setF("legalName", e.target.value)} />
                    <ErrMsg field="legalName" />
                  </div>
                  <div className={`ob-field${errors.dba ? " error" : ""}`}>
                    <label>DBA <span style={{ color: "var(--primary)" }}>*</span></label>
                    <input type="text" value={form.dba} placeholder="Your Business" maxLength={200}
                      onChange={e => setF("dba", e.target.value)} />
                    <ErrMsg field="dba" />
                  </div>
                  <div className={`ob-field${errors.bizType ? " error" : ""}`}>
                    <label>Business Type <span style={{ color: "var(--primary)" }}>*</span></label>
                    <select value={form.bizType} onChange={e => setF("bizType", e.target.value)}>
                      <option value="">Select Type</option>
                      <option>Limited Liability Company</option>
                      <option>Corporation</option>
                      <option>Sole Proprietorship</option>
                      <option>Partnership</option>
                      <option>Non-Profit</option>
                    </select>
                    <ErrMsg field="bizType" />
                  </div>
                  <div className={`ob-field ob-full${errors.address1 ? " error" : ""}`}>
                    <label>Business Address Line 1 <span style={{ color: "var(--primary)" }}>*</span></label>
                    <input type="text" value={form.address1} placeholder="123 Main St"
                      onChange={e => setF("address1", e.target.value)} />
                    <ErrMsg field="address1" />
                  </div>
                  <div className="ob-field ob-full">
                    <label>Business Address Line 2</label>
                    <input type="text" value={form.address2} placeholder="Suite, Apt, etc."
                      onChange={e => setF("address2", e.target.value)} />
                  </div>
                  <div className={`ob-field${errors.city ? " error" : ""}`}>
                    <label>City <span style={{ color: "var(--primary)" }}>*</span></label>
                    <input type="text" value={form.city} placeholder="Miami"
                      onChange={e => setF("city", e.target.value)}
                      onBlur={titleCaseBlur("city")} />
                    <ErrMsg field="city" />
                  </div>
                  <div className={`ob-field${errors.state ? " error" : ""}`}>
                    <label>State <span style={{ color: "var(--primary)" }}>*</span></label>
                    <input type="text" value={form.state} placeholder="Florida"
                      onChange={e => setF("state", e.target.value)}
                      onBlur={titleCaseBlur("state")} />
                    <ErrMsg field="state" />
                  </div>
                  <div className={`ob-field${errors.zip ? " error" : ""}`}>
                    <label>Zip Code <span style={{ color: "var(--primary)" }}>*</span></label>
                    <input type="text" value={form.zip} placeholder="33132" maxLength={5}
                      onChange={e => setF("zip", e.target.value.replace(/\D/g, "").slice(0, 5))} />
                    <ErrMsg field="zip" />
                  </div>
                  <div className={`ob-field${errors.bizPhone ? " error" : ""}`}>
                    <label>Business Phone <span style={{ color: "var(--primary)" }}>*</span></label>
                    <input type="tel" value={form.bizPhone} placeholder="(555) 000-0000" maxLength={14}
                      onChange={handlePhone("bizPhone")} />
                    <ErrMsg field="bizPhone" />
                  </div>
                  <div className={`ob-field${errors.bizEmail ? " error" : ""}`}>
                    <label>Business Email <span style={{ color: "var(--primary)" }}>*</span></label>
                    <input type="email" value={form.bizEmail} placeholder="contact@yourbusiness.com" maxLength={200}
                      onChange={e => setF("bizEmail", e.target.value)} />
                    <ErrMsg field="bizEmail" />
                  </div>
                  <div className={`ob-field${errors.agent ? " error" : ""}`}>
                    <label>Agent Code / Name <span style={{ color: "var(--primary)" }}>*</span></label>
                    <input type="text" value={form.agent} placeholder="Search or Enter Agent Details"
                      onChange={e => setF("agent", e.target.value)} />
                    <ErrMsg field="agent" />
                  </div>
                  <div className="ob-field ob-full">
                    <label>Website</label>
                    <input type="url" value={form.website} placeholder="https://yourbusiness.com" maxLength={200}
                      onChange={e => setF("website", e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {/* ── 03 PROCESSING ── */}
            {ownerSelected && (
              <div className="ob-section">
                <SectionHeader num="03" title="Processing Details" />
                <div className="ob-grid">
                  <div className={`ob-field${errors.monthlyVol ? " error" : ""}`}>
                    <label>Monthly Volume ($) <span style={{ color: "var(--primary)" }}>*</span></label>
                    <input type="number" value={form.monthlyVol} placeholder="0" min={0} step={0.01}
                      onChange={e => setF("monthlyVol", e.target.value)} />
                    <ErrMsg field="monthlyVol" />
                  </div>
                  <div className={`ob-field${errors.avgTicket ? " error" : ""}`}>
                    <label>Avg Ticket ($) <span style={{ color: "var(--primary)" }}>*</span></label>
                    <input type="number" value={form.avgTicket} placeholder="0.00" min={0} step={0.01}
                      onChange={e => setF("avgTicket", e.target.value)} />
                    <ErrMsg field="avgTicket" />
                  </div>
                  <div className={`ob-field${errors.highestTicket ? " error" : ""}`}>
                    <label>Highest Ticket ($) <span style={{ color: "var(--primary)" }}>*</span></label>
                    <input type="number" value={form.highestTicket} placeholder="0.00" min={0} step={0.01}
                      onChange={e => setF("highestTicket", e.target.value)} />
                    <ErrMsg field="highestTicket" />
                  </div>
                  <div className="ob-field">
                    <label>Current Processor</label>
                    <select value={form.processor} onChange={e => setF("processor", e.target.value)}>
                      <option value="">None / Not Sure</option>
                      <option>Fiserv</option><option>TSYS</option><option>Worldpay</option>
                      <option>Square</option><option>Stripe</option><option>Other</option>
                    </select>
                  </div>
                  <div className="ob-field ob-full">
                    <label>Additional Notes</label>
                    <textarea value={form.notes} placeholder="Any additional information about your business…"
                      maxLength={2000} rows={3}
                      onChange={e => setF("notes", e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {/* ── 04 EQUIPMENT ── */}
            {ownerSelected && (
              <div className="ob-section">
                <SectionHeader num="04" title="Equipment (Optional)" />
                <div className="ob-grid">
                  <div className="ob-field ob-full">
                    <label>What type of terminal do you need?</label>
                    <select value={form.equipmentType} onChange={e => setF("equipmentType", e.target.value)}>
                      <option value="">None / Not Sure</option>
                      <option>Standalone Terminal</option>
                      <option>Smart POS System</option>
                      <option>Mobile/Wireless Terminal</option>
                      <option>Virtual Terminal / E-Commerce</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* ── 05 DOCUMENTS ── */}
            {ownerSelected && (
              <div className="ob-section">
                <SectionHeader num="05" title="Documents" />
                <div className="ob-upload-grid">
                  <div className="ob-upload-col">
                    <UploadDrop
                      id="f_id1" title="ID / Driver License" subtitle="Required for identity verification" required
                      files={idFiles} onAdd={fs => setIdFiles(p => [...p, ...fs])} onRemove={i => setIdFiles(p => p.filter((_, j) => j !== i))}
                    />
                    {isMulti && (
                      <UploadDrop
                        id="f_id2" title="ID / Driver License (Owner 2)" subtitle="Required for identity verification" required
                        files={id2Files} onAdd={fs => setId2Files(p => [...p, ...fs])} onRemove={i => setId2Files(p => p.filter((_, j) => j !== i))}
                      />
                    )}
                    <UploadDrop
                      id="f_storefront" title="Storefront Pictures" subtitle="Photos of business exterior and interior" required
                      files={storefrontFiles} onAdd={fs => setStorefrontFiles(p => [...p, ...fs])} onRemove={i => setStorefrontFiles(p => p.filter((_, j) => j !== i))}
                    />
                  </div>
                  <div className="ob-upload-small">
                    <UploadSmallSlot
                      id="f_ein" title="EIN / Tax ID" subtitle="Required for verification" required
                      files={einFiles} onAdd={fs => setEinFiles(p => [...p, ...fs])} onRemove={i => setEinFiles(p => p.filter((_, j) => j !== i))}
                    />
                    <UploadSmallSlot
                      id="f_voided" title="Voided Check" subtitle="Account validation" required
                      files={voidedFiles} onAdd={fs => setVoidedFiles(p => [...p, ...fs])} onRemove={i => setVoidedFiles(p => p.filter((_, j) => j !== i))}
                    />
                    <UploadSmallSlot
                      id="f_fns" title="FNS Document" subtitle="If applicable"
                      files={fnsFiles} onAdd={fs => setFnsFiles(p => [...p, ...fs])} onRemove={i => setFnsFiles(p => p.filter((_, j) => j !== i))}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── 06 CONSENTS ── */}
            {ownerSelected && (
              <div className="ob-section">
                <SectionHeader num="06" title="Consents & Agreements" />
                <div className="ob-legal-stack">
                  <ConsentCard
                    checked={consentNotif} onChange={setConsentNotif}
                    title="Notifications"
                    description="I agree to receive automated notifications and updates via text message to the phone number provided, standard rates apply."
                  />
                  <ConsentCard
                    checked={consentTerms} onChange={setConsentTerms}
                    title="Terms of Service"
                    description="I verify that all provided information is accurate and agree to Mtech Distributors' Terms of Service."
                  />
                  <ConsentCard
                    checked={consentMarketing} onChange={setConsentMarketing}
                    title="Promotional Alerts (Optional)"
                    description="I consent to receive promotional texts regarding products and services from Mtech."
                  />
                  {errors.consents && (
                    <div className="ob-field-error" style={{ marginTop: 4 }}>{errors.consents}</div>
                  )}
                  <div style={{ marginTop: 12 }}>
                    <button type="submit" className="ob-submit-btn" disabled={submitting}>
                      {submitting ? "Submitting…" : "Submit Application"}
                      {!submitting && <span className="material-symbols-outlined">arrow_forward</span>}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </form>

          {/* Footer */}
          <footer className="ob-footer">
            <div>© 2026 Mtech Distributors LLC. All Rights Reserved.</div>
            <nav>
              <a href="https://www.mtechdistributors.com/pages/privacy-policy" target="_blank" rel="noopener">Privacy</a>
              <a href="https://www.mtechdistributors.com/pages/terms-of-use" target="_blank" rel="noopener">Terms</a>
              <a href="#" onClick={e => { e.preventDefault(); setShowSupport(true) }}>Support</a>
            </nav>
          </footer>
        </section>
      </main>

      {/* ── Success Modal ── */}
      {showSuccess && (
        <div className="ob-modal-overlay">
          <div className="ob-modal-box">
            <div className="ob-success-icon">
              <span className="material-symbols-outlined">check_circle</span>
            </div>
            <h2 className="ob-success-title">Application Submitted</h2>
            <p className="ob-success-desc">Our team will review your application within 24–48 hours.</p>
            <div className="ob-success-ticket">{ticketId}</div>
            <br />
            <button className="ob-success-btn" onClick={() => {
              setShowSuccess(false)
              setForm(EMPTY_FORM)
              setConsentNotif(false); setConsentTerms(false); setConsentMarketing(false)
              setIdFiles([]); setId2Files([]); setStorefrontFiles([])
              setEinFiles([]); setVoidedFiles([]); setFnsFiles([])
            }}>
              Submit Another Application
            </button>
          </div>
        </div>
      )}

      {/* ── Support Modal ── */}
      {showSupport && (
        <div className="ob-modal-overlay" onClick={() => setShowSupport(false)}>
          <div className="ob-modal-box" onClick={e => e.stopPropagation()}>
            <div className="ob-support-icon">
              <span className="material-symbols-outlined">support_agent</span>
            </div>
            <div className="ob-support-title">Mtech Support</div>
            <div className="ob-support-desc">
              For immediate assistance, please reach out to our team during operating hours:<br /><br />
              <strong>Phone:</strong>{" "}
              <a href="tel:18884117583" style={{ color: "var(--text)", textDecoration: "none", fontWeight: 600 }}>(888) 411-7583</a><br />
              <strong>Email:</strong>{" "}
              <a href="mailto:support@mtechdistributors.com" style={{ color: "var(--text)", textDecoration: "none", fontWeight: 600 }}>support@mtechdistributors.com</a><br />
              <strong>Hours:</strong> Mon – Fri, 10:00 AM – 6:00 PM EST
            </div>
            <button className="ob-support-btn" onClick={() => setShowSupport(false)}>OK</button>
          </div>
        </div>
      )}

    </div>
  )
}
