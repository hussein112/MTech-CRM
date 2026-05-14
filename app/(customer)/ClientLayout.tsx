"use client";

import { ClientSidebar } from "../components/partner/Sidebar";
import { useState, useEffect } from "react";
import Navbar from "../components/partner/Navbar";

export default function ClientLayout({
    children,
    initialCollapsed
}: {
    children: React.ReactNode,
    initialCollapsed: boolean
}) {
    const [activeItems, setActiveItems] = useState("Overview")
    const [darkMode, setDarkMode] = useState(false)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(initialCollapsed)

    useEffect(() => {
        setDarkMode(document.documentElement.getAttribute("data-theme") === "dark")
    }, [])

    const toggleTheme = () => {
        const next = !darkMode
        setDarkMode(next)
        document.documentElement.setAttribute("data-theme", next ? "dark" : "light")
        localStorage.setItem("mtech-theme", next ? "dark" : "light")
    }

    const toggleSidebar = () => {
        const next = !sidebarCollapsed
        setSidebarCollapsed(next)
        // Set cookie
        document.cookie = `mtech-partner-sidebar-collapsed=${next}; path=/; max-age=31536000`
    }

    return (
        <div className={`partner-root${sidebarCollapsed ? " collapsed" : ""}`}
        >
            <ClientSidebar
                activeItem={activeItems}
                setActiveItem={setActiveItems}
                darkMode={darkMode}
                toggleTheme={toggleTheme}
                isCollapsed={sidebarCollapsed}
                toggleSidebar={toggleSidebar}
            />
            <Navbar darkMode={darkMode} toggleTheme={toggleTheme} />
            <main
                style={{
                    marginLeft: "var(--pp-w)",
                    width: "calc(100% - var(--pp-w))",
                    minHeight: "100vh",
                    padding: "0 50px",
                    boxSizing: "border-box",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                }}>
                {children}
            </main>
        </div>
    )
}
