"use client"

import { createContext, useContext, useState, useLayoutEffect, type ReactNode } from "react"

interface SidebarContextType {
  collapsed: boolean
  toggle:    () => void
}

const SidebarContext = createContext<SidebarContextType>({ collapsed: false, toggle: () => {} })

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  useLayoutEffect(() => {
    document.documentElement.style.setProperty("--sidebar-w", collapsed ? "64px" : "250px")
  }, [collapsed])

  return (
    <SidebarContext.Provider value={{ collapsed, toggle: () => setCollapsed(c => !c) }}>
      {children}
    </SidebarContext.Provider>
  )
}

export const useSidebar = () => useContext(SidebarContext)
