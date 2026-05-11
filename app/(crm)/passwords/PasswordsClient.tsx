"use client"

import { useState, useMemo, useEffect, useRef, Fragment } from "react"
import type { Credential } from "./page"

const CAT_COLORS: Record<string, string> = {
  Portal: "#6366f1", POS: "#10b981", Email: "#f59e0b",
  Banking: "#3b82f6", Merchant: "#8b5cf6", API: "#ec4899",
  General: "#64748b", Other: "#64748b",
}

const FOLDERS = [
  { key: "All",      icon: "folder",          label: "All"      },
  { key: "Portal",   icon: "dashboard",       label: "Portal"   },
  { key: "POS",      icon: "point_of_sale",   label: "POS"      },
  { key: "Email",    icon: "mail",            label: "Email"    },
  { key: "Banking",  icon: "account_balance", label: "Banking"  },
  { key: "Merchant", icon: "storefront",      label: "Merchant" },
  { key: "API",      icon: "api",             label: "API"      },
  { key: "Other",    icon: "more_horiz",      label: "Other"    },
]

const REQS = [
  { key: "len", label: "8+ Chars",  check: (pw: string) => pw.length >= 8        },
  { key: "up",  label: "Uppercase", check: (pw: string) => /[A-Z]/.test(pw)      },
  { key: "low", label: "Lowercase", check: (pw: string) => /[a-z]/.test(pw)      },
  { key: "num", label: "Number",    check: (pw: string) => /[0-9]/.test(pw)      },
  { key: "sym", label: "Symbol",    check: (pw: string) => /[^A-Za-z0-9]/.test(pw) },
]

const STRENGTH_BAR = {
  Weak:   { width: "30%",  bg: "#ef4444" },
  Medium: { width: "60%",  bg: "#f59e0b" },
  Strong: { width: "100%", bg: "#10b981" },
}

function calcStrength(pw: string): "Weak" | "Medium" | "Strong" {
  if (!pw) return "Weak"
  let s = 0
  if (pw.length >= 8)          s++
  if (pw.length >= 14)         s++
  if (/[A-Z]/.test(pw))        s++
  if (/[a-z]/.test(pw))        s++
  if (/[0-9]/.test(pw))        s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  return s <= 2 ? "Weak" : s <= 4 ? "Medium" : "Strong"
}

function generatePassword(length: number, upper: boolean, lower: boolean, nums: boolean, syms: boolean): string {
  const pool = [
    upper ? "ABCDEFGHIJKLMNOPQRSTUVWXYZ" : "",
    lower ? "abcdefghijklmnopqrstuvwxyz" : "",
    nums  ? "0123456789" : "",
    syms  ? "!@#$%^&*()_+-=[]{}|;:,.<>?" : "",
  ].join("")
  if (!pool) return ""
  return Array.from({ length }, () => pool[Math.floor(Math.random() * pool.length)]).join("")
}

interface CredForm {
  title: string; category: string; folder: string
  username: string; password: string; showPassword: boolean
  url: string; notes: string
}

const EMPTY_FORM: CredForm = {
  title: "", category: "General", folder: "All",
  username: "", password: "", showPassword: false, url: "", notes: "",
}

interface GenOpts { length: number; upper: boolean; lower: boolean; nums: boolean; syms: boolean }
const DEFAULT_GEN: GenOpts = { length: 20, upper: true, lower: true, nums: true, syms: true }

export function PasswordsClient({ credentials: initial }: { credentials: Credential[] }) {
  const [creds, setCreds]                   = useState(initial)
  const [query, setQuery]                   = useState("")
  const [activeFolder, setActiveFolder]     = useState("All")
  const [unlockExpires, setUnlockExpires]   = useState(0)

  const [addOpen, setAddOpen]               = useState(false)
  const [editId, setEditId]                 = useState<string | null>(null)
  const [form, setForm]                     = useState<CredForm>(EMPTY_FORM)
  const [formError, setFormError]           = useState("")
  const [deleteConfirm, setDeleteConfirm]   = useState(false)

  const [genOpen, setGenOpen]               = useState(false)
  const [genFromForm, setGenFromForm]       = useState(false)
  const [genOpts, setGenOpts]               = useState<GenOpts>(DEFAULT_GEN)
  const [generated, setGenerated]           = useState("")

  const [otpOpen, setOtpOpen]               = useState(false)
  const [otpDigits, setOtpDigits]           = useState(["", "", "", "", "", ""])
  const [otpError, setOtpError]             = useState("")
  const [pendingAction, setPendingAction]   = useState<(() => void) | null>(null)

  const [toastMsg, setToastMsg]             = useState("")
  const [toastVisible, setToastVisible]     = useState(false)
  const toastTimer                          = useRef<ReturnType<typeof setTimeout> | null>(null)
  const otpRefs                             = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null))

  const isUnlocked = Date.now() < unlockExpires

  const filtered = useMemo(() => {
    let r = creds
    if (activeFolder !== "All") r = r.filter(c => c.folder === activeFolder)
    if (query.trim()) {
      const q = query.toLowerCase()
      r = r.filter(c =>
        c.title.toLowerCase().includes(q)    ||
        c.username.toLowerCase().includes(q) ||
        c.url.toLowerCase().includes(q)      ||
        c.category.toLowerCase().includes(q)
      )
    }
    return r
  }, [creds, activeFolder, query])

  const stats = useMemo(() => ({
    total:  creds.length,
    strong: creds.filter(c => c.strength === "Strong").length,
    weak:   creds.filter(c => c.strength === "Weak").length,
  }), [creds])

  const folderCounts = useMemo(() => {
    const m: Record<string, number> = { All: creds.length }
    FOLDERS.slice(1).forEach(f => { m[f.key] = creds.filter(c => c.folder === f.key).length })
    return m
  }, [creds])

  // Auto-relock when session expires
  useEffect(() => {
    if (unlockExpires > Date.now()) {
      const t = setTimeout(() => { setUnlockExpires(0); showToast("Vault locked") }, unlockExpires - Date.now() + 100)
      return () => clearTimeout(t)
    }
  }, [unlockExpires])

  // Regenerate password when options change
  useEffect(() => {
    setGenerated(generatePassword(genOpts.length, genOpts.upper, genOpts.lower, genOpts.nums, genOpts.syms))
  }, [genOpts])

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      if (deleteConfirm) { setDeleteConfirm(false); return }
      if (addOpen)  { setAddOpen(false); setFormError(""); return }
      if (genOpen)  { setGenOpen(false); return }
      if (otpOpen)  { setOtpOpen(false); return }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [addOpen, genOpen, otpOpen, deleteConfirm])

  function showToast(msg: string) {
    setToastMsg(msg); setToastVisible(true)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastVisible(false), 2500)
  }

  function handleAction(action: () => void) {
    if (Date.now() < unlockExpires) { action(); return }
    setPendingAction(() => action)
    setOtpDigits(Array(6).fill(""))
    setOtpError("")
    setOtpOpen(true)
    setTimeout(() => otpRefs.current[0]?.focus(), 100)
  }

  function handleOtpInput(index: number, value: string) {
    const digit = value.replace(/[^0-9]/g, "").slice(-1)
    const next = otpDigits.map((d, i) => i === index ? digit : d)
    setOtpDigits(next)
    if (digit && index < 5) otpRefs.current[index + 1]?.focus()
    if (next.every(d => d)) verifyOtp(next.join(""))
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) otpRefs.current[index - 1]?.focus()
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const text = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 6)
    const next = Array(6).fill("").map((_, i) => text[i] || "")
    setOtpDigits(next)
    if (text.length >= 6) verifyOtp(text.slice(0, 6))
    else otpRefs.current[text.length]?.focus()
  }

  function verifyOtp(code: string) {
    if (code.length < 6) return
    const expires = Date.now() + 15 * 60 * 1000
    setUnlockExpires(expires)
    setOtpOpen(false)
    setOtpError("")
    setOtpDigits(Array(6).fill(""))
    showToast("Vault unlocked — 15 min session ✓")
    if (pendingAction) { pendingAction(); setPendingAction(null) }
  }

  function openAdd() {
    setForm({ ...EMPTY_FORM, folder: activeFolder !== "All" ? activeFolder : "All" })
    setEditId(null); setFormError(""); setDeleteConfirm(false); setAddOpen(true)
  }

  function openEdit(id: string) {
    const c = creds.find(x => x.id === id); if (!c) return
    setForm({ title: c.title, category: c.category, folder: c.folder,
      username: c.username, password: c.password, showPassword: false,
      url: c.url, notes: c.notes })
    setEditId(id); setFormError(""); setDeleteConfirm(false); setAddOpen(true)
  }

  function saveCred() {
    if (!form.title.trim()) { setFormError("Title is required."); return }
    if (!form.password)     { setFormError("Password is required."); return }
    const strength = calcStrength(form.password)
    if (editId) {
      setCreds(cs => cs.map(c => c.id === editId ? {
        ...c, title: form.title.trim(),
        category: form.category as Credential["category"],
        folder: form.folder as Credential["folder"],
        username: form.username.trim(), password: form.password,
        url: form.url.trim(), notes: form.notes.trim(), strength,
      } : c))
      showToast("Credential updated ✓")
    } else {
      setCreds(cs => [{ id: Date.now().toString(), title: form.title.trim(),
        category: form.category as Credential["category"],
        folder: form.folder as Credential["folder"],
        username: form.username.trim(), password: form.password,
        url: form.url.trim(), notes: form.notes.trim(), strength,
        createdAt: new Date().toISOString().split("T")[0],
      }, ...cs])
      showToast("Credential saved ✓")
    }
    setAddOpen(false); setFormError("")
  }

  function deleteCred() {
    setCreds(cs => cs.filter(c => c.id !== editId))
    setAddOpen(false); setDeleteConfirm(false); showToast("Credential deleted")
  }

  async function copyField(c: Credential, field: "username" | "password") {
    try {
      await navigator.clipboard.writeText(field === "username" ? c.username : c.password)
      showToast(`${field === "username" ? "Username" : "Password"} copied!`)
    } catch { showToast("Copy failed") }
  }

  function openGenerator(fromForm = false) {
    setGenFromForm(fromForm)
    setGenerated(generatePassword(genOpts.length, genOpts.upper, genOpts.lower, genOpts.nums, genOpts.syms))
    setGenOpen(true)
  }

  function useGenerated() {
    setForm(f => ({ ...f, password: generated })); setGenOpen(false)
  }

  async function copyGenerated() {
    try { await navigator.clipboard.writeText(generated); showToast("Password copied!") }
    catch { showToast("Copy failed") }
  }

  const fStrength = calcStrength(form.password)
  const sBar = STRENGTH_BAR[fStrength]

  const iStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", background: "var(--bg)",
    border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)",
    fontSize: 13, fontWeight: 500, fontFamily: "inherit", outline: "none",
    transition: ".2s", boxSizing: "border-box",
  }
  const btnGhost: React.CSSProperties = {
    padding: "10px 20px", background: "var(--bg3)", border: "1px solid var(--border)",
    borderRadius: 10, fontSize: 13, fontWeight: 700, color: "var(--text2)",
    cursor: "pointer", fontFamily: "inherit",
  }
  const btnPrimary: React.CSSProperties = {
    padding: "10px 20px", background: "var(--accent-crm)", color: "#fff",
    border: "none", borderRadius: 10, fontSize: 13, fontWeight: 800,
    cursor: "pointer", fontFamily: "inherit",
  }

  return (
    <div className="dash-layout" style={{ fontFamily: "'Mulish', sans-serif" }}>

      {/* ── Toast ── */}
      {toastVisible && <div className="pm-toast">{toastMsg}</div>}

      {/* ── OTP / Unlock Modal ── */}
      {otpOpen && (
        <div className="crm-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setOtpOpen(false) }}>
          <div className="crm-modal" style={{ width: "100%", maxWidth: 400, padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "22px 28px", display: "flex", alignItems: "center", gap: 14, borderBottom: "1px solid var(--border)" }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(16,185,129,.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ color: "#10b981", fontSize: 22 }}>passkey</span>
              </div>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 800, color: "var(--text)", margin: 0, fontFamily: "'Mulish', sans-serif" }}>Unlock Vault</h2>
                <p style={{ fontSize: 12, color: "var(--text3)", margin: "2px 0 0", fontWeight: 500 }}>Enter your 6-digit verification code</p>
              </div>
              <button onClick={() => setOtpOpen(false)} style={{ marginLeft: "auto", background: "var(--bg3)", border: "none", width: 32, height: 32, borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--text3)" }}>close</span>
              </button>
            </div>
            <div style={{ padding: "28px", background: "var(--bg)", textAlign: "center" }}>
              <p style={{ fontSize: 13, color: "var(--text3)", margin: "0 0 6px", lineHeight: 1.5 }}>Enter any 6-digit code to unlock the vault.</p>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--accent-crm)", margin: "0 0 24px", background: "var(--accent-crm-light)", padding: "4px 14px", borderRadius: 8, display: "inline-block" }}>
                Demo mode — any 6 digits unlocks for 15 minutes
              </p>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 16 }}>
                {otpDigits.map((d, i) => (
                  <input
                    key={i}
                    ref={el => { otpRefs.current[i] = el }}
                    type="text"
                    className="pm-otp-input"
                    value={d}
                    maxLength={1}
                    inputMode="numeric"
                    onChange={e => handleOtpInput(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    onPaste={handleOtpPaste}
                  />
                ))}
              </div>
              {otpError && (
                <div style={{ padding: "10px 12px", background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.2)", borderRadius: 10, color: "#ef4444", fontSize: 13, fontWeight: 700, marginBottom: 16 }}>
                  {otpError}
                </div>
              )}
              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={() => setOtpOpen(false)} style={{ ...btnGhost, flex: 1, justifyContent: "center", padding: "12px 0" }}>Cancel</button>
                <button
                  onClick={() => otpDigits.every(d => d) && verifyOtp(otpDigits.join(""))}
                  style={{ ...btnPrimary, flex: 1, padding: "12px 0", fontSize: 14 }}
                >
                  Unlock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Add / Edit Credential Modal ── */}
      {addOpen && (
        <div className="crm-modal-overlay" onClick={e => { if (e.target === e.currentTarget) { setAddOpen(false); setFormError("") } }}>
          <div className="crm-modal" style={{ width: "100%", maxWidth: 540, padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "22px 28px", display: "flex", alignItems: "center", gap: 14, borderBottom: "1px solid var(--border)" }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(99,102,241,.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ color: "var(--accent-crm)", fontSize: 22 }}>passkey</span>
              </div>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 800, color: "var(--text)", margin: 0, fontFamily: "'Mulish', sans-serif" }}>{editId ? "Edit Credential" : "New Credential"}</h2>
                <p style={{ fontSize: 12, color: "var(--text3)", margin: "2px 0 0", fontWeight: 500 }}>Add or edit password vault entry</p>
              </div>
              <button onClick={() => { setAddOpen(false); setFormError("") }} style={{ marginLeft: "auto", background: "var(--bg3)", border: "none", width: 32, height: 32, borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--text3)" }}>close</span>
              </button>
            </div>

            <div style={{ padding: "24px 28px 8px", maxHeight: "65vh", overflowY: "auto" }}>
              <div className="crm-field">
                <label>Title *</label>
                <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Company Portal Login" style={iStyle} />
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <div className="crm-field" style={{ flex: 1 }}>
                  <label>Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={iStyle}>
                    {["General","Portal","POS","Email","Banking","Merchant","API","Other"].map(o => (
                      <option key={o} value={o}>{o === "POS" ? "POS Systems" : o === "API" ? "API Keys" : o}</option>
                    ))}
                  </select>
                </div>
                <div className="crm-field" style={{ flex: 1 }}>
                  <label>Folder</label>
                  <select value={form.folder} onChange={e => setForm(f => ({ ...f, folder: e.target.value }))} style={iStyle}>
                    {["All","Portal","POS","Email","Banking","Merchant","API","Other"].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div className="crm-field">
                <label>Username / Email</label>
                <input type="text" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="admin@company.com" style={iStyle} />
              </div>
              <div className="crm-field">
                <label>Password</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type={form.showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Enter password"
                    style={{ ...iStyle, flex: 1 }}
                  />
                  <button onClick={() => setForm(f => ({ ...f, showPassword: !f.showPassword }))} title="Toggle visibility"
                    style={{ padding: "0 12px", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 10, cursor: "pointer", color: "var(--text3)", display: "flex", alignItems: "center" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{form.showPassword ? "visibility_off" : "visibility"}</span>
                  </button>
                  <button onClick={() => openGenerator(true)} title="Generate password"
                    style={{ padding: "0 12px", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 10, cursor: "pointer", color: "var(--text3)", display: "flex", alignItems: "center" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>password</span>
                  </button>
                </div>
                <div className="pm-strength-bar" style={{ marginTop: 8 }}>
                  <div className="bar-fill" style={{ width: sBar.width, background: sBar.bg }} />
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                  {REQS.map(r => {
                    const met = r.check(form.password)
                    return (
                      <div key={r.key} className={`pm-req-item${met ? " met" : ""}`}>
                        <span className="material-symbols-outlined">{met ? "check" : "close"}</span>{r.label}
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="crm-field">
                <label>URL</label>
                <input type="text" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://portal.example.com" style={iStyle} />
              </div>
              <div className="crm-field">
                <label>Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes..." rows={2}
                  style={{ ...iStyle, resize: "vertical", minHeight: 60 } as React.CSSProperties} />
              </div>
              {formError && (
                <div style={{ padding: "8px 12px", background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.2)", borderRadius: 8, color: "#ef4444", fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
                  {formError}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 10, padding: "16px 28px 24px", borderTop: "1px solid var(--border)", justifyContent: "flex-end", background: "var(--bg)", alignItems: "center", flexWrap: "wrap" }}>
              <button onClick={() => { setAddOpen(false); setFormError("") }} style={btnGhost}>Cancel</button>
              {editId && !deleteConfirm && (
                <button onClick={() => setDeleteConfirm(true)}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.2)", borderRadius: 10, fontSize: 13, fontWeight: 700, color: "#ef4444", cursor: "pointer", fontFamily: "inherit" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>Delete
                </button>
              )}
              {deleteConfirm && (
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#ef4444" }}>Confirm delete?</span>
                  <button onClick={deleteCred} style={{ padding: "8px 14px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Yes, Delete</button>
                  <button onClick={() => setDeleteConfirm(false)} style={{ padding: "8px 14px", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, fontWeight: 700, color: "var(--text2)", cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                </div>
              )}
              <button onClick={saveCred} style={{ ...btnPrimary, display: "flex", alignItems: "center", gap: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>save</span>Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Password Generator Modal ── */}
      {genOpen && (
        <div className="crm-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setGenOpen(false) }}>
          <div className="crm-modal" style={{ width: "100%", maxWidth: 420, padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "22px 28px", display: "flex", alignItems: "center", gap: 14, borderBottom: "1px solid var(--border)" }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(245,158,11,.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ color: "#f59e0b", fontSize: 22 }}>password</span>
              </div>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 800, color: "var(--text)", margin: 0, fontFamily: "'Mulish', sans-serif" }}>Password Generator</h2>
                <p style={{ fontSize: 12, color: "var(--text3)", margin: "2px 0 0", fontWeight: 500 }}>Create a secure random password</p>
              </div>
              <button onClick={() => setGenOpen(false)} style={{ marginLeft: "auto", background: "var(--bg3)", border: "none", width: 32, height: 32, borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--text3)" }}>close</span>
              </button>
            </div>
            <div style={{ padding: "24px 28px" }}>
              <div className="pm-gen-preview">{generated || "—"}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13, color: "var(--text2)", fontWeight: 600 }}>
                  <span>Length:</span>
                  <input type="range" min={8} max={64} value={genOpts.length}
                    onChange={e => setGenOpts(o => ({ ...o, length: Number(e.target.value) }))}
                    style={{ flex: 1, accentColor: "var(--accent-crm)" }} />
                  <span style={{ minWidth: 24, textAlign: "right", fontWeight: 800, color: "var(--accent-crm)" }}>{genOpts.length}</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                  {([ ["upper","A-Z"], ["lower","a-z"], ["nums","0-9"], ["syms","!@#$"] ] as [keyof GenOpts, string][]).map(([key, label]) => (
                    <label key={key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text2)", fontWeight: 600, cursor: "pointer" }}>
                      <input type="checkbox" checked={genOpts[key] as boolean}
                        onChange={e => setGenOpts(o => ({ ...o, [key]: e.target.checked }))}
                        style={{ accentColor: "var(--accent-crm)", width: 16, height: 16 }} />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, padding: "16px 28px 24px", borderTop: "1px solid var(--border)", justifyContent: "flex-end", background: "var(--bg)" }}>
              <button
                onClick={() => setGenerated(generatePassword(genOpts.length, genOpts.upper, genOpts.lower, genOpts.nums, genOpts.syms))}
                style={{ ...btnGhost, display: "flex", alignItems: "center", gap: 6 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>refresh</span>Regenerate
              </button>
              {genFromForm ? (
                <button onClick={useGenerated} style={{ ...btnPrimary, display: "flex", alignItems: "center", gap: 6 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span>Use This
                </button>
              ) : (
                <button onClick={copyGenerated} style={{ ...btnPrimary, display: "flex", alignItems: "center", gap: 6 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>content_copy</span>Copy
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="pm-header">
        <span className="material-symbols-outlined" style={{ fontSize: 30, color: "var(--accent-crm)" }}>passkey</span>
        <h1 style={{ fontFamily: "'Mulish', sans-serif", fontSize: 26, fontWeight: 900, color: "var(--text)", margin: 0, letterSpacing: "-.5px" }}>Password Vault</h1>
        <div className="pm-search">
          <span className="material-symbols-outlined">search</span>
          <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search vault..." />
        </div>
        <button className="pm-btn pm-btn-secondary" onClick={() => openGenerator(false)} style={{ marginRight: 4 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>password</span> Generator
        </button>
        {isUnlocked ? (
          <button className="pm-btn pm-btn-primary" onClick={openAdd}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span> New Credential
          </button>
        ) : (
          <button className="pm-btn pm-btn-primary" onClick={() => handleAction(() => {})}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>lock_open</span> Unlock Vault
          </button>
        )}
      </div>

      {/* ── Stats ── */}
      <div className="pm-stats">
        {[
          { icon: "key",           bg: "rgba(99,102,241,.1)",  color: "var(--accent-crm)", val: stats.total,  lbl: "Total"    },
          { icon: "verified_user", bg: "rgba(16,185,129,.1)",  color: "#10b981",       val: stats.strong, lbl: "Strong"   },
          { icon: "warning",       bg: "rgba(245,158,11,.1)",  color: "#f59e0b",       val: stats.weak,   lbl: "Weak"     },
          { icon: isUnlocked ? "lock_open" : "lock", bg: "rgba(139,92,246,.1)", color: "#8b5cf6",
            val: isUnlocked ? "15m" : "—", lbl: isUnlocked ? "Unlocked" : "Locked" },
        ].map(s => (
          <div key={s.lbl} className="pm-stat">
            <div style={{ width: 40, height: 40, borderRadius: 12, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span className="material-symbols-outlined" style={{ color: s.color }}>{s.icon}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", fontFamily: "'Mulish', sans-serif" }}>{s.val}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".5px" }}>{s.lbl}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter Tabs ── */}
      <div className="pm-filter-bar">
        {FOLDERS.map((f, i) => (
          <Fragment key={f.key}>
            {i === 1 && <div style={{ width: 1, height: 20, background: "var(--border)", margin: "0 4px", flexShrink: 0 }} />}
            <button
              className={`pm-filter-tab${activeFolder === f.key ? " active" : ""}`}
              onClick={() => setActiveFolder(f.key)}
            >
              <span className="material-symbols-outlined">{f.icon}</span>
              {f.label}
              <span className="pm-count">{folderCounts[f.key] ?? 0}</span>
            </button>
          </Fragment>
        ))}
      </div>

      {/* ── Lock notice ── */}
      {!isUnlocked && (
        <div style={{ padding: "12px 18px", background: "rgba(239,68,68,.06)", border: "1px solid rgba(239,68,68,.14)", borderRadius: 12, marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
          <span className="material-symbols-outlined" style={{ color: "#ef4444", fontSize: 20 }}>lock</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text2)", flex: 1 }}>Vault is locked. Unlock to copy or edit credentials.</span>
          <button onClick={() => handleAction(() => {})}
            style={{ padding: "7px 16px", background: "var(--accent-crm)", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            Unlock Now
          </button>
        </div>
      )}

      {/* ── Grid ── */}
      {filtered.length === 0 ? (
        <div className="pm-empty">
          <span className="material-symbols-outlined">lock</span>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", margin: "0 0 8px" }}>No credentials found</h3>
          <p style={{ fontSize: 13, color: "var(--text3)", maxWidth: 360, lineHeight: 1.5, margin: 0 }}>
            {creds.length === 0 ? "Add your first credential to start building your encrypted vault." : "Try a different search term or category filter."}
          </p>
        </div>
      ) : (
        <div className="pm-grid">
          {filtered.map(c => (
            <div key={c.id} className="pm-card" onClick={() => handleAction(() => openEdit(c.id))}>
              <div className="pm-card-head">
                <div className="pm-card-icon" style={{ background: CAT_COLORS[c.category] || "#6366f1" }}>
                  {(c.title || "?")[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="pm-card-title">{c.title}</div>
                  <div className="pm-card-cat">{c.category}</div>
                </div>
                <div className="pm-card-actions">
                  <button onClick={e => { e.stopPropagation(); handleAction(() => copyField(c, "username")) }} title="Copy username">
                    <span className="material-symbols-outlined">person</span>
                  </button>
                  <button onClick={e => { e.stopPropagation(); handleAction(() => copyField(c, "password")) }} title="Copy password">
                    <span className="material-symbols-outlined">key</span>
                  </button>
                  <button onClick={e => { e.stopPropagation(); handleAction(() => openEdit(c.id)) }} title="Edit">
                    <span className="material-symbols-outlined">edit</span>
                  </button>
                </div>
              </div>

              <div className="pm-card-details" style={!isUnlocked ? { filter: "blur(4px)", userSelect: "none", pointerEvents: "none" } : {}}>
                <div className="pm-card-field">
                  <span className="field-lbl">User</span>
                  <span className="field-val">{c.username || "—"}</span>
                </div>
                <div className="pm-card-field">
                  <span className="field-lbl">Password</span>
                  <span className="field-val masked">••••••••••</span>
                </div>
                {c.url && (
                  <div className="pm-card-field">
                    <span className="field-lbl">URL</span>
                    <span className="field-val">{c.url}</span>
                  </div>
                )}
              </div>

              <div className="pm-card-footer">
                <span className={`pm-strength strength-${c.strength.toLowerCase()}`}>{c.strength}</span>
                {c.notes && (
                  <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--text3)" }} title={c.notes}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>notes</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
