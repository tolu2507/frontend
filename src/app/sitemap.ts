import type { MetadataRoute } from 'next';

import { brand } from '@/config/brand';
import { GUIDES } from '@/content/guides';

/** Public pages only: the landing page and the parent guides. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: brand.siteUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${brand.siteUrl}/guides`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    ...GUIDES.map((g) => ({ url: `${brand.siteUrl}/guides/${g.slug}`, lastModified: new Date(g.updated), changeFrequency: 'monthly' as const, priority: 0.7 })),
  ];
}
