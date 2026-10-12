import { brand } from '@/config/brand';

/** Four coloured tiles joined at the centre: school, parent, student and teacher. */
export function Logo() {
  return (
    <span className="lp-logo inline-flex items-center gap-2.5 font-display text-[26px] font-extrabold tracking-[-0.04em] text-ink">
      <svg className="lp-logo-mark size-[38px] shrink-0" viewBox="0 0 40 40" aria-hidden="true">
        <rect x="2" y="2" width="17" height="17" rx="6" fill="#5B3DF5" />
        <rect x="21" y="2" width="17" height="17" rx="8.5" fill="#FFC53D" />
        <rect x="2" y="21" width="17" height="17" rx="8.5" fill="#19C39C" />
        <rect x="21" y="21" width="17" height="17" rx="6" fill="#FF6B4A" />
        <circle cx="20" cy="20" r="5" fill="#fff" />
      </svg>
      {brand.name}
    </span>
  );
}
