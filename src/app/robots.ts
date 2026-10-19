import type { MetadataRoute } from 'next';

import { brand } from '@/config/brand';
import { PRIVATE_PATHS } from '@/config/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: PRIVATE_PATHS },
    sitemap: `${brand.siteUrl}/sitemap.xml`,
    host: brand.siteUrl,
  };
}
