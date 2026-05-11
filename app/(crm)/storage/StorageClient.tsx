"use client"

import { useState, useMemo, useEffect, useRef, useCallback } from "react"
import { getSupabaseBrowser } from "@/lib/supabase-browser"

const BUCKET = "files"

// ── Types ──────────────────────────────────────────────────────────────────

interface StorageItem {
  name: string
  path: string
  isFolder: boolean
  size?: number
  mimeType?: string
  updatedAt?: string | null
}

// ── File type registry ─────────────────────────────────────────────────────

const FILE_TYPE_META = {
  pdf:   { icon: "picture_as_pdf", bg: "linear-gradient(160deg,#ef4444,#b91c1c)", label: "PDF"   },
  image: { icon: "image",          bg: "linear-gradient(160deg,#f59e0b,#b45309)", label: "IMAGE" },
  doc:   { icon: "description",    bg: "linear-gradient(160deg,#3b82f6,#1e40af)", label: "DOC"   },
  sheet: { icon: "table_chart",    bg: "linear-gradient(160deg,#10b981,#047857)", label: "XLSX"  },
  video: { icon: "videocam",       bg: "linear-gradient(160deg,#8b5cf6,#6d28d9)", label: "VIDEO" },
  zip:   { icon: "folder_zip",     bg: "linear-gradient(160deg,#6366f1,#4338ca)", label: "ZIP"   },
  text:  { icon: "text_snippet",   bg: "linear-gradient(160deg,#64748b,#475569)", label: "TXT"   },
  other: { icon: "draft",          bg: "linear-gradient(160deg,#94a3b8,#64748b)", label: "FILE"  },
} as const

type FileTypeKey = keyof typeof FILE_TYPE_META

function getFileType(name: string, mime?: string): FileTypeKey {
  const ext = name.split(".").pop()?.toLowerCase() ?? ""
  const m = mime?.toLowerCase() ?? ""
  if (m.startsWith("image/") || ["jpg","jpeg","png","gif","webp","svg","avif","bmp"].includes(ext)) return "image"
  if (ext === "pdf" || m === "application/pdf") return "pdf"
  if (["doc","docx"].includes(ext) || m.includes("word")) return "doc"
  if (["xls","xlsx","csv"].includes(ext) || m.includes("spreadsheet")) return "sheet"
  if (m.startsWith("video/") || ["mp4","mov","avi","mkv","webm"].includes(ext)) return "video"
  if (["zip","rar","7z","tar","gz","bz2"].includes(ext)) return "zip"
  if (["txt","md","json","yaml","yml","xml","html","css","js","ts"].includes(ext) || m.startsWith("text/")) return "text"
  return "other"
}

// ── Formatters ─────────────────────────────────────────────────────────────

function fmtSize(bytes?: number) {
  if (!bytes) return "—"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

function fmtDate(iso?: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

// ── FileIcon ───────────────────────────────────────────────────────────────

function FileIcon({ name, mimeType, size = 32 }: { name: string; mimeType?: string; size?: number }) {
  const type = getFileType(name, mimeType)
  const { icon, bg } = FILE_TYPE_META[type]
  return (
    <div style={{ width: "100%", height: "100%", background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span className="material-symbols-outlined" style={{ fontSize: size, color: "#fff" }}>{icon}</span>
    </div>
  )
}

// ── NotConfigured ──────────────────────────────────────────────────────────

function NotConfigured() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", textAlign: "center", padding: "40px 20px" }}>
      <div style={{ width: 80, height: 80, borderRadius: 24, background: "rgba(245,158,11,.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 40, color: "#f59e0b" }}>key</span>
      </div>
      <h2 style={{ fontSize: 24, fontWeight: 900, color: "var(--text)", margin: "0 0 12px", letterSpacing: "-0.4px" }}>Supabase Not Configured</h2>
      <p style={{ fontSize: 14, color: "var(--text2)", maxWidth: 480, lineHeight: 1.7, margin: "0 0 28px" }}>
        Add your Supabase credentials to <code style={{ background: "var(--bg3)", border: "1px solid var(--border)", padding: "2px 7px", borderRadius: 6, fontSize: 13 }}>.env.local</code> to enable file storage.
      </p>
      <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 24px", fontFamily: "monospace", fontSize: 13, color: "var(--text)", lineHeight: 2, textAlign: "left" }}>
        <div><span style={{ color: "var(--text3)" }}># .env.local</span></div>
        <div>NEXT_PUBLIC_SUPABASE_URL=<span style={{ color: "#10b981" }}>https://your-project.supabase.co</span></div>
        <div>NEXT_PUBLIC_SUPABASE_ANON_KEY=<span style={{ color: "#10b981" }}>your-anon-key</span></div>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export function StorageClient() {
  const supabase = getSupabaseBrowser()

  const [items, setItems]               = useState<StorageItem[]>([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState<string | null>(null)
  const [path, setPath]                 = useState<string[]>([])
  const [view, setView]                 = useState<"grid" | "list">("grid")
  const [sort, setSort]                 = useState<"name" | "date" | "size">("name")
  const [sortDir, setSortDir]           = useState<"asc" | "desc">("asc")
  const [query, setQuery]               = useState("")
  const [preview, setPreview]           = useState<StorageItem | null>(null)
  const [previewUrl, setPreviewUrl]     = useState("")
  const [uploadOpen, setUploadOpen]     = useState(false)
  const [newFolderOpen, setNewFolderOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [dragging, setDragging]         = useState(false)
  const [uploading, setUploading]       = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<StorageItem | null>(null)
  const [deleting, setDeleting]         = useState(false)
  const [toast, setToast]               = useState<{ msg: string; ok: boolean } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCounter  = useRef(0)
  const toastTimer   = useRef<ReturnType<typeof setTimeout> | null>(null)

  const prefix = path.join("/")

  // ── Helpers ──────────────────────────────────────────────────────────────

  function showToast(msg: string, ok = true) {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ msg, ok })
    toastTimer.current = setTimeout(() => setToast(null), 3200)
  }

  function toggleSort(col: "name" | "date" | "size") {
    if (sort === col) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSort(col); setSortDir("asc") }
  }

  // ── Load files ────────────────────────────────────────────────────────────

  const loadFiles = useCallback(async () => {
    if (!supabase) return
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase.storage.from(BUCKET).list(prefix, {
      limit: 500,
      sortBy: { column: "name", order: "asc" },
    })
    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }
    const mapped: StorageItem[] = (data ?? [])
      .filter(f => f.name !== ".keep")
      .map(f => {
        const meta = f.metadata as Record<string, unknown> | null
        return {
          name: f.name,
          path: prefix ? `${prefix}/${f.name}` : f.name,
          isFolder: f.id === null,
          size: typeof meta?.size === "number" ? meta.size : undefined,
          mimeType: typeof meta?.mimetype === "string" ? meta.mimetype : undefined,
          updatedAt: f.updated_at,
        }
      })
    setItems(mapped)
    setLoading(false)
  }, [supabase, prefix])

  useEffect(() => { loadFiles() }, [loadFiles])

  // ── ESC key ───────────────────────────────────────────────────────────────

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key !== "Escape") return
      if (preview)       { setPreview(null); setPreviewUrl(""); return }
      if (uploadOpen)    { setUploadOpen(false); return }
      if (newFolderOpen) { setNewFolderOpen(false); return }
      if (deleteTarget)  { setDeleteTarget(null); return }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [preview, uploadOpen, newFolderOpen, deleteTarget])

  // ── Sorted + filtered list ────────────────────────────────────────────────

  const displayed = useMemo(() => {
    let r = items
    if (query.trim()) {
      const q = query.toLowerCase()
      r = r.filter(i => i.name.toLowerCase().includes(q))
    }
    const folders = r.filter(i => i.isFolder)
    const files   = r.filter(i => !i.isFolder)
    const cmp = (a: StorageItem, b: StorageItem) => {
      let v = 0
      if (sort === "name") v = a.name.localeCompare(b.name)
      else if (sort === "size") v = (a.size ?? 0) - (b.size ?? 0)
      else v = (a.updatedAt ?? "").localeCompare(b.updatedAt ?? "")
      return sortDir === "asc" ? v : -v
    }
    return [...folders.sort(cmp), ...files.sort(cmp)]
  }, [items, query, sort, sortDir])

  const folders = displayed.filter(i => i.isFolder)
  const files   = displayed.filter(i => !i.isFolder)

  // ── File operations ───────────────────────────────────────────────────────

  async function handleUpload(fileList: FileList) {
    if (!supabase) return
    setUploading(true)
    let ok = 0, fail = 0
    for (const file of Array.from(fileList)) {
      const dest = prefix ? `${prefix}/${file.name}` : file.name
      const { error: err } = await supabase.storage.from(BUCKET).upload(dest, file, { upsert: true })
      if (err) fail++
      else ok++
    }
    setUploading(false)
    await loadFiles()
    if (fail === 0) showToast(`${ok} file${ok > 1 ? "s" : ""} uploaded`)
    else showToast(`${ok} uploaded, ${fail} failed`, false)
  }

  async function handleCreateFolder() {
    if (!supabase || !newFolderName.trim()) return
    const name = newFolderName.trim()
    const keepPath = prefix ? `${prefix}/${name}/.keep` : `${name}/.keep`
    const { error: err } = await supabase.storage
      .from(BUCKET)
      .upload(keepPath, new Blob([""]), { contentType: "text/plain", upsert: false })
    if (err) { showToast(`Failed: ${err.message}`, false); return }
    setNewFolderOpen(false)
    setNewFolderName("")
    await loadFiles()
    showToast(`Folder "${name}" created`)
  }

  async function handleDelete() {
    if (!supabase || !deleteTarget) return
    setDeleting(true)
    if (deleteTarget.isFolder) {
      const { data } = await supabase.storage.from(BUCKET).list(deleteTarget.path, { limit: 1000 })
      if (data && data.length > 0) {
        const paths = data.map(f => `${deleteTarget.path}/${f.name}`)
        await supabase.storage.from(BUCKET).remove(paths)
      }
    } else {
      const { error: err } = await supabase.storage.from(BUCKET).remove([deleteTarget.path])
      if (err) { showToast(`Delete failed: ${err.message}`, false); setDeleting(false); return }
    }
    setDeleteTarget(null)
    setDeleting(false)
    if (preview?.path === deleteTarget.path) { setPreview(null); setPreviewUrl("") }
    await loadFiles()
    showToast(`"${deleteTarget.name}" deleted`)
  }

  function openPreview(item: StorageItem) {
    if (!supabase) return
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(item.path)
    setPreviewUrl(data.publicUrl)
    setPreview(item)
  }

  function handleNavigateFolder(item: StorageItem) {
    setPath(p => [...p, item.name])
    setQuery("")
  }

  function handleCopyUrl(item: StorageItem) {
    if (!supabase) return
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(item.path)
    navigator.clipboard.writeText(data.publicUrl).then(() => showToast("URL copied"))
  }

  // ── Drag & drop ───────────────────────────────────────────────────────────

  function onDragEnter(e: React.DragEvent) {
    e.preventDefault()
    dragCounter.current++
    if (dragCounter.current === 1) setDragging(true)
  }
  function onDragLeave(e: React.DragEvent) {
    e.preventDefault()
    dragCounter.current--
    if (dragCounter.current === 0) setDragging(false)
  }
  function onDragOver(e: React.DragEvent) { e.preventDefault() }
  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    dragCounter.current = 0
    setDragging(false)
    if (e.dataTransfer.files.length > 0) handleUpload(e.dataTransfer.files)
  }

  // ── Shared styles ─────────────────────────────────────────────────────────

  const inputStyle: React.CSSProperties = {
    padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)",
    background: "var(--bg3)", color: "var(--text)", fontSize: 13,
    outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box",
  }
  const btnGhost: React.CSSProperties = {
    padding: "9px 18px", background: "var(--bg)", border: "1px solid var(--border)",
    borderRadius: 10, fontSize: 13, fontWeight: 700, color: "var(--text2)",
    cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6,
  }
  const btnAccent: React.CSSProperties = {
    padding: "9px 18px", background: "var(--accent-crm)", color: "#fff",
    border: "none", borderRadius: 10, fontSize: 13, fontWeight: 800,
    cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6,
  }

  // ── Not configured ────────────────────────────────────────────────────────

  // if (!supabase) return <NotConfigured />

  // ── Preview: determine content type ──────────────────────────────────────

  const previewType = preview
    ? preview.mimeType?.startsWith("image/") || ["jpg","jpeg","png","gif","webp","svg","avif","bmp"].some(x => preview.name.endsWith(`.${x}`))
      ? "image"
      : preview.mimeType === "application/pdf" || preview.name.endsWith(".pdf")
      ? "pdf"
      : preview.mimeType?.startsWith("video/") || ["mp4","mov","webm"].some(x => preview.name.endsWith(`.${x}`))
      ? "video"
      : "download"
    : null

  const sortIcon = (col: "name" | "date" | "size") => {
    if (sort !== col) return null
    return <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{sortDir === "asc" ? "arrow_upward" : "arrow_downward"}</span>
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      style={{ fontFamily: "'Mulish', sans-serif" }}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {/* ── Hidden file input ── */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: "none" }}
        onChange={e => { if (e.target.files?.length) { handleUpload(e.target.files); e.target.value = "" } }}
      />

      {/* ── Toast ── */}
      {toast && (
        <div className="fm-toast" style={{ background: toast.ok ? "var(--text)" : "#ef4444" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{toast.ok ? "check_circle" : "error"}</span>
          {toast.msg}
        </div>
      )}

      {/* ── Preview Modal ── */}
      {preview && (
        <div
          className="crm-modal-overlay"
          style={{ backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) { setPreview(null); setPreviewUrl("") } }}
        >
          <div style={{
            background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 20,
            boxShadow: "0 24px 64px rgba(0,0,0,.3)",
            width: "100%", maxWidth: 900, height: "88vh",
            display: "flex", flexDirection: "column", overflow: "hidden",
            animation: "fadeUp .25s ease",
          }}>
            {/* Header */}
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, overflow: "hidden", flexShrink: 0 }}>
                <FileIcon name={preview.name} mimeType={preview.mimeType} size={20} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{preview.name}</div>
                <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 1 }}>
                  {FILE_TYPE_META[getFileType(preview.name, preview.mimeType)].label}
                  {preview.size ? ` · ${fmtSize(preview.size)}` : ""}
                  {preview.updatedAt ? ` · ${fmtDate(preview.updatedAt)}` : ""}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button
                  onClick={() => handleCopyUrl(preview)}
                  style={{ ...btnGhost, padding: "7px 12px", fontSize: 12 }}
                  title="Copy URL"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>link</span>
                  Copy URL
                </button>
                <a
                  href={previewUrl}
                  download={preview.name}
                  style={{ ...btnAccent, padding: "7px 12px", fontSize: 12, textDecoration: "none" }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>
                  Download
                </a>
                <button
                  onClick={() => { setDeleteTarget(preview); setPreview(null); setPreviewUrl("") }}
                  title="Delete"
                  style={{ width: 34, height: 34, borderRadius: 9, border: "1px solid var(--border)", background: "none", cursor: "pointer", color: "var(--text3)", display: "flex", alignItems: "center", justifyContent: "center" }}
                  onMouseOver={e => { (e.currentTarget as HTMLElement).style.color = "#ef4444"; (e.currentTarget as HTMLElement).style.borderColor = "#ef4444" }}
                  onMouseOut={e => { (e.currentTarget as HTMLElement).style.color = "var(--text3)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--border)" }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                </button>
                <button
                  onClick={() => { setPreview(null); setPreviewUrl("") }}
                  style={{ width: 34, height: 34, borderRadius: 9, border: "1px solid var(--border)", background: "none", cursor: "pointer", color: "var(--text3)", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                </button>
              </div>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
              {previewType === "image" && (
                <img src={previewUrl} alt={preview.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", padding: 16 }} />
              )}
              {previewType === "pdf" && (
                <iframe src={previewUrl} title={preview.name} style={{ width: "100%", height: "100%", border: "none" }} />
              )}
              {previewType === "video" && (
                <video src={previewUrl} controls style={{ maxWidth: "100%", maxHeight: "100%" }} />
              )}
              {previewType === "download" && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: 40, textAlign: "center" }}>
                  <div style={{ width: 100, height: 100, borderRadius: 20, overflow: "hidden" }}>
                    <FileIcon name={preview.name} mimeType={preview.mimeType} size={48} />
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>{preview.name}</div>
                    <div style={{ fontSize: 13, color: "var(--text3)" }}>
                      {FILE_TYPE_META[getFileType(preview.name, preview.mimeType)].label}
                      {preview.size ? ` · ${fmtSize(preview.size)}` : ""}
                    </div>
                  </div>
                  <p style={{ fontSize: 14, color: "var(--text2)", maxWidth: 360, lineHeight: 1.6, margin: 0 }}>
                    This file type cannot be previewed in the browser. Download it to view its contents.
                  </p>
                  <a href={previewUrl} download={preview.name} style={{ ...btnAccent, padding: "12px 28px", fontSize: 14, textDecoration: "none" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>download</span>
                    Download File
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Upload Modal ── */}
      {uploadOpen && (
        <div className="crm-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setUploadOpen(false) }}>
          <div className="crm-modal" style={{ width: "100%", maxWidth: 520, padding: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid var(--border)" }}>
              <span className="material-symbols-outlined" style={{ color: "var(--accent-crm)" }}>cloud_upload</span>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--text)", flex: 1 }}>Upload Files</h2>
              <button onClick={() => setUploadOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)" }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p style={{ fontSize: 13, color: "var(--text3)", margin: "0 0 16px" }}>
              Uploading to: <strong style={{ color: "var(--text)" }}>/{path.join("/") || "root"}</strong>
            </p>
            <div
              className={`fm-drop-zone${dragging ? " drag" : ""}`}
              onClick={() => fileInputRef.current?.click()}
              style={{ marginBottom: 20 }}
            >
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--accent-crm-light)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 32, color: "var(--accent-crm)" }}>cloud_upload</span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
                {dragging ? "Drop files here" : "Click or drag files to upload"}
              </div>
              <div style={{ fontSize: 12, color: "var(--text3)" }}>PDF, Images, Documents, Videos, Archives</div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setUploadOpen(false)} style={btnGhost}>Cancel</button>
              <button onClick={() => { setUploadOpen(false); fileInputRef.current?.click() }} style={btnAccent}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>folder_open</span>
                Browse Files
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── New Folder Modal ── */}
      {newFolderOpen && (
        <div className="crm-modal-overlay" onClick={e => { if (e.target === e.currentTarget) { setNewFolderOpen(false); setNewFolderName("") } }}>
          <div className="crm-modal" style={{ width: "100%", maxWidth: 420, padding: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid var(--border)" }}>
              <span className="material-symbols-outlined" style={{ color: "var(--accent-crm)" }}>create_new_folder</span>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--text)", flex: 1 }}>New Folder</h2>
              <button onClick={() => { setNewFolderOpen(false); setNewFolderName("") }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)" }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="crm-field">
              <label>Folder Name</label>
              <input
                type="text"
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCreateFolder()}
                placeholder="e.g. Marketing, Q2 Reports"
                style={inputStyle}
                autoFocus
              />
            </div>
            <p style={{ fontSize: 12, color: "var(--text3)", margin: "8px 0 20px" }}>
              Will be created inside <strong style={{ color: "var(--text)" }}>/{path.join("/") || "root"}</strong>
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => { setNewFolderOpen(false); setNewFolderName("") }} style={btnGhost}>Cancel</button>
              <button onClick={handleCreateFolder} disabled={!newFolderName.trim()} style={{ ...btnAccent, opacity: newFolderName.trim() ? 1 : 0.5 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>create_new_folder</span>
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteTarget && (
        <div className="crm-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setDeleteTarget(null) }}>
          <div className="crm-modal" style={{ width: "100%", maxWidth: 400, padding: 28, textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(239,68,68,.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 32, color: "#ef4444" }}>delete_forever</span>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--text)", margin: "0 0 10px" }}>Delete {deleteTarget.isFolder ? "Folder" : "File"}?</h2>
            <p style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.6, margin: "0 0 8px" }}>
              <strong style={{ color: "var(--text)" }}>{deleteTarget.name}</strong>
            </p>
            <p style={{ fontSize: 13, color: "var(--text3)", margin: "0 0 28px", lineHeight: 1.5 }}>
              {deleteTarget.isFolder
                ? "All files inside this folder will be permanently deleted. This cannot be undone."
                : "This file will be permanently deleted. This cannot be undone."}
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={() => setDeleteTarget(null)} style={btnGhost}>Cancel</button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{ ...btnAccent, background: "#ef4444", opacity: deleting ? 0.6 : 1 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{deleting ? "hourglass_empty" : "delete"}</span>
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Global drag overlay ── */}
      {dragging && !uploadOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 900, background: "rgba(99,102,241,.08)", border: "3px dashed var(--accent-crm)", borderRadius: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <div style={{ background: "var(--bg2)", border: "1px solid var(--accent-crm)", borderRadius: 20, padding: "32px 48px", textAlign: "center", boxShadow: "0 12px 40px rgba(99,102,241,.25)" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 48, color: "var(--accent-crm)", display: "block", marginBottom: 12 }}>cloud_upload</span>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text)" }}>Drop to upload</div>
            <div style={{ fontSize: 13, color: "var(--text3)", marginTop: 4 }}>Files will upload to /{path.join("/") || "root"}</div>
          </div>
        </div>
      )}

      {/* ── Main container ── */}
      <div style={{ background: "var(--bg2)", borderRadius: 20, border: "1px solid var(--border)", padding: "28px 32px" }}>

        {/* Top bar */}
        <div className="fm-bar">
          {/* Breadcrumb */}
          <div className="fm-crumb">
            <button
              className="fm-crumb-seg"
              onClick={() => setPath([])}
              style={{ color: path.length === 0 ? "var(--text)" : undefined }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: "middle" }}>home</span>
            </button>
            {path.map((seg, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 2 }}>
                <span className="fm-crumb-sep">/</span>
                <button
                  className="fm-crumb-seg"
                  onClick={() => setPath(p => p.slice(0, i + 1))}
                  style={{ color: i === path.length - 1 ? "var(--text)" : undefined }}
                >
                  {seg}
                </button>
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="fm-search">
            <span className="material-symbols-outlined icon">search</span>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search files…"
              onFocus={e => { e.currentTarget.style.borderColor = "var(--accent-crm)"; e.currentTarget.style.width = "240px" }}
              onBlur={e => { e.currentTarget.style.borderColor = "var(--border)"; if (!query) e.currentTarget.style.width = "" }}
            />
          </div>

          {/* View toggle */}
          <div className="fm-view-toggle">
            <button
              className="fm-view-btn"
              title="Grid view"
              onClick={() => setView("grid")}
              style={{ background: view === "grid" ? "var(--accent-crm)" : "transparent", color: view === "grid" ? "#fff" : "var(--text3)" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>grid_view</span>
            </button>
            <button
              className="fm-view-btn"
              title="List view"
              onClick={() => setView("list")}
              style={{ background: view === "list" ? "var(--accent-crm)" : "transparent", color: view === "list" ? "#fff" : "var(--text3)" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>view_list</span>
            </button>
          </div>

          {/* Actions */}
          <button onClick={() => setNewFolderOpen(true)} style={btnGhost}>
            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>create_new_folder</span>
            <span className="fm-btn-label">New Folder</span>
          </button>
          <button onClick={() => setUploadOpen(true)} style={btnAccent} disabled={uploading}>
            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>{uploading ? "hourglass_empty" : "upload"}</span>
            <span className="fm-btn-label">{uploading ? "Uploading…" : "Upload"}</span>
          </button>
        </div>

        {/* Upload progress bar */}
        {uploading && (
          <div style={{ height: 3, background: "var(--border)", borderRadius: 99, marginBottom: 20, overflow: "hidden" }}>
            <div style={{ height: "100%", background: "var(--accent-crm)", borderRadius: 99, animation: "fm-progress 1.4s ease-in-out infinite" }} />
          </div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "64px 20px", gap: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid var(--border)", borderTopColor: "var(--accent-crm)", animation: "spin 0.8s linear infinite" }} />
            <div style={{ fontSize: 13, color: "var(--text3)", fontWeight: 600 }}>Loading files…</div>
          </div>
        )}

        {/* ── Error ── */}
        {!loading && error && (
          <div style={{ padding: "40px 20px", textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(239,68,68,.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 32, color: "#ef4444" }}>error_outline</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Failed to load files</div>
            <div style={{ fontSize: 13, color: "var(--text3)", marginBottom: 20 }}>{error}</div>
            <button onClick={loadFiles} style={btnAccent}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>refresh</span>
              Retry
            </button>
          </div>
        )}

        {/* ── Content ── */}
        {!loading && !error && (
          <>
            {/* Folders */}
            {folders.length > 0 && (
              <section style={{ marginBottom: 28 }}>
                <div className="fm-section-label">
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>folder</span>
                  Folders
                  <span style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 10, padding: "0 7px", fontSize: 10 }}>{folders.length}</span>
                </div>
                <div className="fm-folder-grid">
                  {folders.map(f => (
                    <div
                      key={f.path}
                      className="fm-folder-card"
                      onClick={() => handleNavigateFolder(f)}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 24, color: "#f59e0b", flexShrink: 0 }}>folder</span>
                      <span className="fm-folder-name">{f.name}</span>
                      <button
                        title="Delete folder"
                        onClick={e => { e.stopPropagation(); setDeleteTarget(f) }}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)", padding: 2, display: "flex", flexShrink: 0 }}
                        onMouseOver={e => (e.currentTarget as HTMLElement).style.color = "#ef4444"}
                        onMouseOut={e => (e.currentTarget as HTMLElement).style.color = "var(--text3)"}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Files */}
            {files.length > 0 && (
              <section>
                {/* Section header + sort */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div className="fm-section-label" style={{ margin: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>description</span>
                    Files
                    <span style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 10, padding: "0 7px", fontSize: 10 }}>{files.length}</span>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {(["name", "date", "size"] as const).map(col => (
                      <button
                        key={col}
                        onClick={() => toggleSort(col)}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 3,
                          padding: "5px 10px", borderRadius: 8, border: "none",
                          background: sort === col ? "var(--accent-crm-light)" : "transparent",
                          color: sort === col ? "var(--accent-crm)" : "var(--text3)",
                          fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                          textTransform: "capitalize",
                        }}
                      >
                        {col} {sortIcon(col)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grid view */}
                {view === "grid" && (
                  <div className="fm-file-grid">
                    {files.map(f => (
                      <div key={f.path} className="fm-file-card" onClick={() => openPreview(f)}>
                        <div className="fm-file-cover">
                          <FileIcon name={f.name} mimeType={f.mimeType} size={36} />
                          <div className="fm-file-actions">
                            <button className="fm-file-act-btn" title="Download" onClick={e => { e.stopPropagation(); if (supabase) { const { data } = supabase.storage.from(BUCKET).getPublicUrl(f.path); window.open(data.publicUrl, "_blank") } }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>download</span>
                            </button>
                            <button className="fm-file-act-btn" title="Copy URL" onClick={e => { e.stopPropagation(); handleCopyUrl(f) }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>link</span>
                            </button>
                            <button className="fm-file-act-btn" title="Delete" style={{ background: "rgba(239,68,68,.7)" }} onClick={e => { e.stopPropagation(); setDeleteTarget(f) }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>delete</span>
                            </button>
                          </div>
                          <div style={{ position: "absolute", bottom: 6, left: 8 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, background: "rgba(0,0,0,.45)", color: "#fff", padding: "2px 6px", borderRadius: 5, letterSpacing: ".3px" }}>
                              {FILE_TYPE_META[getFileType(f.name, f.mimeType)].label}
                            </span>
                          </div>
                        </div>
                        <div className="fm-file-card-body">
                          <div className="fm-file-name">{f.name}</div>
                          <div className="fm-file-meta">{fmtSize(f.size)} · {fmtDate(f.updatedAt)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* List view */}
                {view === "list" && (
                  <div style={{ border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", background: "var(--bg)" }}>
                    {files.map(f => (
                      <div key={f.path} className="fm-list-row" onClick={() => openPreview(f)}>
                        <div className="fm-list-icon">
                          <FileIcon name={f.name} mimeType={f.mimeType} size={18} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="fm-list-name">{f.name}</div>
                          <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 1 }}>
                            {FILE_TYPE_META[getFileType(f.name, f.mimeType)].label}
                          </div>
                        </div>
                        <div className="fm-list-meta" style={{ width: 80, textAlign: "right" }}>{fmtSize(f.size)}</div>
                        <div className="fm-list-meta" style={{ width: 110, textAlign: "right" }}>{fmtDate(f.updatedAt)}</div>
                        <div className="fm-list-actions" onClick={e => e.stopPropagation()}>
                          <button className="fm-list-act-btn" title="Preview" onClick={() => openPreview(f)}>
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>visibility</span>
                          </button>
                          <button className="fm-list-act-btn" title="Copy URL" onClick={() => handleCopyUrl(f)}>
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>link</span>
                          </button>
                          <button className="fm-list-act-btn" title="Download" onClick={() => { if (supabase) { const { data } = supabase.storage.from(BUCKET).getPublicUrl(f.path); window.open(data.publicUrl, "_blank") } }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>
                          </button>
                          <button
                            className="fm-list-act-btn"
                            title="Delete"
                            style={{ color: "#ef4444" }}
                            onClick={() => setDeleteTarget(f)}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Empty state */}
            {items.length === 0 && (
              <div
                className={`fm-drop-zone${dragging ? " drag" : ""}`}
                onClick={() => fileInputRef.current?.click()}
                style={{ margin: "8px 0 0" }}
              >
                <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--accent-crm-light)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 36, color: "var(--accent-crm)" }}>cloud_upload</span>
                </div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>
                  {dragging ? "Drop files to upload" : "This folder is empty"}
                </div>
                <div style={{ fontSize: 13, color: "var(--text3)", marginBottom: 20 }}>
                  Drag and drop files here, or click to browse
                </div>
                <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                  <button style={btnGhost} onClick={e => { e.stopPropagation(); setNewFolderOpen(true) }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>create_new_folder</span>
                    New Folder
                  </button>
                  <button style={btnAccent} onClick={e => { e.stopPropagation(); fileInputRef.current?.click() }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>upload</span>
                    Upload Files
                  </button>
                </div>
              </div>
            )}

            {/* No results state */}
            {items.length > 0 && displayed.length === 0 && (
              <div style={{ padding: "60px 20px", textAlign: "center" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 40, color: "var(--text3)", display: "block", marginBottom: 12, opacity: .4 }}>search_off</span>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>No files found</div>
                <div style={{ fontSize: 13, color: "var(--text2)" }}>No files match &ldquo;{query}&rdquo;</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
