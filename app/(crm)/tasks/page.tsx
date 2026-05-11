import type { Metadata } from "next"
import { TasksClient } from "./TasksClient"

export const metadata: Metadata = {
  title: "My Tasks | Mtech CRM",
  robots: "noindex, nofollow",
}

export default function TasksPage() {
  return <TasksClient />
}
