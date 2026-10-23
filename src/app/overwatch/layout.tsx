'use client';

import { Activity, ArrowLeftRight, Bot, Building2, FileQuestion, Gift, Inbox, LayoutDashboard, LibraryBig, LifeBuoy, Settings, ShieldCheck, Swords, Trophy, Users, Wallet } from 'lucide-react';

import { AppShell, type NavItem } from '@/components/shell/AppShell';

const nav: NavItem[] = [
  { href: '/overwatch', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/overwatch/schools', label: 'Schools', icon: Building2 },
  { href: '/overwatch/people', label: 'People', icon: Users },
  { href: '/overwatch/privacy', label: 'Privacy requests', icon: ShieldCheck },
  { href: '/overwatch/activity', label: 'Activity log', icon: Activity },
  { href: '/overwatch/learning', label: 'Learning', icon: LibraryBig },
  { href: '/overwatch/questions', label: 'Question bank', icon: FileQuestion },
  { href: '/overwatch/rankings', label: 'Rankings', icon: Trophy },
  { href: '/overwatch/arena', label: 'Arena', icon: Swords },
  { href: '/overwatch/support', label: 'Support', icon: LifeBuoy },
  { href: '/overwatch/ai', label: 'AI & curriculum', icon: Bot },
  { href: '/overwatch/wallets', label: 'Wallets', icon: Wallet },
  { href: '/overwatch/rewards', label: 'Rewards', icon: Gift },
  { href: '/overwatch/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { href: '/overwatch/enquiries', label: 'Demo requests', icon: Inbox },
  { href: '/overwatch/settings', label: 'Settings', icon: Settings },
];

/** Overwatch: the platform owner's area. Only PLATFORM_ADMIN accounts get in. */
export default function OverwatchLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell nav={nav} roles={['PLATFORM_ADMIN']} label="Overwatch" accent="bg-ink">
      {children}
    </AppShell>
  );
}
