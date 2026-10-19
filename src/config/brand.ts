/** Product name and contact details in one place, so a rename is a one-line change. */
export const brand = {
  name: 'Nexus',
  tagline: 'Daily practice for your child, a weekly report for you',
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
  /**
   * The public address of this site, for search engines and share previews. Set NEXT_PUBLIC_SITE_URL once you
   * have your own domain; until then Vercel's production address (set by Vercel at build time) is used.
   */
  siteUrl:
    process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3003'),
  /** The web version of the mobile app (Expo web), for parents and children without the Android app. */
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:8081',
  /** Store listings; leave unset until the app is live there and the button shows "Coming soon". */
  playStoreUrl: process.env.NEXT_PUBLIC_PLAY_STORE_URL || null,
  appStoreUrl: process.env.NEXT_PUBLIC_APP_STORE_URL || null,
} as const;
