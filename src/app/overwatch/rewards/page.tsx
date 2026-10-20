'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CircleAlert, Gift, HandCoins, PiggyBank } from 'lucide-react';
import { useState } from 'react';

import { Meter } from '@/components/overwatch/charts';
import { dateTime, FilterSelect, Kpi } from '@/components/overwatch/kit';
import { Badge, Button, Card, Empty, ErrorBox, Loading, Notice, PageHeader, Table, type Tone } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { api, errorText } from '@/lib/api';
import { naira } from '@/lib/format';

type Status = 'SENDING' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'CHECK';
type Overview = {
  month: { spentKobo: string; budgetKobo: string };
  unclaimedKobo: string;
  counts: Partial<Record<Status, number>>;
  redemptions: { id: string; kind: 'AIRTIME' | 'DATA'; network: string; phone: string; planName: string | null; amountKobo: string; status: Status; createdAt: string; parent: string; email: string | null; providerRef: string | null; error: string | null }[];
};

const STATUS: Record<Status, { label: string; tone: Tone }> = {
  SENDING: { label: 'sending', tone: 'sky' },
  PENDING: { label: 'on its way', tone: 'sky' },
  SUCCESS: { label: 'sent', tone: 'mint' },
  FAILED: { label: 'failed, refunded', tone: 'coral' },
  CHECK: { label: 'needs checking', tone: 'sun' },
};

/** Earn while you learn: airtime and data paid out to parents, against the monthly budget. */
export default function RewardsPage() {
  const [status, setStatus] = useState('');
  const q = useQuery({ queryKey: ['ow', 'rewards', status], queryFn: () => api<Overview>(`/admin/rewards${status ? `?status=${status}` : ''}`) });
  return (
    <>
      <PageHeader title="Rewards" subtitle="Airtime and data children earn for their parents by practising, sent through Squad." />
      {q.isPending ? <Loading rows={5} /> : q.error ? <ErrorBox error={q.error} onRetry={q.refetch} /> : <Dashboard d={q.data} status={status} setStatus={setStatus} />}
    </>
  );
}

function Dashboard({ d, status, setStatus }: { d: Overview; status: string; setStatus: (s: string) => void }) {
  const spent = Number(d.month.spentKobo);
  const budget = Number(d.month.budgetKobo);
  const used = budget ? Math.min(100, (spent / budget) * 100) : 100;
  const toCheck = d.counts.CHECK ?? 0;
  return (
    <div className="flex flex-col gap-6">
      {toCheck ? (
        <Notice tone="sun" title={`${toCheck} reward${toCheck === 1 ? '' : 's'} to check`}>
          Squad didn’t answer when these were sent, so we don’t know if they arrived. Look each one up in the Squad dashboard (Value-added services) by phone number and time, then mark it sent or failed. Failed gives the parent their money back.
        </Notice>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Paid out this month" tone="sun" value={naira(spent)} hint={`of ${naira(budget)} budget`} icon={<Gift className="size-5" />} />
        <Kpi label="Waiting to be collected" tone="violet" value={naira(Number(d.unclaimedKobo))} hint="earned by children, owed to parents" icon={<PiggyBank className="size-5" />} />
        <Kpi label="Sent so far" tone="mint" value={(d.counts.SUCCESS ?? 0).toLocaleString()} hint={`${d.counts.FAILED ?? 0} failed and refunded`} icon={<HandCoins className="size-5" />} />
      </div>

      <Card className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-bold">Monthly budget</span>
          <span className="text-sm text-ink-500">
            {naira(spent)} of {naira(budget)}
          </span>
        </div>
        <Meter value={used} tone={used >= 90 ? 'coral' : used >= 70 ? 'sun' : 'mint'} />
        <p className="text-sm text-ink-500">
          When it’s used up, parents are asked to collect again on the 1st; their balance stays safe. Change it with <code>REWARDS_MONTHLY_BUDGET_NAIRA</code> in the backend <code>.env</code>. Squad takes the cost from your Squad balance, so keep it funded.
        </p>
      </Card>

      <div className="flex flex-wrap items-end gap-3">
        <FilterSelect label="Status" value={status} onChange={setStatus} options={[{ value: '', label: 'All' }, ...(Object.keys(STATUS) as Status[]).map((s) => ({ value: s, label: STATUS[s].label }))]} />
      </div>

      {d.redemptions.length ? (
        <Table head={['When', 'Parent', 'Reward', 'Phone', 'Status', '']}>
          {d.redemptions.map((r) => (
            <tr key={r.id} className="hover:bg-paper">
              <td className="whitespace-nowrap px-4 py-2.5 text-sm">{dateTime(r.createdAt)}</td>
              <td className="px-4 py-2.5">
                <div className="font-bold">{r.parent}</div>
                {r.email ? <div className="text-xs text-ink-500">{r.email}</div> : null}
              </td>
              <td className="px-4 py-2.5 font-semibold">
                {r.kind === 'AIRTIME' ? `${naira(Number(r.amountKobo))} airtime` : `${r.planName} (${naira(Number(r.amountKobo))})`}
                <div className="text-xs font-normal text-ink-500">{r.network}</div>
              </td>
              <td className="whitespace-nowrap px-4 py-2.5 font-mono text-sm">{r.phone}</td>
              <td className="px-4 py-2.5">
                <Badge tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Badge>
                {r.error ? <div className="mt-1 max-w-56 text-xs text-ink-500">{r.error}</div> : null}
                {r.providerRef ? <div className="mt-1 font-mono text-[11px] text-ink-400">{r.providerRef}</div> : null}
              </td>
              <td className="px-4 py-2.5">{r.status === 'CHECK' || r.status === 'PENDING' || r.status === 'SENDING' ? <Resolve id={r.id} /> : null}</td>
            </tr>
          ))}
        </Table>
      ) : (
        <Empty icon={<CircleAlert className="size-8" />} title="No rewards yet" message="When parents collect what their children earned, each send shows here." />
      )}
    </div>
  );
}

function Resolve({ id }: { id: string }) {
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: (outcome: 'SUCCESS' | 'FAILED') => api(`/admin/rewards/${id}/resolve`, { method: 'POST', body: { outcome } }),
    onSuccess: (_, outcome) => {
      toast.success(outcome === 'SUCCESS' ? 'Marked sent. The parent has been told.' : 'Marked failed. The money is back in the parent’s rewards.');
      void qc.invalidateQueries({ queryKey: ['ow', 'rewards'] });
    },
    onError: (e) => toast.error(errorText(e)),
  });
  return (
    <div className="flex gap-2">
      <Button size="sm" variant="secondary" loading={m.isPending && m.variables === 'SUCCESS'} disabled={m.isPending} onClick={() => m.mutate('SUCCESS')}>
        It arrived
      </Button>
      <Button size="sm" variant="ghost" loading={m.isPending && m.variables === 'FAILED'} disabled={m.isPending} onClick={() => m.mutate('FAILED')}>
        Failed, refund
      </Button>
    </div>
  );
}
