import { ImageResponse } from 'next/og';

import { brand } from '@/config/brand';

/** The picture WhatsApp, Facebook and X show when someone shares the site. */
export const alt = `${brand.name}: exam practice for your child from Nursery to JAMB, and a weekly report for you`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const EXAMS = ['JAMB', 'WAEC', 'NECO', 'BECE', 'Common Entrance', 'Nursery & Primary'];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 72, background: 'linear-gradient(150deg, #5B3DF5 0%, #4426C9 100%)', color: '#FFFFFF' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <svg width="88" height="88" viewBox="0 0 100 100">
            <rect width="100" height="100" rx="26" fill="#FFFFFF" />
            <path d="M40.5 42 V80 H47.5 A16 16 0 0 0 47.5 48 H40.5" fill="none" stroke="#5B3DF5" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="40.5" cy="24" r="10.5" fill="#FFC53D" />
          </svg>
          <div style={{ fontSize: 56, fontWeight: 800, letterSpacing: -2 }}>{brand.name}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, letterSpacing: -3, maxWidth: 980 }}>Help your child pass, from Nursery to JAMB</div>
          <div style={{ fontSize: 30, color: '#E4DEFF', maxWidth: 900 }}>Daily practice, a CBT mock every Friday, and a weekly report for parents.</div>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {EXAMS.map((e) => (
            <div key={e} style={{ display: 'flex', fontSize: 24, fontWeight: 700, padding: '10px 20px', borderRadius: 999, background: e === 'JAMB' ? '#FFC53D' : 'rgba(255,255,255,0.16)', color: e === 'JAMB' ? '#17133A' : '#FFFFFF' }}>
              {e}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
