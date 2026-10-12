'use client';

import { useQuery } from '@tanstack/react-query';
import { Building2, Plus } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { CreateSchool } from '@/components/overwatch/CreateSchool';
import { Badge, Button, Empty, ErrorBox, Loading, PageHeader, Table } from '@/components/ui';
import { api } from '@/lib/api';
import { date } from '@/lib/format';

type SchoolRow = {
  id: string;
  name: string;
  state: string | null;
  status: string;
  createdAt: string;
  students: number;
  owner: { firstName: string; lastName: string; email: string | null; lastLoginAt: string | null } | null;
  agreement: { planName: string; revenueShareBp: number } | null;
};

export default function SchoolsPage() {
  const q = useQuery({ queryKey: ['ow', 'schools'], queryFn: () => api<SchoolRow[]>('/admin/schools') });
  const [adding, setAdding] = useState(false);
  return (
    <>
      <PageHeader
        title="Schools"
        actions={
          <Button icon={<Plus className="size-4" />} onClick={() => setAdding(true)}>
            Add school
          </Button>
        }
      />
      {q.isPending ? (
        <Loading />
      ) : q.error ? (
        <ErrorBox error={q.error} onRetry={q.refetch} />
      ) : q.data.length === 0 ? (
        <Empty icon={<Building2 className="size-7" />} title="No schools yet" message="Set one up from a demo request, or add it directly." action={<Button onClick={() => setAdding(true)}>Add school</Button>} />
      ) : (
        <Table head={['School', 'Owner', 'Students', 'Agreement', 'Status']}>
          {q.data.map((s) => (
            <tr key={s.id} className="hover:bg-paper">
              <td className="px-4 py-3">
                <Link href={`/overwatch/schools/${s.id}`} className="font-bold hover:text-violet-700">
                  {s.name}
                </Link>
                <div className="text-xs text-ink-500">
                  {s.state ?? '—'} · since {date(s.createdAt, { month: 'short', year: 'numeric' })}
                </div>
              </td>
              <td className="px-4 py-3">
                {s.owner ? (
                  <>
                    <div className="font-semibold">
                      {s.owner.firstName} {s.owner.lastName}
                    </div>
                    <div className="text-xs text-ink-500">{s.owner.lastLoginAt ? `Last in ${date(s.owner.lastLoginAt, { day: 'numeric', month: 'short' })}` : 'Hasn’t signed in'}</div>
                  </>
                ) : (
                  '—'
                )}
              </td>
              <td className="px-4 py-3 font-semibold">{s.students}</td>
              <td className="px-4 py-3">{s.agreement ? `${s.agreement.planName} · ${s.agreement.revenueShareBp / 100}%` : <Badge tone="sun">None yet</Badge>}</td>
              <td className="px-4 py-3">
                <Badge tone={s.status === 'ACTIVE' ? 'mint' : s.status === 'SUSPENDED' ? 'coral' : 'sun'}>{s.status.toLowerCase()}</Badge>
              </td>
            </tr>
          ))}
        </Table>
      )}
      {adding ? <CreateSchool onClose={() => setAdding(false)} /> : null}
    </>
  );
}
