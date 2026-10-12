'use client';

import { useQueryClient } from '@tanstack/react-query';
import { ChevronDown, LogOut, Menu, X, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';

import { Logo } from '@/components/landing/Logo';
import { Avatar, cx } from '@/components/ui';
import { brand } from '@/config/brand';
import { SCHOOL_ROLES, useAuth, type Role } from '@/lib/auth';

export type NavItem = { href: string; label: string; icon: LucideIcon; exact?: boolean };

/** True once the saved session has been read from localStorage (avoids a flash of the sign-in redirect). */
export function useHydrated() {
  return useSyncExternalStore(
    (cb) => useAuth.persist.onFinishHydration(cb),
    () => useAuth.persist.hasHydrated(),
    () => false,
  );
}

/**
 * Sidebar layout for signed-in areas. Redirects to /login when signed out, and to `/no-access`
 * when the person has none of `roles`.
 */
export function AppShell({ nav, roles, label, children, accent = 'bg-violet-500' }: { nav: NavItem[]; roles: Role[]; label: string; children: ReactNode; accent?: string }) {
  const hydrated = useHydrated();
  const router = useRouter();
  const pathname = usePathname();
  const qc = useQueryClient();
  const { user, refreshToken, schoolId, setSchool, clear } = useAuth();
  const [open, setOpen] = useState(false);
  const allowed = !!user?.memberships.some((m) => roles.includes(m.role));

  useEffect(() => {
    if (!hydrated) return;
    if (!user) router.replace(`/login`);
    else if (!allowed) router.replace('/no-access');
  }, [hydrated, user, allowed, router]);

  if (!hydrated || !user || !allowed) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <div className="size-10 animate-spin rounded-full border-4 border-violet-100 border-t-violet-500" aria-label="Loading" />
      </div>
    );
  }

  const schools = user.memberships.filter((m) => m.schoolId && SCHOOL_ROLES.includes(m.role) && roles.includes(m.role));
  const uniqueSchools = [...new Map(schools.map((m) => [m.schoolId, m])).values()];

  const signOut = async () => {
    if (refreshToken) await fetch(`${brand.apiUrl}/auth/logout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken }) }).catch(() => {});
    clear();
    qc.clear();
    router.replace('/login');
  };

  const isActive = (item: NavItem) => (item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`));

  const sidebar = (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="flex items-center justify-between px-2 pt-2">
        <Link href={nav[0].href} aria-label="Home">
          <Logo />
        </Link>
        <button type="button" className="grid size-10 place-items-center rounded-xl hover:bg-ink-100 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
          <X className="size-5" />
        </button>
      </div>

      {uniqueSchools.length > 1 ? (
        <label className="relative mx-1 block">
          <span className="sr-only">School</span>
          <select
            value={schoolId ?? ''}
            onChange={(e) => {
              setSchool(e.target.value);
              qc.clear();
            }}
            className="h-11 w-full appearance-none rounded-xl border-2 border-ink-200 bg-white pr-9 pl-3 text-sm font-bold"
          >
            {uniqueSchools.map((m) => (
              <option key={m.schoolId} value={m.schoolId!}>
                {m.schoolName}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute top-3 right-3 size-5 text-ink-500" />
        </label>
      ) : (
        <div className="mx-1 rounded-xl bg-paper px-3 py-2">
          <div className="text-[11px] font-extrabold tracking-wide text-ink-300 uppercase">{label}</div>
          <div className="truncate text-sm font-bold">{uniqueSchools[0]?.schoolName ?? 'Nexus HQ'}</div>
        </div>
      )}

      <nav className="flex flex-1 flex-col gap-1" aria-label="Main">
        {nav.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              onClick={() => setOpen(false)}
              className={cx('flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-bold transition', active ? `${accent} text-white shadow-card` : 'text-ink-700 hover:bg-violet-50 hover:text-violet-700')}
            >
              <item.icon className="size-5" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-3 rounded-2xl bg-paper p-3">
        <Avatar name={`${user.firstName} ${user.lastName}`} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold">
            {user.firstName} {user.lastName}
          </div>
          <div className="truncate text-xs text-ink-500">{user.email ?? user.phone}</div>
        </div>
        <button type="button" onClick={signOut} className="grid size-9 place-items-center rounded-xl text-ink-500 hover:bg-white hover:text-coral-700" aria-label="Sign out" title="Sign out">
          <LogOut className="size-5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[272px_1fr]">
      <aside className="sticky top-0 hidden h-dvh border-r border-ink-100 bg-white lg:block">{sidebar}</aside>

      {/* Phone / tablet: top bar + slide-in drawer */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ink-100 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <Link href={nav[0].href} aria-label="Home">
          <Logo />
        </Link>
        <button type="button" onClick={() => setOpen(true)} className="grid size-11 place-items-center rounded-xl border-2 border-ink-200" aria-label="Open menu" aria-expanded={open}>
          <Menu className="size-5" />
        </button>
      </header>
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" className="absolute inset-0 bg-ink-900/40" onClick={() => setOpen(false)} aria-label="Close menu" />
          <div className="absolute inset-y-0 left-0 w-[86%] max-w-xs animate-rise bg-white shadow-2xl">{sidebar}</div>
        </div>
      ) : null}

      <main className="min-w-0 px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
