import type { Metadata } from "next"
import { AgentsClient } from "./AgentsClient"

export const metadata: Metadata = { title: "Agents" }

export interface Agent {
  id: number
  agent_code: string
  full_name: string
  email: string
  phone: string
  status: "Active" | "Inactive" | "Suspended" | "Pending"
  tier: "35%" | "45%" | "55%" | ""
  business_name: string
  address: string
  merchant_count: number
  parent_agent_id: number | null
  join_date: string
  created_at: string
  whitelabel_office: string
}

const MOCK_AGENTS: Agent[] = [
  {
    id: 1, agent_code: "4521-001", full_name: "Valentina Cruz",
    email: "v.cruz@payments.io", phone: "(714) 883-2190",
    status: "Active", tier: "55%", business_name: "Cruz Payment Solutions LLC",
    address: "892 Commerce Blvd, Anaheim, CA 92801",
    merchant_count: 15, parent_agent_id: null,
    join_date: "2023-03-15", created_at: "2023-03-15T00:00:00Z",
    whitelabel_office: "West Coast",
  },
  {
    id: 2, agent_code: "4521-002", full_name: "Marcus Webb",
    email: "m.webb@payments.io", phone: "(212) 447-9834",
    status: "Active", tier: "45%", business_name: "Webb Merchant Group Inc.",
    address: "240 Park Ave S, New York, NY 10003",
    merchant_count: 8, parent_agent_id: null,
    join_date: "2023-06-01", created_at: "2023-06-01T00:00:00Z",
    whitelabel_office: "Northeast",
  },
  {
    id: 3, agent_code: "4521-003", full_name: "Dani Kowalski",
    email: "d.kowalski@payments.io", phone: "(312) 552-0071",
    status: "Active", tier: "35%", business_name: "",
    address: "1150 N Michigan Ave, Chicago, IL 60611",
    merchant_count: 3, parent_agent_id: 2,
    join_date: "2024-01-10", created_at: "2024-01-10T00:00:00Z",
    whitelabel_office: "Midwest",
  },
  {
    id: 4, agent_code: "4521-004", full_name: "Tariq Brennan",
    email: "t.brennan@payments.io", phone: "(617) 330-8852",
    status: "Inactive", tier: "35%", business_name: "Brennan POS Services",
    address: "500 Boylston St, Boston, MA 02116",
    merchant_count: 0, parent_agent_id: 2,
    join_date: "2023-09-22", created_at: "2023-09-22T00:00:00Z",
    whitelabel_office: "Northeast",
  },
  {
    id: 5, agent_code: "4521-005", full_name: "Sunita Osei",
    email: "s.osei@payments.io", phone: "(404) 718-3325",
    status: "Active", tier: "45%", business_name: "Osei Payments Inc.",
    address: "3400 Peachtree Rd NE, Atlanta, GA 30326",
    merchant_count: 7, parent_agent_id: null,
    join_date: "2023-11-05", created_at: "2023-11-05T00:00:00Z",
    whitelabel_office: "Southeast",
  },
  {
    id: 6, agent_code: "4521-006", full_name: "Felix Drummond",
    email: "f.drummond@payments.io", phone: "(305) 841-6612",
    status: "Pending", tier: "", business_name: "",
    address: "701 Brickell Ave, Miami, FL 33131",
    merchant_count: 0, parent_agent_id: 5,
    join_date: "2025-04-28", created_at: "2025-04-28T00:00:00Z",
    whitelabel_office: "Southeast",
  },
  {
    id: 7, agent_code: "4521-007", full_name: "Ingrid Lau",
    email: "i.lau@payments.io", phone: "(415) 229-4407",
    status: "Active", tier: "35%", business_name: "Lau Retail Tech",
    address: "235 Montgomery St, San Francisco, CA 94104",
    merchant_count: 5, parent_agent_id: 1,
    join_date: "2024-02-19", created_at: "2024-02-19T00:00:00Z",
    whitelabel_office: "West Coast",
  },
  {
    id: 8, agent_code: "4521-008", full_name: "Rashid Baxter",
    email: "r.baxter@payments.io", phone: "(469) 503-7729",
    status: "Suspended", tier: "45%", business_name: "Baxter Processing Co.",
    address: "4900 Main St, Dallas, TX 75226",
    merchant_count: 2, parent_agent_id: null,
    join_date: "2023-07-14", created_at: "2023-07-14T00:00:00Z",
    whitelabel_office: "Southwest",
  },
  {
    id: 9, agent_code: "4521-009", full_name: "Noa Ferreira",
    email: "n.ferreira@payments.io", phone: "(602) 388-1045",
    status: "Active", tier: "55%", business_name: "Ferreira Payments Group",
    address: "2121 E Camelback Rd, Phoenix, AZ 85016",
    merchant_count: 12, parent_agent_id: null,
    join_date: "2023-02-08", created_at: "2023-02-08T00:00:00Z",
    whitelabel_office: "Southwest",
  },
  {
    id: 10, agent_code: "4521-010", full_name: "Cleo Nakashima",
    email: "c.nakashima@payments.io", phone: "(503) 674-2938",
    status: "Active", tier: "35%", business_name: "",
    address: "1 SW Columbia St, Portland, OR 97204",
    merchant_count: 4, parent_agent_id: 1,
    join_date: "2024-05-07", created_at: "2024-05-07T00:00:00Z",
    whitelabel_office: "West Coast",
  },
]

export default function AgentsPage() {
  return <AgentsClient agents={MOCK_AGENTS} />
}
