import { brand } from '@/config/brand';

/** The BrainBox mark: a lowercase b whose stem is a learner with a sun-yellow head, in a violet box. */
export function Logo() {
  return (
    <span className="lp-logo inline-flex items-center gap-2.5 font-display text-[26px] font-extrabold tracking-[-0.04em] text-ink">
      <svg className="lp-logo-mark size-[38px] shrink-0" viewBox="0 0 100 100" aria-hidden="true">
        <rect width="100" height="100" rx="26" fill="#5B3DF5" />
        <path d="M40.5 42 V80 H47.5 A16 16 0 0 0 47.5 48 H40.5" fill="none" stroke="#fff" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="40.5" cy="24" r="10.5" fill="#FFC53D" />
      </svg>
      {brand.name}
    </span>
  );
}
