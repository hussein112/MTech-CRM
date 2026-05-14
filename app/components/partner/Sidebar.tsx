"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// ── Nav data ───────────────────────────────────────────────────────────────
interface NavItem {
    label: string
    icon: string
    badge?: string
    badgePurple?: boolean,
    href: string
}
interface NavSection { title: string; items: NavItem[] }

const NAV: NavSection[] = [
    {
        title: "DASHBOARD", items: [
            { label: "Overview", icon: "grid_view", href: "/partner" },
        ]
    },
    {
        title: "PRODUCTS & MARKETING", items: [
            { label: "Hardware", icon: "memory", href: "/partner/hardware" },
            { label: "Software", icon: "developer_mode", href: "/partner/software" },
            { label: "Assets", icon: "folder", href: "/partner/assets" },
        ]
    },
    {
        title: "TRAINING & PLAYBOOKS", items: [
            { label: "Courses", icon: "school", href: "/partner/courses" },
            { label: "Certifications", icon: "workspace_premium", badge: "4", href: "/partner/certifications" },
            { label: "Pitch Guides", icon: "present_to_all", href: "/partner/pitch-guides" },
        ]
    },
    {
        title: "SUPPORT & TICKETS", items: [
            { label: "Troubleshooting", icon: "build", href: "/partner/troubleshooting" },
            { label: "Submit Ticket", icon: "add_circle", href: "/partner/submit-ticket" },
            { label: "My Tickets", icon: "confirmation_number", badge: "5", badgePurple: true, href: "/partner/my-tickets" },
        ]
    },
    {
        title: "MY PERFORMANCE", items: [
            { label: "Commission", icon: "payments", href: "/partner/commission" },
            { label: "Goals", icon: "flag", href: "/partner/goals" },
        ]
    },
]



// ── Component ──────────────────────────────────────────────────────────────
export function ClientSidebar({ activeItem, setActiveItem, darkMode, toggleTheme, isCollapsed, toggleSidebar }: { activeItem: string, setActiveItem: (label: string) => void, darkMode: boolean, toggleTheme: () => void, isCollapsed: boolean, toggleSidebar: () => void }) {
    const pathname = usePathname();
    return (
        <div>
            {/* ══════════ Sidebar ══════════ */}
            <aside className="pp-sidebar">
                <div className="pp-sidebar-inner">
                    {/* Logo */}
                    <div className="pp-logo-container" style={{ padding: "28px 28px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                            <span style={{ fontWeight: 900, fontSize: 20, color: "#4F46E5", fontFamily: "'Mulish', sans-serif" }}>M</span>
                            <span className="pp-logo-text" style={{ fontWeight: 900, fontSize: 20, color: "#4F46E5", fontFamily: "'Mulish', sans-serif" }}>Tech</span>
                            <span className="pp-logo-text" style={{ fontWeight: 900, fontSize: 20, color: "var(--pp-text)", fontFamily: "'Mulish', sans-serif" }}>&nbsp;Partner</span>
                        </div>
                        {!isCollapsed && (
                            <div className="pp-logo-text" style={{ fontSize: 11, fontWeight: 600, color: "var(--pp-muted)", marginTop: 3, letterSpacing: 0.2 }}>
                                Partner Portal
                            </div>
                        )}
                    </div>

                    {/* Navigation */}
                    <div className="pp-nav-container" style={{ display: "flex", flexDirection: "column", padding: "0 14px 32px", flex: 1 }}>
                        {NAV.map((section, si) => (
                            <div key={section.title}>
                                {si > 0 && (
                                    <div className="pp-nav-divider" style={{ height: 1, background: "var(--pp-border)", margin: "14px 2px 4px" }} />
                                )}
                                <div className="pp-nav-section-title" style={{ fontSize: 11, fontWeight: 800, color: "var(--pp-muted)", letterSpacing: "1.2px", textTransform: "uppercase", margin: "22px 0 10px 12px" }}>
                                    {section.title}
                                </div>
                                {section.items.map(item => (
                                    <Link
                                        key={item.label}
                                        href={item.href}
                                        className={`pp-nav-item${pathname === item.href ? " active" : ""}`}
                                        title={isCollapsed ? item.label : ""}
                                    >
                                        <span className="material-symbols-outlined">{item.icon}</span>
                                        <span style={{ flex: 1 }}>{item.label}</span>
                                        {item.badge && !isCollapsed && (
                                            <span style={{
                                                background: item.badgePurple ? "#FCE7F3" : "#E0E7FF",
                                                color: item.badgePurple ? "#BE185D" : "#4F46E5",
                                                fontSize: 11, fontWeight: 800,
                                                height: 20, minWidth: 20,
                                                borderRadius: 10,
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                padding: "0 5px",
                                            }}>
                                                {item.badge}
                                            </span>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Collapse Toggle */}
                <button
                    className="pp-collapse-btn"
                    onClick={toggleSidebar}
                    aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_left</span>
                </button>
            </aside>
        </div>
    )
}