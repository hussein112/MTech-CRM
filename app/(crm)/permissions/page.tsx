import type { Metadata } from "next"
import { Suspense } from "react"
import { PermissionsClient } from "./PermissionsClient"

export const metadata: Metadata = {
  title: "Permissions | Mtech CRM",
  robots: "noindex, nofollow",
}

export default function PermissionsPage() {
  return (
    <Suspense>
      <PermissionsClient />
    </Suspense>
  )
}
