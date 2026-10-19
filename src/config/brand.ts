/** Product name and contact details in one place, so a rename is a one-line change. */
export const brand = {
  name: 'Nexus',
  tagline: 'Daily practice for your child, a weekly report for you',
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
  /** The web version of the mobile app (Expo web), for parents and children without the Android app. */
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:8081',
} as const;
