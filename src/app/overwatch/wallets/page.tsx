'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Lock, LockOpen, Wallet } from 'lucide-react';
import { useState } from 'react';

import { ago, dateTime, ExportButton, Filters, FilterSelect, label, Pager, qs, SearchBox, type Paged } from '@/components/overwatch/kit';
import { Badge, Button, Card, cx, Empty, ErrorBox, Loading, Modal, Notice, PageHeader, Table, Textarea } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { api, errorText } from '@/lib/api';
import { naira } from '@/lib/format';

type Row = { id: string; type: string; owner: string; contact: string | null; school: string | null; balanceKobo: number; isFrozen: boolean; canFreeze: boolean; entries: number; updatedAt: string };
type List = Paged<Row> & { totals: { type: string; wallets: number; balanceKobo: number }[] };
type Detail = {
  id: string;
  type: string;
  owner: string;
  contact: string | null;
  balanceKobo: number;
  isFrozen: boolean;
  canFreeze: boolean;
  createdAt: string;
  byType: { type: string; count: number; amountKobo: number }[];
  entries: { id: string; at: string; type: string; stream: string; amountKobo: number; balanceAfterKobo: number; description: string | null; actor: string | null; reference: string | null }[];
};

// Tutoring is paused, so its wallet types (TUTOR_EARNINGS, ESCROW) aren't shown.
const TYPES = ['STUDENT_SPEND', 'SCHOOL_REVENUE', 'PLATFORM_REVENUE'];
const PAGE = 25;

export default function WalletsPage() {
  const [type, setType] = useState('');
  const [frozen, setFrozen] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<string | null>(null);
  const [freezing, setFreezing] = useState<Row | null>(null);
  const filter = { type, frozen, q };
  const list = useQuery({ queryKey: ['ow', 'wallets', filter, page], queryFn: () => api<List>(`/admin/wallets?${qs({ ...filter, page, pageSize: PAGE })}`), placeholderData: keepPreviousData });

  return (
    <>
      <PageHeader title="Wallets" subtitle="Every balance BrainBox holds: children’s pocket money, school revenue and BrainBox’s own revenue." />

      {list.data ? (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {TYPES.map((t) => {
            const x = list.data.totals.find((r) => r.type === t);
            return (
              <button key={t} type="button" onClick={() => (setType(type === t ? '' : t), setPage(1))} className="text-left">
                <Card className={cx('flex flex-col gap-1 transition hover:-translate-y-0.5', type === t && 'border-violet-500 ring-4 ring-violet-100')}>
                  <span className="text-sm font-bold text-ink-500">{label(t)}</span>
                  <span className="font-display text-2xl font-extrabold">{naira(x?.balanceKobo ?? 0)}</span>
                  <span className="text-xs text-ink-500">{(x?.wallets ?? 0).toLocaleString()} wallets</span>
                </Card>
              </button>
            );
          })}
        </div>
      ) : null}

      <Filters>
        <SearchBox value={q} onChange={(v) => (setQ(v), setPage(1))} placeholder="Owner name, email or school" />
        <FilterSelect label="Type" value={type} onChange={(v) => (setType(v), setPage(1))} options={[{ value: '', label: 'All wallet types' }, ...TYPES.map((t) => ({ value: t, label: label(t) }))]} />
        <FilterSelect label="State" value={frozen} onChange={(v) => (setFrozen(v), setPage(1))} options={[{ value: '', label: 'Active & frozen' }, { value: 'true', label: 'Frozen only' }, { value: 'false', label: 'Active only' }]} />
        <div className="ml-auto">
          <ExportButton<Row>
            filename="nexus-wallets.csv"
            fetchPage={(p, size) => api<List>(`/admin/wallets?${qs({ ...filter, page: p, pageSize: size })}`)}
            columns={[['Owner', (r) => r.owner], ['Contact', (r) => r.contact], ['Type', (r) => label(r.type)], ['School', (r) => r.school], ['Balance (₦)', (r) => r.balanceKobo / 100], ['Frozen', (r) => (r.isFrozen ? 'yes' : 'no')], ['Transactions', (r) => r.entries]]}
          />
        </div>
      </Filters>

      {list.isPending ? (
        <Loading />
      ) : list.error ? (
        <ErrorBox error={list.error} onRetry={list.refetch} />
      ) : list.data.rows.length === 0 ? (
        <Empty icon={<Wallet className="size-7" />} title="No wallets found" message="A wallet is created the first time money moves for someone." />
      ) : (
        <div className={list.isPlaceholderData ? 'opacity-60 transition' : 'transition'}>
          <Table head={['Owner', 'Type', 'School', 'Balance', 'Transactions', 'Last movement', '']}>
            {list.data.rows.map((w) => (
              <tr key={w.id} className="hover:bg-paper">
                <td className="px-4 py-3">
                  <button type="button" onClick={() => setOpen(w.id)} className="text-left font-bold hover:text-violet-700">
                    {w.owner}
                  </button>
                  <div className="text-xs text-ink-500">{w.contact ?? ''}</div>
                </td>
                <td className="px-4 py-3">{label(w.type)}</td>
                <td className="px-4 py-3 text-ink-700">{w.school ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className="font-display font-bold">{naira(w.balanceKobo)}</span> {w.isFrozen ? <Badge tone="coral">frozen</Badge> : null}
                </td>
                <td className="px-4 py-3">{w.entries}</td>
                <td className="px-4 py-3 text-ink-500">{ago(w.updatedAt)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setOpen(w.id)}>
                      History
                    </Button>
                    {w.canFreeze ? (
                      <Button size="sm" variant={w.isFrozen ? 'success' : 'danger'} icon={w.isFrozen ? <LockOpen className="size-4" /> : <Lock className="size-4" />} onClick={() => setFreezing(w)}>
                        {w.isFrozen ? 'Unfreeze' : 'Freeze'}
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </Table>
          <Pager page={page} pageSize={PAGE} total={list.data.total} onPage={setPage} />
        </div>
      )}

      {open ? <WalletHistory id={open} onClose={() => setOpen(null)} /> : null}
      {freezing ? <FreezeDialog wallet={freezing} onClose={() => setFreezing(null)} /> : null}
    </>
  );
}

function FreezeDialog({ wallet, onClose }: { wallet: Row; onClose: () => void }) {
  const qc = useQueryClient();
  const [reason, setReason] = useState('');
  const freeze = !wallet.isFrozen;
  const m = useMutation({
    mutationFn: () => api(`/admin/wallets/${wallet.id}`, { method: 'PATCH', body: { frozen: freeze, reason: reason || undefined } }),
    onSuccess: () => {
      toast.success(freeze ? `${wallet.owner}’s wallet is frozen.` : `${wallet.owner}’s wallet is active again.`);
      qc.invalidateQueries({ queryKey: ['ow'] });
      onClose();
    },
    onError: (e) => toast.error(errorText(e)),
  });
  return (
    <Modal
      open
      onClose={onClose}
      title={freeze ? 'Freeze wallet' : 'Unfreeze wallet'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant={freeze ? 'danger' : 'success'} loading={m.isPending} onClick={() => m.mutate()}>
            {freeze ? 'Freeze' : 'Unfreeze'}
          </Button>
        </>
      }
    >
      <p className="mb-4 text-[15px] text-ink-700">
        {freeze ? (
          <>
            <b>{wallet.owner}</b>’s {label(wallet.type).toLowerCase()} wallet ({naira(wallet.balanceKobo)}) will stop paying out: no tuck-shop purchases or withdrawals until you unfreeze it. Money can still come in.
          </>
        ) : (
          <>
            <b>{wallet.owner}</b> will be able to spend from this wallet again.
          </>
        )}
      </p>
      <Textarea label="Reason (kept in the activity log)" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} placeholder={freeze ? 'e.g. Parent reported a lost card' : ''} />
    </Modal>
  );
}

function WalletHistory({ id, onClose }: { id: string; onClose: () => void }) {
  const q = useQuery({ queryKey: ['ow', 'wallet', id], queryFn: () => api<Detail>(`/admin/wallets/${id}`) });
  return (
    <Modal open wide onClose={onClose} title={q.data ? `${q.data.owner} · ${label(q.data.type)}` : 'Wallet'}>
      {q.isPending ? (
        <Loading />
      ) : q.error ? (
        <ErrorBox error={q.error} onRetry={q.refetch} />
      ) : (
        <div className="flex flex-col gap-4">
          {q.data.isFrozen ? <Notice tone="coral" title="Frozen">Nothing can be spent from this wallet.</Notice> : null}
          <div className="flex flex-wrap gap-6">
            <div>
              <div className="text-sm font-bold text-ink-500">Balance</div>
              <div className="font-display text-3xl font-extrabold">{naira(q.data.balanceKobo)}</div>
            </div>
            {q.data.byType.map((t) => (
              <div key={t.type}>
                <div className="text-sm font-bold text-ink-500">{label(t.type)}</div>
                <div className="font-display text-lg font-bold">{naira(t.amountKobo)}</div>
                <div className="text-xs text-ink-500">{t.count}×</div>
              </div>
            ))}
          </div>
          {q.data.entries.length === 0 ? (
            <p className="text-ink-500">No money has moved through this wallet yet.</p>
          ) : (
            <Table head={['When', 'What', 'Amount', 'Balance after', 'By']} className="shadow-none">
              {q.data.entries.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-2 whitespace-nowrap text-ink-500">{dateTime(e.at)}</td>
                  <td className="px-4 py-2">
                    <div className="font-semibold">{label(e.type)}</div>
                    <div className="text-xs text-ink-500">{e.description ?? label(e.stream)}</div>
                  </td>
                  <td className={cx('px-4 py-2 font-display font-bold whitespace-nowrap', e.amountKobo < 0 ? 'text-coral-700' : 'text-mint-800')}>
                    {e.amountKobo > 0 ? '+' : '−'}
                    {naira(Math.abs(e.amountKobo))}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">{naira(e.balanceAfterKobo)}</td>
                  <td className="px-4 py-2 text-ink-500">{e.actor ?? e.reference ?? '—'}</td>
                </tr>
              ))}
            </Table>
          )}
        </div>
      )}
    </Modal>
  );
}
