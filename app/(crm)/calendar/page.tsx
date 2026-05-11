import type { Metadata } from "next"
import { CalendarClient } from "./CalendarClient"

export const metadata: Metadata = {
  title: "Calendar | Mtech CRM",
  robots: "noindex, nofollow",
}

export default function CalendarPage() {
  return <CalendarClient />
}
