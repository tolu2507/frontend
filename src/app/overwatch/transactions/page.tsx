'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ArrowLeftRight, CreditCard } from 'lucide-react';
import { useState } from 'react';

import { ChartCard, ColumnChart, dayLabel, nairaCompact, TrendChart } from '@/components/overwatch/charts';
import { dateTime, ExportButton, Filters, FilterSelect, label, Pager, qs, RangeTabs, SchoolFilter, SearchBox, type Paged } from '@/components/overwatch/kit';
import { Badge, cx, Empty, ErrorBox, Loading, PageHeader, Table, Tabs, type Tone } from '@/components/ui';
import { api } from '@/lib/api';
import { naira } from '@/lib/format';

type Flow = { day: string; creditsKobo: number; debitsKobo: number; entries: number; paidKobo: number; failedPayments: number; pendingPayments: number }[];
type Entry = { id: string; at: string; type: string; stream: string; amountKobo: number; balanceAfterKobo: number; description: string | null; wallet: { id: string; type: string; owner: string }; school: string | null; actor: string | null; reference: string | null };
type Ledger = Paged<Entry> & { byType: { type: string; count: number; amountKobo: number }[] };
type Payment = { id: string; reference: string; provider: string; providerRef: string | null; purpose: string; status: string; amountKobo: number; payer: string; payerContact: string | null; school: string | null; createdAt: string; paidAt: string | null };
type Payments = Paged<Payment> & { byStatus: { status: string; count: number; amountKobo: number }[] };

const ENTRY_TYPES = ['TOPUP', 'PURCHASE', 'FEE_PAYMENT', 'ESCROW_HOLD', 'ESCROW_RELEASE', 'PLATFORM_FEE', 'PAYOUT', 'REFUND', 'ADJUSTMENT'];
const STREAMS = ['SCHOOL_FEES', 'TUCK_SHOP', 'SUBSCRIPTION', 'OTHER'];
const STATUS_TONE: Record<string, Tone> = { SUCCESS: 'mint', PENDING: 'sun', FAILED: 'coral', REFUNDED: 'sky' };
const PAGE = 50;

export default function TransactionsPage() {
  const [tab, setTab] = useState<'ledger' | 'payments'>('ledger');
  const [days, setDays] = useState(30);
  const flow = useQuery({ queryKey: ['ow', 'flow', days], queryFn: () => api<Flow>(`/admin/transactions/flow?days=${days}`) });
  const totals = flow.data?.reduce((a, d) => ({ paid: a.paid + d.paidKobo, failed: a.failed + d.failedPayments, pending: a.pending + d.pendingPayments, entries: a.entries + d.entries }), { paid: 0, failed: 0, pending: 0, entries: 0 });

  return (
    <>
      <PageHeader title="Transactions" subtitle="Every naira that moved on Nexus, and every payment attempt." actions={<RangeTabs value={days} onChange={setDays} />} />

      {flow.isPending ? (
        <Loading rows={3} />
      ) : flow.error ? (
        <ErrorBox error={flow.error} onRetry={flow.refetch} />
      ) : (
        <div className="mb-6 grid gap-4 xl:grid-cols-2">
          <ChartCard title="Money in and out of wallets" subtitle={`${totals!.entries.toLocaleString()} ledger entries in ${days} days`}>
            <ColumnChart data={flow.data} x="day" xFormat={dayLabel} series={[{ key: 'creditsKobo', label: 'Credited' }, { key: 'debitsKobo', label: 'Debited', color: '#e2552f' }]} format={nairaCompact} />
          </ChartCard>
          <ChartCard
            title="Payments collected"
            subtitle={
              <>
                {naira(totals!.paid)} collected
                {totals!.failed ? <span className="font-bold text-coral-700"> · {totals!.failed} failed</span> : null}
                {totals!.pending ? <span> · {totals!.pending} still pending</span> : null}
              </>
            }
          >
            <TrendChart data={flow.data} series={[{ key: 'paidKobo', label: 'Collected', color: '#0e8f7a' }]} format={nairaCompact} empty="No payments in this period" />
          </ChartCard>
        </div>
      )}

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'ledger', label: 'Wallet ledger', icon: <ArrowLeftRight className="size-4" /> },
          { value: 'payments', label: 'Card & bank payments', icon: <CreditCard className="size-4" /> },
        ]}
      />
      {tab === 'ledger' ? <LedgerTab /> : <PaymentsTab />}
    </>
  );
}

function LedgerTab() {
  const [f, setF] = useState({ q: '', type: '', stream: '', schoolId: '', from: '', to: '' });
  const [page, setPage] = useState(1);
  const set = (k: keyof typeof f) => (v: string) => (setF((x) => ({ ...x, [k]: v })), setPage(1));
  const list = useQuery({ queryKey: ['ow', 'ledger', f, page], queryFn: () => api<Ledger>(`/admin/transactions?${qs({ ...f, page, pageSize: PAGE })}`), placeholderData: keepPreviousData });
  return (
    <>
      <Filters>
        <SearchBox value={f.q} onChange={set('q')} placeholder="Owner, description or reference" />
        <FilterSelect label="Type" value={f.type} onChange={set('type')} options={[{ value: '', label: 'All types' }, ...ENTRY_TYPES.map((t) => ({ value: t, label: label(t) }))]} />
        <FilterSelect label="Stream" value={f.stream} onChange={set('stream')} options={[{ value: '', label: 'All streams' }, ...STREAMS.map((t) => ({ value: t, label: label(t) }))]} />
        <SchoolFilter value={f.schoolId} onChange={set('schoolId')} />
        <DateInput label="From" value={f.from} onChange={set('from')} />
        <DateInput label="To" value={f.to} onChange={set('to')} />
        <div className="ml-auto">
          <ExportButton<Entry>
            filename="nexus-ledger.csv"
            fetchPage={(p, size) => api<Ledger>(`/admin/transactions?${qs({ ...f, page: p, pageSize: size })}`)}
            columns={[['Time', (r) => dateTime(r.at)], ['Type', (r) => label(r.type)], ['Stream', (r) => label(r.stream)], ['Wallet', (r) => `${r.wallet.owner} (${label(r.wallet.type)})`], ['School', (r) => r.school], ['Amount (₦)', (r) => r.amountKobo / 100], ['Balance after (₦)', (r) => r.balanceAfterKobo / 100], ['Description', (r) => r.description], ['By', (r) => r.actor], ['Reference', (r) => r.reference]]}
          />
        </div>
      </Filters>
      {list.isPending ? (
        <Loading />
      ) : list.error ? (
        <ErrorBox error={list.error} onRetry={list.refetch} />
      ) : list.data.rows.length === 0 ? (
        <Empty icon={<ArrowLeftRight className="size-7" />} title="No transactions" message="Top-ups, tuck-shop purchases, fee payments and subscriptions will appear here." />
      ) : (
        <div className={list.isPlaceholderData ? 'opacity-60 transition' : 'transition'}>
          <div className="mb-3 flex flex-wrap gap-2">
            {list.data.byType.map((t) => (
              <Badge key={t.type} tone="ink">
                {label(t.type)} · {t.count} · {naira(t.amountKobo)}
              </Badge>
            ))}
          </div>
          <Table head={['When', 'What', 'Wallet', 'School', 'Amount', 'Balance after', 'By / ref']}>
            {list.data.rows.map((e) => (
              <tr key={e.id} className="hover:bg-paper">
                <td className="px-4 py-2.5 whitespace-nowrap text-ink-500">{dateTime(e.at)}</td>
                <td className="px-4 py-2.5">
                  <div className="font-semibold">{label(e.type)}</div>
                  <div className="text-xs text-ink-500">{e.description ?? label(e.stream)}</div>
                </td>
                <td className="px-4 py-2.5">
                  <div className="font-semibold">{e.wallet.owner}</div>
                  <div className="text-xs text-ink-500">{label(e.wallet.type)}</div>
                </td>
                <td className="px-4 py-2.5 text-ink-700">{e.school ?? '—'}</td>
                <td className={cx('px-4 py-2.5 font-display font-bold whitespace-nowrap', e.amountKobo < 0 ? 'text-coral-700' : 'text-mint-800')}>
                  {e.amountKobo > 0 ? '+' : '−'}
                  {naira(Math.abs(e.amountKobo))}
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap">{naira(e.balanceAfterKobo)}</td>
                <td className="px-4 py-2.5 text-xs text-ink-500">
                  {e.actor ?? ''}
                  {e.reference ? <div className="font-mono">{e.reference}</div> : null}
                </td>
              </tr>
            ))}
          </Table>
          <Pager page={page} pageSize={PAGE} total={list.data.total} onPage={setPage} />
        </div>
      )}
    </>
  );
}

function PaymentsTab() {
  const [f, setF] = useState({ q: '', status: '', purpose: '', schoolId: '' });
  const [page, setPage] = useState(1);
  const set = (k: keyof typeof f) => (v: string) => (setF((x) => ({ ...x, [k]: v })), setPage(1));
  const list = useQuery({ queryKey: ['ow', 'payments', f, page], queryFn: () => api<Payments>(`/admin/payments?${qs({ ...f, page, pageSize: PAGE })}`), placeholderData: keepPreviousData });
  return (
    <>
      <Filters>
        <SearchBox value={f.q} onChange={set('q')} placeholder="Payer or reference" />
        <FilterSelect label="Status" value={f.status} onChange={set('status')} options={[{ value: '', label: 'All statuses' }, ...['SUCCESS', 'PENDING', 'FAILED', 'REFUNDED'].map((s) => ({ value: s, label: s.charAt(0) + s.slice(1).toLowerCase() }))]} />
        <FilterSelect label="Purpose" value={f.purpose} onChange={set('purpose')} options={[{ value: '', label: 'All purposes' }, ...['WALLET_TOPUP', 'SCHOOL_FEE', 'TUTOR_SESSION', 'SUBSCRIPTION'].map((s) => ({ value: s, label: label(s) }))]} />
        <SchoolFilter value={f.schoolId} onChange={set('schoolId')} />
        <div className="ml-auto">
          <ExportButton<Payment>
            filename="nexus-payments.csv"
            fetchPage={(p, size) => api<Payments>(`/admin/payments?${qs({ ...f, page: p, pageSize: size })}`)}
            columns={[['Created', (r) => dateTime(r.createdAt)], ['Paid', (r) => (r.paidAt ? dateTime(r.paidAt) : '')], ['Reference', (r) => r.reference], ['Provider ref', (r) => r.providerRef], ['Purpose', (r) => label(r.purpose)], ['Status', (r) => r.status], ['Amount (₦)', (r) => r.amountKobo / 100], ['Payer', (r) => r.payer], ['Contact', (r) => r.payerContact], ['School', (r) => r.school]]}
          />
        </div>
      </Filters>
      {list.isPending ? (
        <Loading />
      ) : list.error ? (
        <ErrorBox error={list.error} onRetry={list.refetch} />
      ) : list.data.rows.length === 0 ? (
        <Empty icon={<CreditCard className="size-7" />} title="No payments" message="Payments parents make through Squad appear here, including failed and abandoned ones." />
      ) : (
        <div className={list.isPlaceholderData ? 'opacity-60 transition' : 'transition'}>
          <div className="mb-3 flex flex-wrap gap-2">
            {list.data.byStatus.map((s) => (
              <Badge key={s.status} tone={STATUS_TONE[s.status] ?? 'ink'}>
                {s.status.toLowerCase()} · {s.count} · {naira(s.amountKobo)}
              </Badge>
            ))}
          </div>
          <Table head={['Created', 'Payer', 'Purpose', 'School', 'Amount', 'Status', 'Reference']}>
            {list.data.rows.map((p) => (
              <tr key={p.id} className="hover:bg-paper">
                <td className="px-4 py-2.5 whitespace-nowrap text-ink-500">{dateTime(p.createdAt)}</td>
                <td className="px-4 py-2.5">
                  <div className="font-semibold">{p.payer}</div>
                  <div className="text-xs text-ink-500">{p.payerContact ?? ''}</div>
                </td>
                <td className="px-4 py-2.5">{label(p.purpose)}</td>
                <td className="px-4 py-2.5 text-ink-700">{p.school ?? '—'}</td>
                <td className="px-4 py-2.5 font-display font-bold whitespace-nowrap">{naira(p.amountKobo)}</td>
                <td className="px-4 py-2.5">
                  <Badge tone={STATUS_TONE[p.status] ?? 'ink'}>{p.status.toLowerCase()}</Badge>
                  {p.paidAt ? <div className="mt-1 text-xs text-ink-500">paid {dateTime(p.paidAt)}</div> : null}
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-ink-500">{p.reference}</td>
              </tr>
            ))}
          </Table>
          <Pager page={page} pageSize={PAGE} total={list.data.total} onPage={setPage} />
        </div>
      )}
    </>
  );
}

function DateInput({ label: l, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex h-11 items-center gap-2 rounded-xl border-2 border-ink-200 bg-white px-3 text-sm font-bold text-ink-500 focus-within:border-violet-500">
      {l}
      <input type="date" value={value} onChange={(e) => onChange(e.target.value)} className="bg-transparent font-semibold text-ink outline-none" />
    </label>
  );
}
