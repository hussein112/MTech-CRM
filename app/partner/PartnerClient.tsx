"use client"

import { useState, useEffect } from "react"

// ── Nav data ───────────────────────────────────────────────────────────────
interface NavItem {
  label:        string
  icon:         string
  badge?:       string
  badgePurple?: boolean
}
interface NavSection { title: string; items: NavItem[] }

const NAV: NavSection[] = [
  { title: "DASHBOARD", items: [
    { label: "Overview", icon: "grid_view" },
  ]},
  { title: "PRODUCTS & MARKETING", items: [
    { label: "Hardware", icon: "memory"         },
    { label: "Software", icon: "developer_mode" },
    { label: "Assets",   icon: "folder"         },
  ]},
  { title: "TRAINING & PLAYBOOKS", items: [
    { label: "Courses",        icon: "school"            },
    { label: "Certifications", icon: "workspace_premium", badge: "4"                  },
    { label: "Pitch Guides",   icon: "present_to_all"    },
  ]},
  { title: "SUPPORT & TICKETS", items: [
    { label: "Troubleshooting", icon: "build"                                          },
    { label: "Submit Ticket",   icon: "add_circle"                                    },
    { label: "My Tickets",      icon: "confirmation_number", badge: "5", badgePurple: true },
  ]},
  { title: "MY PERFORMANCE", items: [
    { label: "Commission", icon: "payments" },
    { label: "Goals",      icon: "flag"     },
  ]},
]

// ── Card data ──────────────────────────────────────────────────────────────
const CARDS = [
  { title: "Mtech Hardware Pitch Guide & Specifications", img: "pp-img-hardware", icon: "picture_as_pdf",  color: "#C2410C" },
  { title: "POS Software User Manual and Integration",    img: "pp-img-software", icon: "menu_book",       color: "#4F46E5" },
  { title: "Q3 Product Brochure and Marketing Assets",   img: "pp-img-brochure", icon: "auto_stories",    color: "#047857" },
  { title: "Sales Certification Course — Module 1",      img: "pp-img-course",   icon: "school",          color: "#BE185D" },
  { title: "Troubleshooting Advanced Networks",          img: "pp-img-support",  icon: "support_agent",   color: "#A16207" },
  { title: "Logo Pack & Digital Assets Bundle",          img: "pp-img-assets",   icon: "folder_zip",      color: "#334155" },
]

// ── Component ──────────────────────────────────────────────────────────────
export function PartnerClient() {
  const [activeItem, setActiveItem] = useState("Overview")
  const [darkMode,   setDarkMode]   = useState(false)

  // Sync with app-wide theme on mount
  useEffect(() => {
    setDarkMode(document.documentElement.getAttribute("data-theme") === "dark")
  }, [])

  function toggleTheme() {
    const next = !darkMode
    setDarkMode(next)
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light")
    localStorage.setItem("mtech-theme", next ? "dark" : "light")
  }

  return (
    <div className="partner-root">

      {/* ══════════ Sidebar ══════════ */}
      <aside className="pp-sidebar">

        {/* Logo */}
        <div style={{ padding: "28px 28px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            <span style={{ fontWeight: 900, fontSize: 20, color: "#4F46E5",         fontFamily: "'Mulish', sans-serif" }}>MTech</span>
            <span style={{ fontWeight: 900, fontSize: 20, color: "var(--pp-text)", fontFamily: "'Mulish', sans-serif" }}>&nbsp;Partner</span>
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--pp-muted)", marginTop: 3, letterSpacing: 0.2 }}>
            Partner Portal
          </div>
        </div>

        {/* Navigation */}
        <div style={{ display: "flex", flexDirection: "column", padding: "0 14px 32px", flex: 1 }}>
          {NAV.map((section, si) => (
            <div key={section.title}>
              {si > 0 && (
                <div style={{ height: 1, background: "var(--pp-border)", margin: "14px 2px 4px" }} />
              )}
              <div style={{ fontSize: 11, fontWeight: 800, color: "var(--pp-muted)", letterSpacing: "1.2px", textTransform: "uppercase", margin: "22px 0 10px 12px" }}>
                {section.title}
              </div>
              {section.items.map(item => (
                <div
                  key={item.label}
                  className={`pp-nav-item${activeItem === item.label ? " active" : ""}`}
                  onClick={() => setActiveItem(item.label)}
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.badge && (
                    <span style={{
                      background:  item.badgePurple ? "#FCE7F3" : "#E0E7FF",
                      color:       item.badgePurple ? "#BE185D" : "#4F46E5",
                      fontSize: 11, fontWeight: 800,
                      height: 20, minWidth: 20,
                      borderRadius: 10,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      padding: "0 5px",
                    }}>
                      {item.badge}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </aside>

      {/* ══════════ Main ══════════ */}
      <main style={{ marginLeft: "var(--pp-w)", width: "calc(100% - var(--pp-w))", minHeight: "100vh", padding: "40px 56px", boxSizing: "border-box" }}>
        <div style={{ maxWidth: 1400, width: "100%", margin: "0 auto" }}>

          {/* Topbar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: 28, fontWeight: 900, margin: 0, color: "var(--pp-text)", fontFamily: "'Mulish', sans-serif", letterSpacing: -0.5 }}>
              Customer Area
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <button className="pp-theme-btn" onClick={toggleTheme} title="Toggle theme">
                <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                  {darkMode ? "light_mode" : "dark_mode"}
                </span>
              </button>
              <div className="pp-user-chip">
                <div style={{ width: 32, height: 32, background: "linear-gradient(135deg,#6366F1,#4F46E5)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", fontSize: 13, fontWeight: 700 }}>
                  PU
                </div>
                <span style={{ color: "var(--pp-text)" }}>Partner User</span>
              </div>
            </div>
          </div>

          {/* Cards grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 28 }}>
            {CARDS.map(card => (
              <div key={card.title} className="pp-card">

                {/* Image section */}
                <div className={`pp-card-img ${card.img}`} style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div className="pp-icon-glass">
                    <span className="material-symbols-outlined" style={{ color: card.color, fontSize: 42 }}>
                      {card.icon}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: "22px 26px", display: "flex", flexDirection: "column", flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "var(--pp-text)", marginBottom: 20, lineHeight: 1.5, flex: 1, fontFamily: "'Mulish', sans-serif" }}>
                    {card.title}
                  </div>
                  <button className="pp-view-btn">View</button>
                </div>

              </div>
            ))}
          </div>

        </div>
      </main>
    </div>
  )
}
