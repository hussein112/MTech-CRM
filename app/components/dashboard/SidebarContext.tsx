"use client"

import Cookies from "js-cookie"
import { createContext, useContext, useState, useLayoutEffect, type ReactNode } from "react"

const COOKIE_KEY = "sidebar-collapsed"

interface SidebarContextType {
  collapsed: boolean
  toggle:    () => void
}

const SidebarContext = createContext<SidebarContextType>({ collapsed: false, toggle: () => {} })

interface Props {
  initialCollapsed?: boolean
  children: ReactNode
}

export function SidebarProvider({ initialCollapsed = false, children }: Props) {
  const [collapsed, setCollapsed] = useState(initialCollapsed)

  useLayoutEffect(() => {
    document.documentElement.style.setProperty("--sidebar-w", collapsed ? "64px" : "250px")
  }, [collapsed])

  function toggle() {
    setCollapsed(c => {
      const next = !c
      Cookies.set(COOKIE_KEY, String(next), { expires: 365 })
      return next
    })
  }

  return (
    <SidebarContext.Provider value={{ collapsed, toggle }}>
      {children}
    </SidebarContext.Provider>
  )
}

export const useSidebar = () => useContext(SidebarContext)
