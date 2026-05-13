"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { redirect, RedirectType } from 'next/navigation'
// ── Types ──────────────────────────────────────────────────────────────────
type Col = "view" | "create" | "edit" | "delete"

interface PermRow {
  id: string
  label: string
  icon: string
  page: string
  acts: Col[]
  desc: string
}
interface PermCat { cat: string; rows: PermRow[] }

export interface PortalUser {
  id: number
  email: string
  full_name: string
  role: string
  is_active: boolean
  permissions: { pages?: Record<string, boolean>; capabilities?: Record<string, boolean> } | null
}

type Preset = "full" | "standard" | "readonly" | "minimal"
type SaveState = "idle" | "saving" | "saved" | "error"
type ToastType = "ok" | "error" | "warn"

// ── Config ─────────────────────────────────────────────────────────────────
const COLS: Col[] = ["view", "create", "edit", "delete"]
const COL_LABELS: Record<Col, string> = { view: "View", create: "Create", edit: "Edit", delete: "Delete" }

const MODS: PermCat[] = [
  {
    cat: "Core Operations", rows: [
      { id: "tickets", label: "Support Tickets", icon: "confirmation_number", page: "tickets", acts: ["view", "create", "edit", "delete"], desc: "View, create, and manage support tickets" },
      { id: "merchants", label: "Merchant Records", icon: "storefront", page: "merchants", acts: ["view", "create", "edit", "delete"], desc: "Browse and manage merchant accounts and MIDs" },
      { id: "inventory", label: "Equipment & Stock", icon: "inventory_2", page: "inventory", acts: ["view", "create", "edit", "delete"], desc: "Track equipment stock levels and terminal assignments" },
    ]
  },
  {
    cat: "Content & Resources", rows: [
      { id: "resources", label: "Shared Resources", icon: "folder_shared", page: "resources", acts: ["view", "create", "edit", "delete"], desc: "Browse shared documents, guides, and training materials" },
      { id: "file_storage", label: "File Storage", icon: "cloud_upload", page: "file-storage", acts: ["view", "create", "edit", "delete"], desc: "Upload, organize, and share files in cloud storage" },
      { id: "onboarding", label: "Onboarding Forms", icon: "assignment", page: "onboarding", acts: ["view", "create", "edit"], desc: "Access merchant and agent onboarding submissions" },
    ]
  },
  {
    cat: "Scheduling & Tasks", rows: [
      { id: "calendar", label: "Calendar Events", icon: "calendar_month", page: "calendar", acts: ["view", "create", "edit", "delete"], desc: "View and manage team events and meetings" },
      { id: "tasks", label: "Tasks", icon: "task_alt", page: "tasks", acts: ["view", "create", "edit", "delete"], desc: "Personal and team task lists and assignments" },
      { id: "timecard", label: "Timecards", icon: "timer", page: "timecard", acts: ["view", "create"], desc: "Clock in/out and view work hours" },
    ]
  },
  {
    cat: "Communication", rows: [
      { id: "feedback", label: "Community Feedback", icon: "feedback", page: "feedback", acts: ["view", "create", "edit"], desc: "Submit and review feedback and feature requests" },
      { id: "changelog", label: "Changelog", icon: "campaign", page: "changelog", acts: ["view"], desc: "View portal update history and release notes" },
    ]
  },
  {
    cat: "Administration", rows: [
      { id: "dashboard", label: "Dashboard", icon: "dashboard", page: "dashboard", acts: ["view"], desc: "Main portal overview with stats and quick actions" },
      { id: "activity", label: "Activity Log", icon: "history", page: "activity", acts: ["view"], desc: "Real-time feed of all portal actions by all users" },
      { id: "users", label: "User Management", icon: "manage_accounts", page: "users", acts: ["view", "create", "edit", "delete"], desc: "Add, remove, and manage portal user accounts" },
      { id: "agents", label: "Agents", icon: "support_agent", page: "agents", acts: ["view", "create", "edit", "delete"], desc: "View and manage sales agent profiles" },
      { id: "tools", label: "Tools", icon: "build", page: "tools", acts: ["view"], desc: "Access internal utilities and calculators" },
      { id: "passwords", label: "Password Manager", icon: "passkey", page: "password-manager", acts: ["view", "edit"], desc: "Access the team shared password vault" },
    ]
  },
]

const MINIMAL_PAGES = ["dashboard", "tickets", "tasks", "timecard", "feedback", "changelog"]
const AV_COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#f43f5e", "#f59e0b", "#10b981", "#3b82f6", "#ec4899"]
const PRESETS: { id: Preset; label: string }[] = [
  { id: "full", label: "Full Access" },
  { id: "standard", label: "Standard" },
  { id: "readonly", label: "View Only" },
  { id: "minimal", label: "Minimal" },
]

// ── Helpers ────────────────────────────────────────────────────────────────
function initials(name: string) {
  return name.split(" ").filter(Boolean).map(w => w[0]).join("").substring(0, 2).toUpperCase() || "?"
}

function permKey(row: PermRow, action: Col) {
  return action === "view" ? `${row.page}__view` : `${row.id}_${action}`
}

function buildPerms(user: PortalUser): Record<string, boolean> {
  const { pages = {}, capabilities = {} } = user.permissions ?? {}
  const out: Record<string, boolean> = {}
  MODS.forEach(cat => cat.rows.forEach(row =>
    row.acts.forEach(a => {
      const k = permKey(row, a)
      out[k] = a === "view" ? (pages[row.page] ?? true) : (capabilities[k] ?? true)
    })
  ))
  return out
}

function summarise(perms: Record<string, boolean>) {
  let total = 0, enabled = 0, pageT = 0, pageE = 0
  MODS.forEach(cat => cat.rows.forEach(row =>
    row.acts.forEach(a => {
      const k = permKey(row, a); total++
      if (perms[k] !== false) enabled++
      if (a === "view") { pageT++; if (perms[k] !== false) pageE++ }
    })
  ))
  return { total, enabled, pageT, pageE }
}

function allTruePerms(): Record<string, boolean> {
  const out: Record<string, boolean> = {}
  MODS.forEach(cat => cat.rows.forEach(row =>
    row.acts.forEach(a => { out[permKey(row, a)] = true })
  ))
  return out
}

function presetPerms(p: Preset): Record<string, boolean> {
  const out: Record<string, boolean> = {}
  MODS.forEach(cat => cat.rows.forEach(row =>
    row.acts.forEach(a => {
      const k = permKey(row, a)
      switch (p) {
        case "full": out[k] = true; break
        case "standard":
          if (a === "view") out[k] = true
          else if (a === "delete") out[k] = false
          else if (row.id === "users" || row.id === "agents") out[k] = false
          else out[k] = true
          break
        case "readonly": out[k] = a === "view"; break
        case "minimal":
          if (a === "view") out[k] = MINIMAL_PAGES.includes(row.page)
          else out[k] = row.id === "tickets" && a === "create"
          break
      }
    })
  ))
  return out
}

// ── Component ──────────────────────────────────────────────────────────────
export function PermissionsClient({ initialUsers }: { initialUsers: PortalUser[] }) {
  const searchParams = useSearchParams()
  const uidParam = searchParams.get("uid")
  const [users, setUsers] = useState<PortalUser[]>(initialUsers)
  const [search, setSearch] = useState("")
  const [selId, setSelId] = useState<number | null>(null)
  const [perms, setPerms] = useState<Record<string, boolean>>({})
  const [saveState, setSaveState] = useState<SaveState>("idle")
  const [activePreset, setActivePreset] = useState<Preset | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: ToastType } | null>(null)

  // Hydration sync
  useEffect(() => {
    if (uidParam) {
      const uid = parseInt(uidParam)
      const u = users.find(x => x.id === uid)
      if (u) {
        setSelId(uid)
        setPerms(buildPerms(u))
      }
    } else {
      setSelId(null)
    }
  }, [uidParam, users])

  // ── Open editor ──────────────────────────────────────────────────────────
  function openEditor(id: number, list?: PortalUser[]) {
    const u = (list ?? users).find(x => x.id === id)
    if (!u) return
    setSelId(id)
    setPerms(buildPerms(u))
    setActivePreset(null)
    const url = new URL(window.location.href)
    url.searchParams.set("uid", String(id))
    window.history.replaceState({}, "", url.toString())
  }

  function closeEditor() {
    redirect('/users', RedirectType.replace)
    // setSelId(null)
    // const url = new URL(window.location.href + "/users");
    // url.searchParams.delete("uid")
    // window.history.replaceState({}, "", url.toString())
  }

  function toggle(key: string, val: boolean) {
    setPerms(prev => ({ ...prev, [key]: val }))
    setActivePreset(null)
  }

  function applyPreset(p: Preset) { setPerms(presetPerms(p)); setActivePreset(p) }
  function resetDefaults() { setPerms(allTruePerms()); setActivePreset(null) }

  // ── Save (local-state only — wire to real API when backend is ready) ──────
  async function save() {
    if (!selId) return
    setSaveState("saving")
    const pages: Record<string, boolean> = {}
    const caps: Record<string, boolean> = {}
    let allTrue = true
    MODS.forEach(cat => cat.rows.forEach(row =>
      row.acts.forEach(a => {
        const k = permKey(row, a)
        if (perms[k] === false) {
          allTrue = false
          if (a === "view") pages[row.page] = false
          else caps[`${row.id}_${a}`] = false
        }
      })
    ))
    const permissions = allTrue ? null : { pages, capabilities: caps }
    await new Promise(r => setTimeout(r, 500))
    setUsers(prev => prev.map(u => u.id === selId ? { ...u, permissions } : u))
    setSaveState("saved")
    showToast("Permissions saved successfully", "ok")
    setTimeout(() => setSaveState("idle"), 1500)
  }

  function showToast(msg: string, type: ToastType) {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const selectedUser = users.find(u => u.id === selId)
  const filteredUsers = users.filter(u =>
    !search ||
    (u.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (u.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (u.role ?? "").toLowerCase().includes(search.toLowerCase())
  )
  const summary = selId ? summarise(perms) : null

  // ══════════════════════════════════════════════════════════════════════════
  // Permission editor
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="perm-editor-wrap">

      {/* ── Left: user mini-list ── */}
      <aside className="perm-sidebar">
        <div className="perm-sidebar-head">
          <div className="perm-sidebar-search">
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>search</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
            />
          </div>
        </div>
        <div className="perm-sidebar-list">
          {(search ? filteredUsers : users).map(u => {
            const name = u.full_name || u.email || ""
            const r = (u.role || "user").toLowerCase()
            const rc = r === "ceo" ? "#eab308" : r === "admin" ? "#ef4444" : "var(--accent-crm)"
            const active = u.id === selId
            return (
              <div
                key={u.id}
                className={`perm-user-item${active ? " active" : ""}`}
                onClick={() => openEditor(u.id)}
              >
                <div className="perm-user-av" style={{ background: AV_COLORS[u.id % AV_COLORS.length] }}>
                  {initials(name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="perm-user-name">{name}</div>
                  <div className="perm-user-role" style={{ color: rc }}>{r.toUpperCase()}</div>
                </div>
                {active && <span className="material-symbols-outlined" style={{ fontSize: 14, color: "var(--accent-crm)", flexShrink: 0 }}>chevron_right</span>}
              </div>
            )
          })}
        </div>
      </aside>

      {/* ── Right: permission grid ── */}
      <main className="perm-main">
        {!selectedUser ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text3)", opacity: 0.6 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 48, marginBottom: 16 }}>shield_person</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>Loading.....</span>
          </div>
        ) : (
          <>
            {/* User header */}
            <div className="perm-user-header">
              <div className="perm-user-av-lg" style={{ background: AV_COLORS[(selId || 0) % AV_COLORS.length] }}>
                {initials(selectedUser.full_name || selectedUser.email || "")}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", display: "flex", alignItems: "center", gap: 8 }}>
                  {selectedUser.full_name || selectedUser.email}
                  <RoleBadge role={selectedUser.role} />
                </div>
                <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 3 }}>{selectedUser.email}</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={closeEditor}
                  className="crm-btn crm-btn-ghost"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
                  Back
                </button>
                <button className="crm-btn crm-btn-ghost" onClick={resetDefaults} style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6, padding: "8px 14px" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>restart_alt</span>
                  Reset Defaults
                </button>
                <button
                  onClick={save}
                  disabled={saveState === "saving"}
                  className="perm-save-btn"
                  data-state={saveState}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                    {saveState === "saving" ? "hourglass_empty" : saveState === "saved" ? "check_circle" : "save"}
                  </span>
                  {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved!" : "Save Changes"}
                </button>
              </div>
            </div>

            {/* Presets + stats bar */}
            <div className="flex-col">
              <div className="presets flex gap-2 items-center py-2">
                <span className="perm-presets-label">Presets:</span>
                {PRESETS.map(p => {
                  const active = activePreset === p.id
                  return (
                    <button
                      key={p.id}
                      onClick={() => applyPreset(p.id)}
                      className={`perm-preset-btn${active ? " active" : ""}`}
                    >
                      {p.label}
                    </button>
                  )
                })}
              </div>
              <div className="summary flex gap-2 items-center py-2">
                {summary && (
                  <div className="perm-stats-group py-2">
                    <StatPill dot="#10b981" label="Enabled" val={`${summary.enabled}/${summary.total}`} />
                    <StatPill dot="var(--accent-crm)" label="Pages" val={`${summary.pageE}/${summary.pageT}`} />
                    <StatPill dot="#f59e0b" label="Actions" val={`${summary.enabled - summary.pageE}/${summary.total - summary.pageT}`} />
                  </div>
                )}
              </div>
            </div>

            {/* Permission Grid */}
            <div style={{ padding: "12px 28px 60px" }}>
              {MODS.map((cat, ci) => (
                <div key={cat.cat} style={{ marginTop: ci === 0 ? 10 : 22 }}>
                  {/* Category header */}
                  <div className="perm-cat-header">
                    <div className="perm-cat-title">
                      <span className="perm-cat-bar" />
                      {cat.cat}
                    </div>
                    <div className="perm-col-labels">
                      {COLS.map(c => (
                        <div key={c} className="perm-col-label">{COL_LABELS[c]}</div>
                      ))}
                    </div>
                  </div>

                  {/* Category rows */}
                  <div className="perm-cat-rows dash-card-v2" style={{ padding: 0, borderRadius: 14 }}>
                    {cat.rows.map((row, ri) => {
                      const anyOff = row.acts.some(a => perms[permKey(row, a)] === false)
                      return (
                        <div
                          key={row.id}
                          className={`perm-row${ri === 0 ? " first" : ""}`}
                        >
                          <div className="perm-row-info" style={{ opacity: anyOff ? 0.38 : 1 }}>
                            <span className="material-symbols-outlined perm-row-icon">{row.icon}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="perm-row-label">{row.label}</div>
                              <div className="perm-row-desc">{row.desc}</div>
                            </div>
                          </div>
                          <div className="perm-col-checks">
                            {COLS.map(col => {
                              if (!row.acts.includes(col))
                                return <div key={col} className="perm-check-cell perm-check-na">—</div>
                              const k = permKey(row, col)
                              const on = perms[k] !== false
                              return (
                                <label key={col} className="perm-check-cell perm-check-toggle">
                                  <input type="checkbox" checked={on} onChange={e => toggle(k, e.target.checked)} style={{ display: "none" }} />
                                  <span className={`perm-check-circle${on ? " on" : ""}`}>
                                    {on && <span style={{ fontSize: 11, color: "#fff", fontWeight: 700 }}>✓</span>}
                                  </span>
                                  <span className={`perm-check-yes-no${on ? " on" : ""}`}>{on ? "Yes" : "No"}</span>
                                </label>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {toast && <Toast toast={toast} />}
    </div>
  )

  function RoleBadge({ role }: { role: string }) {
    const r = (role || "user").toUpperCase()
    const bg = r === "CEO" ? "rgba(234,179,8,.12)" : r === "ADMIN" ? "rgba(239,68,68,.1)" : "rgba(99,102,241,.12)"
    const cl = r === "CEO" ? "#eab308" : r === "ADMIN" ? "#ef4444" : "var(--accent-crm)"
    return <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 10px", borderRadius: 6, textTransform: "uppercase" as const, letterSpacing: 0.5, background: bg, color: cl }}>{r}</span>
  }

  function StatPill({ dot, label, val }: { dot: string; label: string; val: string }) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: "var(--text3)" }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: dot, display: "inline-block", flexShrink: 0 }} />
        {label} <span style={{ fontWeight: 800, color: "var(--text)", fontSize: 12, marginLeft: 1 }}>{val}</span>
      </div>
    )
  }

  function Toast({ toast }: { toast: { msg: string; type: ToastType } }) {
    return (
      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 99999, padding: "12px 20px", borderRadius: 12, fontSize: 13, fontWeight: 600, color: "#fff", background: toast.type === "error" ? "#ef4444" : toast.type === "warn" ? "#f59e0b" : "#10b981", boxShadow: "0 8px 24px rgba(0,0,0,.25)", animation: "fadeUp .3s ease" }}>
        {toast.msg}
      </div>
    )
  }
}