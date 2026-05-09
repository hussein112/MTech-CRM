"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { UserRow } from "./page"

const AVATAR_COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#f43f5e", "#f59e0b", "#10b981", "#3b82f6"]
const ROLE_LABELS: Record<string, string> = { admin: "Admin", ceo: "CEO", user: "User" }

function getInitials(name: string, email: string) {
  const src = name || email
  return src.split(" ").filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase() || email.slice(0, 2).toUpperCase()
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

interface Props { users: UserRow[]; currentUserId: number }
interface AddForm  { name: string; email: string; password: string; role: string }
interface PwForm   { password: string; confirm: string; error: string }
interface MailForm { to: string; subject: string; message: string; error: string }

const EMPTY_ADD:  AddForm  = { name: "", email: "", password: "", role: "user" }
const EMPTY_PW:   PwForm   = { password: "", confirm: "", error: "" }
const EMPTY_MAIL: MailForm = { to: "", subject: "", message: "", error: "" }

const fieldSt: React.CSSProperties = {
  width: "100%", padding: "10px 14px", background: "var(--bg3)",
  border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)",
  fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box",
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 5000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.45)", backdropFilter: "blur(4px)", animation: "fadeIn .18s ease" }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      {children}
    </div>
  )
}

function MField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text3)", marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )
}

function MFooter({ onCancel, onConfirm, label }: { onCancel: () => void; onConfirm: () => void; label: string }) {
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20 }}>
      <button onClick={onCancel} style={{ padding: "9px 18px", borderRadius: 10, border: "1px solid var(--border)", background: "transparent", color: "var(--text3)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
      <button onClick={onConfirm} style={{ padding: "9px 18px", borderRadius: 10, border: "none", background: "var(--accent)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{label}</button>
    </div>
  )
}

export function UsersClient({ users: initial, currentUserId }: Props) {
  const router = useRouter()
  const [users, setUsers]             = useState(initial)
  const [query, setQuery]             = useState("")
  const [roleFilter, setRoleFilter]   = useState("")
  const [statusFilter, setStatus]     = useState("")
  const [addOpen, setAddOpen]         = useState(false)
  const [addForm, setAddForm]         = useState<AddForm>(EMPTY_ADD)
  const [pwId, setPwId]               = useState<number | null>(null)
  const [pwForm, setPwForm]           = useState<PwForm>(EMPTY_PW)
  const [mailOpen, setMailOpen]       = useState(false)
  const [mailForm, setMailForm]       = useState<MailForm>(EMPTY_MAIL)
  const [delId, setDelId]             = useState<number | null>(null)

  const me     = users.find(u => u.id === currentUserId)
  const myRole = me?.role ?? "admin"
  const isAdmin = myRole === "admin" || myRole === "ceo"

  const canEdit = (u: UserRow) =>
    isAdmin && u.id !== currentUserId && (myRole === "ceo" || u.role === "user")

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return users.filter(u => {
      if (q && !u.full_name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false
      if (roleFilter && u.role !== roleFilter) return false
      if (statusFilter === "active" && !u.is_active) return false
      if (statusFilter === "inactive" && u.is_active) return false
      return true
    })
  }, [users, query, roleFilter, statusFilter])

  function saveName(id: number, val: string) {
    const v = val.trim()
    if (v) setUsers(prev => prev.map(u => u.id === id ? { ...u, full_name: v } : u))
  }

  function saveRole(id: number, role: string) {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role: role as UserRow["role"] } : u))
  }

  function saveActive(id: number, active: boolean) {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: active } : u))
  }

  function doDelete() {
    if (delId == null) return
    setUsers(prev => prev.filter(u => u.id !== delId))
    setDelId(null)
  }

  function submitAdd() {
    if (!addForm.name.trim() || !addForm.email.trim() || !addForm.password.trim()) {
      alert("Name, Email, and Password are required.")
      return
    }
    setUsers(prev => [...prev, {
      id: Date.now(), full_name: addForm.name.trim(), email: addForm.email.trim(),
      role: addForm.role as UserRow["role"], is_active: true, created_at: new Date().toISOString(),
    }])
    setAddOpen(false)
    setAddForm(EMPTY_ADD)
  }

  function submitPw() {
    if (pwForm.password.length < 6) { setPwForm(f => ({ ...f, error: "Password must be at least 6 characters." })); return }
    if (pwForm.password !== pwForm.confirm) { setPwForm(f => ({ ...f, error: "Passwords do not match." })); return }
    setPwId(null); setPwForm(EMPTY_PW)
  }

  function submitMail() {
    if (!mailForm.to || !mailForm.subject || !mailForm.message) {
      setMailForm(f => ({ ...f, error: "All fields are required." })); return
    }
    setMailOpen(false); setMailForm(EMPTY_MAIL)
  }

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      if (addOpen)           setAddOpen(false)
      else if (mailOpen)     setMailOpen(false)
      else if (pwId != null) { setPwId(null); setPwForm(EMPTY_PW) }
      else if (delId != null) setDelId(null)
    }
    window.addEventListener("keydown", h)
    return () => window.removeEventListener("keydown", h)
  }, [addOpen, mailOpen, pwId, delId])

  const pwUser  = users.find(u => u.id === pwId)
  const delUser = users.find(u => u.id === delId)

  return (
    <div className="dash-layout">

      {/* ── Header ── */}
      <div className="dash-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", margin: 0, letterSpacing: -0.5 }}>Users</h1>
          <p style={{ fontSize: 13, color: "var(--text3)", margin: "3px 0 0", fontWeight: 500 }}>
            Portal accounts · Edit name, role, or status inline
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, color: "var(--text3)", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 8, padding: "7px 14px" }}>
            {users.length} user{users.length !== 1 ? "s" : ""}
          </span>
          {isAdmin && (
            <>
              <button
                onClick={() => setMailOpen(true)}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--text)", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 17 }}>mail</span>
                Send Email Test
              </button>
              <button
                onClick={() => { setAddForm(EMPTY_ADD); setAddOpen(true) }}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 17 }}>person_add</span>
                Add User
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="tkt-filter-bar">
        <div className="tkt-search" style={{ flex: 1 }}>
          <span className="material-symbols-outlined">search</span>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <div className="tkt-filters">
          <select className="tkt-filter-sel" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="ceo">CEO</option>
          </select>
          <select className="tkt-filter-sel" value={statusFilter} onChange={e => setStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="tkt-filter-divider" />
        <span className="tkt-result-count">{filtered.length} user{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* ── Desktop table ── */}
      <div className="usr-table-outer">
        <div className="users-table-wrap">
          <table className="users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Member Since</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} style={{ textAlign: "center", padding: "48px 20px", color: "var(--text3)" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 36, display: "block", marginBottom: 10, opacity: 0.4 }}>group</span>
                    No users match your search.
                  </td>
                </tr>
              ) : filtered.map((u, i) => {
                const isMe     = u.id === currentUserId
                const editable = canEdit(u)
                const color    = AVATAR_COLORS[i % AVATAR_COLORS.length]
                return (
                  <tr key={u.id}>
                    <td>
                      <div className="user-row-info">
                        <div className="user-avatar-sm" style={{ background: color }}>
                          {getInitials(u.full_name, u.email)}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}>
                          <input
                            className="name-input"
                            defaultValue={u.full_name}
                            placeholder="Enter name"
                            disabled={!editable}
                            onBlur={e => saveName(u.id, e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur() }}
                            autoComplete="off"
                          />
                          {isMe && (
                            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", marginLeft: 8, padding: "2px 6px", background: "rgba(99,102,241,.1)", borderRadius: 4, flexShrink: 0 }}>Me</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ color: "var(--text3)" }}>{u.email}</td>
                    <td>
                      {editable ? (
                        <select
                          className="role-select"
                          data-role={u.role}
                          value={u.role}
                          onChange={e => saveRole(u.id, e.target.value)}
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                          {myRole === "ceo" && <option value="ceo">CEO</option>}
                        </select>
                      ) : (
                        <span className="role-select" data-role={u.role} style={{ cursor: "default" }}>
                          {ROLE_LABELS[u.role] ?? u.role}
                        </span>
                      )}
                    </td>
                    <td>
                      {editable ? (
                        <div className="status-cell">
                          <label className="usr-toggle" title={u.is_active ? "Click to disable" : "Click to enable"}>
                            <input
                              type="checkbox"
                              checked={u.is_active}
                              onChange={e => saveActive(u.id, e.target.checked)}
                            />
                            <span className="usr-toggle-track" />
                          </label>
                        </div>
                      ) : (
                        <span className={`status-pill ${u.is_active ? "active" : "inactive"}`}>
                          {u.is_active ? "Active" : "Inactive"}
                        </span>
                      )}
                    </td>
                    <td style={{ color: "var(--text3)" }}>{formatDate(u.created_at)}</td>
                    {isAdmin && (
                      <td style={{ whiteSpace: "nowrap" }}>
                        {editable && (
                          <>
                            <span
                              className="material-symbols-outlined usr-action-icon"
                              onClick={() => router.push(`/permissions?uid=${u.id}`)}
                              title="Manage Permissions"
                            >shield_person</span>
                            <span
                              className="material-symbols-outlined usr-action-icon"
                              onClick={() => { setPwId(u.id); setPwForm(EMPTY_PW) }}
                              title="Change Password"
                            >key</span>
                            <span
                              className="material-symbols-outlined usr-action-icon usr-action-danger"
                              onClick={() => setDelId(u.id)}
                              title="Remove user"
                            >delete</span>
                          </>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Mobile cards ── */}
      <div className="usr-cards-outer">
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text3)", fontSize: 13 }}>No users match your search.</div>
        )}
        {filtered.map((u, i) => {
          const editable = canEdit(u)
          const isMe     = u.id === currentUserId
          const color    = AVATAR_COLORS[i % AVATAR_COLORS.length]
          return (
            <div key={u.id} className="tkt-card" style={{ padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div className="user-avatar-sm" style={{ background: color }}>
                  {getInitials(u.full_name, u.email)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{u.full_name || "—"}</span>
                    {isMe && <span style={{ fontSize: 10, fontWeight: 700, color: "var(--accent)", padding: "1px 5px", background: "rgba(99,102,241,.1)", borderRadius: 4 }}>Me</span>}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</div>
                </div>
                <span className={`status-pill ${u.is_active ? "active" : "inactive"}`}>
                  {u.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="role-select" data-role={u.role} style={{ cursor: "default" }}>
                    {ROLE_LABELS[u.role]}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--text3)" }}>{formatDate(u.created_at)}</span>
                </div>
                {editable && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <span className="material-symbols-outlined usr-action-icon" onClick={() => router.push(`/permissions?uid=${u.id}`)} title="Permissions">shield_person</span>
                    <span className="material-symbols-outlined usr-action-icon" onClick={() => { setPwId(u.id); setPwForm(EMPTY_PW) }} title="Change Password">key</span>
                    <span className="material-symbols-outlined usr-action-icon usr-action-danger" onClick={() => setDelId(u.id)} title="Remove">delete</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Add User Modal ── */}
      {addOpen && (
        <Modal onClose={() => setAddOpen(false)}>
          <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 20, padding: 28, width: 440, maxWidth: "95vw", boxShadow: "0 24px 64px rgba(0,0,0,.2)" }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", margin: "0 0 20px", display: "flex", alignItems: "center", gap: 8 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>person_add</span>
              Add New User
            </h3>
            <MField label="Full Name *">
              <input type="text" placeholder="e.g. Jane Smith" value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} style={fieldSt} />
            </MField>
            <MField label="Email *">
              <input type="email" placeholder="user@mtechdistributors.com" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} style={fieldSt} />
            </MField>
            <MField label="Password *">
              <input type="password" placeholder="Enter a password" value={addForm.password} onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))} style={fieldSt} />
            </MField>
            <MField label="Role">
              <select value={addForm.role} onChange={e => setAddForm(f => ({ ...f, role: e.target.value }))} style={{ ...fieldSt, appearance: "none" as const }}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
                {myRole === "ceo" && <option value="ceo">CEO</option>}
              </select>
            </MField>
            <MFooter onCancel={() => setAddOpen(false)} onConfirm={submitAdd} label="Add User" />
          </div>
        </Modal>
      )}

      {/* ── Change Password Modal ── */}
      {pwId != null && (
        <Modal onClose={() => { setPwId(null); setPwForm(EMPTY_PW) }}>
          <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 20, padding: 28, width: 440, maxWidth: "95vw", boxShadow: "0 24px 64px rgba(0,0,0,.2)" }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", margin: "0 0 8px", display: "flex", alignItems: "center", gap: 8 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>lock_reset</span>
              Change Password
            </h3>
            <p style={{ fontSize: 13, color: "var(--text3)", margin: "0 0 20px" }}>For {pwUser?.full_name || pwUser?.email}</p>
            <MField label="New Password *">
              <input type="password" placeholder="Enter new password" autoComplete="new-password" value={pwForm.password} onChange={e => setPwForm(f => ({ ...f, password: e.target.value, error: "" }))} style={fieldSt} />
            </MField>
            <MField label="Confirm Password *">
              <input type="password" placeholder="Re-enter password" autoComplete="new-password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value, error: "" }))} style={fieldSt} />
            </MField>
            {pwForm.error && <div style={{ color: "#ef4444", fontSize: 12, fontWeight: 600, marginBottom: 12 }}>{pwForm.error}</div>}
            <MFooter onCancel={() => { setPwId(null); setPwForm(EMPTY_PW) }} onConfirm={submitPw} label="Reset Password" />
          </div>
        </Modal>
      )}

      {/* ── Send Email Modal ── */}
      {mailOpen && (
        <Modal onClose={() => setMailOpen(false)}>
          <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 20, padding: 28, width: 440, maxWidth: "95vw", boxShadow: "0 24px 64px rgba(0,0,0,.2)" }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", margin: "0 0 20px", display: "flex", alignItems: "center", gap: 8 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>mail</span>
              Send Email Test
            </h3>
            <MField label="Send To *">
              <input type="email" placeholder="recipient@example.com" value={mailForm.to} onChange={e => setMailForm(f => ({ ...f, to: e.target.value, error: "" }))} style={fieldSt} />
            </MField>
            <MField label="Subject *">
              <input type="text" placeholder="Test Email Subject" value={mailForm.subject} onChange={e => setMailForm(f => ({ ...f, subject: e.target.value, error: "" }))} style={fieldSt} />
            </MField>
            <MField label="Message *">
              <textarea placeholder="Type your message here..." rows={4} value={mailForm.message} onChange={e => setMailForm(f => ({ ...f, message: e.target.value, error: "" }))} style={{ ...fieldSt, resize: "vertical" as const }} />
            </MField>
            {mailForm.error && <div style={{ color: "#ef4444", fontSize: 12, fontWeight: 600, marginBottom: 12 }}>{mailForm.error}</div>}
            <MFooter onCancel={() => setMailOpen(false)} onConfirm={submitMail} label="Send Email" />
          </div>
        </Modal>
      )}

      {/* ── Delete Confirmation ── */}
      {delId != null && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 20000, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeIn .18s ease" }}
          onClick={e => { if (e.target === e.currentTarget) setDelId(null) }}
        >
          <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 16, padding: "28px 32px", maxWidth: 380, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,.5)", textAlign: "center", animation: "fadeUp .2s ease" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 40, color: "#ef4444", display: "block", marginBottom: 12 }}>delete_forever</span>
            <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: "var(--text)" }}>Remove User?</h3>
            <p style={{ margin: "0 0 22px", fontSize: 13, color: "var(--text3)", lineHeight: 1.5 }}>
              Remove <strong>{delUser?.full_name || delUser?.email}</strong> from the portal? This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={() => setDelId(null)} style={{ padding: "9px 22px", borderRadius: 10, fontWeight: 600, fontSize: 13, background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--text)", cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
              <button onClick={doDelete} style={{ padding: "9px 22px", borderRadius: 10, fontWeight: 700, fontSize: 13, background: "#ef4444", border: "none", color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>Remove</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
