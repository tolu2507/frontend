/** Money arrives from the API as kobo strings. */
export const naira = (kobo: string | number | bigint) => `₦${(Number(kobo) / 100).toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;

export const date = (iso: string | Date, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  new Date(iso).toLocaleDateString('en-NG', { timeZone: 'Africa/Lagos', ...opts });

export const todayIso = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' });

export const TERM = { FIRST: 'First term', SECOND: 'Second term', THIRD: 'Third term' } as const;
export const ROLE = { SCHOOL_OWNER: 'Owner', SCHOOL_ADMIN: 'Administrator', TEACHER: 'Teacher' } as const;
export const LEVEL = { NURSERY: 'Nursery', PRIMARY: 'Primary', JUNIOR_SECONDARY: 'Junior Secondary', SENIOR_SECONDARY: 'Senior Secondary' } as const;
export const initials = (first?: string, last?: string) => `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase();
