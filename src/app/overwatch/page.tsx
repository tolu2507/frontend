'use client';

import { useQuery } from '@tanstack/react-query';
import { Building2, GraduationCap, Inbox, Scale, Users } from 'lucide-react';
import Link from 'next/link';

import { Card, ErrorBox, Loading, PageHeader, Stat } from '@/components/ui';
import { api } from '@/lib/api';
import { naira } from '@/lib/format';

type Overview = {
  schools: Record<string, number>;
  students: number;
  parents: number;
  todo: { enquiries: number; tutorsToReview: number; disputes: number };
  payments30d: { purpose: string; count: number; amountKobo: string }[];
};
const PURPOSE: Record<string, string> = { WALLET_TOPUP: 'Wallet top-ups', SCHOOL_FEE: 'School fees', TUTOR_SESSION: 'Lessons', SUBSCRIPTION: 'Subscriptions' };

export default function OverwatchHome() {
  const q = useQuery({ queryKey: ['ow', 'overview'], queryFn: () => api<Overview>('/admin/overview') });
  if (q.isPending) return <Loading rows={5} />;
  if (q.error) return <ErrorBox error={q.error} onRetry={q.refetch} />;
  const d = q.data;
  const todo = [
    { n: d.todo.enquiries, label: 'demo requests to follow up', href: '/overwatch/enquiries', icon: Inbox },
    { n: d.todo.tutorsToReview, label: 'tutors waiting for review', href: '/overwatch/tutors', icon: GraduationCap },
    { n: d.todo.disputes, label: 'lesson disputes to resolve', href: '/overwatch/disputes', icon: Scale },
  ];
  return (
    <>
      <PageHeader title="Overwatch" subtitle="Everything happening on Nexus." />
      <div className="mb-6 grid gap-3 md:grid-cols-3">
        {todo.map((t) => (
          <Link key={t.href} href={t.href}>
            <Card className={`flex items-center gap-4 transition hover:-translate-y-0.5 ${t.n ? 'border-sun-400 bg-sun-50' : ''}`}>
              <t.icon className={`size-7 ${t.n ? 'text-sun-800' : 'text-ink-300'}`} />
              <div>
                <div className="font-display text-3xl font-extrabold">{t.n}</div>
                <div className="text-sm font-semibold text-ink-500">{t.label}</div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Live schools" value={d.schools.ACTIVE ?? 0} hint={d.schools.SUSPENDED ? `${d.schools.SUSPENDED} suspended` : undefined} icon={<Building2 className="size-5" />} />
        <Stat label="Students" tone="mint" value={d.students.toLocaleString()} icon={<Users className="size-5" />} />
        <Stat label="Parents" tone="sky" value={d.parents.toLocaleString()} icon={<Users className="size-5" />} />
      </div>
      <Card className="mt-6">
        <h2 className="mb-3 font-display text-lg font-bold">Payments in the last 30 days</h2>
        {d.payments30d.length === 0 ? (
          <p className="text-ink-500">No successful payments yet.</p>
        ) : (
          <ul className="divide-y divide-ink-100">
            {d.payments30d.map((p) => (
              <li key={p.purpose} className="flex justify-between py-2.5">
                <span className="font-semibold">
                  {PURPOSE[p.purpose] ?? p.purpose} <span className="text-ink-500">· {p.count}</span>
                </span>
                <span className="font-display font-bold">{naira(p.amountKobo)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
