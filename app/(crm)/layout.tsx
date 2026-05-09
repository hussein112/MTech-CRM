import { Manrope } from "next/font/google"
import { cookies } from "next/headers"
import { Sidebar } from "@/app/components/dashboard/Sidebar"
import { SidebarProvider } from "@/app/components/dashboard/SidebarContext"
import { MainContent } from "@/app/components/dashboard/MainContent"
import "@/app/styles/dashboard.css"

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
})

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const initialCollapsed = cookieStore.get("sidebar-collapsed")?.value === "true"

  return (
    <SidebarProvider initialCollapsed={initialCollapsed}>
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
        <MainContent>{children}</MainContent>
      </div>
    </SidebarProvider>
  )
}
