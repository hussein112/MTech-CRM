"use client"

import { useSidebar } from "./SidebarContext"
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
        transition: "margin-left 0.22s ease",
      }}
    >
      {children}
    </main>
  )
}
