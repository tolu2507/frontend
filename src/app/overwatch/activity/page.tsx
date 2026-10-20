'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Activity as ActivityIcon, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

import { ChartCard, compact, TrendChart } from '@/components/overwatch/charts';
import { ago, dateTime, ExportButton, Filters, label, Pager, qs, RangeTabs, SchoolFilter, SearchBox, type Paged } from '@/components/overwatch/kit';
import { Badge, Empty, ErrorBox, Loading, PageHeader, Table } from '@/components/ui';
import { api } from '@/lib/api';

type Row = {
  id: string;
  at: string;
  action: string;
  entityType: string;
  entityId: string;
  actor: { id: string; name: string; role: string | null } | null;
  school: { id: string; name: string } | null;
  ip: string | null;
  meta: { method?: string; path?: string; status?: number; [k: string]: unknown } | null;
};
type Summary = {
  series: { day: string; events: number }[];
  schools: { id: string; name: string; status: string; students: number; events: number; people: number; logins: number; lastActivity: string | null }[];
};

const NAMED: Record<string, string> = {
  'auth.login': 'Signed in',
  'school.create': 'Created school',
  'school.active': 'Reactivated school',
  'school.suspended': 'Suspended school',
  'agreement.create': 'Added agreement',
  'statement.calculate': 'Calculated statement',
  'wallet.freeze': 'Froze wallet',
  'wallet.unfreeze': 'Unfroze wallet',
  'ai.profile.update': 'Updated AI profile',
  'ai.topics.add': 'Added scheme-of-work topics',
  'ai.topics.delete': 'Removed a scheme-of-work topic',
  'quest.create': 'Created quest',
  'quest.update': 'Edited quest',
  'quest.publish': 'Published quest',
  'quest.unpublish': 'Unpublished quest',
  'quest.delete': 'Deleted quest',
};
/** 'tuckshop.charge' → 'Tuck shop: charge'; 'school.createStudent' → 'School: create student'. */
function describe(action: string) {
  if (NAMED[action]) return NAMED[action];
  const [area, what = ''] = action.split('.');
  const words = what.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
  const areaName = { tuckshop: 'Tuck shop', me: 'Account', school: 'School', student: 'Student app', parent: 'Parent app', tutor: 'Tutor', payments: 'Payments', enquiries: 'Website' }[area] ?? area;
  return `${areaName}: ${words}`;
}

const PAGE = 50;

export default function ActivityPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ActivityLog />
    </Suspense>
  );
}

function ActivityLog() {
  const params = useSearchParams();
  const [days, setDays] = useState(30);
  const [schoolId, setSchoolId] = useState(params.get('schoolId') ?? '');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const summary = useQuery({ queryKey: ['ow', 'activity-summary', days], queryFn: () => api<Summary>(`/admin/activity/summary?days=${days}`) });
  const filter = { schoolId, q, days };
  const log = useQuery({ queryKey: ['ow', 'activity', filter, page], queryFn: () => api<Paged<Row>>(`/admin/activity?${qs({ ...filter, page, pageSize: PAGE })}`), placeholderData: keepPreviousData });

  return (
    <>
      <PageHeader title="Activity log" subtitle="Every sign-in and change, in every school. Request contents (PINs, passwords) are never stored." actions={<RangeTabs value={days} onChange={(d) => (setDays(d), setPage(1))} />} />

      {summary.isPending ? (
        <Loading rows={3} />
      ) : summary.error ? (
        <ErrorBox error={summary.error} onRetry={summary.refetch} />
      ) : (
        <div className="mb-6 grid gap-4 xl:grid-cols-[1fr_1.3fr]">
          <ChartCard title="Actions per day" subtitle="All schools and Overwatch">
            <TrendChart data={summary.data.series} series={[{ key: 'events', label: 'Actions', color: '#1d6fe0' }]} format={compact} empty="Nothing logged in this period" />
          </ChartCard>
          <ChartCard title="School engagement" subtitle={`Quietest first: schools that may need a call. Last ${days} days.`}>
            <div className="max-h-80 overflow-y-auto">
              <Table head={['School', 'Actions', 'People active', 'Sign-ins', 'Last activity']} className="shadow-none">
                {summary.data.schools.map((s) => (
                  <tr key={s.id} className="hover:bg-paper">
                    <td className="px-4 py-2.5">
                      <button type="button" onClick={() => (setSchoolId(s.id), setPage(1))} className="text-left font-bold hover:text-violet-700">
                        {s.name}
                      </button>
                      <div className="text-xs text-ink-500">{s.students} students</div>
                    </td>
                    <td className="px-4 py-2.5 font-semibold">
                      {s.events === 0 && s.status === 'ACTIVE' ? (
                        <Badge tone="coral">
                          <AlertTriangle className="size-3" aria-hidden /> none
                        </Badge>
                      ) : (
                        s.events.toLocaleString()
                      )}
                    </td>
                    <td className="px-4 py-2.5">{s.people}</td>
                    <td className="px-4 py-2.5">{s.logins}</td>
                    <td className="px-4 py-2.5 text-ink-500">{ago(s.lastActivity)}</td>
                  </tr>
                ))}
              </Table>
            </div>
          </ChartCard>
        </div>
      )}

      <Filters>
        <SearchBox value={q} onChange={(v) => (setQ(v), setPage(1))} placeholder="Search person or action" />
        <SchoolFilter value={schoolId} onChange={(v) => (setSchoolId(v), setPage(1))} extra={[{ value: 'none', label: 'Platform-wide only' }]} />
        <div className="ml-auto">
          <ExportButton<Row>
            filename="brainbox-activity.csv"
            fetchPage={(p, size) => api<Paged<Row>>(`/admin/activity?${qs({ ...filter, page: p, pageSize: size })}`)}
            columns={[['Time', (r) => dateTime(r.at)], ['Who', (r) => r.actor?.name], ['Role', (r) => label(r.actor?.role)], ['School', (r) => r.school?.name], ['Action', (r) => describe(r.action)], ['Result', (r) => r.meta?.status ?? ''], ['IP', (r) => r.ip]]}
          />
        </div>
      </Filters>

      {log.isPending ? (
        <Loading />
      ) : log.error ? (
        <ErrorBox error={log.error} onRetry={log.refetch} />
      ) : log.data.rows.length === 0 ? (
        <Empty icon={<ActivityIcon className="size-7" />} title="Nothing logged" message="Sign-ins and every change people make will appear here." />
      ) : (
        <div className={log.isPlaceholderData ? 'opacity-60 transition' : 'transition'}>
          <Table head={['When', 'Who', 'School', 'What', 'Result']}>
            {log.data.rows.map((r) => {
              const status = typeof r.meta?.status === 'number' ? r.meta.status : null;
              return (
                <tr key={r.id} className="hover:bg-paper">
                  <td className="px-4 py-2.5 whitespace-nowrap text-ink-500" title={new Date(r.at).toISOString()}>
                    {dateTime(r.at)}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="font-bold">{r.actor?.name ?? 'System'}</div>
                    {r.actor?.role ? <div className="text-xs text-ink-500">{label(r.actor.role)}</div> : null}
                  </td>
                  <td className="px-4 py-2.5">
                    {r.school ? (
                      <Link href={`/overwatch/schools/${r.school.id}`} className="font-semibold hover:text-violet-700">
                        {r.school.name}
                      </Link>
                    ) : (
                      <span className="text-ink-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="font-semibold">{describe(r.action)}</div>
                    {typeof r.meta?.title === 'string' ? <div className="text-xs text-ink-500">{r.meta.title}</div> : null}
                    {typeof r.meta?.reason === 'string' && r.meta.reason ? <div className="text-xs text-ink-500">Reason: {r.meta.reason}</div> : null}
                  </td>
                  <td className="px-4 py-2.5">{status === null ? <Badge tone="mint">done</Badge> : status < 400 ? <Badge tone="mint">ok</Badge> : <Badge tone="coral">failed · {status}</Badge>}</td>
                </tr>
              );
            })}
          </Table>
          <Pager page={page} pageSize={PAGE} total={log.data.total} onPage={setPage} />
        </div>
      )}
    </>
  );
}
