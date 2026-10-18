'use client';

import { useQuery } from '@tanstack/react-query';
import { Banknote, Bot, Building2, GraduationCap, Inbox, Sparkles, UserPlus, Users } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { BarList, ChartCard, compact, nairaCompact, TrendChart } from '@/components/overwatch/charts';
import { Kpi, label, RangeTabs } from '@/components/overwatch/kit';
import { Badge, Card, ErrorBox, Loading, PageHeader, Table } from '@/components/ui';
import { api } from '@/lib/api';
import { naira } from '@/lib/format';

type K = { value: number; previous: number; changePct: number | null };
type Analytics = {
  days: number;
  totals: { schools: Record<string, number>; students: number; parents: number; staff: number };
  kpis: { paymentsKobo: K; platformRevenueKobo: K; aiCostKobo: K; activeLearners: K; signups: K };
  series: { day: string; signups: number; paymentsKobo: number; payments: number; attempts: number; learners: number; avgScore: number | null; aiCostKobo: number; aiCalls: number; events: number }[];
  paymentsByPurpose: { purpose: string; count: number; amountKobo: number }[];
  topSchools: { id: string; name: string; status: string; students: number; paymentsKobo: number }[];
};
type Overview = { todo: { enquiries: number } };

export default function OverwatchHome() {
  const [days, setDays] = useState(30);
  const todo = useQuery({ queryKey: ['ow', 'overview'], queryFn: () => api<Overview>('/admin/overview') });
  const q = useQuery({ queryKey: ['ow', 'analytics', days], queryFn: () => api<Analytics>(`/admin/analytics?days=${days}`) });

  const tasks = todo.data
    ? [
        { n: todo.data.todo.enquiries, label: 'demo requests to follow up', href: '/overwatch/enquiries', icon: Inbox },
      ]
    : [];

  return (
    <>
      <PageHeader title="Overwatch" subtitle="Everything happening on Nexus." actions={<RangeTabs value={days} onChange={setDays} />} />

      {tasks.length ? (
        <div className="mb-6 grid gap-3 md:grid-cols-3">
          {tasks.map((t) => (
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
      ) : null}

      {q.isPending ? (
        <Loading rows={6} />
      ) : q.error ? (
        <ErrorBox error={q.error} onRetry={q.refetch} />
      ) : (
        <Dashboard d={q.data} />
      )}
    </>
  );
}

function Dashboard({ d }: { d: Analytics }) {
  const vs = `vs previous ${d.days} days`;
  const t = d.totals;
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Money collected" value={naira(d.kpis.paymentsKobo.value)} changePct={d.kpis.paymentsKobo.changePct} hint={vs} icon={<Banknote className="size-5" />} />
        <Kpi label="Nexus revenue" tone="mint" value={naira(d.kpis.platformRevenueKobo.value)} changePct={d.kpis.platformRevenueKobo.changePct} hint="platform fees" icon={<Sparkles className="size-5" />} />
        <Kpi label="Active learners" tone="sky" value={d.kpis.activeLearners.value.toLocaleString()} changePct={d.kpis.activeLearners.changePct} hint={`of ${t.students.toLocaleString()} students`} icon={<GraduationCap className="size-5" />} />
        <Kpi label="New accounts" tone="sun" value={d.kpis.signups.value.toLocaleString()} changePct={d.kpis.signups.changePct} hint={vs} icon={<UserPlus className="size-5" />} />
        <Kpi label="AI cost" tone="coral" value={naira(d.kpis.aiCostKobo.value)} changePct={d.kpis.aiCostKobo.changePct} goodWhenUp={false} hint={<Link href="/overwatch/ai" className="font-bold text-violet-700 hover:underline">details</Link>} icon={<Bot className="size-5" />} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Money collected" subtitle="Successful payments per day (fees, top-ups, lessons)">
          <TrendChart data={d.series} series={[{ key: 'paymentsKobo', label: 'Collected' }]} format={nairaCompact} empty="No payments in this period" />
        </ChartCard>
        <ChartCard title="Learning activity" subtitle="Quests finished and students learning, per day">
          <TrendChart data={d.series} series={[{ key: 'attempts', label: 'Quests finished' }, { key: 'learners', label: 'Students learning' }]} format={compact} empty="No quests finished yet" />
        </ChartCard>
        <ChartCard title="New accounts" subtitle="Parents, students and staff who joined">
          <TrendChart data={d.series} series={[{ key: 'signups', label: 'New accounts', color: '#d49a00' }]} format={compact} empty="No sign-ups in this period" />
        </ChartCard>
        <ChartCard title="Platform activity" subtitle="Sign-ins and changes made across every school" action={<Link href="/overwatch/activity" className="text-sm font-bold text-violet-700 hover:underline">Activity log</Link>}>
          <TrendChart data={d.series} series={[{ key: 'events', label: 'Actions', color: '#1d6fe0' }]} format={compact} empty="Nothing logged yet" />
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <ChartCard title="Where the money came from" subtitle={`Last ${d.days} days`}>
          <BarList items={[...d.paymentsByPurpose].sort((a, b) => b.amountKobo - a.amountKobo).map((p) => ({ key: p.purpose, label: label(p.purpose), value: p.amountKobo, hint: `${p.count} payment${p.count === 1 ? '' : 's'}` }))} format={(v) => naira(v)} empty="No successful payments yet." />
        </ChartCard>
        <ChartCard title="Schools" subtitle="By money collected, then size" action={<Link href="/overwatch/schools" className="text-sm font-bold text-violet-700 hover:underline">All schools</Link>}>
          {d.topSchools.length ? (
            <Table head={['School', 'Students', 'Collected', 'Status']} className="shadow-none">
              {d.topSchools.map((s) => (
                <tr key={s.id} className="hover:bg-paper">
                  <td className="px-4 py-2.5">
                    <Link href={`/overwatch/schools/${s.id}`} className="font-bold hover:text-violet-700">
                      {s.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 font-semibold">{s.students.toLocaleString()}</td>
                  <td className="px-4 py-2.5 font-semibold">{naira(s.paymentsKobo)}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={s.status === 'ACTIVE' ? 'mint' : s.status === 'SUSPENDED' ? 'coral' : 'sun'}>{s.status.toLowerCase()}</Badge>
                  </td>
                </tr>
              ))}
            </Table>
          ) : (
            <p className="text-sm text-ink-500">No schools yet.</p>
          )}
        </ChartCard>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: 'Live schools', value: t.schools.ACTIVE ?? 0, hint: t.schools.SUSPENDED ? `${t.schools.SUSPENDED} suspended` : `${t.schools.PENDING ?? 0} pending`, href: '/overwatch/schools', icon: Building2 },
          { label: 'Students', value: t.students, href: '/overwatch/people?kind=STUDENT', icon: GraduationCap },
          { label: 'Parents', value: t.parents, href: '/overwatch/people?kind=PARENT', icon: Users },
          { label: 'Teachers & staff', value: t.staff, href: '/overwatch/people?kind=STAFF', icon: Users },
        ].map((x) => (
          <Link key={x.label} href={x.href}>
            <Card className="flex items-center gap-3 transition hover:-translate-y-0.5">
              <x.icon className="size-6 text-ink-300" aria-hidden />
              <div className="min-w-0">
                <div className="font-display text-2xl font-extrabold">{x.value.toLocaleString()}</div>
                <div className="truncate text-sm font-semibold text-ink-500">
                  {x.label}
                  {x.hint ? <span className="font-normal"> · {x.hint}</span> : null}
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
