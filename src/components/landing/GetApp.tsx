import { ArrowRight } from 'lucide-react';

import { brand } from '@/config/brand';

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
      <path d="M3.6 1.8 13.8 12 3.6 22.2a1.6 1.6 0 0 1-.6-1.3V3.1c0-.5.2-1 .6-1.3Z" fill="#00D7FE" />
      <path d="m17.2 8.6-3.4 3.4-10.2-10.2c.5-.4 1.2-.4 1.8-.1l11.8 6.9Z" fill="#00F076" />
      <path d="m17.2 15.4-11.8 6.9c-.6.3-1.3.3-1.8-.1L13.8 12l3.4 3.4Z" fill="#FF3A44" />
      <path d="m20.4 13.4-3.2 2L13.8 12l3.4-3.4 3.2 1.9c1 .6 1 2.3 0 2.9Z" fill="#FFD109" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="currentColor">
      <path d="M16.4 12.6c0-2.4 2-3.6 2.1-3.7-1.2-1.7-3-1.9-3.6-2-1.5-.2-3 .9-3.8.9-.8 0-2-.9-3.3-.9-1.7 0-3.3 1-4.2 2.5-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8 1.6 0 2 .8 3.4.8 1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9 0 0-2.8-1.1-2.9-4.2ZM13.9 5.2c.7-.9 1.2-2 1-3.2-1 0-2.2.7-3 1.6-.6.7-1.2 1.9-1 3.1 1.1.1 2.3-.6 3-1.5Z" />
    </svg>
  );
}

/** Google Play and App Store first, with the web version as a small link underneath. A store with no listing yet shows "Coming soon". */
export function GetApp({ center }: { center?: boolean }) {
  const stores = [
    { name: 'Google Play', top: 'Get it on', url: brand.playStoreUrl, icon: <PlayIcon /> },
    { name: 'App Store', top: 'Download on the', url: brand.appStoreUrl, icon: <AppleIcon /> },
  ];
  return (
    <div className={`lp-get${center ? ' center' : ''}`}>
      <div className="lp-stores">
        {stores.map((s) =>
          s.url ? (
            <a key={s.name} href={s.url} className="lp-store" target="_blank" rel="noopener noreferrer">
              {s.icon}
              <span>
                <small>{s.top}</small>
                {s.name}
              </span>
            </a>
          ) : (
            <span key={s.name} className="lp-store soon" aria-label={`${s.name}: coming soon`}>
              {s.icon}
              <span>
                <small>Coming soon to</small>
                {s.name}
              </span>
            </span>
          ),
        )}
      </div>
      <a href={brand.appUrl} className="lp-web-link">
        or continue on the web <ArrowRight size={14} />
      </a>
    </div>
  );
}
