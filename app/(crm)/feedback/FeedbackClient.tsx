"use client"

import { useState, useRef, useEffect, useCallback } from "react"

// ── Types ──────────────────────────────────────────────────────────────────

type FbCat      = "Bug Report" | "Feature Request" | "Process" | "General"
type FbPriority = "Low" | "Medium" | "High"
type FbStatus   = "Received" | "Pending Internal" | "In Progress" | "Completed"

interface FbItem {
  id:             string
  subject:        string
  desc:           string
  cat:            FbCat
  priority:       FbPriority
  status:         FbStatus
  date:           string
  authorName:     string
  authorInitials: string
  attachments:    { name: string }[]
}

interface PendingFile { id: string; name: string }

// ── Mock data ──────────────────────────────────────────────────────────────

const MOCK_USER = { name: "Alex Johnson", initials: "AJ" }

const INITIAL_ITEMS: FbItem[] = [
  {
    id: "1", cat: "Bug Report", priority: "High", status: "In Progress",
    date: "2026-05-09T14:23:00Z", authorName: "Alex Johnson", authorInitials: "AJ", attachments: [],
    subject: "Activity feed doesn't refresh automatically",
    desc: "The activity feed on the dashboard doesn't update in real-time. I have to manually refresh the page to see new events. This is particularly frustrating during busy onboarding periods when I need to track multiple merchants at once.\n\nSteps to reproduce:\n1. Open the dashboard\n2. Have another user perform an action\n3. The feed doesn't update until manual refresh",
  },
  {
    id: "2", cat: "Feature Request", priority: "Medium", status: "Received",
    date: "2026-05-08T09:15:00Z", authorName: "Sarah Mitchell", authorInitials: "SM", attachments: [],
    subject: "Export tickets to CSV or PDF format",
    desc: "It would be incredibly useful to export the tickets list to CSV or PDF. We regularly need to share ticket summaries with management and clients, and currently we have to manually copy data into spreadsheets.",
  },
  {
    id: "3", cat: "Bug Report", priority: "High", status: "Completed",
    date: "2026-05-06T16:40:00Z", authorName: "Alex Johnson", authorInitials: "AJ", attachments: [],
    subject: "Merchant search returns wrong results with special characters",
    desc: "When searching for merchants with apostrophes or hyphens in their name (e.g. \"O'Brien's Deli\" or \"Pho-Express\"), the search returns no results or incorrect results. The same merchant appears correctly in the full list.",
  },
  {
    id: "4", cat: "Process", priority: "Medium", status: "Pending Internal",
    date: "2026-05-05T11:30:00Z", authorName: "Mike Rivera", authorInitials: "MR", attachments: [],
    subject: "Simplify the merchant onboarding checklist",
    desc: "The current onboarding checklist has 14 steps for basic merchants, but many are redundant or could be combined. I'd suggest grouping them into phases: Setup, Verification, and Go-Live. This would reduce confusion and speed up the process.",
  },
  {
    id: "5", cat: "General", priority: "Low", status: "Received",
    date: "2026-05-04T08:55:00Z", authorName: "Lisa Kowalski", authorInitials: "LK", attachments: [],
    subject: "Dashboard performance is sluggish on older hardware",
    desc: "On machines with less than 8GB RAM or older CPUs, the dashboard takes 6–8 seconds to fully load. The charts and live feed seem to be loading synchronously. Lazy loading would help significantly.",
  },
  {
    id: "6", cat: "Feature Request", priority: "Low", status: "In Progress",
    date: "2026-05-02T13:10:00Z", authorName: "Alex Johnson", authorInitials: "AJ", attachments: [{ name: "portal-screenshot.png" }],
    subject: "Add dark mode toggle to the partner portal",
    desc: "The CRM has a great dark mode but the partner portal doesn't support it. Many of our partners use the portal in the evening and find the bright white interface straining. A simple dark mode toggle would go a long way.",
  },
  {
    id: "7", cat: "Bug Report", priority: "High", status: "Completed",
    date: "2026-04-30T10:25:00Z", authorName: "Tom Brennan", authorInitials: "TB", attachments: [],
    subject: "Password reset emails are not being delivered",
    desc: "Several users have reported that password reset emails aren't arriving, even after multiple attempts. The issue seems intermittent — some users receive them within seconds, others never get them. Checked spam folders, nothing there.",
  },
  {
    id: "8", cat: "Process", priority: "Medium", status: "Received",
    date: "2026-04-28T15:00:00Z", authorName: "Sarah Mitchell", authorInitials: "SM", attachments: [],
    subject: "Allow bulk ticket assignment to multiple agents",
    desc: "It would save a lot of time if we could select multiple tickets and assign them all to an agent in one action. Right now we have to open each ticket individually to reassign it, which is very time-consuming during shift changes.",
  },
  {
    id: "9", cat: "Feature Request", priority: "Medium", status: "Pending Internal",
    date: "2026-04-25T09:00:00Z", authorName: "Mike Rivera", authorInitials: "MR", attachments: [],
    subject: "Google Calendar integration for scheduling",
    desc: "It would be very useful to sync the CRM calendar with Google Calendar. Right now I have to maintain two separate calendars which leads to missed appointments. A two-way sync or at least an export option would be great.",
  },
  {
    id: "10", cat: "General", priority: "Low", status: "Received",
    date: "2026-04-22T14:30:00Z", authorName: "Lisa Kowalski", authorInitials: "LK", attachments: [],
    subject: "Love the new timecard feature!",
    desc: "Just wanted to say the new timecard page is really well designed. The slider clock-in feels intuitive and the weekly strip gives a great visual overview. Looking forward to seeing the PTO and Sick hours filled in!",
  },
]

// ── Config ─────────────────────────────────────────────────────────────────

const CAT_META: Record<FbCat, { icon: string; label: string; sub: string; color: string; bg: string }> = {
  "Bug Report":      { icon: "bug_report",    label: "Bug",     sub: "System error or glitch",  color: "#ef4444", bg: "rgba(239,68,68,.1)"  },
  "Feature Request": { icon: "auto_awesome",  label: "Feature", sub: "Ask for something new",   color: "#6366f1", bg: "rgba(99,102,241,.1)" },
  "Process":         { icon: "model_training",label: "Process", sub: "Workflow improvement",    color: "#f59e0b", bg: "rgba(245,158,11,.1)" },
  "General":         { icon: "forum",         label: "General", sub: "Comments or questions",   color: "#3b82f6", bg: "rgba(59,130,246,.1)" },
}

const STATUS_STYLE: Record<FbStatus, { color: string; bg: string; border: string }> = {
  "Received":         { color: "#f59e0b", bg: "rgba(245,158,11,.06)",  border: "rgba(245,158,11,.3)"  },
  "Pending Internal": { color: "#8b5cf6", bg: "rgba(139,92,246,.06)",  border: "rgba(139,92,246,.3)"  },
  "In Progress":      { color: "#3b82f6", bg: "rgba(59,130,246,.06)",  border: "rgba(59,130,246,.3)"  },
  "Completed":        { color: "#10b981", bg: "rgba(16,185,129,.06)",   border: "rgba(16,185,129,.3)"  },
}

const CATS: FbCat[]       = ["Bug Report", "Feature Request", "Process", "General"]
const STATUSES: FbStatus[] = ["Received", "Pending Internal", "In Progress", "Completed"]

// ── Component ──────────────────────────────────────────────────────────────

export function FeedbackClient() {
  const [items,       setItems]       = useState<FbItem[]>(INITIAL_ITEMS)
  const [submitOpen,  setSubmitOpen]  = useState(false)
  const [viewItem,    setViewItem]    = useState<FbItem | null>(null)
  const [deleteId,    setDeleteId]    = useState<string | null>(null)
  const [adminItem,   setAdminItem]   = useState<{ id: string; status: FbStatus } | null>(null)
  const [adminStatus, setAdminStatus] = useState<FbStatus>("Received")
  const [isAdmin,     setIsAdmin]     = useState(false)

  // Form state
  const [editingId,   setEditingId]   = useState<string | null>(null)
  const [formCat,     setFormCat]     = useState<FbCat>("Bug Report")
  const [formSubject, setFormSubject] = useState("")
  const [formDesc,    setFormDesc]    = useState("")
  const [formPriority,setFormPriority]= useState<FbPriority>("Medium")
  const [formFiles,   setFormFiles]   = useState<PendingFile[]>([])
  const [subjErr,     setSubjErr]     = useState(false)
  const [dragOver,    setDragOver]    = useState(false)

  // Toast
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const fileRef    = useRef<HTMLInputElement>(null)
  const dragCount  = useRef(0)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ESC key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return
      if (submitOpen) { closeForm(); return }
      if (viewItem)   { setViewItem(null);  return }
      if (adminItem)  { setAdminItem(null); return }
      if (deleteId)   { setDeleteId(null);  return }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [submitOpen, viewItem, adminItem, deleteId])

  const showToast = useCallback((msg: string, ok = true) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ msg, ok })
    toastTimer.current = setTimeout(() => setToast(null), 3200)
  }, [])

  // ── Form helpers ─────────────────────────────────────────────────────────

  function openForm(forEdit?: FbItem) {
    if (forEdit) {
      setEditingId(forEdit.id)
      setFormCat(forEdit.cat)
      setFormSubject(forEdit.subject)
      setFormDesc(forEdit.desc)
      setFormPriority(forEdit.priority)
      setFormFiles([])
    } else {
      setEditingId(null)
      setFormCat("Bug Report")
      setFormSubject("")
      setFormDesc("")
      setFormPriority("Medium")
      setFormFiles([])
    }
    setSubjErr(false)
    setSubmitOpen(true)
  }

  function closeForm() {
    setSubmitOpen(false)
    setEditingId(null)
    setFormSubject("")
    setFormDesc("")
    setFormCat("Bug Report")
    setFormPriority("Medium")
    setFormFiles([])
    setSubjErr(false)
  }

  function handleSubmit() {
    if (!formSubject.trim()) { setSubjErr(true); return }
    setSubjErr(false)
    if (editingId) {
      setItems(prev => prev.map(i =>
        i.id === editingId
          ? { ...i, subject: formSubject.trim(), desc: formDesc.trim(), cat: formCat, priority: formPriority }
          : i
      ))
      showToast("Feedback updated successfully!")
    } else {
      setItems(prev => [{
        id:             Date.now().toString(),
        subject:        formSubject.trim(),
        desc:           formDesc.trim(),
        cat:            formCat,
        priority:       formPriority,
        status:         "Received",
        date:           new Date().toISOString(),
        authorName:     MOCK_USER.name,
        authorInitials: MOCK_USER.initials,
        attachments:    formFiles.map(f => ({ name: f.name })),
      }, ...prev])
      showToast("Feedback submitted successfully!")
    }
    closeForm()
  }

  function handleDelete() {
    if (!deleteId) return
    setItems(prev => prev.filter(i => i.id !== deleteId))
    setDeleteId(null)
    showToast("Feedback deleted")
  }

  function handleAdminStatus() {
    if (!adminItem) return
    setItems(prev => prev.map(i => i.id === adminItem.id ? { ...i, status: adminStatus } : i))
    showToast(`Status updated to ${adminStatus}`)
    setAdminItem(null)
  }

  function handleFiles(files: FileList | null) {
    if (!files) return
    const added = Array.from(files)
      .filter(f => f.type.startsWith("image/"))
      .map(f => ({ id: Math.random().toString(36).slice(2), name: f.name }))
    setFormFiles(prev => [...prev, ...added])
  }

  // ── Shared styles ─────────────────────────────────────────────────────────

  const overlay: React.CSSProperties = {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999,
    display: "flex", alignItems: "center", justifyContent: "center",
    backdropFilter: "blur(3px)", padding: 16,
  }
  function modal(maxW = 600): React.CSSProperties {
    return {
      background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 24,
      padding: 32, boxShadow: "0 20px 60px rgba(0,0,0,.15)",
      width: "100%", maxWidth: maxW, maxHeight: "90vh", overflowY: "auto",
      animation: "fbModalIn 0.25s cubic-bezier(0.175,0.885,0.32,1.275)",
    }
  }
  const labelSt: React.CSSProperties = {
    display: "block", fontSize: 12, fontWeight: 800, color: "var(--text2)",
    textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10,
  }
  const btnPrimary: React.CSSProperties = {
    background: "#6366f1", color: "#fff", border: "none", borderRadius: 12, padding: "13px 28px",
    fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit",
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, flex: 1,
    transition: "background 0.2s",
  }
  const btnSecondary: React.CSSProperties = {
    background: "var(--bg2)", color: "var(--text2)", border: "1px solid var(--border)",
    borderRadius: 12, padding: "13px 28px", fontSize: 15, fontWeight: 800,
    cursor: "pointer", fontFamily: "inherit", transition: "background 0.2s",
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ fontFamily: "'Mulish', sans-serif", padding: 24 }}>

      {/* Toast */}
      {toast && (
        <div className="fb-toast" style={{ background: toast.ok ? "#10b981" : "#ef4444" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            {toast.ok ? "check_circle" : "error"}
          </span>
          {toast.msg}
        </div>
      )}

      {/* ── Page header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28, borderBottom: "1px solid var(--border)", paddingBottom: 18, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: "var(--text)", letterSpacing: -0.5, margin: 0, display: "flex", alignItems: "center", gap: 12 }}>
            <span className="material-symbols-outlined" style={{ color: "#6366f1", fontSize: 36 }}>forum</span>
            Community Feedback
          </h1>
          <p style={{ fontSize: 15, color: "var(--text3)", marginTop: 8, fontWeight: 500, maxWidth: 600, lineHeight: 1.5, margin: "8px 0 0" }}>
            Report system bugs, request new features, or suggest process improvements. Your input helps us build a better portal.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            onClick={() => setIsAdmin(v => !v)}
            title="Toggle admin mode (demo)"
            style={{ fontSize: 12, fontWeight: 700, color: isAdmin ? "#6366f1" : "var(--text3)", background: isAdmin ? "rgba(99,102,241,.1)" : "var(--bg3)", border: `1px solid ${isAdmin ? "rgba(99,102,241,.3)" : "var(--border)"}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontFamily: "inherit" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: "middle", marginRight: 4 }}>admin_panel_settings</span>
            {isAdmin ? "Admin On" : "Admin Off"}
          </button>
          <button
            onClick={() => openForm()}
            style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 12, padding: "12px 22px", fontSize: 14, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 15px rgba(99,102,241,.25)", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>add</span>
            Submit Feedback
          </button>
        </div>
      </div>

      {/* ── Feedback grid ── */}
      {items.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text3)", fontSize: 15, fontWeight: 600, border: "2px dashed var(--border)", borderRadius: 24 }}>
          No community feedback submitted yet.
        </div>
      ) : (
        <div className="fb-grid">
          {items.map(item => {
            const badge  = CAT_META[item.cat]
            const ss     = STATUS_STYLE[item.status]
            const isOwner = item.authorName === MOCK_USER.name

            return (
              <div key={item.id} className="fb-card" onClick={() => setViewItem(item)}>

                {/* Head: badge + status + actions */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 8, background: badge.bg, color: badge.color, fontSize: 11, fontWeight: 800 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{badge.icon}</span>
                    {badge.label}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }} onClick={e => e.stopPropagation()}>
                    {isOwner && (
                      <div style={{ display: "flex", gap: 5 }}>
                        <button className="fb-act-btn" onClick={() => openForm(item)} title="Edit">
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>edit</span>
                          Edit
                        </button>
                        <button className="fb-act-btn del" onClick={() => setDeleteId(item.id)} title="Delete">
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>delete</span>
                        </button>
                      </div>
                    )}
                    <div
                      style={{
                        padding: isAdmin ? "4px 22px 4px 10px" : "4px 10px",
                        borderRadius: 10, border: `1px solid ${ss.border}`,
                        color: ss.color, background: ss.bg,
                        fontSize: 11, fontWeight: 800,
                        cursor: isAdmin ? "pointer" : "default",
                        position: "relative",
                        transition: "box-shadow 0.2s",
                      }}
                      onClick={isAdmin ? () => { setAdminItem({ id: item.id, status: item.status }); setAdminStatus(item.status) } : undefined}
                      title={isAdmin ? "Change status" : undefined}
                    >
                      {item.status}
                      {isAdmin && (
                        <span className="material-symbols-outlined" style={{ fontSize: 13, position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", opacity: 0.7 }}>expand_more</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Title */}
                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", lineHeight: 1.4, marginBottom: 8 }}>{item.subject}</div>

                {/* Desc (clamped) */}
                <div className="fb-clamp" style={{ fontSize: 13, color: "var(--text3)", fontWeight: 500, lineHeight: 1.5, marginBottom: 16 }}>{item.desc}</div>

                {/* Attachment count */}
                {item.attachments.length > 0 && (
                  <div style={{ marginBottom: 14, fontSize: 12, fontWeight: 700, color: "var(--text3)", display: "flex", alignItems: "center", gap: 4 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>attach_file</span>
                    {item.attachments.length} attachment{item.attachments.length !== 1 ? "s" : ""}
                  </div>
                )}

                {/* Footer */}
                <div style={{ marginTop: "auto", paddingTop: 14, borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#fff" }}>
                      {item.authorInitials}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>{item.authorName}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 700, color: "var(--text3)" }}>
                    <span>{item.priority} Priority</span>
                    <span>·</span>
                    <span>{new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ══════════ Submit / Edit Modal ══════════ */}
      {submitOpen && (
        <div style={overlay} onClick={e => { if (e.target === e.currentTarget) closeForm() }}>
          <div style={modal()}>
            <h2 style={{ margin: "0 0 24px", fontSize: 20, fontWeight: 900, color: "var(--text)", display: "flex", alignItems: "center", gap: 8 }}>
              <span className="material-symbols-outlined" style={{ color: "#6366f1" }}>edit_note</span>
              {editingId ? "Update Feedback" : "New Feedback"}
            </h2>

            {/* Category picker */}
            <span style={labelSt}>Feedback Category</span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
              {CATS.map(cat => {
                const m = CAT_META[cat]
                return (
                  <div key={cat} className={`fb-cat-pick${formCat === cat ? " selected" : ""}`} onClick={() => setFormCat(cat)}>
                    <span className={`material-symbols-outlined fb-cat-icon`} style={{ fontSize: 20, color: formCat === cat ? "#6366f1" : "var(--text3)", transition: "color 0.2s" }}>{m.icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", marginBottom: 2 }}>{m.label === "Bug" ? "Report a Bug" : m.label === "Feature" ? "Feature Request" : m.label === "Process" ? "Process Idea" : "General"}</div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text3)" }}>{m.sub}</div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Subject */}
            <span style={labelSt}>Subject</span>
            <input
              type="text"
              value={formSubject}
              onChange={e => { setFormSubject(e.target.value); if (e.target.value.trim()) setSubjErr(false) }}
              placeholder="e.g. Activity feed doesn't load on mobile"
              className={`fb-input${subjErr ? " error" : ""}`}
              style={{ marginBottom: 20 }}
            />

            {/* Description */}
            <span style={labelSt}>Description</span>
            <textarea
              value={formDesc}
              onChange={e => setFormDesc(e.target.value)}
              placeholder="Please provide specific details, steps to reproduce, or any relevant context..."
              className="fb-input"
              style={{ marginBottom: 20, minHeight: 100 }}
            />

            {/* Attachments */}
            <span style={labelSt}>Attachments</span>
            <div
              className={`fb-dropzone${dragOver ? " drag-over" : ""}`}
              style={{ marginBottom: 12 }}
              onClick={() => fileRef.current?.click()}
              onDragEnter={e => { e.preventDefault(); dragCount.current++; if (dragCount.current === 1) setDragOver(true) }}
              onDragLeave={e => { e.preventDefault(); dragCount.current--; if (dragCount.current === 0) setDragOver(false) }}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); dragCount.current = 0; setDragOver(false); handleFiles(e.dataTransfer.files) }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 32, color: "var(--text3)", display: "block", marginBottom: 8 }}>cloud_upload</span>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>
                {dragOver ? "Drop files here" : "Drag and drop pictures here"}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text3)" }}>or click to browse</div>
              <input ref={fileRef} type="file" multiple accept="image/*" style={{ display: "none" }} onChange={e => { handleFiles(e.target.files); e.target.value = "" }} />
            </div>
            {formFiles.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
                {formFiles.map(f => (
                  <div key={f.id} className="fb-att-pill">
                    <span className="material-symbols-outlined" style={{ fontSize: 14, color: "var(--text3)" }}>image</span>
                    <span style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 14, cursor: "pointer", color: "var(--text3)" }}
                      onClick={e => { e.stopPropagation(); setFormFiles(prev => prev.filter(x => x.id !== f.id)) }}
                    >close</span>
                  </div>
                ))}
              </div>
            )}

            {/* Priority */}
            <span style={labelSt}>Priority Level</span>
            <select value={formPriority} onChange={e => setFormPriority(e.target.value as FbPriority)} className="fb-input" style={{ marginBottom: 32 }}>
              <option value="Low">Low — Nice to have</option>
              <option value="Medium">Medium — Normal priority</option>
              <option value="High">High — Blocking my work</option>
            </select>

            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={closeForm} style={btnSecondary}>Cancel</button>
              <button onClick={handleSubmit} style={btnPrimary}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>send</span>
                {editingId ? "Update" : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ View Modal ══════════ */}
      {viewItem && (
        <div style={overlay} onClick={e => { if (e.target === e.currentTarget) setViewItem(null) }}>
          <div style={modal()}>
            <h2 style={{ margin: "0 0 16px", fontSize: 20, fontWeight: 900, color: "var(--text)", display: "flex", alignItems: "center", gap: 8, lineHeight: 1.3 }}>
              <span className="material-symbols-outlined" style={{ color: "#6366f1", flexShrink: 0 }}>receipt_long</span>
              {viewItem.subject}
            </h2>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
              {[
                (() => { const b = CAT_META[viewItem.cat]; return (
                  <span key="cat" style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 8, background: b.bg, color: b.color, fontSize: 12, fontWeight: 800 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{b.icon}</span>
                    {viewItem.cat}
                  </span>
                )})(),
                <span key="prio" style={{ background: "var(--bg2)", padding: "5px 12px", borderRadius: 8, border: "1px solid var(--border)", color: "var(--text2)", fontSize: 12, fontWeight: 700 }}>
                  {viewItem.priority} Priority
                </span>,
                (() => { const s = STATUS_STYLE[viewItem.status]; return (
                  <span key="status" style={{ padding: "5px 12px", borderRadius: 8, border: `1px solid ${s.border}`, color: s.color, background: s.bg, fontSize: 12, fontWeight: 800 }}>
                    {viewItem.status}
                  </span>
                )})(),
              ]}
            </div>

            <span style={labelSt}>Description</span>
            <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 12, padding: 16, fontSize: 14, color: "var(--text)", lineHeight: 1.6, marginBottom: 16, whiteSpace: "pre-wrap", maxHeight: "40vh", overflowY: "auto" }}>
              {viewItem.desc || "No description provided."}
            </div>

            {viewItem.attachments.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
                {viewItem.attachments.map((a, i) => (
                  <div key={i} className="fb-att-pill">
                    <span className="material-symbols-outlined" style={{ fontSize: 14, color: "var(--text3)" }}>image</span>
                    <span style={{ maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 16, borderTop: "1px solid var(--border)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text3)" }}>
                {viewItem.authorName} · {new Date(viewItem.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </div>
              <button onClick={() => setViewItem(null)} style={{ ...btnSecondary, padding: "10px 20px", fontSize: 13 }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ Admin Status Modal ══════════ */}
      {adminItem && (
        <div style={overlay} onClick={e => { if (e.target === e.currentTarget) setAdminItem(null) }}>
          <div style={modal(400)}>
            <h2 style={{ margin: "0 0 10px", fontSize: 18, fontWeight: 900, color: "var(--text)", display: "flex", alignItems: "center", gap: 8 }}>
              <span className="material-symbols-outlined" style={{ color: "#6366f1" }}>admin_panel_settings</span>
              Manage Status
            </h2>
            <p style={{ fontSize: 13, color: "var(--text3)", marginBottom: 24, fontWeight: 500 }}>
              Update the lifecycle status of this community feedback item.
            </p>
            <span style={labelSt}>New Status</span>
            <select value={adminStatus} onChange={e => setAdminStatus(e.target.value as FbStatus)} className="fb-input" style={{ marginBottom: 20 }}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setAdminItem(null)} style={{ ...btnSecondary, padding: "10px 20px", fontSize: 13 }}>Cancel</button>
              <button onClick={handleAdminStatus} style={{ ...btnPrimary, padding: "10px 20px", fontSize: 13 }}>Update</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ Delete Confirm Modal ══════════ */}
      {deleteId && (
        <div style={overlay} onClick={e => { if (e.target === e.currentTarget) setDeleteId(null) }}>
          <div style={{ ...modal(420), textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(239,68,68,.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <span className="material-symbols-outlined" style={{ color: "#ef4444", fontSize: 28 }}>delete_forever</span>
            </div>
            <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 900, color: "var(--text)" }}>Delete Feedback?</h2>
            <p style={{ fontSize: 14, color: "var(--text3)", margin: "0 0 28px", lineHeight: 1.5 }}>
              This action cannot be undone. Your feedback submission will be permanently removed.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setDeleteId(null)} style={{ ...btnSecondary, flex: 1, padding: "12px 16px" }}>Cancel</button>
              <button
                onClick={handleDelete}
                style={{ ...btnPrimary, flex: 1, padding: "12px 16px", background: "#ef4444", boxShadow: "0 4px 15px rgba(239,68,68,.25)" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
