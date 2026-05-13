import type { Metadata } from "next"
import { Suspense } from "react"
import { PermissionsClient } from "./PermissionsClient"
import type { PortalUser } from "./PermissionsClient"

export const metadata: Metadata = {
  title: "Permissions | Mtech CRM",
  robots: "noindex, nofollow",
}

// ── Dummy users matching the design reference ──────────────────────────────
const MOCK_USERS: PortalUser[] = [
  {
    id: 1,
    full_name: "Jhon Smith",
    email: "Jhon@mtechdistributors.com",
    role: "user",
    is_active: true,
    permissions: null,
  },
  {
    id: 2,
    full_name: "Hassan Abboud",
    email: "Hassan@mtechdistributors.com",
    role: "user",
    is_active: true,
    permissions: null,
  },
  {
    id: 3,
    full_name: "Angi Kadi",
    email: "Angi@mtechdistributors.com",
    role: "user",
    is_active: true,
    permissions: null,
  },
  {
    id: 4,
    full_name: "Ziad Hage",
    email: "Ziad@mtechdistributors.com",
    role: "ceo",
    is_active: true,
    permissions: null,
  },
  {
    id: 5,
    full_name: "Ella Cen",
    email: "Ella@mtechdistributors.com",
    role: "admin",
    is_active: true,
    permissions: null,
  },
]

export default function PermissionsPage() {
  return (
    <Suspense>
      <PermissionsClient initialUsers={MOCK_USERS} />
    </Suspense>
  )
}
