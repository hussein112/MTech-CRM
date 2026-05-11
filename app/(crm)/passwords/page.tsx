import type { Metadata } from "next"
import { PasswordsClient } from "./PasswordsClient"

export const metadata: Metadata = { title: "Password Vault" }

export interface Credential {
  id: string
  title: string
  category: "General" | "Portal" | "POS" | "Email" | "Banking" | "Merchant" | "API" | "Other"
  folder: "All" | "Portal" | "POS" | "Email" | "Banking" | "Merchant" | "API" | "Other"
  username: string
  password: string
  url: string
  notes: string
  strength: "Weak" | "Medium" | "Strong"
  createdAt: string
}

const MOCK_CREDENTIALS: Credential[] = [
  { id: "1",  title: "Fiserv Partner Portal",     category: "Portal",   folder: "Portal",   username: "ops@mtech-dist.io",        password: "F!s3rv#Port@l25",   url: "https://partner.fiserv.com",          notes: "",                                  strength: "Strong", createdAt: "2025-01-14" },
  { id: "2",  title: "PAX Technology Dashboard",  category: "POS",      folder: "POS",      username: "deploy@mtech-dist.io",     password: "P@xD3pl0y$99!",     url: "https://dashboard.pax.us",            notes: "PAX A920 & A35 fleet management",    strength: "Strong", createdAt: "2025-02-03" },
  { id: "3",  title: "Dejavoo Merchant Hub",      category: "POS",      folder: "POS",      username: "mtech.ops@dejavoo.net",    password: "Djv00Hub25",         url: "https://hub.dejavoo.net",             notes: "",                                  strength: "Weak",   createdAt: "2025-01-22" },
  { id: "4",  title: "Google Workspace Admin",    category: "Email",    folder: "Email",    username: "admin@mtech-dist.io",      password: "G0ogl3Adm!n#25",    url: "https://admin.google.com",            notes: "Manage all company email accounts", strength: "Strong", createdAt: "2024-11-08" },
  { id: "5",  title: "Chase Business Banking",    category: "Banking",  folder: "Banking",  username: "treasurer@mtech-dist.io",  password: "Ch@se#B!z2025",     url: "https://businessbanking.chase.com",   notes: "Account ending 4872",               strength: "Strong", createdAt: "2024-09-30" },
  { id: "6",  title: "Stripe Live Dashboard",     category: "Merchant", folder: "Merchant", username: "billing@mtech-dist.io",    password: "Str!pe$L1ve!",      url: "https://dashboard.stripe.com",        notes: "",                                  strength: "Strong", createdAt: "2025-03-11" },
  { id: "7",  title: "Twilio API Console",        category: "API",      folder: "API",      username: "ACb8e3f1a924d9c02b",       password: "twl10_api_K3y!XQ9", url: "https://console.twilio.com",          notes: "SMS for ticket notifications",       strength: "Strong", createdAt: "2025-02-28" },
  { id: "8",  title: "Supabase Production DB",    category: "API",      folder: "API",      username: "mtech_prod",               password: "sBs3cr3t!Pr0d",     url: "https://app.supabase.com",            notes: "Production — handle with care",      strength: "Strong", createdAt: "2025-04-01" },
  { id: "9",  title: "Zoho CRM (Legacy)",         category: "Portal",   folder: "Portal",   username: "legacy@mtech-dist.io",     password: "Z0h0legacy",         url: "https://crm.zoho.com",               notes: "Read-only legacy access",            strength: "Weak",   createdAt: "2024-06-15" },
  { id: "10", title: "Mailchimp Marketing",       category: "Email",    folder: "Email",    username: "marketing@mtech-dist.io",  password: "M@ilch!mp#Mkt",     url: "https://mailchimp.com",               notes: "Campaign emails",                   strength: "Medium", createdAt: "2024-12-05" },
  { id: "11", title: "QuickBooks Online",         category: "Banking",  folder: "Banking",  username: "finance@mtech-dist.io",    password: "QB!0nline#2025",    url: "https://app.qbo.intuit.com",          notes: "Company financials",                strength: "Strong", createdAt: "2025-01-07" },
  { id: "12", title: "Authorize.net Sandbox",     category: "Merchant", folder: "Merchant", username: "sandbox_mtech_dev",        password: "s@ndbox_t3st",       url: "https://sandbox.authorize.net",      notes: "Testing only — not production",      strength: "Weak",   createdAt: "2025-03-20" },
  { id: "13", title: "SendGrid SMTP API",         category: "API",      folder: "API",      username: "apikey",                   password: "SG.x9K!pzQrN3mA",  url: "https://app.sendgrid.com",            notes: "Transactional email delivery",       strength: "Strong", createdAt: "2025-03-05" },
  { id: "14", title: "Microsoft 365 Admin",       category: "Email",    folder: "Email",    username: "admin@mtech-dist.io",      password: "M$365@dm!n2025",    url: "https://admin.microsoft.com",         notes: "SharePoint & Teams admin",           strength: "Strong", createdAt: "2025-02-12" },
  { id: "15", title: "Vercel Deployments",        category: "API",      folder: "API",      username: "devops@mtech-dist.io",     password: "V3rc3l!Deploy",      url: "https://vercel.com/dashboard",       notes: "CRM app CI/CD",                     strength: "Medium", createdAt: "2025-04-08" },
]

export default function PasswordsPage() {
  return <PasswordsClient credentials={MOCK_CREDENTIALS} />
}
