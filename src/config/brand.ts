/** Product name and contact details in one place, so a rename is a one-line change. */
export const brand = {
  name: 'Nexus',
  tagline: 'The school system that keeps parents coming back',
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
} as const;
