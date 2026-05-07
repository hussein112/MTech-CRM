import type { Metadata } from "next"
import { Manrope } from "next/font/google"
import { Sidebar }         from "./components/dashboard/Sidebar"
import { SidebarProvider } from "./components/dashboard/SidebarContext"
import "./styles/dashboard.css"

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
})

export const metadata: Metadata = {
  title: { default: "Dashboard | MTech Ticket", template: "%s | MTech Ticket" },
  robots: "noindex, nofollow",
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Document</title>
    </head>
    <body>
      <SidebarProvider>
        <div className={manrope.variable} style={{ display: "flex", minHeight: "100vh", fontFamily: "var(--font-manrope), sans-serif", overflowX: "hidden" }}>
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" />
          <Sidebar />
          <main style={{ flex: 1, minWidth: 0, background: "var(--bg)", marginLeft: "var(--sidebar-w, 250px)", transition: "margin-left 0.22s ease" }}>
            {children}
          </main>
        </div>
      </SidebarProvider>
    </body>
    </html>

  )
}
