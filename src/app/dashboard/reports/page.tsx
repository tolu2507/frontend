'use client';

import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Sparkles, UserX } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Badge, Card, Empty, ErrorBox, Loading, PageHeader, Stat, Table } from '@/components/ui';
import { api } from '@/lib/api';
import { date } from '@/lib/format';
import { useSchoolKey } from '@/lib/queries';

type Row = { studentId: string; name: string; className: string; hasParent: boolean; consented: boolean; lastReport: { weekStart: string; status: string; headline: string | null } | null };

export default function ReportsPage() {
  const key = useSchoolKey();
  const q = useQuery({ queryKey: [key, 'reports'], queryFn: () => api<Row[]>('/school/reports') });
  const [filter, setFilter] = useState<'all' | 'noParent' | 'off'>('all');

  if (q.isPending) return <Loading />;
  if (q.error) return <ErrorBox error={q.error} onRetry={q.refetch} />;
  const rows = q.data;
  const ready = rows.filter((r) => r.hasParent && r.consented).length;
  const noParent = rows.filter((r) => !r.hasParent).length;
  const off = rows.filter((r) => r.hasParent && !r.consented).length;
  const shown = rows.filter((r) => (filter === 'noParent' ? !r.hasParent : filter === 'off' ? r.hasParent && !r.consented : true));

  return (
    <>
      <PageHeader title="Parent reports" subtitle="Every Friday at 4pm, Nexus writes each parent a short report from this week’s attendance, scores and teacher notes." />
      {rows.length === 0 ? (
        <Empty icon={<Sparkles className="size-7" />} title="No students yet" message="Add students and their parents to start sending weekly reports." />
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <Stat label="Getting reports" tone="mint" value={`${ready} of ${rows.length}`} icon={<CheckCircle2 className="size-5" />} />
            <Stat label="No parent linked" tone="coral" value={noParent} hint="Add a parent on the student’s page" icon={<UserX className="size-5" />} />
            <Stat label="Parent hasn’t switched on" tone="sun" value={off} hint="They switch it on in their app" icon={<Sparkles className="size-5" />} />
          </div>
          <Card className="mb-4 flex flex-wrap gap-2 p-2">
            {(
              [
                ['all', `All (${rows.length})`],
                ['noParent', `No parent (${noParent})`],
                ['off', `Not switched on (${off})`],
              ] as const
            ).map(([v, label]) => (
              <button key={v} type="button" aria-pressed={filter === v} onClick={() => setFilter(v)} className={`rounded-xl px-3 py-2 text-sm font-bold ${filter === v ? 'bg-violet-500 text-white' : 'hover:bg-violet-50'}`}>
                {label}
              </button>
            ))}
          </Card>
          <Table head={['Student', 'Class', 'Reports', 'Last report']}>
            {shown.map((r) => (
              <tr key={r.studentId} className="hover:bg-paper">
                <td className="px-4 py-3">
                  <Link href={`/dashboard/students/${r.studentId}`} className="font-bold hover:text-violet-700">
                    {r.name}
                  </Link>
                </td>
                <td className="px-4 py-3">{r.className}</td>
                <td className="px-4 py-3">{!r.hasParent ? <Badge tone="coral">No parent</Badge> : r.consented ? <Badge tone="mint">On</Badge> : <Badge tone="sun">Parent hasn’t switched on</Badge>}</td>
                <td className="px-4 py-3 text-ink-500">{r.lastReport ? `${date(r.lastReport.weekStart, { day: 'numeric', month: 'short' })} · ${r.lastReport.headline ?? ''}` : '—'}</td>
              </tr>
            ))}
          </Table>
        </>
      )}
    </>
  );
}
