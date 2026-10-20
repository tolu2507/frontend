import { ImageResponse } from 'next/og';

import { brand } from '@/config/brand';
import { GUIDES, guideBySlug } from '@/content/guides';

/** Share picture for each guide: the logo, the guide's tag and its title. */
export const alt = `A ${brand.name} guide for parents`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export default async function GuideImage({ params }: { params: Promise<{ slug: string }> }) {
  const g = guideBySlug((await params).slug);
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 72, background: 'linear-gradient(150deg, #5B3DF5 0%, #4426C9 100%)', color: '#FFFFFF' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <svg width="72" height="72" viewBox="0 0 100 100">
            <rect width="100" height="100" rx="26" fill="#FFFFFF" />
            <path d="M27 75 V31 L69 73 V50" fill="none" stroke="#5B3DF5" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="69" cy="29" r="9.5" fill="#FFC53D" />
          </svg>
          <div style={{ display: 'flex', fontSize: 44, fontWeight: 800 }}>{`${brand.name} guides`}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div style={{ display: 'flex' }}>
            <div style={{ fontSize: 26, fontWeight: 700, padding: '8px 18px', borderRadius: 999, background: '#FFC53D', color: '#17133A' }}>{g?.tag ?? 'Guide'}</div>
          </div>
          <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.08, letterSpacing: -2, maxWidth: 1050 }}>{g?.title ?? 'Guides for parents'}</div>
        </div>
      </div>
    ),
    size,
  );
}
