import type { Metadata } from "next"
import type { Ticket } from "@/app/types/dashboard"
import { TicketsClient } from "./TicketsClient"
import type { MerchantSummary } from "./TicketsClient"

export const metadata: Metadata = { title: "Tickets" }

const MOCK_MERCHANTS: MerchantSummary[] = [
  { id: "M-001", mid: "583920471", dba: "Pinnacle Sports Bar",     legalName: "Pinnacle Hospitality Group LLC",    processor: "Fiserv",   status: "Active"   },
  { id: "M-002", mid: "210947382", dba: "Saffron Threads",         legalName: "Saffron Threads Boutique Inc.",     processor: "TSYS",     status: "Active"   },
  { id: "M-003", mid: "649201837", dba: "Cascadia Auto Service",   legalName: "Cascadia Automotive LLC",           processor: "Maverick", status: "Active"   },
  { id: "M-004", mid: "374820196", dba: "Ridgeline Health Clinic", legalName: "Ridgeline Primary Care Inc.",       processor: "Elavon",   status: "Active"   },
  { id: "M-005", mid: "918273640", dba: "Bluewater Seafood",       legalName: "Bluewater Seafood Market Inc.",     processor: "TSYS",     status: "Inactive" },
  { id: "M-006", mid: "462810937", dba: "Fieldstone Bakery",       legalName: "Fieldstone Baking Co. LLC",        processor: "Fiserv",   status: "Active"   },
  { id: "M-007", mid: "701839264", dba: "Ironclad Fitness",        legalName: "Ironclad Fitness & Wellness LLC",  processor: "Maverick", status: "Active"   },
  { id: "M-008", mid: "839172046", dba: "Summit Print & Sign",     legalName: "Summit Print Solutions LLC",       processor: "TSYS",     status: "Pending"  },
  { id: "M-009", mid: "125839204", dba: "Halcyon Spa & Wellness",  legalName: "Halcyon Wellness Group Inc.",      processor: "Fiserv",   status: "Closed"   },
  { id: "M-010", mid: "307491826", dba: "Driftwood Tavern",        legalName: "Driftwood Tavern LLC",             processor: "Elavon",   status: "Active"   },
  { id: "M-011", mid: "594038172", dba: "Coppervine Wine Bar",     legalName: "Coppervine Hospitality Inc.",      processor: "Fiserv",   status: "Active"   },
  { id: "M-012", mid: "820163947", dba: "Noma Nails & Beauty",     legalName: "Noma Beauty LLC",                  processor: "TSYS",     status: "Active"   },
  { id: "M-013", mid: "473920185", dba: "Watershed Books",         legalName: "Watershed Independent Books LLC", processor: "Maverick", status: "Active"   },
  { id: "M-014", mid: "619384720", dba: "Terracycle Garden Shop",  legalName: "Terracycle Horticulture Inc.",     processor: "Elavon",   status: "Active"   },
  { id: "M-015", mid: "284719063", dba: "Luminary Photography",    legalName: "Luminary Studios LLC",             processor: "Fiserv",   status: "Active"   },
  { id: "M-016", mid: "731049285", dba: "Helix Coworking",         legalName: "Helix Workspace Solutions Inc.",  processor: "TSYS",     status: "Active"   },
  { id: "M-017", mid: "968203714", dba: "Barranca Taqueria",       legalName: "Barranca Foods LLC",               processor: "Maverick", status: "Active"   },
  { id: "M-018", mid: "145867329", dba: "Vantage Optical",         legalName: "Vantage Eye Care Inc.",            processor: "Elavon",   status: "Active"   },
]

const MOCK_TICKETS: Ticket[] = [
  { id: "MTECH-470501", subject: "Tips not applying to batch",          merchant: "Pinnacle Sports Bar",    status: "Open",             priority: "High",     assignedTo: "Derek Foss",    createdAt: "May 6, 2026",  brand: "Clover"     },
  { id: "MTECH-470485", subject: "Refund reversed incorrectly",         merchant: "Fieldstone Bakery",      status: "In Progress",      priority: "Medium",   assignedTo: "Amara Singh",      createdAt: "May 5, 2026",  brand: "Clover"     },
  { id: "MTECH-470483", subject: "Account login locked out",            merchant: "Driftwood Tavern",       status: "Open",             priority: "Low",      assignedTo: "Amara Singh",      createdAt: "May 5, 2026",  brand: "PAX"        },
  { id: "MTECH-470470", subject: "Software update failing on device",   merchant: "Coppervine Wine Bar",    status: "In Progress",      priority: "Medium",   assignedTo: "Tomas Vega", createdAt: "May 4, 2026",  brand: "Dejavoo"    },
  { id: "MTECH-470461", subject: "Settlement amount does not match",    merchant: "Bluewater Seafood",      status: "Open",             priority: "Critical", assignedTo: "Derek Foss",    createdAt: "May 4, 2026",  brand: "PAX"        },
  { id: "MTECH-470455", subject: "Printer jamming on long receipts",    merchant: "Ridgeline Health Clinic",status: "Pending Internal", priority: "Medium",   assignedTo: "Derek Foss",    createdAt: "May 3, 2026",  brand: "Ingenico"   },
  { id: "MTECH-470448", subject: "Cash discount not displaying",        merchant: "Cascadia Auto Service",  status: "Open",             priority: "High",     assignedTo: "Amara Singh",      createdAt: "May 3, 2026",  brand: "Verifone"   },
  { id: "MTECH-470439", subject: "Contactless declined every attempt",  merchant: "Saffron Threads",        status: "Resolved",         priority: "Low",      assignedTo: "Tomas Vega", createdAt: "May 2, 2026",  brand: "Dejavoo"    },
  { id: "MTECH-470431", subject: "Tip screen skipped automatically",    merchant: "Pinnacle Sports Bar",    status: "In Progress",      priority: "High",     assignedTo: "Derek Foss",    createdAt: "May 2, 2026",  brand: "Clover"     },
  { id: "MTECH-470422", subject: "SNAP payment not going through",      merchant: "Watershed Books",        status: "Open",             priority: "Critical", assignedTo: "Amara Singh",      createdAt: "May 1, 2026",  brand: "Valor"      },
  { id: "MTECH-470418", subject: "Chip reader unresponsive",            merchant: "Noma Nails & Beauty",    status: "Pending Internal", priority: "High",     assignedTo: "Tomas Vega", createdAt: "May 1, 2026",  brand: "Ingenico"   },
  { id: "MTECH-470410", subject: "Account flagged by processor",        merchant: "Ironclad Fitness",       status: "Open",             priority: "Critical", assignedTo: "Derek Foss",    createdAt: "Apr 30, 2026", brand: "Valor"      },
  { id: "MTECH-470404", subject: "Mobile app not syncing transactions", merchant: "Luminary Photography",   status: "In Progress",      priority: "Medium",   assignedTo: "Amara Singh",      createdAt: "Apr 30, 2026", brand: "SwipeSimple" },
  { id: "MTECH-470398", subject: "Duplicate charge on last batch",      merchant: "Terracycle Garden Shop", status: "Resolved",         priority: "Medium",   assignedTo: "Derek Foss",    createdAt: "Apr 29, 2026", brand: "Dejavoo"    },
  { id: "MTECH-470391", subject: "Tap-to-pay intermittently failing",   merchant: "Helix Coworking",        status: "Closed",           priority: "Low",      assignedTo: "Tomas Vega", createdAt: "Apr 29, 2026", brand: "Clover"     },
  { id: "MTECH-470385", subject: "Statement fee higher than agreed",    merchant: "Barranca Taqueria",      status: "Pending Internal", priority: "High",     assignedTo: "Derek Foss",    createdAt: "Apr 28, 2026", brand: "PAX"        },
  { id: "MTECH-470377", subject: "Manual entry transactions rejected",  merchant: "Vantage Optical",        status: "Resolved",         priority: "Low",      assignedTo: "Amara Singh",      createdAt: "Apr 28, 2026", brand: "Verifone"   },
  { id: "MTECH-470369", subject: "Terminal stuck in reboot loop",       merchant: "Coppervine Wine Bar",    status: "Closed",           priority: "Medium",   assignedTo: "Tomas Vega", createdAt: "Apr 27, 2026", brand: "Dejavoo"    },
  { id: "MTECH-470362", subject: "Daily report export not working",     merchant: "Fieldstone Bakery",      status: "Resolved",         priority: "Low",      assignedTo: "Derek Foss",    createdAt: "Apr 27, 2026", brand: "Clover"     },
  { id: "MTECH-470355", subject: "Transactions missing from close",     merchant: "Driftwood Tavern",       status: "Open",             priority: "Critical", assignedTo: "Amara Singh",      createdAt: "Apr 26, 2026", brand: "Square"     },
]

export default function TicketsPage() {
  return <TicketsClient tickets={MOCK_TICKETS} merchants={MOCK_MERCHANTS} />
}
