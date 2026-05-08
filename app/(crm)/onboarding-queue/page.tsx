import type { Metadata } from "next"
import type { OnboardingTicket } from "./OnboardingQueueClient"
import { OnboardingQueueClient } from "./OnboardingQueueClient"

export const metadata: Metadata = { title: "Onboarding Queue" }

const MOCK_TICKETS: OnboardingTicket[] = [
  { id: "MTECH-ONB-0041", merchant: "Jerusalem Sweets",       submittedBy: "Moe Kadi",       appStatus: "Under Review",       assignedTo: "Joan Huang",     createdAt: "May 6, 2026"  },
  { id: "MTECH-ONB-0039", merchant: "Green Valley Market",    submittedBy: "Zu Jia He Cen",  appStatus: "Submitted",          assignedTo: "Moe Kadi",       createdAt: "May 5, 2026"  },
  { id: "MTECH-ONB-0037", merchant: "Sunrise Coffee Co.",     submittedBy: "Joan Huang",     appStatus: "Awaiting Merchant",  assignedTo: "Joan Huang",     createdAt: "May 5, 2026"  },
  { id: "MTECH-ONB-0035", merchant: "Harbor View Sushi",      submittedBy: "Moe Kadi",       appStatus: "Awaiting Processor", assignedTo: "Zu Jia He Cen",  createdAt: "May 4, 2026"  },
  { id: "MTECH-ONB-0033", merchant: "Maple Leaf Market",      submittedBy: "Zu Jia He Cen",  appStatus: "Approved",           assignedTo: "Joan Huang",     createdAt: "May 3, 2026"  },
  { id: "MTECH-ONB-0031", merchant: "Brooklyn Bistro LLC",    submittedBy: "Joan Huang",     appStatus: "Live",               assignedTo: "Moe Kadi",       createdAt: "May 2, 2026"  },
  { id: "MTECH-ONB-0029", merchant: "QuickStop Mart",         submittedBy: "Moe Kadi",       appStatus: "Declined",           assignedTo: "Joan Huang",     createdAt: "May 1, 2026"  },
  { id: "MTECH-ONB-0027", merchant: "Upper West Cafe",        submittedBy: "Zu Jia He Cen",  appStatus: "Withdrawn",          assignedTo: "Zu Jia He Cen",  createdAt: "Apr 30, 2026" },
  { id: "MTECH-ONB-0025", merchant: "Atlas Auto Parts",       submittedBy: "Joan Huang",     appStatus: "Submitted",          assignedTo: "Moe Kadi",       createdAt: "Apr 29, 2026" },
  { id: "MTECH-ONB-0023", merchant: "Liberty Tax Service",    submittedBy: "Moe Kadi",       appStatus: "Under Review",       assignedTo: "Joan Huang",     createdAt: "Apr 28, 2026" },
  { id: "MTECH-ONB-0021", merchant: "Garden State Deli",      submittedBy: "Zu Jia He Cen",  appStatus: "Awaiting Merchant",  assignedTo: "Zu Jia He Cen",  createdAt: "Apr 27, 2026" },
  { id: "MTECH-ONB-0019", merchant: "Crown Jewelers Inc.",    submittedBy: "Joan Huang",     appStatus: "Approved",           assignedTo: "Joan Huang",     createdAt: "Apr 26, 2026" },
]

export default function OnboardingQueuePage() {
  return <OnboardingQueueClient initialTickets={MOCK_TICKETS} />
}
