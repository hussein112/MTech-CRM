export interface DashboardStats {
  openTickets: number
  totalMerchants: number
  onboarding: number
  resolvedTotal: number
}

export type TicketStatus = 'Open' | 'In Progress' | 'Pending Internal' | 'Resolved' | 'Closed'
export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Critical'
export type ChartPeriod = 'today' | 'week' | '1' | '6' | '12'

export interface Ticket {
  id: string
  subject: string
  merchant: string
  merchantId?: string
  status: TicketStatus
  priority: TicketPriority
  assignedTo: string
  createdAt: string
  dueDate?: string
  tags?: string[]
}

export interface ActivityItem {
  id: string
  userName: string
  action: string
  target?: string
  targetId?: string
  timestamp: string
  dotColor?: string
}

export interface ChartPoint {
  label: string
  created: number
  resolved: number
}

export interface OnboardingStats {
  total: number
  pending: number
  inProgress: number
  completed: number
  merchantSubmissions: number
  agentSubmissions: number
}

export interface PriorityBreakdown {
  priority: TicketPriority
  count: number
  color: string
}

export interface MerchantRow {
  id: string
  name: string
  mid: string
  ticketCount: number
  latestStatus: TicketStatus
  avatarColor: string
}