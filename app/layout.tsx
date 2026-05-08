import type { Metadata } from "next"
import { Manrope, Inter } from "next/font/google"
import { cookies } from "next/headers"
import "./globals.css"

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
})

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: { default: "MTech CRM", template: "%s | MTech CRM" },
  robots: "noindex, nofollow",
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const initialCollapsed = cookieStore.get("sidebar-collapsed")?.value === "true"

  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0"
        />
      </head>
      <body
        className={`${manrope.variable} ${inter.variable}`}
        style={{ "--sidebar-w": initialCollapsed ? "64px" : "250px" } as React.CSSProperties}
      >
        {children}
      </body>
    </html>
  )
}
