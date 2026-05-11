import type { Metadata } from "next"
import type { AgentOnboardingTicket } from "./AgentOnboardingClient"
import { AgentOnboardingClient } from "./AgentOnboardingClient"

export const metadata: Metadata = { title: "Agent Onboarding Queue" }

const MOCK_TICKETS: AgentOnboardingTicket[] = [
  { id: "MTECH-AGT-0022", agentName: "Dominic Reyes",     submittedBy: "Priya Mehra",    appStatus: "Under Review",       assignedTo: "Jordan Vance",   createdAt: "May 9, 2026"  },
  { id: "MTECH-AGT-0021", agentName: "Felicia Okafor",    submittedBy: "Jordan Vance",   appStatus: "Submitted",          assignedTo: "Priya Mehra",    createdAt: "May 8, 2026"  },
  { id: "MTECH-AGT-0020", agentName: "Marco Delgado",     submittedBy: "Elise Fontaine", appStatus: "Awaiting Merchant",  assignedTo: "Jordan Vance",   createdAt: "May 8, 2026"  },
  { id: "MTECH-AGT-0019", agentName: "Sandra Winslow",    submittedBy: "Priya Mehra",    appStatus: "Awaiting Processor", assignedTo: "Elise Fontaine", createdAt: "May 7, 2026"  },
  { id: "MTECH-AGT-0018", agentName: "Tariq Bashir",      submittedBy: "Jordan Vance",   appStatus: "Approved",           assignedTo: "Jordan Vance",   createdAt: "May 6, 2026"  },
  { id: "MTECH-AGT-0017", agentName: "Yolanda Prescott",  submittedBy: "Elise Fontaine", appStatus: "Live",               assignedTo: "Priya Mehra",    createdAt: "May 5, 2026"  },
  { id: "MTECH-AGT-0016", agentName: "Anton Kruger",      submittedBy: "Priya Mehra",    appStatus: "Declined",           assignedTo: "Jordan Vance",   createdAt: "May 4, 2026"  },
  { id: "MTECH-AGT-0015", agentName: "Imani Vasquez",     submittedBy: "Jordan Vance",   appStatus: "Withdrawn",          assignedTo: "Elise Fontaine", createdAt: "May 3, 2026"  },
  { id: "MTECH-AGT-0014", agentName: "Rupert Abernathy",  submittedBy: "Elise Fontaine", appStatus: "Submitted",          assignedTo: "Priya Mehra",    createdAt: "May 2, 2026"  },
  { id: "MTECH-AGT-0013", agentName: "Celeste Morreau",   submittedBy: "Priya Mehra",    appStatus: "Under Review",       assignedTo: "Jordan Vance",   createdAt: "May 1, 2026"  },
  { id: "MTECH-AGT-0012", agentName: "Bryson Nakamura",   submittedBy: "Jordan Vance",   appStatus: "Awaiting Merchant",  assignedTo: "Elise Fontaine", createdAt: "Apr 30, 2026" },
  { id: "MTECH-AGT-0011", agentName: "Odette Harrington", submittedBy: "Elise Fontaine", appStatus: "Approved",           assignedTo: "Jordan Vance",   createdAt: "Apr 29, 2026" },
]

export default function AgentOnboardingPage() {
  return <AgentOnboardingClient initialTickets={MOCK_TICKETS} />
}
