import type { Metadata } from "next"
import { OnboardingClient } from "./OnboardingClient"

export const metadata: Metadata = {
  title: "Merchant Onboarding | Mtech Distributors",
  description: "New merchant onboarding form — Mtech Distributors internal portal",
  robots: "noindex, nofollow",
}

export default function OnboardingPage() {
  return <OnboardingClient />
}
