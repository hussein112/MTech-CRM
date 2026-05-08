import { Manrope } from "next/font/google"
import { cookies } from "next/headers"
import { Sidebar } from "@/app/components/dashboard/Sidebar"
import { SidebarProvider } from "@/app/components/dashboard/SidebarContext"
import "@/app/styles/dashboard.css"

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
})

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const initialCollapsed = cookieStore.get("sidebar-collapsed")?.value === "true"

  const sidebarW = initialCollapsed ? "64px" : "250px"

  return (
    <SidebarProvider initialCollapsed={initialCollapsed}>
      <style>{`:root { --sidebar-w: ${sidebarW}; }`}</style>
      <div
        className={manrope.variable}
        style={{
          display: "flex",
          minHeight: "100vh",
          fontFamily: "var(--font-manrope), sans-serif",
          overflowX: "hidden",
        }}
      >
        <Sidebar />
        <main
          style={{
            flex: 1,
            minWidth: 0,
            background: "var(--bg)",
            marginLeft: "var(--sidebar-w, 250px)",
            transition: "margin-left 0.22s ease",
          }}
        >
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}
