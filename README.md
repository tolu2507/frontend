# BrainBox web

The BrainBox website (marketing and guides), the school dashboard and **Overwatch**, the platform owner's admin area.
Next.js 16 (App Router), Tailwind v4, TanStack Query, react-hook-form + zod. Talks to the API in `../backend`.
Parents and children use the app (`../mobile`, also on the web).

```bash
pnpm install
pnpm dev            # http://localhost:3000 (API expected at http://localhost:3001)
pnpm build          # production build (also the best check that every page compiles)
pnpm lint
```

## Environment

| Variable | What it's for |
|---|---|
| `NEXT_PUBLIC_API_URL` | The BrainBox API. |
| `NEXT_PUBLIC_SITE_URL` | This site's own address (SEO, share images, sitemap). |
| `NEXT_PUBLIC_APP_URL` | The web version of the parent/child app; "Get started" buttons go there. |
| `NEXT_PUBLIC_PLAY_STORE_URL`, `NEXT_PUBLIC_APP_STORE_URL` | Store buttons. Until they're set, the buttons say "Coming soon". |

## What's here

| Route | Who | What |
|---|---|---|
| `/` | everyone | Parent-first landing page, with "For schools" and a "Book a demo" form (goes to Overwatch → Demo requests) |
| `/guides/*` | everyone | Exam guides for parents, written for search (`src/content/guides.ts`) |
| `/login`, `/forgot-password`, `/set-password` | staff, Overwatch | Sign in. Invited staff set their password with the 6-digit code from their email |
| `/dashboard/*` | school owner, admin, teacher | Classes (attendance, scores, broadsheet), students (add, Excel/CSV import, profile, notes), staff, fees, tuck shop, parent reports, settings |
| `/overwatch/*` | platform admin | Everything below |

Teachers only see the classes they teach; the API enforces this too. Parents, children and tuck-shop staff are sent to
`/no-access` here and use the app.

## Overwatch

| Page | What you can do |
|---|---|
| Overview | Money collected, BrainBox revenue (fees and subscriptions), active learners, sign-ups, AI cost; paying, trial and lapsed parents |
| Schools | Create schools from demo requests, private agreements and statements, per-school AI setup |
| People | Every child, parent and staff member. **Delete** a child or parent, and **download** a parent's data |
| Privacy requests | Requests from Privacy & data in the app: a copy of their data, or deletion. Reply within 30 days (NDPA) |
| Learning, Question bank | Quests, the question bank per subject (approve templates, fix reported questions) |
| Rankings | The hardest-working and best-scoring children |
| Support | Questions parents and children send from the app |
| AI & curriculum | What AI costs and what it's used for |
| Wallets, Transactions | Every balance and every naira that moved |
| Rewards | Airtime and data sent to parents against the monthly budget, money earned but not collected, and sends to settle by hand when Squad didn't answer |
| Settings | Plan price, days per payment, free trial, free questions a day, coin rates, sticker coins, reward value, monthly rewards budget, rewards on/off. No deploy needed; every change is in the activity log |
| Demo requests | Schools asking for a demo |

### Deleting a parent or child

Overwatch shows exactly what will go before anything is deleted, and asks you to type DELETE.

- **A child** loses their login, progress, stickers, coins, mocks and reports.
- **A parent** loses their login and personal details. Tick the box to also delete their children who have no other
  parent on BrainBox; a child with another parent stays with them.
- Payments, airtime sent and consents are kept as the law requires: a parent who has any becomes an unnamed "Deleted
  user" holding only those records.
- Uncollected rewards money is shown, and is lost on deletion.
- Deletion is refused while a child has tuck-shop money (refund it first) or school fee bills.

## Brand

The product name is in `src/config/brand.ts`. The mark (a lowercase **b** whose stem is a learner with a sun-yellow
head, in the violet box) is drawn in `src/components/landing/Logo.tsx`, `src/app/icon.svg` and both share images
(`opengraph-image.tsx`, `guides/[slug]/opengraph-image.tsx`). `public/logo.png`, `src/app/apple-icon.png` and
`src/app/favicon.ico` are the same mark as images. Colours and fonts live in `src/app/globals.css` and match the app.

`src/components/ui` is the shared kit (Button, Input, Select, Modal, Table, Tabs, …). `src/components/overwatch` has
Overwatch's pieces (KPIs, charts, filters, the delete dialog).

`legacy-v1/` holds the first dashboard for reference. It isn't built or linted.
