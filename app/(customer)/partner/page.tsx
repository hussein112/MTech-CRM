import type { Metadata } from "next"
import { PartnerClient } from "./PartnerClient"

export const metadata: Metadata = {
  title: "Mtech Partner Portal",
  robots: "noindex, nofollow",
}

export default function PartnerPage() {
  return <PartnerClient />
}
