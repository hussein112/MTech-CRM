import type { Metadata } from "next"
import { UsersClient } from "./UsersClient"

export const metadata: Metadata = { title: "Users" }

export interface UserRow {
  id: number
  email: string
  full_name: string
  role: "user" | "admin" | "ceo"
  is_active: boolean
  created_at: string
}

const MOCK_USERS: UserRow[] = [
  { id: 1, email: "r.castellano@mtechdistributors.com", full_name: "Rita Castellano",  role: "ceo",   is_active: true,  created_at: "2024-09-03T00:00:00Z" },
  { id: 2, email: "b.okonkwo@mtechdistributors.com",    full_name: "Bayo Okonkwo",     role: "admin", is_active: true,  created_at: "2024-11-18T00:00:00Z" },
  { id: 3, email: "priya.nair@mtechdistributors.com",   full_name: "Priya Nair",       role: "admin", is_active: true,  created_at: "2025-01-07T00:00:00Z" },
  { id: 4, email: "c.whitfield@mtechdistributors.com",  full_name: "Cole Whitfield",   role: "user",  is_active: true,  created_at: "2025-02-14T00:00:00Z" },
  { id: 5, email: "e.rousseau@mtechdistributors.com",   full_name: "Élise Rousseau",   role: "user",  is_active: true,  created_at: "2025-03-22T00:00:00Z" },
  { id: 6, email: "k.obrien@mtechdistributors.com",     full_name: "Kieran O'Brien",   role: "user",  is_active: true,  created_at: "2025-04-01T00:00:00Z" },
  { id: 7, email: "n.petrov@mtechdistributors.com",     full_name: "Nikita Petrov",    role: "user",  is_active: false, created_at: "2025-04-19T00:00:00Z" },
  { id: 8, email: "lupe.zavala@mtechdistributors.com",  full_name: "Lupe Zavala",      role: "user",  is_active: true,  created_at: "2025-05-02T00:00:00Z" },
]

// Bayo Okonkwo is the demo logged-in user (admin)
export default function UsersPage() {
  return <UsersClient users={MOCK_USERS} currentUserId={2} />
}
