import type { Metadata } from "next"
import { RatesClient } from "./RatesClient"

export const metadata: Metadata = { title: "Rate Calculator" }

export default function RatesPage() {
  return <RatesClient />
}
