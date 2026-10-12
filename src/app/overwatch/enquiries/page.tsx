'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Inbox, Mail, MessageCircle, Phone } from 'lucide-react';
import { useState } from 'react';

import { CreateSchool, type Enquiry } from '@/components/overwatch/CreateSchool';
import { Badge, Button, Card, Empty, ErrorBox, Loading, PageHeader, Tabs } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { api, errorText } from '@/lib/api';
import { date, LEVEL } from '@/lib/format';

export default function EnquiriesPage() {
  const [tab, setTab] = useState<'open' | 'done'>('open');
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['ow', 'enquiries', tab], queryFn: () => api<Enquiry[]>(`/admin/school-enquiries?handled=${tab === 'done'}`) });
  const [converting, setConverting] = useState<Enquiry | null>(null);
  const done = useMutation({
    mutationFn: (id: string) => api(`/admin/school-enquiries/${id}/handled`, { body: {} }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ow'] }),
    onError: (e) => toast.error(errorText(e)),
  });
  const wa = (phone: string) => `https://wa.me/${phone.replace(/\D/g, '').replace(/^0/, '234')}`;

  return (
    <>
      <PageHeader title="Demo requests" subtitle="From the “Book a demo” form on the website." />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'open', label: 'To follow up' },
          { value: 'done', label: 'Handled' },
        ]}
      />
      {q.isPending ? (
        <Loading />
      ) : q.error ? (
        <ErrorBox error={q.error} onRetry={q.refetch} />
      ) : q.data.length === 0 ? (
        <Empty icon={<Inbox className="size-7" />} title={tab === 'open' ? 'All caught up' : 'Nothing here yet'} message={tab === 'open' ? 'New demo requests from the website appear here.' : undefined} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {q.data.map((e) => (
            <Card key={e.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-display text-xl font-bold">{e.schoolName}</h3>
                  <p className="text-sm text-ink-500">
                    {e.contactName} · {e.role}
                  </p>
                </div>
                <span className="text-xs whitespace-nowrap text-ink-500">{date(e.createdAt, { day: 'numeric', month: 'short' })}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {e.state ? <Badge tone="sky">{e.state}</Badge> : null}
                {e.studentCount ? <Badge tone="violet">{e.studentCount} students</Badge> : null}
                {e.levels.map((l) => (
                  <Badge key={l}>{LEVEL[l as keyof typeof LEVEL] ?? l}</Badge>
                ))}
              </div>
              {e.message ? <p className="rounded-xl bg-paper p-3 text-[14px]">“{e.message}”</p> : null}
              <div className="flex flex-wrap gap-2 text-sm font-bold">
                <a href={`tel:${e.phone}`} className="flex items-center gap-1 rounded-lg px-2 py-1 text-violet-700 hover:bg-violet-50">
                  <Phone className="size-4" /> {e.phone}
                </a>
                <a href={wa(e.phone)} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-lg px-2 py-1 text-mint-700 hover:bg-mint-50">
                  <MessageCircle className="size-4" /> WhatsApp
                </a>
                <a href={`mailto:${e.email}`} className="flex items-center gap-1 rounded-lg px-2 py-1 text-violet-700 hover:bg-violet-50">
                  <Mail className="size-4" /> {e.email}
                </a>
              </div>
              {tab === 'open' ? (
                <div className="mt-auto flex flex-wrap gap-2 pt-2">
                  <Button size="sm" onClick={() => setConverting(e)}>
                    Set up school
                  </Button>
                  <Button size="sm" variant="ghost" loading={done.isPending && done.variables === e.id} onClick={() => done.mutate(e.id)}>
                    Mark as handled
                  </Button>
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      )}
      {converting ? <CreateSchool enquiry={converting} onClose={() => setConverting(null)} /> : null}
    </>
  );
}
