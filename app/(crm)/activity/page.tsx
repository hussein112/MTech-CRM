import type { Metadata } from "next"
import { ActivityClient } from "./ActivityClient"
import type { ActivityEntry } from "./ActivityClient"

export const metadata: Metadata = { title: "Activity" }

const MOCK_ACTIVITY: ActivityEntry[] = [
  // ── Today ───────────────────────────────────────────────────────────────
  {
    id: "A-001", type: "updated", user: "Derek Foss",
    action: "changed status on", target: "MTECH-470501", targetId: "MTECH-470501",
    merchant: "Pinnacle Sports Bar", timestamp: "7 min ago", dateGroup: "Today",
    changes: [{ field: "Status", from: "Open", to: "In Progress" }],
  },
  {
    id: "A-002", type: "note", user: "Derek Foss",
    action: "added a note to", target: "MTECH-470501", targetId: "MTECH-470501",
    merchant: "Pinnacle Sports Bar", timestamp: "7 min ago", dateGroup: "Today",
    detail: "Contacted merchant, issue reproduced on their end. Escalating to Clover support.",
  },
  {
    id: "A-003", type: "resolved", user: "Amara Singh",
    action: "resolved", target: "MTECH-470485", targetId: "MTECH-470485",
    merchant: "Fieldstone Bakery", timestamp: "26 min ago", dateGroup: "Today",
    changes: [{ field: "Status", from: "In Progress", to: "Resolved" }],
  },
  {
    id: "A-004", type: "updated", user: "Amara Singh",
    action: "updated priority on", target: "MTECH-470483", targetId: "MTECH-470483",
    merchant: "Driftwood Tavern", timestamp: "31 min ago", dateGroup: "Today",
    changes: [{ field: "Priority", from: "Low", to: "High" }],
  },
  {
    id: "A-005", type: "note", user: "Amara Singh",
    action: "added a note to", target: "MTECH-470485", targetId: "MTECH-470485",
    merchant: "Fieldstone Bakery", timestamp: "38 min ago", dateGroup: "Today",
    detail: "Ran batch reconciliation manually, missing transactions recovered and confirmed.",
  },
  {
    id: "A-006", type: "created", user: "Tomas Vega",
    action: "created ticket", target: "MTECH-470501", targetId: "MTECH-470501",
    merchant: "Pinnacle Sports Bar", timestamp: "54 min ago", dateGroup: "Today",
  },
  {
    id: "A-007", type: "merchant", user: "Tomas Vega",
    action: "created new merchant", target: "Pinnacle Sports Bar",
    timestamp: "57 min ago", dateGroup: "Today",
  },
  {
    id: "A-008", type: "resolved", user: "Derek Foss",
    action: "resolved", target: "MTECH-470439", targetId: "MTECH-470439",
    merchant: "Saffron Threads", timestamp: "1 hr ago", dateGroup: "Today",
    changes: [{ field: "Status", from: "In Progress", to: "Resolved" }],
  },
  {
    id: "A-009", type: "updated", user: "Amara Singh",
    action: "reassigned", target: "MTECH-470470", targetId: "MTECH-470470",
    merchant: "Coppervine Wine Bar", timestamp: "2 hrs ago", dateGroup: "Today",
    changes: [{ field: "Assigned To", from: "Tomas Vega", to: "Amara Singh" }],
  },
  {
    id: "A-010", type: "note", user: "Tomas Vega",
    action: "added a note to", target: "MTECH-470461", targetId: "MTECH-470461",
    merchant: "Bluewater Seafood", timestamp: "3 hrs ago", dateGroup: "Today",
    detail: "Called merchant, confirmed they have not been processing since March. Awaiting reactivation decision.",
  },
  {
    id: "A-011", type: "created", user: "Derek Foss",
    action: "created ticket", target: "MTECH-470461", targetId: "MTECH-470461",
    merchant: "Bluewater Seafood", timestamp: "4 hrs ago", dateGroup: "Today",
  },

  // ── Yesterday ────────────────────────────────────────────────────────────
  {
    id: "A-012", type: "updated", user: "Amara Singh",
    action: "changed status on", target: "MTECH-470448", targetId: "MTECH-470448",
    merchant: "Cascadia Auto Service", timestamp: "Yesterday, 4:12 PM", dateGroup: "Yesterday",
    changes: [{ field: "Status", from: "Pending Internal", to: "Open" }],
  },
  {
    id: "A-013", type: "closed", user: "Tomas Vega",
    action: "closed", target: "MTECH-470391", targetId: "MTECH-470391",
    merchant: "Helix Coworking", timestamp: "Yesterday, 2:48 PM", dateGroup: "Yesterday",
    changes: [{ field: "Status", from: "In Progress", to: "Closed" }],
  },
  {
    id: "A-014", type: "note", user: "Derek Foss",
    action: "added a note to", target: "MTECH-470418", targetId: "MTECH-470418",
    merchant: "Noma Nails & Beauty", timestamp: "Yesterday, 1:30 PM", dateGroup: "Yesterday",
    detail: "Spoke with Ingenico support. Replacement chip reader approved under warranty. Shipping in 3–5 days.",
  },
  {
    id: "A-015", type: "created", user: "Amara Singh",
    action: "created ticket", target: "MTECH-470448", targetId: "MTECH-470448",
    merchant: "Cascadia Auto Service", timestamp: "Yesterday, 11:05 AM", dateGroup: "Yesterday",
  },
  {
    id: "A-016", type: "updated", user: "Tomas Vega",
    action: "updated", target: "MTECH-470431", targetId: "MTECH-470431",
    merchant: "Pinnacle Sports Bar", timestamp: "Yesterday, 10:20 AM", dateGroup: "Yesterday",
    changes: [
      { field: "Priority",    from: "Medium",      to: "High"        },
      { field: "Assigned To", from: "Amara Singh", to: "Derek Foss"  },
    ],
  },
  {
    id: "A-017", type: "note", user: "Derek Foss",
    action: "added a note to", target: "MTECH-470422", targetId: "MTECH-470422",
    merchant: "Watershed Books", timestamp: "Yesterday, 9:15 AM", dateGroup: "Yesterday",
    detail: "SNAP processor confirmed issue on their end. ETA for fix is 24–48 hours. Merchant notified.",
  },
  {
    id: "A-018", type: "merchant", user: "Amara Singh",
    action: "created new merchant", target: "Ironclad Fitness",
    timestamp: "Yesterday, 8:30 AM", dateGroup: "Yesterday",
  },

  // ── May 6, 2026 ──────────────────────────────────────────────────────────
  {
    id: "A-019", type: "updated", user: "Tomas Vega",
    action: "changed status on", target: "MTECH-470410", targetId: "MTECH-470410",
    merchant: "Ironclad Fitness", timestamp: "May 6, 5:45 PM", dateGroup: "May 6, 2026",
    changes: [{ field: "Status", from: "Open", to: "Pending Internal" }],
  },
  {
    id: "A-020", type: "resolved", user: "Derek Foss",
    action: "resolved", target: "MTECH-470377", targetId: "MTECH-470377",
    merchant: "Vantage Optical", timestamp: "May 6, 4:20 PM", dateGroup: "May 6, 2026",
    changes: [{ field: "Status", from: "In Progress", to: "Resolved" }],
  },
  {
    id: "A-021", type: "created", user: "Amara Singh",
    action: "created ticket", target: "MTECH-470418", targetId: "MTECH-470418",
    merchant: "Noma Nails & Beauty", timestamp: "May 6, 3:10 PM", dateGroup: "May 6, 2026",
  },
  {
    id: "A-022", type: "note", user: "Tomas Vega",
    action: "added a note to", target: "MTECH-470404", targetId: "MTECH-470404",
    merchant: "Luminary Photography", timestamp: "May 6, 2:00 PM", dateGroup: "May 6, 2026",
    detail: "SwipeSimple confirmed sync issue is related to app version 3.2.1. Update has been pushed.",
  },
  {
    id: "A-023", type: "resolved", user: "Derek Foss",
    action: "resolved", target: "MTECH-470398", targetId: "MTECH-470398",
    merchant: "Terracycle Garden Shop", timestamp: "May 6, 11:30 AM", dateGroup: "May 6, 2026",
    changes: [{ field: "Status", from: "In Progress", to: "Resolved" }],
  },
  {
    id: "A-024", type: "created", user: "Amara Singh",
    action: "created ticket", target: "MTECH-470410", targetId: "MTECH-470410",
    merchant: "Ironclad Fitness", timestamp: "May 6, 10:15 AM", dateGroup: "May 6, 2026",
  },
  {
    id: "A-025", type: "merchant", user: "Tomas Vega",
    action: "created new merchant", target: "Fieldstone Bakery",
    timestamp: "May 6, 9:00 AM", dateGroup: "May 6, 2026",
  },

  // ── May 5, 2026 ──────────────────────────────────────────────────────────
  {
    id: "A-026", type: "created", user: "Derek Foss",
    action: "created ticket", target: "MTECH-470398", targetId: "MTECH-470398",
    merchant: "Terracycle Garden Shop", timestamp: "May 5, 4:30 PM", dateGroup: "May 5, 2026",
  },
  {
    id: "A-027", type: "note", user: "Amara Singh",
    action: "added a note to", target: "MTECH-470391", targetId: "MTECH-470391",
    merchant: "Helix Coworking", timestamp: "May 5, 3:20 PM", dateGroup: "May 5, 2026",
    detail: "NFC hardware confirmed functional. Issue was a firmware version mismatch — update applied remotely.",
  },
  {
    id: "A-028", type: "updated", user: "Tomas Vega",
    action: "changed status on", target: "MTECH-470385", targetId: "MTECH-470385",
    merchant: "Barranca Taqueria", timestamp: "May 5, 2:10 PM", dateGroup: "May 5, 2026",
    changes: [{ field: "Status", from: "Open", to: "Pending Internal" }],
  },
  {
    id: "A-029", type: "created", user: "Derek Foss",
    action: "created ticket", target: "MTECH-470391", targetId: "MTECH-470391",
    merchant: "Helix Coworking", timestamp: "May 5, 1:00 PM", dateGroup: "May 5, 2026",
  },
  {
    id: "A-030", type: "merchant", user: "Amara Singh",
    action: "created new merchant", target: "Cascadia Auto Service",
    timestamp: "May 5, 10:45 AM", dateGroup: "May 5, 2026",
  },
]

export default function ActivityPage() {
  return <ActivityClient initialActivity={MOCK_ACTIVITY} />
}
