# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start dev server (Next.js 16)
npm run build    # Production build
npm run lint     # ESLint (no separate test suite)
```

## Architecture

**MTech CRM** is a ticket management / merchant support dashboard built with Next.js 16, React 19, TypeScript, Tailwind CSS v4, and shadcn/ui (radix-nova style).

### Data flow

The dashboard uses a server/client split pattern:

- [app/dashboard/page.tsx](app/dashboard/page.tsx) — async Server Component; fetches (currently mock) data and passes it as props
- [app/components/dashboard/DashboardClient.tsx](app/components/dashboard/DashboardClient.tsx) — `"use client"` orchestrator; imports all widget components via `next/dynamic` with `{ ssr: false }` to avoid hydration issues with Chart.js

### Key directories

- [app/components/dashboard/](app/components/dashboard/) — all dashboard widget components (`StatCards`, `ActivityChart`, `LiveFeed`, `TicketQueue`, `ResolutionGauge`, `OnboardingPipeline`, `OnboardingVolumeChart`, `RecentMerchants`, `BrandsAffected`)
- [app/types/dashboard.ts](app/types/dashboard.ts) — shared TypeScript interfaces (`Ticket`, `ActivityItem`, `ChartPoint`, `DashboardStats`, etc.)
- [app/styles/dashboard.css](app/styles/dashboard.css) — custom CSS classes (`dash-card-v2`, `dv2-title`, `stat-v2`, `tkt-list-header`, gauge utilities) imported in [app/layout.tsx](app/layout.tsx)
- [lib/utils.ts](lib/utils.ts) — `cn()` helper (clsx + tailwind-merge)

### Styling conventions

- Dashboard layout uses **inline styles** for positioning/grid, and **CSS class names** from `dashboard.css` for shared card/text styles — not Tailwind utilities
- CSS custom properties (`--text`, `--text2`, `--text3`, `--bg2`, `--bg3`, `--border`, `--accent`) drive theming; `data-theme="dark"` on `<html>` switches themes
- shadcn/ui tokens live in [app/globals.css](app/globals.css) (Tailwind v4 `@theme inline` block); the shadcn alias for components is `@/app/components`
- Font: **Mulish** (Google Fonts, loaded via `next/font/google` in layout); **Material Symbols Outlined** loaded via `<link>` for icons in the header

### Charts

Uses **Chart.js** (via `react-chartjs-2` pattern) and **Recharts** for different widgets. All chart components are dynamically imported to avoid SSR.

### shadcn/ui

Config is in [components.json](components.json). Generated UI primitives go to `@/components/ui` (not yet created). Add components with:

```bash
npx shadcn add <component>
```
