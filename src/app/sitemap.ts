import type { MetadataRoute } from 'next';

import { brand } from '@/config/brand';

/** Public pages only. Add new public pages (guides, blog posts) here as they're written. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: brand.siteUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 }];
}
