'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCheck, LifeBuoy, Mail, Phone, RotateCcw, Send } from 'lucide-react';
import { useState } from 'react';

import { ago, dateTime, Pager } from '@/components/overwatch/kit';
import { Badge, Button, Card, cx, Empty, ErrorBox, Loading, PageHeader, Tabs, Textarea, type Tone } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { api, errorText } from '@/lib/api';

type Status = 'OPEN' | 'WAITING_ON_USER' | 'RESOLVED';
const STATUS: Record<Status, { label: string; tone: Tone }> = {
  OPEN: { label: 'Needs a reply', tone: 'sun' },
  WAITING_ON_USER: { label: 'Waiting on them', tone: 'sky' },
  RESOLVED: { label: 'Resolved', tone: 'mint' },
};
type Inbox = {
  total: number;
  page: number;
  pageSize: number;
  counts: Partial<Record<Status, number>>;
  items: { id: string; subject: string; status: Status; requester: string; messages: number; lastMessage: string; waitingOnUs: boolean; updatedAt: string }[];
};
type Thread = {
  id: string;
  subject: string;
  status: Status;
  createdAt: string;
  child: string | null;
  requester: { name: string; email: string | null; phone: string | null };
  messages: { id: string; body: string; fromStaff: boolean; author: string; createdAt: string }[];
};

/** Help requests from parents and students, answered here. Replies reach them in the app. */
export default function SupportPage() {
  const [tab, setTab] = useState<Status | ''>('OPEN');
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);
  const inbox = useQuery({ queryKey: ['ow', 'support', tab, page], queryFn: () => api<Inbox>(`/admin/support?page=${page}${tab ? `&status=${tab}` : ''}`), placeholderData: keepPreviousData });
  const counts = inbox.data?.counts ?? {};

  return (
    <>
      <PageHeader title="Support" subtitle="Questions from parents and students. Your reply reaches them in the app straight away." />
      <Tabs
        value={tab}
        onChange={(t) => (setTab(t), setPage(1), setOpenId(null))}
        tabs={[
          { value: 'OPEN', label: `Needs a reply${counts.OPEN ? ` (${counts.OPEN})` : ''}` },
          { value: 'WAITING_ON_USER', label: 'Waiting on them' },
          { value: 'RESOLVED', label: 'Resolved' },
          { value: '', label: 'All' },
        ]}
      />
      {inbox.isPending ? (
        <Loading />
      ) : inbox.error ? (
        <ErrorBox error={inbox.error} onRetry={inbox.refetch} />
      ) : inbox.data.items.length === 0 ? (
        <Empty icon={<LifeBuoy className="size-7" />} title={tab === 'OPEN' ? 'All caught up' : 'Nothing here'} message={tab === 'OPEN' ? 'When a parent or student asks for help from the app, it appears here.' : undefined} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[2fr_3fr]">
          <div>
            <ol className="flex flex-col gap-2">
              {inbox.data.items.map((t) => (
                <li key={t.id}>
                  <button type="button" onClick={() => setOpenId(t.id)} className={cx('w-full rounded-2xl border bg-white p-3 text-left hover:border-violet-300', openId === t.id ? 'border-violet-400 ring-4 ring-violet-100' : 'border-ink-100')}>
                    <div className="flex items-center gap-2">
                      <span className="mr-auto truncate font-bold">{t.subject}</span>
                      <span className="text-xs whitespace-nowrap text-ink-500">{ago(t.updatedAt)}</span>
                    </div>
                    <div className="mt-0.5 text-xs text-ink-500">
                      {t.requester} · {t.messages} {t.messages === 1 ? 'message' : 'messages'}
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-ink-700">{t.lastMessage}</p>
                    <div className="mt-2">
                      <Badge tone={STATUS[t.status].tone}>{STATUS[t.status].label}</Badge>
                    </div>
                  </button>
                </li>
              ))}
            </ol>
            <Pager page={page} pageSize={inbox.data.pageSize} total={inbox.data.total} onPage={setPage} />
          </div>
          {openId ? (
            <Conversation id={openId} />
          ) : (
            <Card className="flex items-center justify-center text-sm text-ink-500">Choose a conversation to read and reply.</Card>
          )}
        </div>
      )}
    </>
  );
}

function Conversation({ id }: { id: string }) {
  const qc = useQueryClient();
  const [body, setBody] = useState('');
  const t = useQuery({ queryKey: ['ow', 'support', 'thread', id], queryFn: () => api<Thread>(`/admin/support/${id}`) });
  const done = () => qc.invalidateQueries({ queryKey: ['ow', 'support'] });
  const reply = useMutation({
    mutationFn: (resolve: boolean) => api<Thread>(`/admin/support/${id}/reply`, { method: 'POST', body: { body, resolve } }),
    onSuccess: (_, resolve) => {
      setBody('');
      toast.success(resolve ? 'Reply sent and marked resolved.' : 'Reply sent. They’ll get a notification.');
      done();
    },
    onError: (e) => toast.error(errorText(e)),
  });
  const status = useMutation({
    mutationFn: (s: Status) => api<Thread>(`/admin/support/${id}/status`, { method: 'POST', body: { status: s } }),
    onSuccess: (_, s) => {
      toast.success(s === 'RESOLVED' ? 'Marked resolved.' : 'Opened again.');
      done();
    },
    onError: (e) => toast.error(errorText(e)),
  });

  if (t.isPending) return <Loading />;
  if (t.error) return <ErrorBox error={t.error} onRetry={t.refetch} />;
  const d = t.data;
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start gap-2">
        <div className="mr-auto">
          <h2 className="font-display text-xl font-bold">{d.subject}</h2>
          <p className="text-sm text-ink-500">
            {d.requester.name}
            {d.child ? ` · about ${d.child}` : ''} · started {dateTime(d.createdAt)}
          </p>
          <div className="mt-1 flex flex-wrap gap-3 text-sm font-bold">
            {d.requester.email ? (
              <a href={`mailto:${d.requester.email}`} className="flex items-center gap-1 text-violet-700 hover:underline">
                <Mail className="size-4" /> {d.requester.email}
              </a>
            ) : null}
            {d.requester.phone ? (
              <a href={`tel:${d.requester.phone}`} className="flex items-center gap-1 text-violet-700 hover:underline">
                <Phone className="size-4" /> {d.requester.phone}
              </a>
            ) : null}
          </div>
        </div>
        <Badge tone={STATUS[d.status].tone}>{STATUS[d.status].label}</Badge>
      </div>
      <ol className="flex flex-col gap-2">
        {d.messages.map((msg) => (
          <li key={msg.id} className={cx('max-w-[85%] rounded-2xl p-3 text-[14px] leading-relaxed', msg.fromStaff ? 'self-end bg-violet-50' : 'self-start bg-paper')}>
            <div className="mb-1 text-xs font-bold text-ink-500">
              {msg.author} · {dateTime(msg.createdAt)}
            </div>
            <p className="whitespace-pre-wrap">{msg.body}</p>
          </li>
        ))}
      </ol>
      <Textarea label="Your reply" value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder="Write a clear, friendly answer…" />
      <div className="flex flex-wrap justify-end gap-2">
        {d.status === 'RESOLVED' ? (
          <Button variant="ghost" icon={<RotateCcw className="size-4" />} loading={status.isPending} onClick={() => status.mutate('OPEN')}>
            Open again
          </Button>
        ) : (
          <Button variant="ghost" icon={<CheckCheck className="size-4" />} loading={status.isPending} onClick={() => status.mutate('RESOLVED')}>
            Mark resolved
          </Button>
        )}
        <Button variant="secondary" disabled={!body.trim()} loading={reply.isPending && reply.variables === true} onClick={() => reply.mutate(true)}>
          Reply and resolve
        </Button>
        <Button icon={<Send className="size-4" />} disabled={!body.trim()} loading={reply.isPending && reply.variables === false} onClick={() => reply.mutate(false)}>
          Send reply
        </Button>
      </div>
    </Card>
  );
}
