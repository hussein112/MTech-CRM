import type { Metadata } from "next"
import { StorageClient } from "./StorageClient"

export const metadata: Metadata = { title: "File Storage" }

export default function FilesPage() {
  return <StorageClient />
}
