"use client"

import { useState, useMemo, useEffect } from "react"
import type { Resource } from "./page"

const CAT_LABELS: Record<string, string> = {
  all: "All", marketing: "Marketing", forms: "Forms",
  legal: "Legal", support: "Support", proposals: "Proposals",
}

const TYPE_META: Record<Resource["fileType"], { icon: string; bg: string; label: string }> = {
  pdf:     { icon: "picture_as_pdf", bg: "linear-gradient(160deg,#ef4444,#b91c1c)", label: "PDF"   },
  doc:     { icon: "description",    bg: "linear-gradient(160deg,#3b82f6,#1e40af)", label: "DOC"   },
  sheet:   { icon: "table_chart",    bg: "linear-gradient(160deg,#10b981,#047857)", label: "XLSX"  },
  media:   { icon: "image",          bg: "linear-gradient(160deg,#f59e0b,#b45309)", label: "MEDIA" },
  default: { icon: "folder_zip",     bg: "linear-gradient(160deg,#6366f1,#4338ca)", label: "FILE"  },
}

const ELLIPSIS_2: React.CSSProperties = {
  overflow: "hidden", textOverflow: "ellipsis",
  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function CoverIcon({ type, iconSize = 28 }: { type: Resource["fileType"]; iconSize?: number }) {
  const { icon, bg } = TYPE_META[type]
  return (
    <div style={{ width: "100%", height: "100%", background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span className="material-symbols-outlined" style={{ color: "#fff", fontSize: iconSize }}>{icon}</span>
    </div>
  )
}

export function ResourcesClient({ resources: initial }: { resources: Resource[] }) {
  const [resources, setResources]       = useState(initial)
  const [query, setQuery]               = useState("")
  const [activeCat, setActiveCat]       = useState("all")
  const [view, setView]                 = useState<"grid" | "list">("list")
  const [popularOpen, setPopularOpen]   = useState(true)
  const [uploadOpen, setUploadOpen]     = useState(false)
  const [folderOpen, setFolderOpen]     = useState(false)
  const [improving, setImproving]       = useState(false)
  const [detailRes, setDetailRes]       = useState<Resource | null>(null)
  const [detailName, setDetailName]     = useState("")
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [uploadForm, setUploadForm]     = useState({ category: "marketing", name: "" })
  const [folderName, setFolderName]     = useState("")

  const filtered = useMemo(() => {
    let r = resources
    if (activeCat !== "all") r = r.filter(x => x.category === activeCat)
    if (query.trim()) {
      const q = query.toLowerCase()
      r = r.filter(x =>
        x.name.toLowerCase().includes(q) ||
        x.author.toLowerCase().includes(q) ||
        x.category.toLowerCase().includes(q)
      )
    }
    return r
  }, [resources, query, activeCat])

  const popular = useMemo(() => resources.filter(r => r.isPopular), [resources])

  const showEmpty     = resources.length === 0
  const showNoResults = !showEmpty && filtered.length === 0

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      if (detailRes)   { setDetailRes(null); setDeleteConfirm(false); return }
      if (uploadOpen)  { setUploadOpen(false); return }
      if (folderOpen)  { setFolderOpen(false); return }
      if (improving)   { setImproving(false); return }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [detailRes, uploadOpen, folderOpen, improving])

  function openDetail(r: Resource) {
    setDetailRes(r)
    setDetailName(r.name)
    setDeleteConfirm(false)
  }

  function saveDetailName() {
    if (!detailRes) return
    const name = detailName.trim()
    if (!name) return
    setResources(rs => rs.map(r => r.id === detailRes.id ? { ...r, name } : r))
    setDetailRes(d => d ? { ...d, name } : d)
  }

  function deleteResource() {
    if (!detailRes) return
    setResources(rs => rs.filter(r => r.id !== detailRes.id))
    setDetailRes(null)
    setDeleteConfirm(false)
  }

  function submitUpload() {
    const name = uploadForm.name.trim()
    if (!name) return
    const newRes: Resource = {
      id: Date.now(), name,
      category: uploadForm.category as Resource["category"],
      fileType: "pdf", author: "You",
      uploadDate: new Date().toISOString().split("T")[0],
      views: 0, size: "—", version: "v1", isPopular: false,
    }
    setResources(rs => [newRes, ...rs])
    setUploadOpen(false)
    setUploadForm({ category: "marketing", name: "" })
  }

  const inputStyle: React.CSSProperties = {
    padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)",
    background: "var(--bg3)", color: "var(--text)", fontSize: 13, outline: "none",
    fontFamily: "inherit", width: "100%", boxSizing: "border-box",
  }
  const btnGhost: React.CSSProperties = {
    padding: "10px 20px", background: "var(--bg)", border: "1px solid var(--border)",
    borderRadius: 10, fontSize: 13, fontWeight: 700, color: "var(--text2)",
    cursor: "pointer", fontFamily: "inherit",
  }
  const btnAccent: React.CSSProperties = {
    padding: "10px 20px", background: "var(--accent-crm)", color: "#fff",
    border: "none", borderRadius: 10, fontSize: 13, fontWeight: 800,
    cursor: "pointer", fontFamily: "inherit",
  }

  return (
    <div style={{ fontFamily: "'Mulish', sans-serif" }}>

      {/* ── Feature In Progress Modal ── */}
      {improving && (
        <div className="crm-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setImproving(false) }}>
          <div className="crm-modal" style={{ width: "100%", maxWidth: 400, padding: 40, textAlign: "center" }}>
            <button onClick={() => setImproving(false)} style={{ position: "absolute", top: 20, right: 20, background: "none", border: "none", cursor: "pointer", color: "var(--text3)" }}>
              <span className="material-symbols-outlined">close</span>
            </button>
            <div style={{ width: 80, height: 80, borderRadius: 24, background: "var(--accent-crm-light)", color: "var(--accent-crm)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 40 }}>engineering</span>
            </div>
            <h2 style={{ margin: "0 0 12px", fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.4px" }}>Feature In Progress</h2>
            <p style={{ margin: "0 0 32px", fontSize: 15, color: "var(--text2)", lineHeight: 1.6 }}>We're actively working on improving this feature. Please check back soon!</p>
            <button onClick={() => setImproving(false)} style={{ ...btnAccent, width: "100%", padding: "13px 0", fontSize: 15, borderRadius: 14 }}>Got It</button>
          </div>
        </div>
      )}

      {/* ── Upload Modal ── */}
      {uploadOpen && (
        <div className="crm-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setUploadOpen(false) }}>
          <div className="crm-modal" style={{ width: "100%", maxWidth: 500, padding: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid var(--border)" }}>
              <span className="material-symbols-outlined" style={{ color: "var(--accent-crm)" }}>cloud_upload</span>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--text)", flex: 1 }}>Add Resource</h2>
              <button onClick={() => setUploadOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)" }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="crm-field">
              <label>Category</label>
              <select value={uploadForm.category} onChange={e => setUploadForm(f => ({ ...f, category: e.target.value }))} style={inputStyle}>
                <option value="marketing">Marketing Materials</option>
                <option value="forms">Company Forms</option>
                <option value="legal">Legal</option>
                <option value="support">Support Materials</option>
                <option value="proposals">Proposal Documents</option>
              </select>
            </div>

            <div className="crm-field" style={{ marginTop: 14 }}>
              <label>Document Name</label>
              <input
                type="text"
                value={uploadForm.name}
                onChange={e => setUploadForm(f => ({ ...f, name: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && submitUpload()}
                placeholder="Enter a descriptive name..."
                style={inputStyle}
              />
            </div>

            <div className="res-dropzone" style={{ marginTop: 16 }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--accent-crm-light)", color: "var(--accent-crm)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 28 }}>note_add</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Click or drag file to upload</div>
              <div style={{ fontSize: 12, color: "var(--text3)" }}>PDF, DOCX, XLSX, JPG, PNG (Max 50MB)</div>
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button onClick={() => setUploadOpen(false)} style={btnGhost}>Cancel</button>
              <button onClick={submitUpload} style={btnAccent}>Add Resource</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Folder Modal ── */}
      {folderOpen && (
        <div className="crm-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setFolderOpen(false) }}>
          <div className="crm-modal" style={{ width: "100%", maxWidth: 420, padding: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid var(--border)" }}>
              <span className="material-symbols-outlined" style={{ color: "var(--accent-crm)" }}>create_new_folder</span>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--text)", flex: 1 }}>Create Folder</h2>
              <button onClick={() => setFolderOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)" }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="crm-field">
              <label>Folder Name</label>
              <input
                type="text"
                value={folderName}
                onChange={e => setFolderName(e.target.value)}
                placeholder="e.g. Dejavoo, PAX, Q1 Reports"
                style={inputStyle}
              />
            </div>
            <p style={{ fontSize: 12, color: "var(--text3)", margin: "6px 0 20px" }}>
              Folder will be created in <b style={{ color: "var(--text)" }}>{activeCat === "all" ? "All Resources" : CAT_LABELS[activeCat]}</b>.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button onClick={() => setFolderOpen(false)} style={btnGhost}>Cancel</button>
              <button onClick={() => { setFolderOpen(false); setFolderName(""); setImproving(true) }} style={btnAccent}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Resource Detail Modal ── */}
      {detailRes && (
        <div
          className="crm-modal-overlay"
          onClick={e => { if (e.target === e.currentTarget) { setDetailRes(null); setDeleteConfirm(false) } }}
        >
          <div className="crm-modal" style={{ width: "100%", maxWidth: 460, maxHeight: "88vh", overflow: "hidden", display: "flex", flexDirection: "column", padding: 0 }}>
            {/* Header */}
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              <span className="material-symbols-outlined" style={{ color: "var(--accent-crm)", fontSize: 20 }}>edit_note</span>
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "var(--text)", flex: 1 }}>Resource Details</h2>
              <span
                className="material-symbols-outlined"
                style={{ cursor: "pointer", color: "var(--text3)", fontSize: 20 }}
                onClick={() => { setDetailRes(null); setDeleteConfirm(false) }}
              >close</span>
            </div>

            {/* Body */}
            <div style={{ padding: 20, overflowY: "auto", flex: 1 }}>
              {/* Cover + editable name */}
              <div style={{ display: "flex", gap: 14, marginBottom: 16 }}>
                <div style={{ width: 72, height: 94, borderRadius: 12, overflow: "hidden", flexShrink: 0 }}>
                  <CoverIcon type={detailRes.fileType} iconSize={30} />
                </div>
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8, justifyContent: "center" }}>
                  <input
                    type="text"
                    value={detailName}
                    onChange={e => setDetailName(e.target.value)}
                    onFocus={e => { e.target.style.borderColor = "var(--accent-crm)"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,.08)" }}
                    onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none" }}
                    style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg3)", color: "var(--text)", fontSize: 14, fontWeight: 700, outline: "none", fontFamily: "'Mulish', sans-serif", boxSizing: "border-box" }}
                  />
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "var(--accent-crm)", background: "var(--accent-crm-light)", padding: "2px 8px", borderRadius: 14, textTransform: "uppercase", letterSpacing: ".3px" }}>
                      {CAT_LABELS[detailRes.category]}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", background: "var(--bg3)", padding: "2px 8px", borderRadius: 14, border: "1px solid var(--border)", letterSpacing: ".3px" }}>
                      {TYPE_META[detailRes.fileType].label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Info pills */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "10px 12px", background: "var(--bg3)", borderRadius: 10, marginBottom: 20 }}>
                <span className="rd-pill"><span className="material-symbols-outlined" style={{ fontSize: 12 }}>straighten</span>{detailRes.size}</span>
                <span className="rd-pill"><span className="material-symbols-outlined" style={{ fontSize: 12 }}>tag</span>{detailRes.version}</span>
                <span className="rd-pill"><span className="material-symbols-outlined" style={{ fontSize: 12 }}>visibility</span>{detailRes.views.toLocaleString()}</span>
                <div style={{ flex: 1 }} />
                <span style={{ fontSize: 10, color: "var(--text3)", display: "flex", alignItems: "center", gap: 3 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 12 }}>person</span>{detailRes.author}
                </span>
                <span style={{ fontSize: 9, color: "var(--border)" }}>•</span>
                <span style={{ fontSize: 10, color: "var(--text3)", display: "flex", alignItems: "center", gap: 3 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 12 }}>schedule</span>{fmtDate(detailRes.uploadDate)}
                </span>
              </div>

              {/* Delete confirmation */}
              {deleteConfirm && (
                <div style={{ border: "1px solid #ef4444", borderRadius: 10, padding: 12, marginBottom: 14, background: "rgba(239,68,68,.05)" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#ef4444", marginBottom: 8 }}>Delete this resource permanently?</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={deleteResource} style={{ padding: "7px 14px", fontSize: 12, fontWeight: 700, borderRadius: 8, border: "none", background: "#ef4444", color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>Delete</button>
                    <button onClick={() => setDeleteConfirm(false)} style={{ padding: "7px 14px", fontSize: 12, fontWeight: 700, borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text2)", cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                  </div>
                </div>
              )}

              {/* Upload new version */}
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", marginBottom: 8, display: "flex", alignItems: "center", gap: 5, textTransform: "uppercase", letterSpacing: ".5px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>upload_file</span> Upload New Version
              </div>
              <div
                className="res-dropzone"
                style={{ padding: "14px 16px", flexDirection: "row", gap: 12, minHeight: 0, marginBottom: 20 }}
                onClick={() => setImproving(true)}
              >
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--accent-crm-light)", color: "var(--accent-crm)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>note_add</span>
                </div>
                <div style={{ textAlign: "left", flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>Click to select new file version</div>
                  <div style={{ fontSize: 11, color: "var(--text3)" }}>Update this resource with a new file</div>
                </div>
              </div>

              {/* Version history */}
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", marginBottom: 8, display: "flex", alignItems: "center", gap: 5, textTransform: "uppercase", letterSpacing: ".5px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>history</span> Version History
              </div>
              <div style={{ border: "1px solid var(--border)", borderRadius: 10, background: "var(--bg3)", overflow: "hidden" }}>
                <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--accent-crm)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: "#fff" }}>draft</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{detailRes.version} (Current)</div>
                    <div style={{ fontSize: 11, color: "var(--text3)" }}>{fmtDate(detailRes.uploadDate)} · {detailRes.author}</div>
                  </div>
                  <span className="rd-pill">{detailRes.size}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, flexShrink: 0 }}>
              <button
                onClick={() => setDeleteConfirm(d => !d)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", background: "none", border: "1px solid var(--border)", borderRadius: 10, fontSize: 13, fontWeight: 700, color: "var(--text3)", cursor: "pointer", fontFamily: "inherit" }}
                onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.color = "#ef4444"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#ef4444" }}
                onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text3)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>Delete
              </button>
              <div style={{ flex: 1 }} />
              <button
                onClick={() => setImproving(true)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 13, fontWeight: 700, color: "var(--text2)", cursor: "pointer", fontFamily: "inherit" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>Download
              </button>
              <button
                onClick={saveDetailName}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", background: "var(--accent-crm)", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 800, color: "#fff", cursor: "pointer", fontFamily: "inherit" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>save</span>Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <div style={{ background: "var(--bg2)", borderRadius: 20, border: "1px solid var(--border)", padding: "32px 40px", position: "relative" }}>

        {/* Top actions */}
        <div className="res-top-actions">
          <button
            onClick={() => setFolderOpen(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 13, fontWeight: 700, padding: "9px 18px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>create_new_folder</span>
            Create Folder
          </button>
          <button
            onClick={() => setUploadOpen(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--accent-crm)", color: "#fff", fontSize: 13, fontWeight: 700, padding: "9px 18px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "inherit" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
            Add Resource
          </button>
        </div>

        {/* Hero search */}
        <section style={{ maxWidth: 640, margin: "0 auto 36px", textAlign: "center", paddingTop: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--text)", margin: "0 0 20px", letterSpacing: "-0.5px" }}>Resources</h1>
          <div style={{ position: "relative", marginBottom: 20 }}>
            <span className="material-symbols-outlined" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text3)", fontSize: 20, pointerEvents: "none" }}>search</span>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search resources..."
              style={{ width: "100%", padding: "12px 16px 12px 44px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 14, color: "var(--text)", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
              onFocus={e => { e.target.style.borderColor = "var(--accent-crm)"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,.1)" }}
              onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none" }}
            />
          </div>
          {/* Filter chips */}
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            {Object.entries(CAT_LABELS).map(([key, label]) => (
              <button
                key={key}
                className={`res-chip${activeCat === key ? " active" : ""}`}
                onClick={() => setActiveCat(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* Popular Resources */}
        <section style={{ marginBottom: 24 }}>
          <div
            onClick={() => setPopularOpen(o => !o)}
            style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "10px 0", userSelect: "none" }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 18, color: "var(--text3)", transition: "transform .2s", transform: popularOpen ? "rotate(90deg)" : "rotate(0deg)" }}
            >chevron_right</span>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: 0 }}>Popular Resources</h2>
            <span style={{ fontSize: 11, color: "var(--text3)", fontWeight: 600, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "1px 8px" }}>{popular.length}</span>
          </div>
          {popularOpen && (
            <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 12 } as React.CSSProperties}>
              {popular.map(r => (
                <div key={r.id} className="res-popular-card" onClick={() => openDetail(r)}>
                  <div style={{ width: "100%", height: 110, borderRadius: 10, overflow: "hidden", marginBottom: 10, flexShrink: 0 }}>
                    <CoverIcon type={r.fileType} iconSize={32} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "var(--accent-crm)", background: "var(--accent-crm-light)", padding: "2px 8px", borderRadius: 10, marginBottom: 4, textTransform: "uppercase", letterSpacing: ".3px" }}>
                    {CAT_LABELS[r.category]}
                  </span>
                  <div style={{ ...ELLIPSIS_2, fontSize: 12, fontWeight: 800, color: "var(--text)", lineHeight: 1.3, marginBottom: 3, width: "100%" }}>
                    {r.name}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text3)", fontWeight: 600 }}>{r.author}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* All Resources */}
        <section>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", margin: 0 }}>
              {activeCat === "all" ? "All Resources" : CAT_LABELS[activeCat]}
              {filtered.length > 0 && (
                <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 600, color: "var(--text3)" }}>({filtered.length})</span>
              )}
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: 4, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: 3 }}>
              <button
                onClick={() => setView("grid")}
                title="Grid view"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 28, borderRadius: 6, border: "none", cursor: "pointer", transition: ".15s", background: view === "grid" ? "var(--accent-crm)" : "transparent", color: view === "grid" ? "#fff" : "var(--text3)" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>grid_view</span>
              </button>
              <button
                onClick={() => setView("list")}
                title="List view"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 28, borderRadius: 6, border: "none", cursor: "pointer", transition: ".15s", background: view === "list" ? "var(--accent-crm)" : "transparent", color: view === "list" ? "#fff" : "var(--text3)" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>view_list</span>
              </button>
            </div>
          </div>

          {/* Grid view */}
          {view === "grid" && !showEmpty && !showNoResults && (
            <div className="res-grid">
              {filtered.map(r => (
                <div key={r.id} className="res-card" onClick={() => openDetail(r)}>
                  <div className="res-card-cover">
                    <CoverIcon type={r.fileType} iconSize={28} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <div style={{ ...ELLIPSIS_2, fontSize: 15, fontWeight: 800, color: "var(--text)", lineHeight: 1.3, marginBottom: 4 }}>
                      {r.name}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text3)", fontWeight: 600, marginBottom: 8 }}>{r.author}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: "auto" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "var(--accent-crm)", background: "var(--accent-crm-light)", padding: "2px 8px", borderRadius: 10, textTransform: "uppercase" as const }}>
                        {CAT_LABELS[r.category]}
                      </span>
                      <span className="rd-pill">{TYPE_META[r.fileType].label}</span>
                      <span className="rd-pill">
                        <span className="material-symbols-outlined" style={{ fontSize: 11 }}>visibility</span>
                        {r.views.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="res-card-actions">
                    <button
                      className="res-card-action-btn"
                      title="Download"
                      onClick={e => { e.stopPropagation(); setImproving(true) }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>
                    </button>
                    <button
                      className="res-card-action-btn"
                      title="Edit"
                      onClick={e => { e.stopPropagation(); openDetail(r) }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* List view */}
          {view === "list" && !showEmpty && !showNoResults && (
            <div style={{ border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", background: "var(--bg2)" }}>
              {filtered.map(r => (
                <div key={r.id} className="res-list-card" onClick={() => openDetail(r)}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
                    <CoverIcon type={r.fileType} iconSize={18} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text3)", display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                      <span style={{ textTransform: "uppercase" as const, fontWeight: 700, letterSpacing: ".3px" }}>{TYPE_META[r.fileType].label}</span>
                      <span style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--text3)", flexShrink: 0 }} />
                      <span style={{ fontWeight: 600, color: "var(--accent-crm)", textTransform: "uppercase" as const, fontSize: 10 }}>{CAT_LABELS[r.category]}</span>
                      <span style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--text3)", flexShrink: 0 }} />
                      <span>{r.author}</span>
                      <span style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--text3)", flexShrink: 0 }} />
                      <span>{r.size}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text3)", fontWeight: 500, whiteSpace: "nowrap", flexShrink: 0 }}>{fmtDate(r.uploadDate)}</div>
                  <div style={{ display: "flex", gap: 4, marginLeft: 4 }} onClick={e => e.stopPropagation()}>
                    <button className="res-card-action-btn" title="Download" onClick={() => setImproving(true)} style={{ width: 30, height: 30 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 15 }}>download</span>
                    </button>
                    <button className="res-card-action-btn" title="Edit" onClick={() => openDetail(r)} style={{ width: 30, height: 30 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 15 }}>edit</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {showEmpty && (
            <div style={{ padding: "60px 20px", textAlign: "center", borderRadius: 16, border: "1px dashed var(--border)", margin: "20px 0", background: "var(--bg)" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 40, color: "var(--text3)", marginBottom: 12, display: "block", opacity: .5 }}>folder_open</span>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>No resources uploaded yet</div>
              <div style={{ fontSize: 13, color: "var(--text2)", maxWidth: 360, margin: "0 auto" }}>Click "Add Resource" to upload your first resource.</div>
            </div>
          )}

          {/* No results state */}
          {showNoResults && (
            <div style={{ padding: "60px 20px", textAlign: "center", borderRadius: 16, border: "1px dashed var(--border)", margin: "20px 0", background: "var(--bg)" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 40, color: "var(--text3)", marginBottom: 12, display: "block", opacity: .5 }}>search_off</span>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>No resources found</div>
              <div style={{ fontSize: 13, color: "var(--text2)", maxWidth: 360, margin: "0 auto" }}>Try a different keyword or category filter.</div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
