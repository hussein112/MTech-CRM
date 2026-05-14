"use client"

import Link from "next/link"
import "../../styles/dashboard.css"

// ── Card data ──────────────────────────────────────────────────────────────
const CARDS = [
  {
    category: "Training & Playbooks",
    items: [
      { id: "mtech-hardware-pitch-guide-specifications", title: "Hardware Pitch Guide & Specifications", img: "pp-img-hardware", icon: "picture_as_pdf", color: "#C2410C", desc: "Technical specs and sales pitch points for our latest terminal lineup." },
      { id: "pos-software-user-manual-integration", title: "POS Software Integration Manual", img: "pp-img-software", icon: "menu_book", color: "#4F46E5", desc: "Complete guide for integrating MTech software with existing POS systems." },
      { id: "q3-product-brochure-marketing-assets", title: "Q3 Product Brochure & Marketing", img: "pp-img-brochure", icon: "auto_stories", color: "#047857", desc: "High-quality marketing materials for your client presentations." },
      { id: "sales-certification-course-module-1", title: "Sales Certification — Module 1", img: "pp-img-course", icon: "school", color: "#BE185D", desc: "Required training module for all certified MTech hardware partners." },
    ]
  },
  {
    category: 'Support & Tickets',
    items: [
      { id: "troubleshooting-advanced-networks", title: "Advanced Network Troubleshooting", img: "pp-img-support", icon: "support_agent", color: "#A16207", desc: "Solving connectivity issues in complex network environments." },
      { id: "logo-pack-digital-assets-bundle", title: "Digital Brand Assets Bundle", img: "pp-img-assets", icon: "folder_zip", color: "#334155", desc: "Logos, icons, and brand guidelines for official MTech partners." },
    ]
  }
]

// ── Component ──────────────────────────────────────────────────────────────
export function PartnerClient() {
  return (
    <div className="dash-layout">
      {/* Header */}
      <div className="dash-header">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "var(--text)", margin: 0, letterSpacing: -0.5 }}>Partner Overview</h1>
          <p style={{ fontSize: 13, color: "var(--text3)", margin: "4px 0 0", fontWeight: 500 }}>
            Access your training materials, marketing assets, and support resources.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-10 mt-2">
        {CARDS.map(({ category, items }, key) => (
          <div key={key}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 900, color: "var(--text)", margin: 0 }}>{category}</h2>
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:grid-cols-4">
              {items.map(item => (
                <div key={item.id} className="dash-card-v2" style={{ padding: 0, display: "flex", flexDirection: "column" }}>
                  {/* Visual header */}
                  <div className={`pp-card-img ${item.img}`} style={{ height: 140, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "20px 20px 0 0" }}>
                    <div className="pp-icon-glass" style={{ width: 60, height: 60, borderRadius: 16 }}>
                      <span className="material-symbols-outlined" style={{ color: item.color, fontSize: 32 }}>
                        {item.icon}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div style={{ padding: "20px", display: "flex", flexDirection: "column", flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", marginBottom: 8, lineHeight: 1.4, fontFamily: "'Mulish', sans-serif" }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text3)", lineHeight: 1.5, marginBottom: 20, flex: 1, fontWeight: 500 }}>
                      {item.desc}
                    </div>
                    <Link
                      href={`/partner/manuals/${item.id}`}
                      className="tkt-btn-new"
                      style={{ width: "100%", justifyContent: "center", padding: "10px", marginLeft: 0 }}
                    >
                      View Resource
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
