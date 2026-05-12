import type { Metadata } from "next"
import { FeedbackClient } from "./FeedbackClient"
import "./feedback.css"

export const metadata: Metadata = {
  title: "Community Feedback",
}

export default function FeedbackPage() {
  return <FeedbackClient />
}
