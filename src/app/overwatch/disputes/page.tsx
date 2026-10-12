'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Scale } from 'lucide-react';

import { Badge, Button, Card, Empty, ErrorBox, Loading, PageHeader } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { api, errorText } from '@/lib/api';
import { date, naira } from '@/lib/format';

type Dispute = {
  sessionId: string;
  scheduledAt: string;
  disputedAt: string | null;
  reason: string | null;
  totalKobo: string;
  topics: string[];
  tutorNotes: string | null;
  parent: { firstName: string; lastName: string; email: string | null; phone: string | null };
  tutor: { firstName: string; lastName: string; phone: string | null };
  child: string;
};

export default function DisputesPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['ow', 'disputes'], queryFn: () => api<Dispute[]>('/admin/disputes') });
  const resolve = useMutation({
    mutationFn: ({ id, release }: { id: string; release: boolean }) => api(`/admin/sessions/${id}/resolve-dispute`, { body: { release } }),
    onSuccess: (_, v) => {
      toast.success(v.release ? 'Tutor paid' : 'Refund sent to the parent through Squad');
      qc.invalidateQueries({ queryKey: ['ow'] });
    },
    onError: (e) => toast.error(errorText(e)),
  });

  return (
    <>
      <PageHeader title="Lesson disputes" subtitle="A parent said a paid lesson didn’t happen as agreed. The money waits in escrow until you decide." />
      {q.isPending ? (
        <Loading />
      ) : q.error ? (
        <ErrorBox error={q.error} onRetry={q.refetch} />
      ) : q.data.length === 0 ? (
        <Empty icon={<Scale className="size-7" />} title="No open disputes" />
      ) : (
        <div className="flex flex-col gap-4">
          {q.data.map((d) => (
            <Card key={d.sessionId} className="flex flex-col gap-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-display text-lg font-bold">
                    {d.child}’s lesson with {d.tutor.firstName} {d.tutor.lastName}
                  </h3>
                  <p className="text-sm text-ink-500">
                    {date(d.scheduledAt, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })} · disputed {d.disputedAt ? date(d.disputedAt, { day: 'numeric', month: 'short' }) : ''}
                  </p>
                </div>
                <Badge tone="sun">{naira(d.totalKobo)} held</Badge>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl bg-coral-50 p-3">
                  <div className="mb-1 text-xs font-extrabold text-coral-700 uppercase">Parent says</div>
                  <p className="text-[15px]">{d.reason}</p>
                  <p className="mt-2 text-sm text-ink-500">
                    {d.parent.firstName} {d.parent.lastName} · {d.parent.phone ?? d.parent.email}
                  </p>
                </div>
                <div className="rounded-xl bg-paper p-3">
                  <div className="mb-1 text-xs font-extrabold text-ink-500 uppercase">Tutor recorded</div>
                  <p className="text-[15px]">{d.topics.length ? `Covered: ${d.topics.join(', ')}` : 'No topics recorded.'}</p>
                  {d.tutorNotes ? <p className="text-sm text-ink-700">“{d.tutorNotes}”</p> : null}
                  <p className="mt-2 text-sm text-ink-500">{d.tutor.phone}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="success" size="sm" loading={resolve.isPending && resolve.variables?.id === d.sessionId && resolve.variables.release} onClick={() => confirm('Pay the tutor for this lesson?') && resolve.mutate({ id: d.sessionId, release: true })}>
                  Lesson happened: pay tutor
                </Button>
                <Button variant="danger" size="sm" loading={resolve.isPending && resolve.variables?.id === d.sessionId && !resolve.variables.release} onClick={() => confirm(`Refund ${naira(d.totalKobo)} to the parent’s card?`) && resolve.mutate({ id: d.sessionId, release: false })}>
                  Refund the parent
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
