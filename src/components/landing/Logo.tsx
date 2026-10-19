import { brand } from '@/config/brand';

/** The Nexus mark: an N whose last stroke is a learner with a sun-yellow head, on a violet tile. */
export function Logo() {
  return (
    <span className="lp-logo inline-flex items-center gap-2.5 font-display text-[26px] font-extrabold tracking-[-0.04em] text-ink">
      <svg className="lp-logo-mark size-[38px] shrink-0" viewBox="0 0 100 100" aria-hidden="true">
        <rect width="100" height="100" rx="26" fill="#5B3DF5" />
        <path d="M27 75 V31 L69 73 V50" fill="none" stroke="#fff" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="69" cy="29" r="9.5" fill="#FFC53D" />
      </svg>
      {brand.name}
    </span>
  );
}
