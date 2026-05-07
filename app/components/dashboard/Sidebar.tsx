"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

const NAV_ITEMS = [
  { label: "Dashboard",        href: "/dashboard",            icon: "dashboard"           },
  { label: "Tickets",          href: "/tickets",              icon: "confirmation_number" },
  { label: "Onboarding",       href: "/onboarding",           icon: "group_add",          children: [
    { label: "Merchants", href: "/onboarding/merchants" },
    { label: "Agents",    href: "/onboarding/agents"   },
  ]},
  { label: "Merchants",        href: "/merchants",            icon: "storefront"          },
  { label: "Inventory",        href: "/inventory",            icon: "inventory_2"         },
  { label: "Activity",         href: "/activity",             icon: "bolt"                },
  { label: "Users",            href: "/users",                icon: "group"               },
  { label: "Agents",           href: "/agents",               icon: "support_agent"       },
  { label: "Tools",            href: "/tools",                icon: "build",              children: [
    { label: "Batch",    href: "/tools/batch"    },
    { label: "Reports",  href: "/tools/reports"  },
  ]},
  { label: "Resources",        href: "/resources",            icon: "menu_book"           },
  { label: "File Storage",     href: "/storage",              icon: "folder"              },
  { label: "Password Manager", href: "/passwords",            icon: "lock"                },
  { label: "Changelog",        href: "/changelog",            icon: "history"             },
]

export function Sidebar() {
  const pathname  = usePathname()
  const [expanded,  setExpanded]  = useState<string | null>("Onboarding")
  const [collapsed, setCollapsed] = useState(false)
  const [tooltip,   setTooltip]   = useState<{ label: string; y: number } | null>(null)

  function openTooltip(label: string, e: React.MouseEvent<HTMLElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    setTooltip({ label, y: r.top + r.height / 2 })
  }

  function toggle() {
    setCollapsed(c => !c)
    setTooltip(null)
  }

  return (
    <>
      <aside
        style={{
          width: collapsed ? 64 : 200,
          background: "var(--bg2)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          position: "sticky",
          top: 0,
          flexShrink: 0,
          transition: "width 0.22s ease",
          overflow: "hidden",
        }}
      >
        {/* ── Header ─────────────────────────────────────── */}
        <div
          style={{
            padding: "0 10px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "space-between",
            height: 56,
            gap: 8,
          }}
        >
          {!collapsed && (
            <Link
              href="/dashboard"
              style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0, overflow: "hidden" }}
            >
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: "#fff" }}>credit_card</span>
              </div>
              <span style={{ fontWeight: 900, fontSize: 14, color: "var(--text)", fontFamily: "'Mulish', sans-serif", whiteSpace: "nowrap" }}>
                <span style={{ color: "var(--accent)" }}>MTech</span>Distributors
              </span>
            </Link>
          )}

          <button
            onClick={toggle}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="sidebar-toggle-btn"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              {collapsed ? "chevron_right" : "chevron_left"}
            </span>
          </button>
        </div>

        {/* ── Nav ────────────────────────────────────────── */}
        <nav style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "10px 8px" }}>
          {NAV_ITEMS.map(item => {
            const isActive    = pathname === item.href || pathname.startsWith(item.href + "/")
            const hasChildren = !!item.children
            const isExpanded  = expanded === item.label

            /* ── Collapsed: icon-only ── */
            if (collapsed) {
              return (
                <div key={item.label} style={{ marginBottom: 2 }}>
                  <Link
                    href={item.href}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: 40,
                      borderRadius: 8,
                      background: isActive ? "var(--accent-light)" : "transparent",
                      outline: isActive ? "2px solid var(--accent)" : "2px solid transparent",
                      outlineOffset: -2,
                      transition: ".15s",
                    }}
                    onMouseEnter={e => { openTooltip(item.label, e); if (!isActive) (e.currentTarget as HTMLElement).style.background = "var(--bg3)" }}
                    onMouseLeave={e => { setTooltip(null);            if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent" }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 20, color: isActive ? "var(--accent)" : "var(--text3)" }}>
                      {item.icon}
                    </span>
                  </Link>
                </div>
              )
            }

            /* ── Expanded: label + optional submenu ── */
            return (
              <div key={item.label}>
                <div
                  onClick={() => hasChildren ? setExpanded(isExpanded ? null : item.label) : undefined}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 8, marginBottom: 2, cursor: "pointer", background: isActive ? "var(--accent-light)" : "transparent", borderLeft: isActive ? "2px solid var(--accent)" : "2px solid transparent", transition: ".15s" }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "var(--bg3)" }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent" }}
                >
                  {hasChildren ? (
                    <>
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: isActive ? "var(--accent)" : "var(--text3)", flexShrink: 0 }}>{item.icon}</span>
                      <span style={{ flex: 1, fontSize: 13, fontWeight: isActive ? 700 : 600, color: isActive ? "var(--accent)" : "var(--text2)" }}>{item.label}</span>
                      <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--text3)", transition: "transform .2s", transform: isExpanded ? "rotate(180deg)" : "none" }}>expand_more</span>
                    </>
                  ) : (
                    <Link href={item.href} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", textDecoration: "none" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: isActive ? "var(--accent)" : "var(--text3)", flexShrink: 0 }}>{item.icon}</span>
                      <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 600, color: isActive ? "var(--accent)" : "var(--text2)" }}>{item.label}</span>
                    </Link>
                  )}
                </div>

                {hasChildren && isExpanded && (
                  <div style={{ paddingLeft: 36, marginBottom: 4 }}>
                    {item.children!.map(child => {
                      const childActive = pathname === child.href
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          style={{ display: "block", padding: "5px 10px", fontSize: 12, fontWeight: childActive ? 700 : 500, color: childActive ? "var(--accent)" : "var(--text3)", textDecoration: "none", borderRadius: 6, marginBottom: 2, transition: ".15s" }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--text)" }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = childActive ? "var(--accent)" : "var(--text3)" }}
                        >
                          {child.label}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* ── New Ticket ─────────────────────────────────── */}
        <div style={{ padding: "12px 8px", borderTop: "1px solid var(--border)" }}>
          {collapsed ? (
            <Link
              href="/tickets/new"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 40, background: "var(--accent)", color: "#fff", borderRadius: 10, textDecoration: "none", transition: ".15s" }}
              onMouseEnter={e => openTooltip("New Ticket", e)}
              onMouseLeave={() => setTooltip(null)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>add</span>
            </Link>
          ) : (
            <Link
              href="/tickets/new"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "var(--accent)", color: "#fff", borderRadius: 10, padding: "10px 0", fontSize: 13, fontWeight: 800, textDecoration: "none", transition: ".15s" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
              New Ticket
            </Link>
          )}
        </div>
      </aside>

      {/* Tooltip — rendered outside aside so overflow:hidden doesn't clip it */}
      {collapsed && tooltip && (
        <div
          style={{
            position: "fixed",
            left: 72,
            top: tooltip.y,
            transform: "translateY(-50%)",
            zIndex: 1000,
            background: "var(--bg2)",
            border: "1px solid var(--border)",
            borderRadius: 7,
            padding: "5px 12px",
            fontSize: 12,
            fontWeight: 700,
            color: "var(--text)",
            whiteSpace: "nowrap",
            boxShadow: "0 4px 14px rgba(0,0,0,.15)",
            pointerEvents: "none",
          }}
        >
          {tooltip.label}
        </div>
      )}
    </>
  )
}
