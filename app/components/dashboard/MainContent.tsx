"use client"

import { useSidebar } from "./SidebarContext"
import { Topbar } from "./Topbar"
import type { ReactNode } from "react"

export function MainContent({ children }: { children: ReactNode }) {
  const { collapsed } = useSidebar()
  return (
    <main
      style={{
        flex: 1,
        minWidth: 0,
        background: "var(--bg)",
        marginLeft: collapsed ? 64 : 250,
        marginTop: 56,
        transition: "margin-left 0.22s ease",
        display: "flex",
        flexDirection: "column",
        minHeight: "calc(100vh - 56px)",
      }}
    >
      <Topbar />
      {children}
    </main>
  )
}
