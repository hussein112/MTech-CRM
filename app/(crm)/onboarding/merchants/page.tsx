import type { Metadata } from "next"
import type { MerchantOnboardingTicket } from "./MerchantOnboardingClient"
import { MerchantOnboardingClient } from "./MerchantOnboardingClient"

export const metadata: Metadata = { title: "Merchant Onboarding Queue" }

const MOCK_TICKETS: MerchantOnboardingTicket[] = [
  { id: "MTECH-ONB-0041", merchant: "Pinnacle Sports Bar",     submittedBy: "Amara Singh",   appStatus: "Under Review",       assignedTo: "Derek Foss",    createdAt: "May 6, 2026"  },
  { id: "MTECH-ONB-0039", merchant: "Saffron Threads",         submittedBy: "Tomas Vega",    appStatus: "Submitted",          assignedTo: "Amara Singh",   createdAt: "May 5, 2026"  },
  { id: "MTECH-ONB-0037", merchant: "Fieldstone Bakery",       submittedBy: "Derek Foss",    appStatus: "Awaiting Merchant",  assignedTo: "Derek Foss",    createdAt: "May 5, 2026"  },
  { id: "MTECH-ONB-0035", merchant: "Cascadia Auto Service",   submittedBy: "Amara Singh",   appStatus: "Awaiting Processor", assignedTo: "Tomas Vega",    createdAt: "May 4, 2026"  },
  { id: "MTECH-ONB-0033", merchant: "Ridgeline Health Clinic", submittedBy: "Tomas Vega",    appStatus: "Approved",           assignedTo: "Derek Foss",    createdAt: "May 3, 2026"  },
  { id: "MTECH-ONB-0031", merchant: "Driftwood Tavern",        submittedBy: "Derek Foss",    appStatus: "Live",               assignedTo: "Amara Singh",   createdAt: "May 2, 2026"  },
  { id: "MTECH-ONB-0029", merchant: "Noma Nails & Beauty",     submittedBy: "Amara Singh",   appStatus: "Declined",           assignedTo: "Derek Foss",    createdAt: "May 1, 2026"  },
  { id: "MTECH-ONB-0027", merchant: "Summit Print & Sign",     submittedBy: "Tomas Vega",    appStatus: "Withdrawn",          assignedTo: "Tomas Vega",    createdAt: "Apr 30, 2026" },
  { id: "MTECH-ONB-0025", merchant: "Ironclad Fitness",        submittedBy: "Derek Foss",    appStatus: "Submitted",          assignedTo: "Amara Singh",   createdAt: "Apr 29, 2026" },
  { id: "MTECH-ONB-0023", merchant: "Watershed Books",         submittedBy: "Amara Singh",   appStatus: "Under Review",       assignedTo: "Derek Foss",    createdAt: "Apr 28, 2026" },
  { id: "MTECH-ONB-0021", merchant: "Barranca Taqueria",       submittedBy: "Tomas Vega",    appStatus: "Awaiting Merchant",  assignedTo: "Tomas Vega",    createdAt: "Apr 27, 2026" },
  { id: "MTECH-ONB-0019", merchant: "Halcyon Spa & Wellness",  submittedBy: "Derek Foss",    appStatus: "Approved",           assignedTo: "Derek Foss",    createdAt: "Apr 26, 2026" },
]

export default function MerchantOnboardingPage() {
  return <MerchantOnboardingClient initialTickets={MOCK_TICKETS} />
}
