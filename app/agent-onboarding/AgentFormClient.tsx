"use client"

import { useState, useRef, useMemo } from "react"
import "../merchant-onboarding/form.css"

// ── Types ────────────────────────────────────────────────────────────────────

interface AgentFormFields {
  firstName: string
  lastName:  string
  phone:     string
  email:     string
  companyName: string
  referrer:  string
  notes:     string
}

const EMPTY_FORM: AgentFormFields = {
  firstName: "", lastName: "", phone: "", email: "",
  companyName: "", referrer: "", notes: "",
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatPhone(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 10)
  if (d.length <= 3) return d.length ? `(${d}` : ""
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
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

export function AgentFormClient() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [isLight, setIsLight] = useState(false)

  const [form,       setForm]       = useState<AgentFormFields>(EMPTY_FORM)
  const [errors,     setErrors]     = useState<Partial<Record<keyof AgentFormFields | "consents", string>>>({})

  const [consentNotif, setConsentNotif] = useState(false)
  const [consentTerms, setConsentTerms] = useState(false)

  const [idFiles,     setIdFiles]     = useState<File[]>([])
  const [einFiles,    setEinFiles]    = useState<File[]>([])
  const [voidedFiles, setVoidedFiles] = useState<File[]>([])

  const [showSuccess, setShowSuccess] = useState(false)
  const [ticketId,    setTicketId]    = useState("")
  const [showSupport, setShowSupport] = useState(false)
  const [submitting,  setSubmitting]  = useState(false)

  // ── Field updater ────────────────────────────────────────────────────────

  function setF<K extends keyof AgentFormFields>(k: K, v: string) {
    setForm(prev => ({ ...prev, [k]: v }))
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: undefined }))
  }

  // ── Progress ─────────────────────────────────────────────────────────────

  const { progress, step } = useMemo(() => {
    const req = [form.firstName, form.lastName, form.phone, form.email]
    const docs = [idFiles.length > 0 ? "y" : "", voidedFiles.length > 0 ? "y" : ""]
    const consents = [consentNotif ? "y" : "", consentTerms ? "y" : ""]
    const all = [...req, ...docs, ...consents]
    const pct = Math.round(all.filter(Boolean).length / all.length * 100)

    let stepLabel = "STEP 0 OF 4: NOT STARTED"
    if (pct > 0  && pct <= 30) stepLabel = "STEP 1 OF 4: PERSONAL INFO"
    if (pct > 30 && pct <= 60) stepLabel = "STEP 2 OF 4: AGENCY IDENTITY"
    if (pct > 60 && pct <= 85) stepLabel = "STEP 3 OF 4: DOCUMENTS"
    if (pct > 85 && pct < 100) stepLabel = "STEP 4 OF 4: CONSENTS & AGREEMENTS"
    if (pct === 100)            stepLabel = "COMPLETE — READY TO SUBMIT"
    return { progress: pct, step: stepLabel }
  }, [form, idFiles, voidedFiles, consentNotif, consentTerms])

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
    if (!form.firstName.trim()) errs.firstName = "First name is required"
    if (!form.lastName.trim())  errs.lastName  = "Last name is required"
    if (!form.phone.trim())     errs.phone     = "Phone number is required"
    else if (form.phone.replace(/\D/g, "").length !== 10) errs.phone = "Enter a valid 10-digit phone"
    if (!form.email.trim())     errs.email     = "Email address is required"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Enter a valid email address"
    if (!consentNotif || !consentTerms) errs.consents = "Please accept both consents to proceed"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) {
      document.querySelector(".ob-wrapper .ob-field.error")?.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 900))
    const id = `MTECH-AGT-${String(Math.floor(1000 + Math.random() * 9000))}`
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
            <h1 className="ob-headline">AGENT<br />REGIS&shy;TRATION.</h1>
            <p className="ob-subtitle">Complete the registration form to begin your agent onboarding process with Mtech Distributors. Our team will review your application within 24–48 hours.</p>
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
                <div className={`ob-field${errors.firstName ? " error" : ""}`}>
                  <label>First Name <span style={{ color: "var(--primary)" }}>*</span></label>
                  <input
                    type="text" value={form.firstName} placeholder="John" maxLength={100}
                    onChange={e => setF("firstName", e.target.value)}
                    onBlur={e => { if (e.target.value) setF("firstName", toTitleCase(e.target.value)) }}
                  />
                  <ErrMsg field="firstName" />
                </div>
                <div className={`ob-field${errors.lastName ? " error" : ""}`}>
                  <label>Last Name <span style={{ color: "var(--primary)" }}>*</span></label>
                  <input
                    type="text" value={form.lastName} placeholder="Doe" maxLength={100}
                    onChange={e => setF("lastName", e.target.value)}
                    onBlur={e => { if (e.target.value) setF("lastName", toTitleCase(e.target.value)) }}
                  />
                  <ErrMsg field="lastName" />
                </div>
                <div className={`ob-field${errors.phone ? " error" : ""}`}>
                  <label>Phone Number <span style={{ color: "var(--primary)" }}>*</span></label>
                  <input
                    type="tel" value={form.phone} placeholder="(555) 000-0000" maxLength={14}
                    onChange={e => setF("phone", formatPhone(e.target.value))}
                  />
                  <ErrMsg field="phone" />
                </div>
                <div className={`ob-field${errors.email ? " error" : ""}`}>
                  <label>Email Address <span style={{ color: "var(--primary)" }}>*</span></label>
                  <input
                    type="email" value={form.email} placeholder="you@personal.com" maxLength={200}
                    onChange={e => setF("email", e.target.value)}
                  />
                  <ErrMsg field="email" />
                </div>
              </div>
            </div>

            {/* ── 02 AGENCY IDENTITY ── */}
            <div className="ob-section">
              <SectionHeader num="02" title="Agency Identity" />
              <div className="ob-grid">
                <div className="ob-field ob-full">
                  <label>Company Name (If Applicable)</label>
                  <input
                    type="text" value={form.companyName} placeholder="Your Company LLC" maxLength={200}
                    onChange={e => setF("companyName", e.target.value)}
                    onBlur={e => { if (e.target.value) setF("companyName", toTitleCase(e.target.value)) }}
                  />
                </div>
                <div className="ob-field ob-full">
                  <label>Referred By (Optional)</label>
                  <input
                    type="text" value={form.referrer} placeholder="Name of referrer" maxLength={100}
                    onChange={e => setF("referrer", e.target.value)}
                    onBlur={e => { if (e.target.value) setF("referrer", toTitleCase(e.target.value)) }}
                  />
                </div>
                <div className="ob-field ob-full">
                  <label>Additional Notes</label>
                  <textarea
                    value={form.notes} placeholder="Any additional information or referrers…"
                    maxLength={2000} rows={3}
                    onChange={e => setF("notes", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* ── 03 DOCUMENTS ── */}
            <div className="ob-section">
              <SectionHeader num="03" title="Documents" />
              <div className="ob-upload-grid">
                <div className="ob-upload-col">
                  <UploadDrop
                    id="af_id" title="ID / Driver License" subtitle="Required for identity verification" required
                    files={idFiles}
                    onAdd={fs => setIdFiles(p => [...p, ...fs])}
                    onRemove={i => setIdFiles(p => p.filter((_, j) => j !== i))}
                  />
                </div>
                <div className="ob-upload-small">
                  <UploadSmallSlot
                    id="af_ein" title="EIN / Tax ID" subtitle="Required if incorporating"
                    files={einFiles}
                    onAdd={fs => setEinFiles(p => [...p, ...fs])}
                    onRemove={i => setEinFiles(p => p.filter((_, j) => j !== i))}
                  />
                  <UploadSmallSlot
                    id="af_voided" title="Voided Check" subtitle="Account validation for payouts" required
                    files={voidedFiles}
                    onAdd={fs => setVoidedFiles(p => [...p, ...fs])}
                    onRemove={i => setVoidedFiles(p => p.filter((_, j) => j !== i))}
                  />
                </div>
              </div>
            </div>

            {/* ── 04 CONSENTS ── */}
            <div className="ob-section">
              <SectionHeader num="04" title="Consents & Agreements" />
              <div className="ob-legal-stack">
                <ConsentCard
                  checked={consentNotif} onChange={setConsentNotif}
                  title="Notifications"
                  description="I agree to receive automated notifications and updates via text message to the phone number provided."
                />
                <ConsentCard
                  checked={consentTerms} onChange={setConsentTerms}
                  title="Terms of Service"
                  description="I verify that all provided information is accurate and agree to Mtech Distributors' Agent Terms."
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
            <button
              className="ob-success-btn"
              onClick={() => {
                setShowSuccess(false)
                setForm(EMPTY_FORM)
                setConsentNotif(false); setConsentTerms(false)
                setIdFiles([]); setEinFiles([]); setVoidedFiles([])
              }}
            >
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
