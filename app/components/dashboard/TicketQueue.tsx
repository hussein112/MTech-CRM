"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import type { Ticket, TicketPriority, TicketStatus } from "@/app/types/dashboard"

const PRIORITY_COLORS: Record<TicketPriority, string> = {
  Low:      "#10b981",
  Medium:   "#f59e0b",
  High:     "#ef4444",
  Critical: "#7c3aed",
}

const STATUS_COLORS: Record<TicketStatus, string> = {
  "Open":             "#ef4444",
  "In Progress":      "#f59e0b",
  "Pending Internal": "#8b5cf6",
  "Resolved":         "#10b981",
  "Closed":           "#6b7280",
}

const COLS = "110px minmax(0,1fr) 150px 120px 100px 130px 100px"

interface Props {
  tickets: Ticket[]
  loading?: boolean
}

export function TicketQueue({ tickets, loading }: Props) {
  const [query,          setQuery]          = useState("")
  const [activePriority, setActivePriority] = useState<TicketPriority | null>(null)

  const priorities = useMemo<TicketPriority[]>(() => ["Critical", "High", "Medium", "Low"], [])

  const counts = useMemo(() =>
    priorities.reduce((acc, p) => ({ ...acc, [p]: tickets.filter(t => t.priority === p).length }), {} as Record<TicketPriority, number>),
    [tickets, priorities]
  )

  const filtered = useMemo(() =>
    tickets.filter(t => {
      const matchQ = !query || [t.id, t.subject, t.merchant].some(s => s.toLowerCase().includes(query.toLowerCase()))
      const matchP = !activePriority || t.priority === activePriority
      return matchQ && matchP
    }),
    [tickets, query, activePriority]
  )

  return (
    <div className="dash-card-v2" style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>

      {/* Header */}
      <div className="dv2-title">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--accent-crm-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span className="material-symbols-outlined" style={{ color: "var(--accent-crm)", fontSize: 18 }}>inbox</span>
          </div>
          <span>Open Tickets Queue</span>
        </div>
        <Link
          href="/tickets"
          style={{ textDecoration: "none", background: "var(--bg)", padding: "6px 14px", borderRadius: 20, border: "1px solid var(--border)", color: "var(--accent-crm)", fontSize: 12, fontWeight: 800, whiteSpace: "nowrap" }}
        >
          Manage Queue →
        </Link>
      </div>

      {/* Priority filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {priorities.map(p => (
          <button
            key={p}
            onClick={() => setActivePriority(activePriority === p ? null : p)}
            style={{ padding: "5px 14px", borderRadius: 20, border: `1px solid ${PRIORITY_COLORS[p]}`, background: activePriority === p ? PRIORITY_COLORS[p] : "transparent", color: activePriority === p ? "#fff" : PRIORITY_COLORS[p], fontSize: 12, fontWeight: 700, cursor: "pointer", transition: ".15s" }}
          >
            {p} ({counts[p]})
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <span className="material-symbols-outlined" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text3)", fontSize: 16 }}>search</span>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Filter by subject, merchant, or ID…"
          style={{ width: "100%", padding: "10px 14px 10px 38px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: 13, fontWeight: 600, outline: "none", boxSizing: "border-box" }}
        />
      </div>

      {/* ── Mobile card view (≤ 700 px) ─────────────────── */}
      <div className="tkt-cards-view">
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text3)", fontSize: 13 }}>No tickets match your filter.</div>
        )}
        {filtered.map((ticket, i) => (
          <Link key={ticket.id} href={`/tickets/${ticket.id}`} className="tkt-card" style={{ animation: "fadeIn 0.3s ease both", animationDelay: `${i * 45}ms` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--accent-crm)" }}>{ticket.id}</span>
              <div style={{ display: "flex", gap: 5 }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: `${STATUS_COLORS[ticket.status]}22`, color: STATUS_COLORS[ticket.status] }}>
                  {ticket.status}
                </span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: `${PRIORITY_COLORS[ticket.priority]}22`, color: PRIORITY_COLORS[ticket.priority] }}>
                  {ticket.priority}
                </span>
              </div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>{ticket.subject}</div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text3)" }}>
              <span>{ticket.merchant}</span>
              <span>{ticket.assignedTo} · {ticket.createdAt}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Desktop table view (> 700 px) ────────────────── */}
      <div className="tkt-scroll-view">
        <div style={{ minWidth: 740 }}>

          {/* Header row */}
          <div style={{ display: "grid", gridTemplateColumns: COLS, gap: 12, padding: "0 12px 10px", fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".5px", borderBottom: "1px solid var(--border)" }}>
            <div>Ticket ID</div>
            <div>Subject</div>
            <div>Merchant</div>
            <div>Status</div>
            <div>Priority</div>
            <div>Assigned</div>
            <div>Created</div>
          </div>

          {/* Skeleton */}
          {loading && Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: COLS, gap: 12, padding: 12, borderBottom: "1px solid var(--border)", opacity: 0.4 }}>
              {Array.from({ length: 7 }).map((_, j) => (
                <div key={j} style={{ height: 12, background: "var(--border)", borderRadius: 4 }} />
              ))}
            </div>
          ))}

          {/* Empty */}
          {!loading && filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text3)", fontSize: 13 }}>No tickets match your filter.</div>
          )}

          {/* Rows */}
          {!loading && filtered.map((ticket, i) => (
            <Link
              key={ticket.id}
              href={`/tickets/${ticket.id}`}
              className="ticket-row"
              style={{ display: "grid", gridTemplateColumns: COLS, gap: 12, padding: 12, borderBottom: "1px solid var(--border)", alignItems: "center", textDecoration: "none", borderRadius: 8, transition: ".12s", animation: "fadeIn 0.3s ease both", animationDelay: `${i * 40}ms` }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-crm)" }}>{ticket.id}</div>
              <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ticket.subject}</div>
              <div style={{ fontSize: 12, color: "var(--text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ticket.merchant}</div>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20, background: `${STATUS_COLORS[ticket.status]}22`, color: STATUS_COLORS[ticket.status] }}>
                  {ticket.status}
                </span>
              </div>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20, background: `${PRIORITY_COLORS[ticket.priority]}22`, color: PRIORITY_COLORS[ticket.priority] }}>
                  {ticket.priority}
                </span>
              </div>
              <div style={{ fontSize: 12, color: "var(--text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ticket.assignedTo}</div>
              <div style={{ fontSize: 11, color: "var(--text3)" }}>{ticket.createdAt}</div>
            </Link>
          ))}

        </div>
      </div>

    </div>
  )
}
