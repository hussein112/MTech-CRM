import type { Metadata } from "next"
import { AgentFormClient } from "./AgentFormClient"

export const metadata: Metadata = {
  title: "Agent Onboarding | Mtech Distributors",
  description: "New agent onboarding form — Mtech Distributors",
  robots: "noindex, nofollow",
}

export default function AgentOnboardingPage() {
  return <AgentFormClient />
}
