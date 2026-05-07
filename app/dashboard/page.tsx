import type { DashboardStats, Ticket, ActivityItem, ChartPoint, ChartPeriod } from "../types/dashboard"
import { DashboardClient } from "../components/dashboard/DashboardClient"

async function getDashboardData() {
  const stats: DashboardStats = { openTickets: 18, totalMerchants: 214, onboarding: 2, resolvedTotal: 47 }

  const tickets: Ticket[] = [
    { id: "MTECH-470501", subject: "Terminal not connecting",   merchant: "Jerusalem Sweets",  status: "Open",        priority: "High",     assignedTo: "Joan Huang",    createdAt: "May 6, 2026" },
    { id: "MTECH-470485", subject: "Chargeback dispute",        merchant: "Sunrise Coffee",    status: "In Progress", priority: "Medium",   assignedTo: "Moe Kadi",      createdAt: "May 5, 2026" },
    { id: "MTECH-470483", subject: "Account login issue",       merchant: "Metro Gas Station", status: "Open",        priority: "Low",      assignedTo: "Moe Kadi",      createdAt: "May 5, 2026" },
    { id: "MTECH-470470", subject: "POS update request",        merchant: "Blue Ocean Diner",  status: "In Progress", priority: "Medium",   assignedTo: "Zu Jia He Cen", createdAt: "May 4, 2026" },
    { id: "MTECH-470461", subject: "Batch settlement mismatch", merchant: "Maple Leaf Market", status: "Open",        priority: "Critical", assignedTo: "Joan Huang",    createdAt: "May 4, 2026" },
  ]

  const activity: ActivityItem[] = [
    { id: "1", userName: "Joan Huang",     action: "updated status for",   targetId: "MTECH-470501", timestamp: "7 min ago"  },
    { id: "2", userName: "Joan Huang",     action: "added a note to",      targetId: "MTECH-470501", timestamp: "7 min ago"  },
    { id: "3", userName: "Joan Huang",     action: "updated status for",   targetId: "MTECH-470485", timestamp: "26 min ago" },
    { id: "4", userName: "Moe Kadi",       action: "updated status for",   targetId: "MTECH-470483", timestamp: "28 min ago" },
    { id: "5", userName: "Moe Kadi",       action: "added a note to",      targetId: "MTECH-470483", timestamp: "28 min ago" },
    { id: "6", userName: "Joan Huang",     action: "added a note to",      targetId: "MTECH-470485", timestamp: "33 min ago" },
    { id: "7", userName: "Zu Jia He Cen", action: "created ticket",       targetId: "MTECH-470501", timestamp: "51 min ago" },
    { id: "8", userName: "Zu Jia He Cen", action: "created new merchant", target: "Jerusalem Sweets (584600000330654)", timestamp: "53 min ago" },
  ]

  const chartData: Record<ChartPeriod, ChartPoint[]> = {
    today: [
      { label: "8am",  created: 2, resolved: 1 },
      { label: "10am", created: 4, resolved: 2 },
      { label: "12pm", created: 3, resolved: 3 },
      { label: "2pm",  created: 5, resolved: 2 },
      { label: "4pm",  created: 2, resolved: 4 },
      { label: "6pm",  created: 1, resolved: 2 },
    ],
    week: [
      { label: "Thu", created: 1,  resolved: 0  },
      { label: "Fri", created: 0,  resolved: 0  },
      { label: "Sat", created: 0,  resolved: 0  },
      { label: "Sun", created: 0,  resolved: 0  },
      { label: "Mon", created: 10, resolved: 10 },
      { label: "Tue", created: 5,  resolved: 7  },
      { label: "Wed", created: 6,  resolved: 4  },
    ],
    "1":  Array.from({ length: 30 }, (_, i) => ({ label: `${i + 1}`, created: Math.floor(Math.random() * 8),  resolved: Math.floor(Math.random() * 6)  })),
    "6":  ["Jan","Feb","Mar","Apr","May","Jun"].map(m =>                 ({ label: m,          created: Math.floor(Math.random() * 40), resolved: Math.floor(Math.random() * 35) })),
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
    { id: "1", name: "322 DELI CORP (Clover)", mid: "496148749880", initials: "3D", avatarColor: "#8b5cf6", ticketCount: 2, barColor: "#8b5cf6", status: "Active" as const },
    { id: "2", name: "NEW YORK LANDSCAPE",     mid: "584600000776443", initials: "NY", avatarColor: "#ec4899", ticketCount: 2, barColor: "#ec4899", status: "Active" as const },
    { id: "3", name: "THE BROOKLYN INN",        mid: "8046425800",      initials: "TB", avatarColor: "#06b6d4", ticketCount: 1, barColor: "#06b6d4", status: "Active" as const },
    { id: "4", name: "STIMULATING MINDS",       mid: "584600000701904", initials: "SM", avatarColor: "#ef4444", ticketCount: 1, barColor: "#ef4444", status: "Active" as const },
    { id: "5", name: "J & J HEATING FUEL",      mid: "584600000391657", initials: "J&", avatarColor: "#10b981", ticketCount: 1, barColor: "#10b981", status: "Active" as const },
  ]

  const brands = [
    { id: "1", name: "Dejavoo", initials: "DE", avatarColor: "#6366f1", count: 4, countColor: "#6366f1" },
    { id: "2", name: "Valor",   initials: "VA", avatarColor: "#ec4899", count: 3, countColor: "#ec4899" },
    { id: "3", name: "Figure",  initials: "FI", avatarColor: "#06b6d4", count: 2, countColor: "#06b6d4" },
    { id: "4", name: "PAX",     initials: "PA", avatarColor: "#f97316", count: 1, countColor: "#f97316" },
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
