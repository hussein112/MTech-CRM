"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { getSupabaseBrowser } from "@/lib/supabase-browser"

// ── Types ──────────────────────────────────────────────────────────────────
type Col = "view" | "create" | "edit" | "delete"

interface PermRow {
  id:    string
  label: string
  icon:  string
  page:  string
  acts:  Col[]
  desc:  string
}
interface PermCat { cat: string; rows: PermRow[] }

interface PortalUser {
  id:          number
  email:       string
  full_name:   string
  role:        string
  is_active:   boolean
  permissions: { pages?: Record<string, boolean>; capabilities?: Record<string, boolean> } | null
}

type Preset    = "full" | "standard" | "readonly" | "minimal"
type SaveState = "idle" | "saving" | "saved" | "error"
type ToastType = "ok" | "error" | "warn"

// ── Config ─────────────────────────────────────────────────────────────────
const COLS: Col[] = ["view", "create", "edit", "delete"]
const COL_LABELS: Record<Col, string> = { view: "View", create: "Create", edit: "Edit", delete: "Delete" }

const MODS: PermCat[] = [
  { cat: "Core Operations", rows: [
    { id: "tickets",   label: "Support Tickets",  icon: "confirmation_number", page: "tickets",          acts: ["view","create","edit","delete"], desc: "View, create, and manage support tickets"             },
    { id: "merchants", label: "Merchant Records",  icon: "storefront",          page: "merchants",        acts: ["view","create","edit","delete"], desc: "Browse and manage merchant accounts and MIDs"         },
    { id: "inventory", label: "Equipment & Stock", icon: "inventory_2",         page: "inventory",        acts: ["view","create","edit","delete"], desc: "Track equipment stock levels and terminal assignments" },
  ]},
  { cat: "Content & Resources", rows: [
    { id: "resources",    label: "Shared Resources", icon: "folder_shared", page: "resources",    acts: ["view","create","edit","delete"], desc: "Browse shared documents, guides, and training materials" },
    { id: "file_storage", label: "File Storage",      icon: "cloud_upload",  page: "file-storage", acts: ["view","create","edit","delete"], desc: "Upload, organize, and share files in cloud storage"      },
    { id: "onboarding",   label: "Onboarding Forms",  icon: "assignment",    page: "onboarding",   acts: ["view","create","edit"],          desc: "Access merchant and agent onboarding submissions"        },
  ]},
  { cat: "Scheduling & Tasks", rows: [
    { id: "calendar", label: "Calendar Events", icon: "calendar_month", page: "calendar", acts: ["view","create","edit","delete"], desc: "View and manage team events and meetings"     },
    { id: "tasks",    label: "Tasks",           icon: "task_alt",       page: "tasks",    acts: ["view","create","edit","delete"], desc: "Personal and team task lists and assignments" },
    { id: "timecard", label: "Timecards",       icon: "timer",          page: "timecard", acts: ["view","create"],                 desc: "Clock in/out and view work hours"             },
  ]},
  { cat: "Communication", rows: [
    { id: "feedback",  label: "Community Feedback", icon: "feedback", page: "feedback",  acts: ["view","create","edit"], desc: "Submit and review feedback and feature requests" },
    { id: "changelog", label: "Changelog",           icon: "campaign", page: "changelog", acts: ["view"],                 desc: "View portal update history and release notes"    },
  ]},
  { cat: "Administration", rows: [
    { id: "dashboard", label: "Dashboard",        icon: "dashboard",       page: "dashboard",        acts: ["view"],                         desc: "Main portal overview with stats and quick actions" },
    { id: "activity",  label: "Activity Log",     icon: "history",         page: "activity",         acts: ["view"],                         desc: "Real-time feed of all portal actions by all users" },
    { id: "users",     label: "User Management",  icon: "manage_accounts", page: "users",            acts: ["view","create","edit","delete"], desc: "Add, remove, and manage portal user accounts"      },
    { id: "agents",    label: "Agents",           icon: "support_agent",   page: "agents",           acts: ["view","create","edit","delete"], desc: "View and manage sales agent profiles"              },
    { id: "tools",     label: "Tools",            icon: "build",           page: "tools",            acts: ["view"],                         desc: "Access internal utilities and calculators"         },
    { id: "passwords", label: "Password Manager", icon: "passkey",         page: "password-manager", acts: ["view","edit"],                   desc: "Access the team shared password vault"             },
  ]},
]

const MINIMAL_PAGES = ["dashboard","tickets","tasks","timecard","feedback","changelog"]
const AV_COLORS     = ["#6366f1","#8b5cf6","#06b6d4","#f43f5e","#f59e0b","#10b981","#3b82f6","#ec4899"]
const PRESETS: { id: Preset; label: string }[] = [
  { id: "full",     label: "Full Access" },
  { id: "standard", label: "Standard"   },
  { id: "readonly", label: "View Only"  },
  { id: "minimal",  label: "Minimal"    },
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
        case "full":     out[k] = true; break
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

function enabledPageCount(user: PortalUser): number {
  const { pages = {} } = user.permissions ?? {}
  const total = MODS.reduce((n, c) => n + c.rows.length, 0)
  const disabled = Object.values(pages).filter(v => v === false).length
  return total - disabled
}

// ── Component ──────────────────────────────────────────────────────────────
export function PermissionsClient() {
  const db           = getSupabaseBrowser()
  const searchParams = useSearchParams()

  const [users,        setUsers]        = useState<PortalUser[]>([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState("")
  const [selId,        setSelId]        = useState<number | null>(null)
  const [perms,        setPerms]        = useState<Record<string, boolean>>({})
  const [saveState,    setSaveState]    = useState<SaveState>("idle")
  const [activePreset, setActivePreset] = useState<Preset | null>(null)
  const [toast,        setToast]        = useState<{ msg: string; type: ToastType } | null>(null)

  // ── Load ─────────────────────────────────────────────────────────────────
  const loadUsers = useCallback(async () => {
    if (!db) { setLoading(false); return }
    const { data } = await db
      .from("portal_users")
      .select("id,email,full_name,role,is_active,permissions")
      .order("full_name")
    const list: PortalUser[] = data ?? []
    setUsers(list)
    setLoading(false)
    const uid = searchParams.get("uid")
    if (uid) openEditor(parseInt(uid), list)
  }, [db]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadUsers() }, [loadUsers])

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
    setSelId(null)
    const url = new URL(window.location.href)
    url.searchParams.delete("uid")
    window.history.replaceState({}, "", url.toString())
  }

  function toggle(key: string, val: boolean) {
    setPerms(prev => ({ ...prev, [key]: val }))
    setActivePreset(null)
  }

  function applyPreset(p: Preset) { setPerms(presetPerms(p)); setActivePreset(p) }
  function resetDefaults()        { setPerms(allTruePerms()); setActivePreset(null) }

  // ── Save ─────────────────────────────────────────────────────────────────
  async function save() {
    if (!selId || !db) return
    setSaveState("saving")
    const pages: Record<string, boolean> = {}
    const caps:  Record<string, boolean> = {}
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
    try {
      const { error } = await db.from("portal_users").update({ permissions }).eq("id", selId)
      if (error) throw error
      setUsers(prev => prev.map(u => u.id === selId ? { ...u, permissions } : u))
      setSaveState("saved")
      showToast("Permissions saved successfully", "ok")
      setTimeout(() => setSaveState("idle"), 1500)
    } catch (err: any) {
      setSaveState("error")
      showToast("Failed to save: " + (err.message ?? "Unknown error"), "error")
      setTimeout(() => setSaveState("idle"), 2000)
    }
  }

  function showToast(msg: string, type: ToastType) {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const selectedUser  = users.find(u => u.id === selId)
  const filteredUsers = users.filter(u =>
    !search ||
    (u.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (u.email     ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (u.role      ?? "").toLowerCase().includes(search.toLowerCase())
  )
  const summary = selId ? summarise(perms) : null

  // ══════════════════════════════════════════════════════════════════════════
  // VIEW A — User list
  // ══════════════════════════════════════════════════════════════════════════
  if (!selId || !selectedUser) {
    return (
      <div className="dash-layout" style={{ fontFamily: "'Mulish', sans-serif" }}>

        {/* Page header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 32, paddingBottom: 24, borderBottom: "1px solid var(--border)" }}>
          <div>
            <div style={{ fontSize: 32, fontWeight: 900, color: "var(--text)", letterSpacing: -0.5 }}>Permissions</div>
            <div style={{ fontSize: 15, color: "var(--text3)", marginTop: 8, fontWeight: 500 }}>
              Select a user to manage their access and capabilities.
            </div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text2)", display: "flex", alignItems: "center", gap: 6, background: "var(--bg2)", padding: "8px 16px", borderRadius: 12, border: "1px solid var(--border)" }}>
            <span className="material-symbols-outlined" style={{ color: "var(--accent-crm)", fontSize: 18 }}>group</span>
            {users.length} Users
          </div>
        </div>

        {/* Search */}
        <div style={{ position: "relative", maxWidth: 400, marginBottom: 28 }}>
          <span className="material-symbols-outlined" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 18, color: "var(--text3)", pointerEvents: "none" }}>search</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email or role…"
            style={{ width: "100%", padding: "11px 14px 11px 42px", background: "var(--bg2)", border: "1.5px solid var(--border)", borderRadius: 12, fontSize: 13, color: "var(--text)", fontWeight: 600, outline: "none", fontFamily: "inherit", boxSizing: "border-box", transition: ".15s" }}
            onFocus={e  => (e.currentTarget.style.borderColor = "var(--accent-crm)")}
            onBlur={e   => (e.currentTarget.style.borderColor = "var(--border)")}
          />
        </div>

        {/* User grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text3)", fontSize: 14 }}>Loading users…</div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text3)", fontSize: 14 }}>No users found</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
            {filteredUsers.map(u => {
              const name     = u.full_name || u.email || ""
              const r        = (u.role || "user").toLowerCase()
              const roleColor = r === "ceo" ? "#eab308" : r === "admin" ? "#ef4444" : "var(--accent-crm)"
              const roleBg    = r === "ceo" ? "rgba(234,179,8,.12)" : r === "admin" ? "rgba(239,68,68,.1)" : "rgba(99,102,241,.1)"
              const pagesOn  = enabledPageCount(u)
              const totalPages = MODS.reduce((n, c) => n + c.rows.length, 0)
              const pct      = Math.round((pagesOn / totalPages) * 100)

              return (
                <UserCard
                  key={u.id}
                  u={u}
                  name={name}
                  r={r}
                  roleColor={roleColor}
                  roleBg={roleBg}
                  pagesOn={pagesOn}
                  totalPages={totalPages}
                  pct={pct}
                  onClick={() => openEditor(u.id)}
                />
              )
            })}
          </div>
        )}

        {toast && <Toast toast={toast} />}
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // VIEW B — Permission editor
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ display: "flex", height: "calc(100vh - 56px)", overflow: "hidden", fontFamily: "'Mulish', sans-serif" }}>

      {/* ── Left: user mini-list ── */}
      <aside style={{ width: 260, borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", flexShrink: 0, background: "var(--bg)" }}>
        <div style={{ padding: "16px 14px 12px", borderBottom: "1px solid var(--border)" }}>
          <button
            onClick={closeEditor}
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "var(--text3)", background: "none", border: "none", cursor: "pointer", padding: "4px 0", marginBottom: 12, fontFamily: "inherit" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--accent-crm)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--text3)")}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
            All Users
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 10, padding: "7px 10px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15, color: "var(--text3)" }}>search</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              style={{ border: "none", background: "none", color: "var(--text)", fontSize: 12, outline: "none", width: "100%", fontFamily: "inherit" }}
            />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "6px 8px" }}>
          {(search ? filteredUsers : users).map(u => {
            const name   = u.full_name || u.email || ""
            const r      = (u.role || "user").toLowerCase()
            const rc     = r === "ceo" ? "#eab308" : r === "admin" ? "#ef4444" : "var(--accent-crm)"
            const active = u.id === selId
            return (
              <div
                key={u.id}
                onClick={() => openEditor(u.id)}
                style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: 10, cursor: "pointer", transition: "all .15s", marginBottom: 2, background: active ? "rgba(99,102,241,.1)" : "transparent", boxShadow: active ? "inset 3px 0 0 var(--accent-crm)" : "none" }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = "var(--bg2)" }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent" }}
              >
                <div style={{ width: 30, height: 30, borderRadius: 8, background: AV_COLORS[u.id % AV_COLORS.length], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                  {initials(name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
                  <div style={{ fontSize: 9.5, fontWeight: 700, marginTop: 1, textTransform: "uppercase", letterSpacing: 0.3, color: rc }}>{r.toUpperCase()}</div>
                </div>
                {active && <span className="material-symbols-outlined" style={{ fontSize: 14, color: "var(--accent-crm)" }}>chevron_right</span>}
              </div>
            )
          })}
        </div>
      </aside>

      {/* ── Right: permission grid ── */}
      <main style={{ flex: 1, overflowY: "auto", background: "var(--bg)" }}>

        {/* User header */}
        <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "22px 32px", borderBottom: "1px solid var(--border)", background: "linear-gradient(135deg,rgba(99,102,241,.03),rgba(139,92,246,.03))" }}>
          <div style={{ width: 50, height: 50, borderRadius: 14, background: AV_COLORS[selId % AV_COLORS.length], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#fff", flexShrink: 0, boxShadow: "0 4px 12px rgba(0,0,0,.15)" }}>
            {initials(selectedUser.full_name || selectedUser.email || "")}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text)", display: "flex", alignItems: "center", gap: 8 }}>
              {selectedUser.full_name || selectedUser.email}
              <RoleBadge role={selectedUser.role} />
            </div>
            <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 3 }}>{selectedUser.email}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <GhostBtn icon="restart_alt" onClick={resetDefaults}>Reset</GhostBtn>
            <button
              onClick={save}
              disabled={saveState === "saving"}
              style={{ padding: "8px 18px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: saveState === "saving" ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, background: saveState === "saved" ? "#10b981" : "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", color: "#fff", boxShadow: "0 2px 8px rgba(99,102,241,.3)", transition: "all .15s", opacity: saveState === "saving" ? 0.6 : 1 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                {saveState === "saving" ? "hourglass_empty" : saveState === "saved" ? "check_circle" : "save"}
              </span>
              {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved!" : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Presets */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 32px", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 0.4, marginRight: 4 }}>Presets:</span>
          {PRESETS.map(p => {
            const active = activePreset === p.id
            return (
              <button
                key={p.id}
                onClick={() => applyPreset(p.id)}
                style={{ padding: "5px 14px", borderRadius: 20, fontSize: 11, fontWeight: 600, border: `1px solid ${active ? "var(--accent-crm)" : "var(--border)"}`, cursor: "pointer", fontFamily: "inherit", transition: "all .15s", background: active ? "var(--accent-crm)" : "transparent", color: active ? "#fff" : "var(--text3)", boxShadow: active ? "0 2px 8px rgba(99,102,241,.25)" : "none" }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = "var(--accent-crm)"; e.currentTarget.style.color = "var(--accent-crm)" } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text3)" } }}
              >
                {p.label}
              </button>
            )
          })}
          {summary && (
            <div style={{ marginLeft: "auto", display: "flex", gap: 14 }}>
              <StatPill dot="#10b981"          label="Enabled" val={`${summary.enabled}/${summary.total}`} />
              <StatPill dot="var(--accent-crm)" label="Pages"   val={`${summary.pageE}/${summary.pageT}`} />
              <StatPill dot="#f59e0b"           label="Actions" val={`${summary.enabled - summary.pageE}/${summary.total - summary.pageT}`} />
            </div>
          )}
        </div>

        {/* Grid */}
        <div style={{ padding: "12px 32px 60px" }}>
          {MODS.map((cat, ci) => (
            <div key={cat.cat} style={{ marginTop: ci === 0 ? 10 : 22 }}>
              <div style={{ display: "flex", alignItems: "center", paddingBottom: 10 }}>
                <div style={{ flex: 1, fontSize: 13, fontWeight: 800, color: "var(--text)", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 3, height: 14, borderRadius: 2, background: "var(--accent-crm)", display: "inline-block" }} />
                  {cat.cat}
                </div>
                <div style={{ display: "flex", width: 360, flexShrink: 0 }}>
                  {COLS.map(c => (
                    <div key={c} style={{ width: 90, textAlign: "center", fontSize: 10, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                      {COL_LABELS[c]}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", background: "var(--bg2)", boxShadow: "0 1px 4px rgba(0,0,0,.03)" }}>
                {cat.rows.map((row, ri) => {
                  const anyOff = row.acts.some(a => perms[permKey(row, a)] === false)
                  return (
                    <div
                      key={row.id}
                      style={{ display: "flex", alignItems: "center", padding: "11px 16px", borderTop: ri === 0 ? "none" : "1px solid var(--border)", transition: "background .12s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(99,102,241,.025)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, minWidth: 0, opacity: anyOff ? 0.38 : 1, transition: "opacity .15s" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 17, color: "var(--accent-crm)", opacity: 0.65, width: 20, textAlign: "center" }}>{row.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{row.label}</div>
                          <div style={{ fontSize: 10.5, color: "var(--text3)", marginTop: 1, lineHeight: 1.35 }}>{row.desc}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", width: 360, flexShrink: 0 }}>
                        {COLS.map(col => {
                          if (!row.acts.includes(col))
                            return <div key={col} style={{ width: 90, textAlign: "center", fontSize: 10, color: "var(--border)", fontWeight: 500 }}>—</div>
                          const k  = permKey(row, col)
                          const on = perms[k] !== false
                          return (
                            <label key={col} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, width: 90, cursor: "pointer", userSelect: "none" }}>
                              <input type="checkbox" checked={on} onChange={e => toggle(k, e.target.checked)} style={{ display: "none" }} />
                              <span style={{ width: 22, height: 22, borderRadius: "50%", border: on ? "none" : "2px solid var(--border)", background: on ? "linear-gradient(135deg,#6366f1,#818cf8)" : "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s cubic-bezier(.4,0,.2,1)", boxShadow: on ? "0 2px 6px rgba(99,102,241,.3)" : "none", transform: on ? "scale(1.05)" : "none", flexShrink: 0 }}>
                                {on && <span style={{ fontSize: 11, color: "#fff", fontWeight: 700 }}>✓</span>}
                              </span>
                              <span style={{ fontSize: 10, fontWeight: 600, color: on ? "var(--accent-crm)" : "var(--text3)" }}>{on ? "Yes" : "No"}</span>
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
      </main>

      {toast && <Toast toast={toast} />}
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────
function UserCard({ u, name, r, roleColor, roleBg, pagesOn, totalPages, pct, onClick }: {
  u: PortalUser; name: string; r: string
  roleColor: string; roleBg: string
  pagesOn: number; totalPages: number; pct: number
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background: "var(--bg2)", border: `1px solid ${hovered ? "var(--accent-crm)" : "var(--border)"}`, borderRadius: 16, padding: 20, cursor: "pointer", transition: "all .18s", transform: hovered ? "translateY(-2px)" : "none", boxShadow: hovered ? "0 8px 24px rgba(0,0,0,.07)" : "0 2px 8px rgba(0,0,0,.02)" }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: AV_COLORS[u.id % AV_COLORS.length], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff", flexShrink: 0, boxShadow: "0 3px 8px rgba(0,0,0,.14)" }}>
          {initials(name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
          <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.email}</div>
        </div>
        <span style={{ fontSize: 9.5, fontWeight: 700, padding: "3px 9px", borderRadius: 6, textTransform: "uppercase", letterSpacing: 0.4, background: roleBg, color: roleColor, flexShrink: 0 }}>
          {r}
        </span>
      </div>

      {/* Access bar */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text3)" }}>Page access</span>
          <span style={{ fontSize: 11, fontWeight: 800, color: "var(--text)" }}>{pagesOn}/{totalPages}</span>
        </div>
        <div style={{ height: 5, borderRadius: 3, background: "var(--border)", overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 3, width: `${pct}%`, background: pct === 100 ? "#10b981" : pct >= 60 ? "var(--accent-crm)" : "#f59e0b", transition: "width .3s" }} />
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: u.is_active ? "#10b981" : "var(--text3)", display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: u.is_active ? "#10b981" : "var(--border)", display: "inline-block" }} />
          {u.is_active ? "Active" : "Inactive"}
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, color: hovered ? "var(--accent-crm)" : "var(--text3)", display: "flex", alignItems: "center", gap: 3, transition: ".15s" }}>
          Edit permissions
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
        </span>
      </div>
    </div>
  )
}

function RoleBadge({ role }: { role: string }) {
  const r  = (role || "user").toUpperCase()
  const bg = r === "CEO" ? "rgba(234,179,8,.12)" : r === "ADMIN" ? "rgba(239,68,68,.1)" : "rgba(99,102,241,.12)"
  const cl = r === "CEO" ? "#eab308"             : r === "ADMIN" ? "#ef4444"            : "var(--accent-crm)"
  return <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 10px", borderRadius: 6, textTransform: "uppercase", letterSpacing: 0.5, background: bg, color: cl }}>{r}</span>
}

function GhostBtn({ icon, onClick, children }: { icon: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{ padding: "8px 14px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, background: "var(--bg2)", border: "1px solid var(--border)", color: "var(--text2)", transition: "all .15s" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent-crm)"; e.currentTarget.style.color = "var(--accent-crm)" }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)";     e.currentTarget.style.color = "var(--text2)" }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 15 }}>{icon}</span>
      {children}
    </button>
  )
}

function StatPill({ dot, label, val }: { dot: string; label: string; val: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: "var(--text3)" }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: dot, display: "inline-block" }} />
      {label} <span style={{ fontWeight: 800, color: "var(--text)", fontSize: 12, marginLeft: 1 }}>{val}</span>
    </div>
  )
}

function Toast({ toast }: { toast: { msg: string; type: ToastType } }) {
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 99999, padding: "12px 20px", borderRadius: 12, fontSize: 13, fontWeight: 600, color: "#fff", background: toast.type === "error" ? "#ef4444" : toast.type === "warn" ? "#f59e0b" : "#10b981", boxShadow: "0 8px 24px rgba(0,0,0,.25)", fontFamily: "inherit" }}>
      {toast.msg}
    </div>
  )
}
