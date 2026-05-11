import type { Metadata } from "next"
import { Fragment } from "react"

export const metadata: Metadata = { title: "Changelog" }

type TagStyle = "feature" | "fix" | "update" | "infra"
type BulletStyle = "feat" | "upd" | "fix"

interface CLBullet { s: BulletStyle; icon: string; html: string }
interface CLSection { h?: string; items: CLBullet[] }
interface CLEntry {
  date: string
  time?: string
  tags: { s: TagStyle; l: string }[]
  title: string
  desc: string
  sections: CLSection[]
}

const ENTRIES: CLEntry[] = [
  {
    date: "May 6, 2026",
    time: "Evening Update",
    tags: [{ s: "update", l: "Update" }, { s: "infra", l: "Infrastructure" }],
    title: "Cloudflare DNS & Nameserver Migration Guide",
    desc: `Updating the nameservers is like changing the "master switchboard operator" for your domain.`,
    sections: [
      {
        items: [
          { s: "upd", icon: "swap_horiz", html: `<strong>How it Works:</strong> Right now, GoDaddy is your operator. When someone types mtechdistributors.com or sends an email to it, the internet asks GoDaddy where to send that traffic. By updating the nameservers to Cloudflare, you are telling the internet: "GoDaddy is still where I pay my yearly registration bill, but Cloudflare is now handling the switchboard."` },
        ],
      },
      {
        h: "Why does Cloudflare need to be the switchboard?",
        items: [
          { s: "feat", icon: "dns", html: "<strong>The Dropdown Menu:</strong> To use that easy Cloudflare Tunnel UI (where you pick your domain from a dropdown and route it to your local port), Cloudflare strictly requires that they manage the DNS." },
          { s: "feat", icon: "security", html: "<strong>Security & Speed:</strong> Cloudflare isn't just a router; it's a massive security firewall. By becoming the switchboard, Cloudflare can block hackers, stop DDoS attacks, and hide your local server's actual IP address before the traffic even reaches your tunnel." },
          { s: "feat", icon: "done_all", html: "<strong>Seamless Transition:</strong> Because we let Cloudflare scan and copy all your existing GoDaddy records (Shopify, Email, CRM) earlier, the transition is completely seamless. Cloudflare just takes over the exact same switchboard rules GoDaddy had, but now gives you the superpower to easily create secure tunnels!" },
        ],
      },
    ],
  },
  {
    date: "May 6, 2026",
    time: "Afternoon Update",
    tags: [{ s: "update", l: "Update" }, { s: "fix", l: "Bug Fix" }],
    title: "UI Consistency & Calendar Layout Fix",
    desc: `Added "Testing Mode" banners to beta modules and resolved a CSS issue that was truncating the Calendar view.`,
    sections: [
      {
        items: [
          { s: "upd", icon: "design_services", html: `<strong>Testing Mode Banners:</strong> Standardized the UI by adding a consistent "Testing Mode" notice to the Password Manager, Tasks, and Calendar.` },
          { s: "fix", icon: "build", html: "<strong>Calendar Layout Resolved:</strong> Fixed a flexbox height issue causing the calendar iframe to collapse, ensuring the schedule now fills the entire page height." },
        ],
      },
    ],
  },
  {
    date: "May 6, 2026",
    time: "Morning Update",
    tags: [{ s: "update", l: "Update" }, { s: "fix", l: "Bug Fix" }],
    title: "Ticket Workflow Modernization, Calendar Live Sync & Permissions Updates",
    desc: "We completely redesigned the ticket creation process to be faster and smarter, upgraded the Calendar page with real-time synchronization, and fixed several issues with the Permissions Manager so changes take effect instantly.",
    sections: [
      {
        h: "Ticket Creation Upgrades",
        items: [
          { s: "feat", icon: "check_circle", html: `<strong>Smart Category Routing:</strong> The "New Ticket" window has been completely rebuilt. When you select a Category (like Hardware &amp; POS or Billing), the system now automatically routes it to the correct Department without you needing to guess.` },
          { s: "upd", icon: "check_circle", html: `<strong>Simplified Form Layout:</strong> We removed the redundant "Subcategory" dropdown and cleaned up the extra information fields. The form is now much cleaner and faster to fill out, asking only for the information truly needed to solve the issue.` },
          { s: "upd", icon: "check_circle", html: `<strong>Clean Ticket Details View:</strong> We removed the clunky "Additional Details" grid from the ticket viewing screen. The screen is now perfectly clean and focuses entirely on the issue description, status, and communication history.` },
          { s: "feat", icon: "check_circle", html: "<strong>Historical Data Updated:</strong> All of your older tickets have been safely organized and re-labeled into the new, improved category structure automatically so everything is perfectly consistent." },
        ],
      },
      {
        h: "Live Event Sync",
        items: [
          { s: "feat", icon: "check_circle", html: "<strong>Events Update Instantly for Everyone:</strong> When someone creates, edits, or deletes a calendar event, all other team members viewing the calendar will see the change appear automatically — no need to refresh the page." },
          { s: "upd", icon: "check_circle", html: "<strong>Faster Initial Loading:</strong> The calendar now loads your saved events immediately while it fetches the latest data in the background, so you never stare at a blank screen." },
        ],
      },
      {
        h: "Event Management",
        items: [
          { s: "fix", icon: "check_circle", html: "<strong>Clicking Events Now Opens the Correct One:</strong> Fixed a bug where clicking on an event could sometimes open a different event's details, especially after creating or deleting items. Events now always open the correct detail view." },
          { s: "fix", icon: "check_circle", html: "<strong>Deleting Events Works Reliably:</strong> Fixed an issue where deleting a calendar event could fail silently without any error message. You'll now see a clear confirmation when an event is deleted, or an error message if something goes wrong." },
          { s: "fix", icon: "check_circle", html: "<strong>Tasks Can No Longer Be Accidentally Deleted:</strong> Calendar items that come from your Tasks page (shown in purple) can no longer be accidentally deleted from the calendar. The delete button is hidden for task-based entries — manage them from the Tasks page instead." },
        ],
      },
      {
        h: "Navigation & Display",
        items: [
          { s: "fix", icon: "check_circle", html: "<strong>Calendar Always Scrolls to the Right Time:</strong> Fixed a bug where switching between Day, Week, and Month views would sometimes leave the calendar scrolled to midnight instead of your current time of day. The view now anchors to 8:00 AM automatically." },
          { s: "upd", icon: "check_circle", html: "<strong>Full Dark Mode Support:</strong> The calendar now fully respects your portal theme setting. All calendar views, event cards, modals, and date pickers properly switch between light and dark mode along with the rest of the portal." },
        ],
      },
      {
        h: "Permissions Manager",
        items: [
          { s: "fix", icon: "check_circle", html: `<strong>Permissions Save Reliably:</strong> Fixed an issue where changing a team member's permissions wouldn't properly save. All your custom permission settings and presets (like "Minimal" or "View Only") now save perfectly every time.` },
          { s: "feat", icon: "check_circle", html: "<strong>Instant Updates Without Logging Out:</strong> When you update someone's permissions, the changes now take effect immediately. They no longer need to log out and log back in to see the updates." },
          { s: "upd", icon: "check_circle", html: "<strong>Clean Navigation Menu:</strong> The sidebar menu will now automatically hide any pages that a team member doesn't have permission to view, keeping their portal experience clean and focused." },
          { s: "fix", icon: "check_circle", html: "<strong>Security Enhancements:</strong> Added protections to ensure team members cannot accidentally lock themselves out by modifying their own permissions, and ensured only authorized administrators can access the Permissions page." },
        ],
      },
    ],
  },
  {
    date: "May 5, 2026",
    time: "Late Night Update",
    tags: [{ s: "feature", l: "Feature" }, { s: "update", l: "Update" }, { s: "fix", l: "Bug Fix" }],
    title: "Agent Dashboard Profiles, Sub-Agent Hierarchy & Merchant Counts",
    desc: "The Agents page has been completely redesigned with full agent profiles you can click into, a new sub-agent hierarchy system, and accurate merchant counts for every agent in the list.",
    sections: [
      {
        h: "Agent Profiles",
        items: [
          { s: "feat", icon: "check_circle", html: "<strong>Click to View Full Profile:</strong> You can now click on any agent in the list to open their full profile page. The profile shows their contact information, business details, agent code, join date, current status, and commission tier — all in one place." },
          { s: "feat", icon: "check_circle", html: "<strong>At-a-Glance Performance Cards:</strong> Each agent profile features summary cards at the top showing their total merchants, active merchants, total monthly volume, and commission tier — making it easy to assess an agent's portfolio in seconds." },
          { s: "feat", icon: "check_circle", html: "<strong>Tabbed Profile Sections:</strong> Agent profiles are organized into tabs — Overview, Merchants, Sub-Agents (or Parent Agent), Performance, Documents, and Notes — so you can drill into exactly the information you need." },
        ],
      },
      {
        h: "Merchant Drill-Down",
        items: [
          { s: "feat", icon: "check_circle", html: "<strong>See All Merchants Under an Agent:</strong> The Merchants tab inside an agent's profile lists every merchant assigned to that agent, including their MID, business name, status, and monthly volume. Click any merchant to jump directly to their profile on the Merchants page." },
          { s: "feat", icon: "check_circle", html: "<strong>Merchant Count in Agent List:</strong> The main Agents table now shows how many merchants each agent manages. This number updates automatically and is always accurate — no more showing zero for everyone." },
        ],
      },
      {
        h: "Sub-Agent Hierarchy",
        items: [
          { s: "feat", icon: "check_circle", html: `<strong>Sub-Agents Tab for Parent Agents:</strong> If an agent has sub-agents (for example, 1219-002 has sub-agents 1219-002-002, 1219-002-004, and 1219-002-006), a "Sub-Agents" tab appears in their profile with a count badge showing how many. Click any sub-agent to open their profile.` },
          { s: "feat", icon: "check_circle", html: `<strong>Parent Agent Tab for Sub-Agents:</strong> When viewing a sub-agent's profile, a "Parent Agent" tab appears instead. It displays a card with the parent agent's name, code, status, and merchant count. Click the card to jump to the parent's profile. The profile header also shows an "Under [Parent Name]" label.` },
        ],
      },
      {
        h: "Agent List Upgrades",
        items: [
          { s: "upd", icon: "check_circle", html: "<strong>New Columns &amp; Filters:</strong> The Agents table now includes Tier and Merchants columns alongside Agent, Code, Email, Status, Added, and Actions. New filter dropdowns let you narrow the list by Status, Tier, or Office." },
          { s: "upd", icon: "check_circle", html: `<strong>Tab Count Badges:</strong> The Merchants and Sub-Agents tabs in agent profiles now display count badges (like "Merchants 6" and "Sub-Agents 3") so you can see at a glance how many items each tab contains.` },
          { s: "fix", icon: "check_circle", html: "<strong>Merchant Counts Always Show Correctly:</strong> Fixed an issue where the Merchant count column and tab badge would sometimes show 0 until you refreshed the page. Counts are now saved and restored instantly, so they always appear correctly from the moment the page loads." },
        ],
      },
      {
        h: "Agent Notes, Documents & Performance",
        items: [
          { s: "feat", icon: "check_circle", html: "<strong>Ticket-Style Agent Notes:</strong> The Notes tab inside an Agent's profile has been completely overhauled to match the premium design of Ticket Notes. It features rich-text editing, multi-file attachments with clickable preview links, and precise timestamps." },
          { s: "upd", icon: "check_circle", html: "<strong>Note Author Controls:</strong> Team members can now safely edit and delete their own agent notes. Administrators retain the ability to manage all notes, ensuring a clean and secure activity log." },
          { s: "feat", icon: "check_circle", html: "<strong>Dedicated Agent Documents:</strong> Agents now have a dedicated Documents tab where you can upload and securely store important compliance and onboarding files directly to their profile." },
          { s: "feat", icon: "check_circle", html: "<strong>Performance Analytics:</strong> The Performance tab has been populated with clear visual data and analytics. You can now effortlessly track an agent's processed volume and key metrics at a glance." },
        ],
      },
    ],
  },
  {
    date: "May 5, 2026",
    time: "Afternoon Update",
    tags: [{ s: "update", l: "Update" }, { s: "feature", l: "Feature" }],
    title: "Onboarding Status Workflow, Ticket Attachments & New Categories",
    desc: "We've completely redesigned how application statuses work on both the Merchant and Agent Onboarding pages, and added a helpful new workflow guide. We also improved ticket notes to allow you to easily remove mistaken file attachments, fixed issues with files not saving properly, and expanded our ticket categories.",
    sections: [
      {
        h: "Simplified Status Tracking",
        items: [
          { s: "upd", icon: "check_circle", html: `<strong>One Status Instead of Two:</strong> Previously, onboarding tickets had both a generic "Status" and a separate "App Status," which was confusing. We've removed the generic status from the onboarding views entirely. You now see just one clear "App Status" column that tells you exactly where the application stands.` },
          { s: "upd", icon: "check_circle", html: "<strong>New Application Stages:</strong> The old statuses (Received, Underwriting, Approved, Rejected) have been replaced with a more detailed lifecycle: <strong>Submitted, Under Review, Awaiting Merchant, Awaiting Processor, Approved, Live, Declined,</strong> and <strong>Withdrawn</strong>. Each stage clearly describes where the application is in the onboarding process." },
          { s: "upd", icon: "check_circle", html: "<strong>Color-Coded Badges:</strong> Each status now has its own distinct color in the onboarding table — blue/gray for new submissions, purple for under review, yellow for waiting stages, green for approved and live, and red for declined or withdrawn — so you can scan the queue at a glance." },
        ],
      },
      {
        h: "Ticket Details Update",
        items: [
          { s: "upd", icon: "check_circle", html: "<strong>App Status Front and Center:</strong> When viewing an onboarding ticket, the Application Status dropdown is now the very first field you see, followed by Priority, Escalation, and Category. The old generic Status dropdown is hidden for onboarding tickets since it's managed automatically behind the scenes." },
          { s: "upd", icon: "check_circle", html: `<strong>Decline Reason Required:</strong> If you change an application's status to "Declined," a popup will ask you to provide a reason before saving. This reason is permanently attached to the ticket for future reference. (Previously called "Rejected," now updated to "Declined.")` },
        ],
      },
      {
        h: "Workflow Help Guide",
        items: [
          { s: "feat", icon: "check_circle", html: "<strong>New Help Button:</strong> Both the Merchant and Agent Onboarding pages now have a help icon in the top-right corner. Clicking it opens a guide that explains what each application status means and how applications move through the onboarding process — perfect for new team members or quick reference." },
        ],
      },
      {
        h: "Filters Updated",
        items: [
          { s: "upd", icon: "check_circle", html: `<strong>Filter by New Statuses:</strong> The status filter dropdown on both onboarding pages now lists all eight new application stages. You can quickly narrow down the queue to see only applications in a specific stage, like "Awaiting Merchant" or "Live."` },
        ],
      },
      {
        h: "Ticket Attachments",
        items: [
          { s: "feat", icon: "check_circle", html: `<strong>Remove Attached Files:</strong> If you accidentally attach the wrong file to a ticket note, you can now easily remove it. Just click the edit pencil on your note, click the small "x" next to the file name, and click save.` },
          { s: "fix", icon: "check_circle", html: "<strong>Reliable File Saving:</strong> Fixed an issue where documents or images attached to a brand new note were sometimes failing to save to the ticket's history. Newly attached files will now stick reliably every time." },
          { s: "upd", icon: "check_circle", html: `<strong>Cleaner Note Viewing:</strong> Removed the "(file attachment)" text placeholder that would automatically appear when you uploaded a file without writing any text. Notes with only files now display perfectly clean in the activity feed.` },
        ],
      },
      {
        h: "Ticket Categories",
        items: [
          { s: "feat", icon: "check_circle", html: `<strong>New Billing/Statement Category:</strong> Added a new "Billing/Statement" option to the Category dropdown when creating new tickets, making it easier to properly classify financial inquiries.` },
        ],
      },
    ],
  },
  {
    date: "May 5, 2026",
    time: "Early Morning Update",
    tags: [{ s: "update", l: "Update" }, { s: "feature", l: "Feature" }],
    title: "Massive Mobile Experience Upgrade",
    desc: "We have completely redesigned the portal to look and feel like a premium mobile app when accessed from your phone or tablet. Every major page has been upgraded to eliminate awkward zooming, prevent cut-off text, and make all information easy to read on smaller screens.",
    sections: [
      {
        h: "Mobile-Friendly Layouts",
        items: [
          { s: "feat", icon: "check_circle", html: `<strong>Premium Mobile Cards:</strong> Across the Tickets, Merchants, Users, Agents, and Inventory pages, we've replaced the wide desktop data tables with clean, multi-row "cards." All your critical information is now stacked beautifully so it perfectly fits your phone screen without needing to scroll side-to-side.` },
          { s: "upd", icon: "check_circle", html: "<strong>Swipeable Filters:</strong> The search bars and dropdown filters on all pages are now fully optimized for touch. Dropdowns (like Status, Priority, or Assigned) now sit in a horizontally swipeable row, saving valuable vertical screen space so you can focus on the content." },
        ],
      },
      {
        h: "Page-Specific Polish",
        items: [
          { s: "upd", icon: "check_circle", html: "<strong>Activity Feed Wrapping:</strong> The Activity Feed now cleanly stacks complex updates (such as long equipment changes or document modifications) so nothing gets cut off or hangs over the edge of your screen." },
          { s: "upd", icon: "check_circle", html: `<strong>Forms &amp; Buttons:</strong> Pages with complex forms and actions like the Resources library and Password Vault have been polished. Buttons will now neatly stack above lists on mobile, and forms (like "New Credential" or "Create Folder") will cleanly adapt their width for easy typing on the go.` },
        ],
      },
    ],
  },
  {
    date: "May 4, 2026",
    time: "Midnight Update",
    tags: [{ s: "feature", l: "Feature" }, { s: "fix", l: "Bug Fix" }],
    title: "Community Feedback Upgrades & Screen Fixes",
    desc: "You can now easily share screenshots and documents when submitting feedback, and we fixed an issue where extremely long descriptions would break the screen layout.",
    sections: [
      {
        h: "Feedback Attachments",
        items: [
          { s: "feat", icon: "check_circle", html: `<strong>Drag &amp; Drop Images:</strong> Added a clean, modern drag-and-drop area to the "Submit Feedback" window. You can now easily attach screenshots or photos directly to your bug reports or feature requests to give our team better context.` },
          { s: "feat", icon: "check_circle", html: "<strong>Clickable Previews:</strong> Any images attached to a feedback submission will now display as clickable links when viewing the feedback, opening the full image in a new tab for easy viewing." },
        ],
      },
      {
        h: "Layout Fixes",
        items: [
          { s: "fix", icon: "check_circle", html: "<strong>Scrolling Long Descriptions:</strong> Fixed a bug where viewing a feedback item with a very long description would cause the viewing window to stretch off the screen, making it impossible to read or close. The text box now neatly scrolls on the inside, keeping the main window perfectly sized." },
        ],
      },
    ],
  },
  {
    date: "May 4, 2026",
    time: "Late Night Update",
    tags: [{ s: "feature", l: "Feature" }, { s: "fix", l: "Bug Fix" }, { s: "fix", l: "Security" }],
    title: "Password Vault Security Upgrade, Inventory Image Fix & Layout Polish",
    desc: "Upgraded the Password Manager to use secure email verification instead of a static PIN, fixed product images displaying with dark backgrounds, and polished layouts across the Resources and Onboarding pages.",
    sections: [
      {
        h: "Password Manager Security",
        items: [
          { s: "feat", icon: "check_circle", html: "<strong>Email Verification Replaces Master PIN:</strong> The old 4-digit Master PIN system has been retired. To unlock the Password Vault, the system now emails a secure, 6-digit verification code directly to you. This ensures that only the verified account owner can access their saved passwords." },
          { s: "feat", icon: "check_circle", html: "<strong>Modern Keypad Interface:</strong> The unlock screen has been redesigned with a modern, clean interface that matches the portal's theme. It supports easy typing and automatically verifies the code once all 6 digits are entered." },
        ],
      },
      {
        h: "Inventory",
        items: [
          { s: "fix", icon: "check_circle", html: "<strong>Product Images No Longer Have Dark Backgrounds:</strong> Fixed a bug where product images with transparent backgrounds (like cutout photos of terminals) would display with an ugly black background after being uploaded. Images are now saved in a format that preserves transparency, so they display cleanly on any background." },
          { s: "fix", icon: "check_circle", html: "<strong>Cleaner Image Thumbnails:</strong> Product thumbnails in the inventory list now display on a clean white background with proper spacing, so cutout images look sharp and professional instead of being squished against a dark surface." },
          { s: "fix", icon: "check_circle", html: "<strong>Re-upload Notice for Existing Images:</strong> Products that were uploaded before this fix still have the old dark backgrounds baked into the image file. A notice now appears on the Inventory page letting you know which images need to be re-uploaded to take advantage of the new transparency support." },
        ],
      },
      {
        h: "Layout & Polish",
        items: [
          { s: "fix", icon: "check_circle", html: "<strong>Resources Page Stretches Wide:</strong> Fixed an issue where the Resources page had excessive empty gaps on the left and right sides. The file library now stretches to full width, matching the rest of the portal pages and giving you more room to view your documents." },
          { s: "upd", icon: "check_circle", html: `<strong>Clearer Ticket Status Colors:</strong> On the Merchant and Agent Onboarding pages, both "Closed" and "Rejected" statuses now prominently display in red, making it instantly clear which applications are no longer active.` },
          { s: "fix", icon: "check_circle", html: `<strong>Ticket Search Typing Fixed:</strong> Fixed an issue where the "Select Merchant" search bar on the Tickets page would interrupt you while typing, forcing you to click it again for every letter. You can now type your search smoothly without interruption.` },
        ],
      },
    ],
  },
  {
    date: "May 4, 2026",
    tags: [{ s: "feature", l: "Feature" }, { s: "fix", l: "Bug Fix" }, { s: "update", l: "Update" }],
    title: "Application Status Tracking, Account Closures & Onboarding Page Fixes",
    desc: "Added new application status tracking to the onboarding queues, introduced a streamlined workflow for closing merchant accounts, and repaired all visual issues across the Merchant and Agent Onboarding pages.",
    sections: [
      {
        h: "Application Status Tracking",
        items: [
          { s: "feat", icon: "check_circle", html: `<strong>Application Status Column:</strong> Both the Merchant and Agent Onboarding queues now show a dedicated "App Status" column. You can see at a glance whether an application is Received, Underwriting, Approved, or Rejected — right from the main table without opening each ticket.` },
          { s: "feat", icon: "check_circle", html: `<strong>Update Status from Ticket View:</strong> When reviewing an onboarding ticket, a new "Application Status" dropdown appears at the top. You can change the application status directly while looking at the file — no need to navigate elsewhere.` },
          { s: "feat", icon: "check_circle", html: `<strong>Rejection Reason Required:</strong> If you mark an application as "Rejected," a popup will appear asking you to explain the reason before the change is saved. The reason is then permanently attached to the ticket so it's always available for reference.` },
        ],
      },
      {
        h: "Account Closure Workflow",
        items: [
          { s: "feat", icon: "check_circle", html: `<strong>Close Accounts from Dashboard:</strong> You can now close a merchant account directly from the main merchant dashboard. Clicking "Closed" on the status indicator instantly opens a popup to collect the required closure details.` },
          { s: "feat", icon: "check_circle", html: "<strong>Ticket &amp; Reason Verification:</strong> Closing an account requires a valid Ticket ID and a detailed reason. The system checks that the ticket exists before allowing the closure to proceed, preventing mistakes." },
          { s: "feat", icon: "check_circle", html: "<strong>Automatic Audit Trails:</strong> The system now automatically records exactly who closed an account and when. The closure history is completely accurate and cannot be bypassed or edited after the fact." },
        ],
      },
      {
        h: "Onboarding Page Fixes",
        items: [
          { s: "fix", icon: "check_circle", html: "<strong>Search &amp; Filter Bar Fixed:</strong> The search bar, status dropdown, assigned dropdown, and reset button on both the Merchant and Agent Onboarding pages were appearing broken and misaligned. All filter controls now sit neatly on a single row with proper spacing and styling." },
          { s: "fix", icon: "check_circle", html: "<strong>Dropdown Styling Restored:</strong> The status and assigned-to dropdown menus were displaying as plain, unstyled browser defaults with no borders or backgrounds. They now have proper rounded borders, backgrounds, and focus effects matching the rest of the portal." },
          { s: "fix", icon: "check_circle", html: "<strong>Table Header &amp; Row Alignment:</strong> The column headers and data rows in both onboarding tables were misaligned, causing text to appear under the wrong column. All columns now line up correctly across the header and every ticket row." },
          { s: "fix", icon: "check_circle", html: `<strong>Status Badges Centered:</strong> The "App Status" and "Status" badges in the onboarding tables were left-aligned while their column headers were centered. These badges now appear properly centered under their headings.` },
          { s: "fix", icon: "check_circle", html: "<strong>Popup Blur No Longer Sticks:</strong> Fixed an issue where the blurred background from a popup could remain stuck on screen after navigating to a different page. All popups now fully clean up when you leave the page." },
          { s: "fix", icon: "check_circle", html: `<strong>Onboarding Links Now Work Everywhere:</strong> The "Get Onboarding Form" and "Get Agent Form" links in the onboarding pages now work correctly in both the live site and local testing environments, instead of always pointing to the live site only.` },
        ],
      },
      {
        h: "Other Improvements",
        items: [
          { s: "fix", icon: "check_circle", html: "<strong>Text Editor Crash Fixed:</strong> Resolved an issue where opening and closing the account closure popup multiple times would cause the text formatting toolbar (bold, italic, etc.) to duplicate and stack on top of itself." },
          { s: "fix", icon: "check_circle", html: "<strong>Changelog Page Crash Fixed:</strong> The Changelog page was crashing because it tried to load the text formatting toolbar even though it doesn't use one. This has been fixed so the Changelog always loads without errors." },
        ],
      },
    ],
  },
  {
    date: "May 3, 2026",
    time: "Morning Update",
    tags: [{ s: "fix", l: "Bug Fix" }, { s: "update", l: "Update" }],
    title: "Performance Optimization & Dashboard Stability",
    desc: "Major performance improvements across the entire portal. Eliminated redundant database connections that were slowing down page loads, fixed dashboard ticket queue counting inconsistencies, and resolved a CSS parsing error affecting styles portal-wide.",
    sections: [
      {
        h: "Performance Improvements",
        items: [
          { s: "upd", icon: "check_circle", html: "<strong>Eliminated Redundant Database Clients:</strong> Reduced from 5+ separate Supabase client instances to a single shared connection. The sidebar, notification system, and background agents now all reuse the same database client — eliminating duplicate authentication handshakes that added seconds to every page load." },
          { s: "upd", icon: "check_circle", html: "<strong>Faster Page Transitions:</strong> Sidebar-to-page navigation is now near-instant. Background data syncs (notifications, user identity) wait for the primary data connection instead of racing to create their own." },
          { s: "fix", icon: "check_circle", html: "<strong>CSS Parsing Fix:</strong> Fixed an orphan closing brace in the stylesheet that was causing all responsive and mobile styles defined after it to be silently ignored by the browser." },
        ],
      },
      {
        h: "Dashboard Fixes",
        items: [
          { s: "fix", icon: "check_circle", html: `<strong>Ticket Queue Count Corrected:</strong> The "All" priority pill on the dashboard now correctly shows the count of open tickets (matching the stat card) instead of showing the total database ticket count including resolved ones.` },
          { s: "fix", icon: "check_circle", html: "<strong>Onboarding Tickets Restored:</strong> Removed a hardcoded filter that was hiding Onboarding-category tickets from the dashboard queue. Onboarding tickets now appear in the queue with a dedicated filter pill." },
          { s: "feat", icon: "check_circle", html: `<strong>Onboarding Filter Pill:</strong> Added a new cyan-colored "Onboarding" pill to the dashboard ticket queue, allowing quick filtering to show only onboarding-related tickets.` },
        ],
      },
    ],
  },
  {
    date: "May 3, 2026",
    time: "Early Morning Update",
    tags: [{ s: "feature", l: "Feature" }, { s: "update", l: "Update" }],
    title: "Dedicated Permissions Management Page",
    desc: "Introduced a brand-new, full-page Permissions Manager that gives admins complete control over what each team member can see and do across the entire portal. Replaces the old modal-based approach with a polished, standalone interface.",
    sections: [
      {
        h: "New Permissions Page",
        items: [
          { s: "feat", icon: "check_circle", html: "<strong>Full-Page Permission Manager:</strong> Managing user permissions now opens a dedicated page instead of a small popup. The new layout features a user sidebar on the left and a comprehensive permission grid on the right, making it much easier to review and adjust access at a glance." },
          { s: "feat", icon: "check_circle", html: "<strong>Granular Module Control:</strong> Every portal module — Tickets, Merchants, Inventory, Calendar, Tasks, Timecards, Resources, File Storage, Onboarding, Feedback, Users, Agents, and more — now has individual View, Create, Edit, and Delete toggles. You can fine-tune exactly what each person can access." },
          { s: "feat", icon: "check_circle", html: `<strong>Quick Presets:</strong> Four one-click presets — Full Access, Standard, View Only, and Minimal — let you instantly configure a user's permissions without toggling each item manually. Great for quickly setting up new team members.` },
        ],
      },
    ],
  },
]

export default function ChangelogPage() {
  return (
    <div style={{ padding: "24px", maxWidth: 960, margin: "0 auto" }}>
      <div style={{ marginBottom: 40, textAlign: "center" }}>
        <div style={{ width: 64, height: 64, background: "var(--accent-light)", borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 32, color: "var(--accent)" }}>campaign</span>
        </div>
        <h1 style={{ fontFamily: "'Mulish', sans-serif", fontSize: 32, fontWeight: 900, color: "var(--text)", margin: "0 0 8px", letterSpacing: "-0.5px" }}>
          What&apos;s New
        </h1>
        <p style={{ fontSize: 16, color: "var(--text3)", margin: 0 }}>
          The latest releases, updates, and bug fixes for Mtech Portal.
        </p>
      </div>

      <div className="card" style={{ padding: "0 32px" }}>
        {ENTRIES.map((entry, ei) => {
          const firstH3Idx = entry.sections.findIndex(s => !!s.h)
          return (
            <div key={ei} className="cl-item">
              <div className="cl-date">
                {entry.date}
                {entry.time && (
                  <><br /><span style={{ fontSize: 10, color: "var(--text3)", fontWeight: 500 }}>{entry.time}</span></>
                )}
              </div>
              <div className="cl-content">
                <div className="cl-tag-row">
                  {entry.tags.map(tag => (
                    <span key={tag.l} className={`cl-tag ${tag.s}`}>{tag.l}</span>
                  ))}
                </div>
                <h2 className="cl-title">{entry.title}</h2>
                <p className="cl-desc">{entry.desc}</p>
                {entry.sections.map((section, si) => (
                  <Fragment key={si}>
                    {section.h && (
                      <h3 className={`cl-h3${si === firstH3Idx ? " first" : ""}`}>{section.h}</h3>
                    )}
                    {section.items.map((b, bi) => (
                      <div key={bi} className="cl-bullet">
                        <span className={`material-symbols-outlined cl-bullet-icon ${b.s}`}>{b.icon}</span>
                        <div className="cl-bullet-text" dangerouslySetInnerHTML={{ __html: b.html }} />
                      </div>
                    ))}
                  </Fragment>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
