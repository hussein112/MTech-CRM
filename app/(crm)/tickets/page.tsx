import type { Metadata } from "next"
import type { Ticket } from "@/app/types/dashboard"
import { TicketsClient } from "./TicketsClient"
import type { MerchantSummary } from "./TicketsClient"

export const metadata: Metadata = { title: "Tickets" }

const MOCK_MERCHANTS: MerchantSummary[] = [
  { id: "M-001", mid: "482910374", dba: "Jerusalem Sweets",    legalName: "Jerusalem Sweets LLC",             processor: "Fiserv",   status: "Active"   },
  { id: "M-002", mid: "619438201", dba: "Green Valley Market", legalName: "Green Valley Market Inc.",         processor: "TSYS",     status: "Active"   },
  { id: "M-003", mid: "305827491", dba: "Sunrise Coffee Co.",  legalName: "Sunrise Coffee Co. LLC",           processor: "Maverick", status: "Active"   },
  { id: "M-004", mid: "741928305", dba: "Harbor View Sushi",   legalName: "Harbor View Restaurant Group LLC", processor: "Fiserv",   status: "Active"   },
  { id: "M-005", mid: "198374650", dba: "Maple Leaf Market",   legalName: "Maple Leaf Grocery Inc.",          processor: "TSYS",     status: "Inactive" },
  { id: "M-006", mid: "867310294", dba: "Brooklyn Bistro LLC", legalName: "Brooklyn Bistro LLC",              processor: "Elavon",   status: "Active"   },
  { id: "M-007", mid: "523491087", dba: "Atlas Auto Parts",    legalName: "Atlas Auto Parts & Supply Corp.",  processor: "Maverick", status: "Active"   },
  { id: "M-008", mid: "902837461", dba: "Upper West Cafe",     legalName: "Upper West Hospitality LLC",       processor: "TSYS",     status: "Pending"  },
  { id: "M-009", mid: "374918205", dba: "Crown Jewelers Inc.", legalName: "Crown Jewelers International Inc.",processor: "Fiserv",   status: "Closed"   },
  { id: "M-010", mid: "281039475", dba: "Metro Gas Station",   legalName: "Metro Petroleum LLC",              processor: "Fiserv",   status: "Active"   },
  { id: "M-011", mid: "491827364", dba: "Blue Ocean Diner",    legalName: "Blue Ocean Restaurant Inc.",       processor: "TSYS",     status: "Active"   },
  { id: "M-012", mid: "637291048", dba: "QuickStop Mart",      legalName: "QuickStop Convenience LLC",        processor: "Maverick", status: "Active"   },
  { id: "M-013", mid: "829104736", dba: "Fifth Ave Boutique",  legalName: "Fifth Avenue Fashion LLC",         processor: "Elavon",   status: "Active"   },
  { id: "M-014", mid: "102938475", dba: "Fresh Farms Grocery", legalName: "Fresh Farms Inc.",                 processor: "Fiserv",   status: "Active"   },
  { id: "M-015", mid: "564738291", dba: "Midtown Pharmacy",    legalName: "Midtown Health Services LLC",      processor: "TSYS",     status: "Active"   },
  { id: "M-016", mid: "738291046", dba: "Garden State Deli",   legalName: "Garden State Foods LLC",           processor: "Maverick", status: "Active"   },
  { id: "M-017", mid: "192837465", dba: "Greenway Landscaping",legalName: "Greenway Property Services Inc.",  processor: "Elavon",   status: "Active"   },
  { id: "M-018", mid: "473829106", dba: "Riverdale Hardware",  legalName: "Riverdale Home Supply LLC",        processor: "Fiserv",   status: "Active"   },
]

const MOCK_TICKETS: Ticket[] = [
  { id: "MTECH-470501", subject: "Terminal not connecting",        merchant: "Jerusalem Sweets",      status: "Open",             priority: "High",     assignedTo: "Joan Huang",     createdAt: "May 6, 2026",  brand: "Dejavoo"   },
  { id: "MTECH-470485", subject: "Chargeback dispute",             merchant: "Sunrise Coffee",        status: "In Progress",      priority: "Medium",   assignedTo: "Moe Kadi",       createdAt: "May 5, 2026",  brand: "Clover"    },
  { id: "MTECH-470483", subject: "Account login issue",            merchant: "Metro Gas Station",     status: "Open",             priority: "Low",      assignedTo: "Moe Kadi",       createdAt: "May 5, 2026",  brand: "PAX"       },
  { id: "MTECH-470470", subject: "POS update request",             merchant: "Blue Ocean Diner",      status: "In Progress",      priority: "Medium",   assignedTo: "Zu Jia He Cen",  createdAt: "May 4, 2026",  brand: "Valor"     },
  { id: "MTECH-470461", subject: "Batch settlement mismatch",      merchant: "Maple Leaf Market",     status: "Open",             priority: "Critical", assignedTo: "Joan Huang",     createdAt: "May 4, 2026",  brand: "Dejavoo"   },
  { id: "MTECH-470455", subject: "Receipt printer offline",        merchant: "Brooklyn Bistro",       status: "Pending Internal", priority: "Medium",   assignedTo: "Joan Huang",     createdAt: "May 3, 2026",  brand: "Ingenico"  },
  { id: "MTECH-470448", subject: "Dual pricing not calculating",   merchant: "QuickStop Mart",        status: "Open",             priority: "High",     assignedTo: "Moe Kadi",       createdAt: "May 3, 2026",  brand: "PAX"       },
  { id: "MTECH-470439", subject: "Signature capture failing",      merchant: "Fifth Ave Boutique",    status: "Resolved",         priority: "Low",      assignedTo: "Zu Jia He Cen",  createdAt: "May 2, 2026",  brand: "Verifone"  },
  { id: "MTECH-470431", subject: "Tip adjustment not saving",      merchant: "Harbor View Sushi",     status: "In Progress",      priority: "High",     assignedTo: "Joan Huang",     createdAt: "May 2, 2026",  brand: "Clover"    },
  { id: "MTECH-470422", subject: "EBT transaction declined",       merchant: "Fresh Farms Grocery",   status: "Open",             priority: "Critical", assignedTo: "Moe Kadi",       createdAt: "May 1, 2026",  brand: "Valor"     },
  { id: "MTECH-470418", subject: "EMV chip reader error",          merchant: "Midtown Pharmacy",      status: "Pending Internal", priority: "High",     assignedTo: "Zu Jia He Cen",  createdAt: "May 1, 2026",  brand: "Ingenico"  },
  { id: "MTECH-470410", subject: "Merchant account on hold",       merchant: "Garden State Deli",     status: "Open",             priority: "Critical", assignedTo: "Joan Huang",     createdAt: "Apr 30, 2026", brand: "Square"    },
  { id: "MTECH-470404", subject: "SwipeSimple app not syncing",    merchant: "Greenway Landscaping",  status: "In Progress",      priority: "Medium",   assignedTo: "Moe Kadi",       createdAt: "Apr 30, 2026", brand: "SwipeSimple"},
  { id: "MTECH-470398", subject: "Void transaction not reflecting", merchant: "Crown Jewelers",       status: "Resolved",         priority: "Medium",   assignedTo: "Joan Huang",     createdAt: "Apr 29, 2026", brand: "Dejavoo"   },
  { id: "MTECH-470391", subject: "NFC tap-to-pay not working",     merchant: "Upper West Cafe",       status: "Closed",           priority: "Low",      assignedTo: "Zu Jia He Cen",  createdAt: "Apr 29, 2026", brand: "PAX"       },
  { id: "MTECH-470385", subject: "Incorrect monthly statement",    merchant: "Prospect Park Fitness", status: "Pending Internal", priority: "High",     assignedTo: "Joan Huang",     createdAt: "Apr 28, 2026", brand: "Clover"    },
  { id: "MTECH-470377", subject: "Keyed entry not authorized",     merchant: "Atlas Auto Parts",      status: "Resolved",         priority: "Low",      assignedTo: "Moe Kadi",       createdAt: "Apr 28, 2026", brand: "Verifone"  },
  { id: "MTECH-470369", subject: "Terminal reboot loop",           merchant: "Westside Nail Spa",     status: "Closed",           priority: "Medium",   assignedTo: "Zu Jia He Cen",  createdAt: "Apr 27, 2026", brand: "Dexa"      },
  { id: "MTECH-470362", subject: "Report download failing",        merchant: "Liberty Tax Service",   status: "Resolved",         priority: "Low",      assignedTo: "Joan Huang",     createdAt: "Apr 27, 2026", brand: "Square"    },
  { id: "MTECH-470355", subject: "Batch close missing transactions", merchant: "Riverdale Hardware",  status: "Open",             priority: "Critical", assignedTo: "Moe Kadi",       createdAt: "Apr 26, 2026", brand: "Supersonic"},
]

export default function TicketsPage() {
  return <TicketsClient tickets={MOCK_TICKETS} merchants={MOCK_MERCHANTS} />
}
