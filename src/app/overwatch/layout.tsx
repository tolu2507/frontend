'use client';

import { Activity, ArrowLeftRight, Bot, Building2, GraduationCap, Inbox, LayoutDashboard, LibraryBig, Scale, Users, Wallet } from 'lucide-react';

import { AppShell, type NavItem } from '@/components/shell/AppShell';

const nav: NavItem[] = [
  { href: '/overwatch', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/overwatch/schools', label: 'Schools', icon: Building2 },
  { href: '/overwatch/people', label: 'People', icon: Users },
  { href: '/overwatch/activity', label: 'Activity log', icon: Activity },
  { href: '/overwatch/learning', label: 'Learning', icon: LibraryBig },
  { href: '/overwatch/ai', label: 'AI & curriculum', icon: Bot },
  { href: '/overwatch/wallets', label: 'Wallets', icon: Wallet },
  { href: '/overwatch/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { href: '/overwatch/enquiries', label: 'Demo requests', icon: Inbox },
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
