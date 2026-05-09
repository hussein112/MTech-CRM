import type { Metadata } from "next"
import { ResourcesClient } from "./ResourcesClient"

export const metadata: Metadata = { title: "Resources" }

export interface Resource {
  id: number
  name: string
  category: "marketing" | "forms" | "legal" | "support" | "proposals"
  fileType: "pdf" | "doc" | "sheet" | "media" | "default"
  author: string
  uploadDate: string
  views: number
  size: string
  version: string
  isPopular: boolean
}

const MOCK_RESOURCES: Resource[] = [
  { id: 1,  name: "Q2 2025 Merchant Onboarding Kit",          category: "marketing",  fileType: "pdf",     author: "Darius Wolfe",     uploadDate: "2025-04-12", views: 847,  size: "3.2 MB",  version: "v3", isPopular: true  },
  { id: 2,  name: "Agent Commission Rate Sheet",               category: "marketing",  fileType: "sheet",   author: "Priya Mehra",      uploadDate: "2025-03-28", views: 612,  size: "480 KB",  version: "v2", isPopular: true  },
  { id: 3,  name: "POS Terminal Quick Start Guide",            category: "support",    fileType: "pdf",     author: "Tobias Engel",     uploadDate: "2025-04-20", views: 1204, size: "5.1 MB",  version: "v4", isPopular: true  },
  { id: 4,  name: "Merchant Application Form",                 category: "forms",      fileType: "doc",     author: "Camille Bertrand", uploadDate: "2025-02-15", views: 389,  size: "220 KB",  version: "v1", isPopular: true  },
  { id: 5,  name: "Independent Sales Agent Agreement",         category: "legal",      fileType: "pdf",     author: "Rodrigo Vidal",    uploadDate: "2025-01-08", views: 278,  size: "1.8 MB",  version: "v2", isPopular: true  },
  { id: 6,  name: "FAQ: Terminal Troubleshooting",             category: "support",    fileType: "pdf",     author: "Tobias Engel",     uploadDate: "2025-04-25", views: 876,  size: "1.4 MB",  version: "v5", isPopular: true  },
  { id: 7,  name: "Spring 2025 Product Brochure",              category: "marketing",  fileType: "pdf",     author: "Darius Wolfe",     uploadDate: "2025-04-01", views: 533,  size: "7.4 MB",  version: "v1", isPopular: false },
  { id: 8,  name: "Residual Calculation Spreadsheet",          category: "marketing",  fileType: "sheet",   author: "Priya Mehra",      uploadDate: "2025-03-14", views: 198,  size: "640 KB",  version: "v1", isPopular: false },
  { id: 9,  name: "Equipment Lease Agreement",                 category: "legal",      fileType: "pdf",     author: "Rodrigo Vidal",    uploadDate: "2025-02-22", views: 145,  size: "920 KB",  version: "v3", isPopular: false },
  { id: 10, name: "Chargeback Dispute Template",               category: "forms",      fileType: "doc",     author: "Camille Bertrand", uploadDate: "2025-03-05", views: 267,  size: "185 KB",  version: "v1", isPopular: false },
  { id: 11, name: "Gateway Integration Overview",              category: "support",    fileType: "pdf",     author: "Tobias Engel",     uploadDate: "2025-04-08", views: 423,  size: "2.3 MB",  version: "v2", isPopular: false },
  { id: 12, name: "Non-Disclosure Agreement",                  category: "legal",      fileType: "pdf",     author: "Rodrigo Vidal",    uploadDate: "2025-01-30", views: 312,  size: "560 KB",  version: "v1", isPopular: false },
  { id: 13, name: "Custom Business Proposal Template",         category: "proposals",  fileType: "doc",     author: "Freya Johansson",  uploadDate: "2025-02-10", views: 389,  size: "340 KB",  version: "v2", isPopular: false },
  { id: 14, name: "Multi-Location Merchant Pitch Deck",        category: "proposals",  fileType: "default", author: "Freya Johansson",  uploadDate: "2025-03-22", views: 201,  size: "12.1 MB", version: "v1", isPopular: false },
  { id: 15, name: "Brand Logo & Assets Pack",                  category: "marketing",  fileType: "media",   author: "Darius Wolfe",     uploadDate: "2025-04-18", views: 447,  size: "24.8 MB", version: "v2", isPopular: false },
  { id: 16, name: "New Hire Onboarding Checklist",             category: "forms",      fileType: "sheet",   author: "Camille Bertrand", uploadDate: "2025-03-30", views: 134,  size: "290 KB",  version: "v1", isPopular: false },
  { id: 17, name: "Annual Revenue Report Template",            category: "proposals",  fileType: "sheet",   author: "Priya Mehra",      uploadDate: "2025-01-20", views: 289,  size: "780 KB",  version: "v1", isPopular: false },
  { id: 18, name: "Signature-Ready MSA — Standard",            category: "legal",      fileType: "pdf",     author: "Rodrigo Vidal",    uploadDate: "2025-02-04", views: 198,  size: "1.2 MB",  version: "v4", isPopular: false },
  { id: 19, name: "Referral Partner Agreement",                category: "legal",      fileType: "doc",     author: "Rodrigo Vidal",    uploadDate: "2025-03-17", views: 156,  size: "440 KB",  version: "v2", isPopular: false },
  { id: 20, name: "Holiday Campaign Email Kit",                category: "marketing",  fileType: "media",   author: "Darius Wolfe",     uploadDate: "2025-04-10", views: 321,  size: "8.9 MB",  version: "v1", isPopular: false },
]

export default function ResourcesPage() {
  return <ResourcesClient resources={MOCK_RESOURCES} />
}
