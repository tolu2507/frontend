'use client';

import { LayoutDashboard, ReceiptText, School, Settings, Sparkles, Users, UsersRound } from 'lucide-react';

import { AppShell, type NavItem } from '@/components/shell/AppShell';
import { useAuth } from '@/lib/auth';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, schoolId } = useAuth();
  const role = user?.memberships.find((m) => m.schoolId === schoolId && (m.role === 'SCHOOL_OWNER' || m.role === 'SCHOOL_ADMIN'));
  const admin = !!role;
  const nav: NavItem[] = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
    { href: '/dashboard/classes', label: 'Classes', icon: School },
    { href: '/dashboard/students', label: 'Students', icon: Users },
    ...(admin ? [{ href: '/dashboard/staff', label: 'Staff', icon: UsersRound }] : []),
    ...(admin ? [{ href: '/dashboard/fees', label: 'Fees', icon: ReceiptText }] : []),
    { href: '/dashboard/reports', label: 'Parent reports', icon: Sparkles },
    ...(admin ? [{ href: '/dashboard/settings', label: 'Settings', icon: Settings }] : []),
  ];
  return (
    <AppShell nav={nav} roles={['SCHOOL_OWNER', 'SCHOOL_ADMIN', 'TEACHER']} label="School">
      {children}
    </AppShell>
  );
}

