'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck } from 'lucide-react';
import { useState } from 'react';

import { DeleteAccountButton, ExportDataButton } from '@/components/overwatch/DeleteAccount';
import { dateTime } from '@/components/overwatch/kit';
import { Badge, Button, Empty, ErrorBox, Loading, Notice, PageHeader, Table, Tabs } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { api, errorText } from '@/lib/api';

type Request = {
  id: string;
  type: 'EXPORT' | 'DELETE';
  status: 'RECEIVED' | 'PROCESSING' | 'DONE';
  createdAt: string;
  completedAt: string | null;
  parent: { userId: string; name: string; email: string | null; phone: string | null };
  child: { userId: string; name: string } | null;
};

/** Requests parents send from Privacy & data in the app: a copy of their data, or deleting it. */
export default function PrivacyPage() {
  const [view, setView] = useState<'open' | 'all'>('open');
  const q = useQuery({ queryKey: ['ow', 'data-requests', view], queryFn: () => api<Request[]>(`/admin/data-requests?open=${view === 'open'}`) });
  return (
    <>
      <PageHeader title="Privacy requests" subtitle="Parents asking for a copy of their data, or for it to be deleted. Under the NDPA, reply within 30 days." />
      <Tabs value={view} onChange={setView} tabs={[{ value: 'open', label: 'To do' }, { value: 'all', label: 'All' }]} />
      <div className="mt-4 flex flex-col gap-4">
        <Notice tone="sky">
          <b>Copy of data:</b> download it and email it to the parent, then mark it done. <b>Delete:</b> deleting the account closes the request by itself. You can also delete anyone from the People page.
        </Notice>
        {q.isPending ? (
          <Loading rows={4} />
        ) : q.error ? (
          <ErrorBox error={q.error} onRetry={q.refetch} />
        ) : q.data.length === 0 ? (
          <Empty icon={<ShieldCheck className="size-8" />} title={view === 'open' ? 'Nothing to do' : 'No requests yet'} message="Requests from Privacy & data in the app show up here." />
        ) : (
          <Table head={['Received', 'Parent', 'Asking for', 'Status', '']}>
            {q.data.map((r) => (
              <tr key={r.id} className="align-top hover:bg-paper">
                <td className="whitespace-nowrap px-4 py-3 text-sm">{dateTime(r.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="font-bold">{r.parent.name}</div>
                  <div className="text-xs text-ink-500">{[r.parent.email, r.parent.phone].filter(Boolean).join(' · ')}</div>
                </td>
                <td className="px-4 py-3">
                  {r.type === 'EXPORT' ? 'A copy of their data' : r.child ? `Delete ${r.child.name}` : 'Delete their account'}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={r.status === 'DONE' ? 'mint' : r.status === 'PROCESSING' ? 'sky' : 'sun'}>{r.status === 'DONE' ? 'done' : r.status === 'PROCESSING' ? 'in progress' : 'new'}</Badge>
                </td>
                <td className="px-4 py-3">
                  {r.status !== 'DONE' ? (
                    <div className="flex flex-wrap gap-2">
                      {r.type === 'EXPORT' ? <ExportDataButton userId={r.parent.userId} name={r.parent.name} /> : <DeleteAccountButton userId={r.child?.userId ?? r.parent.userId} label={r.child ? `Delete ${r.child.name.split(' ')[0]}` : 'Delete account'} />}
                      <MarkDone id={r.id} />
                    </div>
                  ) : null}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </div>
    </>
  );
}

function MarkDone({ id }: { id: string }) {
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: () => api(`/admin/data-requests/${id}/status`, { method: 'POST', body: { status: 'DONE' } }),
    onSuccess: () => {
      toast.success('Marked done.');
      void qc.invalidateQueries({ queryKey: ['ow', 'data-requests'] });
    },
    onError: (e) => toast.error(errorText(e)),
  });
  return (
    <Button size="sm" variant="ghost" loading={m.isPending} onClick={() => m.mutate()}>
      Mark done
    </Button>
  );
}
