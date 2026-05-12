import type { Metadata } from "next"
import { TimecardClient } from "./TimecardClient"
import "./timecard.css"

export const metadata: Metadata = {
  title: "Timecard",
}

export default function TimecardPage() {
  return <TimecardClient />
}
