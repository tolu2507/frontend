# Nexus web

Next.js 16 (App Router), Tailwind v4, TanStack Query, react-hook-form + zod. Talks to the API in `../backend`.

```bash
pnpm install
pnpm dev            # http://localhost:3000 (API expected at http://localhost:3001)
NEXT_PUBLIC_API_URL=https://api.example.com pnpm build
```

## What's here

| Route | Who | What |
|---|---|---|
| `/` | everyone | Marketing site + “Book a demo” form (saves to Overwatch → Demo requests) |
| `/login`, `/forgot-password`, `/set-password` | staff, Overwatch | Sign in. Invited staff set their password with the 6-digit code from their email |
| `/dashboard/*` | school owner, admin, teacher | Overview, classes (attendance, scores, broadsheet, subjects), students (add, Excel/CSV import, profile, notes), staff, fees, parent reports, settings |
| `/overwatch/*` | platform admin | Demo requests → create school, schools + private agreements/statements, tutor approvals, lesson disputes |

Teachers only see the classes they're form teacher or subject teacher for; the API enforces this too.
Parents, students and lesson teachers use the mobile app and are sent to `/no-access` here.

`src/components/ui` is the shared kit (Button, Input, Select, Modal, Table, Tabs, …). Colours and fonts
live in `src/app/globals.css` and match the mobile app. The product name is in `src/config/brand.ts`.

`legacy-v1/` holds the first dashboard for reference. It isn't built or linted.
