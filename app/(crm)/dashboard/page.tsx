import type { DashboardStats, Ticket, ActivityItem, ChartPoint, ChartPeriod } from "@/app/types/dashboard"
import { DashboardClient } from "@/app/components/dashboard/DashboardClient"

async function getDashboardData() {
  const stats: DashboardStats = { openTickets: 18, totalMerchants: 214, onboarding: 2, resolvedTotal: 47 }

  const tickets: Ticket[] = [
    { id: "MTECH-470501", subject: "Tips not applying to batch",        merchant: "Pinnacle Sports Bar",    status: "Open",        priority: "High",     assignedTo: "Derek Foss",    createdAt: "May 6, 2026" },
    { id: "MTECH-470485", subject: "Refund reversed incorrectly",       merchant: "Fieldstone Bakery",      status: "In Progress", priority: "Medium",   assignedTo: "Amara Singh",      createdAt: "May 5, 2026" },
    { id: "MTECH-470483", subject: "Account login locked out",          merchant: "Driftwood Tavern",       status: "Open",        priority: "Low",      assignedTo: "Amara Singh",      createdAt: "May 5, 2026" },
    { id: "MTECH-470470", subject: "Software update failing on device", merchant: "Coppervine Wine Bar",    status: "In Progress", priority: "Medium",   assignedTo: "Tomas Vega", createdAt: "May 4, 2026" },
    { id: "MTECH-470461", subject: "Settlement amount does not match",  merchant: "Bluewater Seafood",      status: "Open",        priority: "Critical", assignedTo: "Derek Foss",    createdAt: "May 4, 2026" },
  ]

  const activity: ActivityItem[] = [
    { id: "1", userName: "Derek Foss",     action: "updated status for",   targetId: "MTECH-470501", timestamp: "7 min ago"  },
    { id: "2", userName: "Derek Foss",     action: "added a note to",      targetId: "MTECH-470501", timestamp: "7 min ago"  },
    { id: "3", userName: "Amara Singh",       action: "updated status for",   targetId: "MTECH-470485", timestamp: "26 min ago" },
    { id: "4", userName: "Amara Singh",       action: "updated status for",   targetId: "MTECH-470483", timestamp: "31 min ago" },
    { id: "5", userName: "Amara Singh",       action: "added a note to",      targetId: "MTECH-470483", timestamp: "31 min ago" },
    { id: "6", userName: "Derek Foss",     action: "added a note to",      targetId: "MTECH-470485", timestamp: "38 min ago" },
    { id: "7", userName: "Tomas Vega", action: "created ticket",       targetId: "MTECH-470501", timestamp: "54 min ago" },
    { id: "8", userName: "Tomas Vega", action: "created new merchant", target: "Pinnacle Sports Bar (583920471)", timestamp: "57 min ago" },
  ]

  const chartData: Record<ChartPeriod, ChartPoint[]> = {
    today: [
      { label: "8am",  created: 3, resolved: 1 },
      { label: "10am", created: 2, resolved: 3 },
      { label: "12pm", created: 5, resolved: 2 },
      { label: "2pm",  created: 1, resolved: 4 },
      { label: "4pm",  created: 4, resolved: 3 },
      { label: "6pm",  created: 2, resolved: 1 },
    ],
    week: [
      { label: "Thu", created: 2,  resolved: 1  },
      { label: "Fri", created: 0,  resolved: 0  },
      { label: "Sat", created: 0,  resolved: 0  },
      { label: "Sun", created: 0,  resolved: 0  },
      { label: "Mon", created: 8,  resolved: 9  },
      { label: "Tue", created: 6,  resolved: 5  },
      { label: "Wed", created: 7,  resolved: 6  },
    ],
    "1":  Array.from({ length: 30 }, (_, i) => ({ label: `${i + 1}`, created: Math.floor(Math.random() * 8),  resolved: Math.floor(Math.random() * 6)  })),
    "6":  ["Jan","Feb","Mar","Apr","May","Jun"].map(m =>                 ({ label: m, created: Math.floor(Math.random() * 40), resolved: Math.floor(Math.random() * 35) })),
    "12": ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map(m => ({ label: m, created: Math.floor(Math.random() * 60), resolved: Math.floor(Math.random() * 50) })),
  }

  return { stats, tickets, activity, chartData }
}

export default async function DashboardPage() {
  const { stats, tickets, activity, chartData } = await getDashboardData()
  const today = new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })

  const onboardingVolume = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (29 - i))
    return {
      label:    d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      merchant: Math.floor(Math.random() * 5),
      agent:    Math.floor(Math.random() * 2),
    }
  })

  const resolution = { resolved: 40, overdue: 6, closed: 7, inProgress: 9, open: 3 }

  const merchants = [
    { id: "1", name: "PINNACLE SPORTS BAR",  mid: "583920471",       initials: "PS", avatarColor: "#8b5cf6", ticketCount: 2, barColor: "#8b5cf6", status: "Active" as const },
    { id: "2", name: "DRIFTWOOD TAVERN",      mid: "307491826",       initials: "DT", avatarColor: "#ec4899", ticketCount: 2, barColor: "#ec4899", status: "Active" as const },
    { id: "3", name: "COPPERVINE WINE BAR",   mid: "594038172",       initials: "CW", avatarColor: "#06b6d4", ticketCount: 1, barColor: "#06b6d4", status: "Active" as const },
    { id: "4", name: "IRONCLAD FITNESS",      mid: "701839264",       initials: "IF", avatarColor: "#ef4444", ticketCount: 1, barColor: "#ef4444", status: "Active" as const },
    { id: "5", name: "BLUEWATER SEAFOOD",     mid: "918273640",       initials: "BW", avatarColor: "#10b981", ticketCount: 1, barColor: "#10b981", status: "Inactive" as const },
  ]

  const brands = [
    { id: "1", name: "Clover",   initials: "CL", avatarColor: "#6366f1", count: 4, countColor: "#6366f1" },
    { id: "2", name: "PAX",      initials: "PA", avatarColor: "#ec4899", count: 3, countColor: "#ec4899" },
    { id: "3", name: "Dejavoo",  initials: "DJ", avatarColor: "#06b6d4", count: 2, countColor: "#06b6d4" },
    { id: "4", name: "Ingenico", initials: "IN", avatarColor: "#f97316", count: 1, countColor: "#f97316" },
  ]

  return (
    <DashboardClient
      stats={stats}
      tickets={tickets}
      activity={activity}
      chartData={chartData}
      today={today}
      onboardingVolume={onboardingVolume}
      resolution={resolution}
      merchants={merchants}
      brands={brands}
    />
  )
}
