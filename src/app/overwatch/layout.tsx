'use client';

import { Building2, GraduationCap, Inbox, LayoutDashboard, Scale } from 'lucide-react';

import { AppShell, type NavItem } from '@/components/shell/AppShell';

const nav: NavItem[] = [
  { href: '/overwatch', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/overwatch/enquiries', label: 'Demo requests', icon: Inbox },
  { href: '/overwatch/schools', label: 'Schools', icon: Building2 },
  { href: '/overwatch/tutors', label: 'Tutor applications', icon: GraduationCap },
  { href: '/overwatch/disputes', label: 'Lesson disputes', icon: Scale },
];

/** Overwatch: the platform owner's area. Only PLATFORM_ADMIN accounts get in. */
export default function OverwatchLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell nav={nav} roles={['PLATFORM_ADMIN']} label="Overwatch" accent="bg-ink">
      {children}
    </AppShell>
  );
}
