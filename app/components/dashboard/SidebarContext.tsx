"use client"

import Cookies from "js-cookie"
import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

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
  // Server: use the SSR-safe prop. Client: always read live from cookie so any
  // remount (e.g. during App Router navigations) picks up the last toggled value.
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return initialCollapsed
    return Cookies.get(COOKIE_KEY) === "true"
  })

  // Belt-and-suspenders: sync once after hydration in case the lazy initializer
  // ran before the cookie was readable (rare, but possible with SSR streaming).
  useEffect(() => {
    const stored = Cookies.get(COOKIE_KEY)
    if (stored !== undefined) setCollapsed(stored === "true")
  }, [])

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
