import type { Metadata } from "next"
import { MerchantFormClient } from "./MerchantFormClient"

export const metadata: Metadata = {
  title: "Merchant Onboarding | Mtech Distributors",
  description: "New merchant onboarding form — Mtech Distributors",
  robots: "noindex, nofollow",
}

export default function MerchantOnboardingPage() {
  return <MerchantFormClient />
}
