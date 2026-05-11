"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { getSupabaseBrowser } from "@/lib/supabase-browser"

// ── Types ──────────────────────────────────────────────────────────────────
type TaskType = "Action Item" | "Reminder" | "Follow-up" | "Notification"
type Priority  = "Low" | "Medium" | "High"
type TaskStatus = "pending" | "completed"

interface Task {
  id:         string
  _dbId?:     number
  title:      string
  desc:       string
  type:       TaskType
  priority:   Priority
  due_date:   string | null
  assigned:   string
  status:     TaskStatus
  created_at: string
}

// ── Static config ──────────────────────────────────────────────────────────
const TYPE_OPTS: { type: TaskType; icon: string; sub: string }[] = [
  { type: "Action Item",  icon: "bolt",     sub: "Deliverable or work to execute"     },
  { type: "Reminder",     icon: "alarm",    sub: "Time-sensitive note to self"         },
  { type: "Follow-up",    icon: "forum",    sub: "Check in with a merchant or agent"   },
  { type: "Notification", icon: "campaign", sub: "Inform internal team members"        },
]

const TYPE_BADGE: Record<TaskType, { icon: string; color: string; bg: string }> = {
  "Action Item":  { icon: "bolt",     color: "#6366f1", bg: "rgba(99,102,241,0.1)"  },
  "Reminder":     { icon: "alarm",    color: "#f59e0b", bg: "rgba(245,158,11,0.1)"  },
  "Follow-up":    { icon: "forum",    color: "#8b5cf6", bg: "rgba(139,92,246,0.1)"  },
  "Notification": { icon: "campaign", color: "#10b981", bg: "rgba(16,185,129,0.1)"  },
}

const PRIO_STYLE: Record<Priority, { color: string; border: string }> = {
  High:   { color: "#ef4444",        border: "rgba(239,68,68,0.3)"  },
  Medium: { color: "#f59e0b",        border: "rgba(245,158,11,0.3)" },
  Low:    { color: "var(--text3)",   border: "var(--border)"         },
}

// ── Helpers ────────────────────────────────────────────────────────────────
function formatDue(dStr: string | null): { text: string; overdue: boolean } | null {
  if (!dStr) return null
  const d = new Date(dStr + "T12:00:00")
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const dm    = new Date(d); dm.setHours(0, 0, 0, 0)
  const tom   = new Date(today); tom.setDate(today.getDate() + 1)
  const yest  = new Date(today); yest.setDate(today.getDate() - 1)
  let text = ""
  if (dm.getTime() === today.getTime()) text = "Today"
  else if (dm.getTime() === tom.getTime())  text = "Tomorrow"
  else if (dm.getTime() === yest.getTime()) text = "Yesterday"
  else text = dm.toLocaleString("en-US", {
    month: "short", day: "numeric",
    year: dm.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  })
  return { text, overdue: dm < today }
}

function initials(name: string) {
  return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() || "?"
}

// ── Shared styles ──────────────────────────────────────────────────────────
const labelSt: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 800, color: "var(--text2)",
  textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8,
}
const inputSt: React.CSSProperties = {
  width: "100%", background: "var(--bg2)", border: "1.5px solid var(--border)",
  borderRadius: 10, padding: "11px 14px", fontSize: 13,
  fontFamily: "'Mulish', sans-serif", color: "var(--text)", fontWeight: 600,
  outline: "none", transition: ".15s", boxSizing: "border-box",
}

// ══════════════════════════════════════════════════════════════════════════
export function TasksClient() {
  const db = getSupabaseBrowser()

  const [tasks,   setTasks]   = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editId,    setEditId]    = useState<string | null>(null)
  const [taskType,  setTaskType]  = useState<TaskType>("Action Item")
  const [title,     setTitle]     = useState("")
  const [desc,      setDesc]      = useState("")
  const [notes,     setNotes]     = useState("")
  const [priority,  setPriority]  = useState<Priority>("Medium")
  const [dueDate,   setDueDate]   = useState("")
  const [assignees, setAssignees] = useState<string[]>([])

  // Assignee dropdown
  const [agentSearch,   setAgentSearch]   = useState("")
  const [agentDropOpen, setAgentDropOpen] = useState(false)
  const [agentList,     setAgentList]     = useState<string[]>([])
  const assigneeRef = useRef<HTMLDivElement>(null)

  const [saving, setSaving] = useState(false)

  // ── Load tasks ──────────────────────────────────────────────────────────
  const loadTasks = useCallback(async () => {
    if (!db) { setLoading(false); return }
    try {
      const { data, error } = await db
        .from("tickets")
        .select("id,ticket_id,subject,description,category,priority,due_date,assigned,status,created_at")
        .like("ticket_id", "TSK-%")
        .order("created_at", { ascending: false })
      if (error) throw error
      setTasks((data ?? []).map((t: any) => ({
        id:         t.ticket_id,
        _dbId:      t.id,
        title:      t.subject      ?? "",
        desc:       t.description  ?? "",
        type:       (t.category    ?? "Action Item") as TaskType,
        priority:   (t.priority    ?? "Medium") as Priority,
        due_date:   t.due_date     ?? null,
        assigned:   t.assigned     ?? "",
        status:     t.status === "Resolved" ? "completed" : "pending",
        created_at: t.created_at   ?? new Date().toISOString(),
      })))
    } catch (err) {
      console.error("loadTasks:", err)
    } finally {
      setLoading(false)
    }
  }, [db])

  // ── Load agents ─────────────────────────────────────────────────────────
  const loadAgents = useCallback(async () => {
    if (!db) return
    try {
      const { data } = await db
        .from("portal_agents")
        .select("full_name")
        .order("full_name")
      if (data?.length) setAgentList(data.map((a: any) => a.full_name).filter(Boolean))
    } catch { /* agents table optional */ }
  }, [db])

  useEffect(() => { loadTasks(); loadAgents() }, [loadTasks, loadAgents])

  // ── Close assignee dropdown on outside click ────────────────────────────
  useEffect(() => {
    function down(e: MouseEvent) {
      if (assigneeRef.current && !assigneeRef.current.contains(e.target as Node))
        setAgentDropOpen(false)
    }
    document.addEventListener("mousedown", down)
    return () => document.removeEventListener("mousedown", down)
  }, [])

  // ── Realtime subscription ───────────────────────────────────────────────
  useEffect(() => {
    if (!db) return
    const ch = db.channel("mtech-tasks-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "tickets" }, payload => {
        const row = (payload.new ?? payload.old ?? {}) as any
        if (row.ticket_id?.startsWith("TSK-")) loadTasks()
      })
      .subscribe()
    return () => { db.removeChannel(ch) }
  }, [db, loadTasks])

  // ── Modal helpers ───────────────────────────────────────────────────────
  function openModal(id?: string) {
    if (id) {
      const t = tasks.find(x => x.id === id)
      if (!t) return
      setEditId(id)
      setTitle(t.title); setDesc(t.desc); setNotes("")
      setPriority(t.priority); setDueDate(t.due_date ?? "")
      setTaskType(t.type)
      setAssignees(t.assigned ? t.assigned.split(",").map(s => s.trim()).filter(Boolean) : [])
    } else {
      setEditId(null)
      setTitle(""); setDesc(""); setNotes("")
      setPriority("Medium"); setDueDate("")
      setTaskType("Action Item"); setAssignees([])
    }
    setAgentDropOpen(false); setAgentSearch("")
    setModalOpen(true)
  }
  function closeModal() { setModalOpen(false) }

  function toggleAssignee(name: string) {
    setAssignees(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name])
  }

  // ── Save ────────────────────────────────────────────────────────────────
  async function save() {
    if (!title.trim()) return
    setSaving(true)
    const assignedStr = assignees.join(", ") || "Unassigned"
    const isEdit  = !!editId
    const ticketId = isEdit ? editId! : "TSK-" + Math.floor(10000 + Math.random() * 90000)
    const prevTask = tasks.find(t => t.id === editId)

    const optimistic: Task = {
      id:         ticketId,
      _dbId:      prevTask?._dbId,
      title:      title.trim(),
      desc:       desc.trim(),
      type:       taskType,
      priority,
      due_date:   dueDate || null,
      assigned:   assignedStr,
      status:     prevTask?.status ?? "pending",
      created_at: prevTask?.created_at ?? new Date().toISOString(),
    }

    setTasks(prev => isEdit
      ? prev.map(t => t.id === editId ? optimistic : t)
      : [optimistic, ...prev]
    )
    closeModal()
    setSaving(false)

    if (!db) return
    const record: Record<string, any> = {
      subject: title.trim(), description: desc.trim(),
      category: taskType, priority, due_date: dueDate || null,
      assigned: assignedStr,
    }
    if (!isEdit) {
      record.ticket_id = ticketId
      record.status = "Open"
      record.dept = "Tasks"
    }

    try {
      let savedDbId: number | undefined
      if (isEdit) {
        const { data, error } = await db.from("tickets").update(record).eq("ticket_id", ticketId).select("id").single()
        if (error) throw error
        savedDbId = data?.id
      } else {
        const { data, error } = await db.from("tickets").insert(record).select("id").single()
        if (error) throw error
        savedDbId = data?.id
      }
      if (notes.trim() && savedDbId) {
        await db.from("ticket_notes").insert({
          ticket_id:  savedDbId,
          text:       notes.trim(),
          created_at: new Date().toISOString(),
        })
      }
      loadTasks()
    } catch (err) {
      console.error("save task:", err)
      loadTasks()
    }
  }

  // ── Toggle complete ─────────────────────────────────────────────────────
  async function toggle(id: string) {
    const t = tasks.find(x => x.id === id)
    if (!t) return
    const next: TaskStatus = t.status === "completed" ? "pending" : "completed"
    setTasks(prev => prev.map(x => x.id === id ? { ...x, status: next } : x))
    if (!db) return
    await db.from("tickets").update({ status: next === "completed" ? "Resolved" : "Open" }).eq("ticket_id", id)
  }

  // ── Delete ──────────────────────────────────────────────────────────────
  async function del(id: string) {
    setTasks(prev => prev.filter(x => x.id !== id))
    if (!db) return
    await db.from("tickets").delete().eq("ticket_id", id)
  }

  const pending   = tasks.filter(t => t.status !== "completed")
  const completed = tasks.filter(t => t.status === "completed")
  const filteredAgents = agentList.filter(a =>
    a.toLowerCase().includes(agentSearch.toLowerCase()) && !assignees.includes(a)
  )

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="dash-layout" style={{ fontFamily: "'Mulish', sans-serif" }}>

      {/* ── Page header ── */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 32, paddingBottom: 24, borderBottom: "1px solid var(--border)" }}>
        <div>
          <div style={{ fontSize: 32, fontWeight: 900, color: "var(--text)", letterSpacing: -0.5 }}>My Tasks</div>
          <div style={{ fontSize: 15, color: "var(--text3)", marginTop: 8, fontWeight: 500 }}>
            Manage assignments, action items, and cross-team follow-ups.
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text2)", display: "flex", alignItems: "center", gap: 6, background: "var(--bg2)", padding: "8px 16px", borderRadius: 12, border: "1px solid var(--border)" }}>
            <span className="material-symbols-outlined" style={{ color: "#10b981", fontSize: 18 }}>task_alt</span>
            {completed.length} Completed
          </div>
          <button
            onClick={() => openModal()}
            style={{ background: "var(--accent-crm)", color: "#fff", border: "none", borderRadius: 12, padding: "10px 24px", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", boxShadow: "0 4px 15px rgba(99,102,241,0.3)" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>add</span>
            New Task
          </button>
        </div>
      </div>

      {/* ── Open tasks ── */}
      <SectionTitle label="Open Tasks" />
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text3)", fontSize: 14 }}>Loading tasks…</div>
      ) : pending.length === 0 ? (
        <EmptyState />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {pending.map(t => (
            <TaskCard key={t.id} task={t} onToggle={toggle} onEdit={openModal} onDelete={del} />
          ))}
        </div>
      )}

      {/* ── Completed ── */}
      {completed.length > 0 && (
        <>
          <SectionTitle label="Completed" style={{ marginTop: 60 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {completed.map(t => (
              <TaskCard key={t.id} task={t} onToggle={toggle} onEdit={openModal} onDelete={del} />
            ))}
          </div>
        </>
      )}

      {/* ── Create / Edit modal ── */}
      {modalOpen && (
        <div
          onClick={e => { if (e.target === e.currentTarget) closeModal() }}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 24, width: "100%", maxWidth: 640, boxShadow: "0 24px 60px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column", maxHeight: "90vh", overflow: "hidden" }}>

            {/* Header */}
            <div style={{ padding: "20px 28px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg2)" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ background: "var(--accent-crm)", width: 10, height: 22, borderRadius: 4 }} />
                {editId ? "Edit Task" : "Create New Task"}
              </div>
              <button
                onClick={closeModal}
                style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--bg)", border: "1px solid var(--border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text3)" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: "24px 28px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Type cards */}
              <div>
                <label style={labelSt}>Task Type</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {TYPE_OPTS.map(opt => (
                    <div
                      key={opt.type}
                      onClick={() => setTaskType(opt.type)}
                      style={{ border: `1.5px solid ${taskType === opt.type ? "var(--accent-crm)" : "var(--border)"}`, borderRadius: 12, padding: "11px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, background: taskType === opt.type ? "rgba(99,102,241,0.05)" : "var(--bg)", transition: ".15s" }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 20, color: taskType === opt.type ? "var(--accent-crm)" : "var(--text3)" }}>{opt.icon}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{opt.type}</div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text3)", marginTop: 1 }}>{opt.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label style={labelSt}>Subject</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g., Review Q4 Sales Deck with Marketing"
                  style={inputSt}
                  onFocus={e => (e.currentTarget.style.borderColor = "var(--accent-crm)")}
                  onBlur={e  => (e.currentTarget.style.borderColor = "var(--border)")}
                />
              </div>

              {/* Description */}
              <div>
                <label style={labelSt}>
                  Details <span style={{ opacity: 0.5, fontWeight: 500, textTransform: "none", fontSize: 11 }}>(Optional)</span>
                </label>
                <textarea
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  placeholder="Add any necessary context, links, or instructions..."
                  rows={3}
                  style={{ ...inputSt, resize: "vertical", lineHeight: 1.5 }}
                  onFocus={e => (e.currentTarget.style.borderColor = "var(--accent-crm)")}
                  onBlur={e  => (e.currentTarget.style.borderColor = "var(--border)")}
                />
              </div>

              {/* Notes */}
              <div>
                <label style={labelSt}>
                  Notes <span style={{ opacity: 0.5, fontWeight: 500, textTransform: "none", fontSize: 11 }}>(Optional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Add any internal tracking notes..."
                  rows={2}
                  style={{ ...inputSt, resize: "vertical", lineHeight: 1.5 }}
                  onFocus={e => (e.currentTarget.style.borderColor = "var(--accent-crm)")}
                  onBlur={e  => (e.currentTarget.style.borderColor = "var(--border)")}
                />
              </div>

              {/* Assignees */}
              <div>
                <label style={labelSt}>Assign To</label>
                <div ref={assigneeRef} style={{ position: "relative" }}>
                  <div
                    onClick={() => setAgentDropOpen(o => !o)}
                    style={{ ...inputSt, display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", cursor: "pointer", minHeight: 44, padding: "8px 12px" }}
                  >
                    {assignees.length === 0 ? (
                      <span style={{ color: "var(--text3)", fontSize: 13 }}>— Select Assignee(s) —</span>
                    ) : assignees.map(name => (
                      <span
                        key={name}
                        style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(99,102,241,0.12)", color: "var(--accent-crm)", padding: "2px 10px", borderRadius: 10, fontSize: 12, fontWeight: 700 }}
                      >
                        {initials(name)} {name}
                        <span
                          onClick={e => { e.stopPropagation(); toggleAssignee(name) }}
                          style={{ cursor: "pointer", marginLeft: 2 }}
                        >×</span>
                      </span>
                    ))}
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--text3)", marginLeft: "auto" }}>expand_more</span>
                  </div>

                  {agentDropOpen && (
                    <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,.14)", zIndex: 999, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                      <input
                        value={agentSearch}
                        onChange={e => setAgentSearch(e.target.value)}
                        placeholder="Search…"
                        autoFocus
                        style={{ margin: 8, padding: "7px 10px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, color: "var(--text)", outline: "none" }}
                      />
                      <div style={{ overflowY: "auto", maxHeight: 180 }}>
                        {filteredAgents.length === 0 ? (
                          <div style={{ padding: "14px", textAlign: "center", fontSize: 12, color: "var(--text3)" }}>
                            {agentList.length === 0 ? "No agents loaded" : "No matches"}
                          </div>
                        ) : filteredAgents.map(name => (
                          <div
                            key={name}
                            onClick={() => { toggleAssignee(name); setAgentSearch("") }}
                            style={{ padding: "9px 14px", fontSize: 13, fontWeight: 600, color: "var(--text)", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: ".1s" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "var(--bg3)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                          >
                            <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "var(--text)", flexShrink: 0 }}>
                              {initials(name)}
                            </div>
                            {name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Due + Priority */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                <div>
                  <label style={labelSt}>Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    style={inputSt}
                    onFocus={e => (e.currentTarget.style.borderColor = "var(--accent-crm)")}
                    onBlur={e  => (e.currentTarget.style.borderColor = "var(--border)")}
                  />
                </div>
                <div>
                  <label style={labelSt}>Priority</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as Priority)}
                    style={inputSt}
                    onFocus={e => (e.currentTarget.style.borderColor = "var(--accent-crm)")}
                    onBlur={e  => (e.currentTarget.style.borderColor = "var(--border)")}
                  >
                    <option value="Low">Low Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="High">High Priority</option>
                  </select>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div style={{ padding: "16px 28px", borderTop: "1px solid var(--border)", background: "var(--bg2)", display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                onClick={closeModal}
                style={{ padding: "9px 20px", borderRadius: 10, fontWeight: 700, fontSize: 13, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text2)", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={!title.trim() || saving}
                style={{ padding: "9px 24px", borderRadius: 10, fontWeight: 700, fontSize: 13, border: "none", background: "var(--accent-crm)", color: "#fff", cursor: "pointer", opacity: !title.trim() || saving ? 0.6 : 1, boxShadow: "0 4px 12px rgba(99,102,241,0.25)" }}
              >
                {saving ? "Saving…" : editId ? "Save Changes" : "Create Task"}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────
function SectionTitle({ label, style }: { label: string; style?: React.CSSProperties }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16, display: "flex", alignItems: "center", gap: 8, ...style }}>
      {label}
      <div style={{ height: 1, flex: 1, background: "var(--border)" }} />
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px", border: "1px dashed var(--border)", borderRadius: 20, background: "var(--bg2)" }}>
      <span className="material-symbols-outlined" style={{ fontSize: 48, color: "var(--text3)", opacity: 0.5, display: "block", marginBottom: 14 }}>done_all</span>
      <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>No Pending Tasks</div>
      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text3)" }}>
        You&apos;ve cleared your queue! Click &ldquo;New Task&rdquo; to create one.
      </div>
    </div>
  )
}

function TaskCard({
  task, onToggle, onEdit, onDelete,
}: {
  task: Task
  onToggle: (id: string) => void
  onEdit:   (id: string) => void
  onDelete: (id: string) => void
}) {
  const [hovered, setHovered] = useState(false)
  const done     = task.status === "completed"
  const typeSpec = TYPE_BADGE[task.type] ?? TYPE_BADGE["Action Item"]
  const prioSpec = PRIO_STYLE[task.priority] ?? PRIO_STYLE.Low
  const dueObj   = formatDue(task.due_date)
  const arr      = task.assigned ? task.assigned.split(",").map(s => s.trim()).filter(Boolean) : []

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background:  "var(--bg2)",
        padding:     20,
        border:      `1px solid ${hovered && !done ? "var(--accent-crm)" : "var(--border)"}`,
        borderRadius: 16,
        transition:  ".18s",
        transform:   hovered && !done ? "translateY(-2px)" : "none",
        boxShadow:   hovered && !done ? "0 6px 20px rgba(0,0,0,0.07)" : "0 2px 8px rgba(0,0,0,0.02)",
        opacity:     done ? 0.72 : 1,
      }}
    >
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>

        {/* Checkbox */}
        <div
          onClick={() => onToggle(task.id)}
          style={{ width: 26, height: 26, borderRadius: "50%", border: `2px solid ${done ? "#10b981" : "var(--border)"}`, background: done ? "#10b981" : "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, marginTop: 2, transition: ".18s" }}
        >
          {done && <span className="material-symbols-outlined" style={{ fontSize: 16, color: "#fff" }}>check</span>}
        </div>

        {/* Body */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: done ? "var(--text3)" : "var(--text)", textDecoration: done ? "line-through" : "none", lineHeight: 1.4 }}>
            {task.title}
          </div>
          {task.desc?.trim() && (
            <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text3)", marginTop: 5, lineHeight: 1.5, overflow: "hidden", maxHeight: "2.6em", textDecoration: done ? "line-through" : "none", opacity: done ? 0.7 : 1 }}>
              {task.desc}
            </div>
          )}

          {/* Meta */}
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 10, marginTop: 14 }}>

            {/* Type */}
            <span style={{ padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 800, background: typeSpec.bg, color: typeSpec.color, display: "inline-flex", alignItems: "center", gap: 4 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{typeSpec.icon}</span>
              {task.type}
            </span>

            {/* Priority */}
            <span style={{ padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 800, color: prioSpec.color, border: `1px solid ${prioSpec.border}` }}>
              {task.priority}
            </span>

            {/* Due date */}
            {dueObj && (
              <span style={{ fontSize: 12, fontWeight: 700, color: dueObj.overdue && !done ? "#ef4444" : "var(--text2)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>event</span>
                {dueObj.text}
              </span>
            )}

            {/* Avatars */}
            <div style={{ marginLeft: "auto", display: "flex" }}>
              {arr.length === 0 ? (
                <div title="Unassigned" style={{ width: 26, height: 26, borderRadius: "50%", border: "1px dashed var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: "var(--text3)" }}>person_off</span>
                </div>
              ) : (
                arr.slice(0, 4).map((name, i) => (
                  <div key={name} title={name} style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--text2)", border: "2px solid var(--bg2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "var(--bg)", marginLeft: i === 0 ? 0 : -8, zIndex: 4 - i, position: "relative" }}>
                    {initials(name)}
                  </div>
                ))
              )}
              {arr.length > 4 && (
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--border)", border: "2px solid var(--bg2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "var(--text3)", marginLeft: -8, position: "relative" }}>
                  +{arr.length - 4}
                </div>
              )}
            </div>

            {/* Edit */}
            <div
              onClick={() => onEdit(task.id)}
              title="Edit"
              style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid transparent", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text3)", opacity: hovered ? 1 : 0, transition: ".15s" }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--bg3)")}
              onMouseLeave={e => (e.currentTarget.style.background = "var(--bg)")}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
            </div>

            {/* Delete */}
            <div
              onClick={() => onDelete(task.id)}
              title="Delete"
              style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid transparent", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text3)", opacity: hovered ? 1 : 0, transition: ".15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; (e.currentTarget as HTMLElement).style.color = "#ef4444" }}
              onMouseLeave={e => { e.currentTarget.style.background = "var(--bg)"; (e.currentTarget as HTMLElement).style.color = "var(--text3)" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
