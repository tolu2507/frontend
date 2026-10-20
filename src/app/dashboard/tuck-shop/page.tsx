'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Receipt, ShoppingBasket, Undo2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Badge, Button, Card, Empty, ErrorBox, Input, Loading, Notice, PageHeader, Stat, Table } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { api, errorText } from '@/lib/api';
import { downloadCsv } from '@/lib/csv';
import { naira, todayIso } from '@/lib/format';
import { useOverview, useSchoolKey } from '@/lib/queries';

type Sale = { id: string; studentName: string; amountKobo: string; note: string | null; createdAt: string; refunded: boolean; soldBy: string | null };
type Sales = { totalKobo: string; count: number; items: Sale[] };

const time = (iso: string) => new Date(iso).toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit', timeZone: 'Africa/Lagos' });

/** A day at the tuck shop: what was sold, by whom, to which child. Sales happen on the counter staff's phones. */
export default function TuckShopPage() {
  const key = useSchoolKey();
  const [day, setDay] = useState(todayIso());
  const sales = useQuery({ queryKey: [key, 'tuck-shop', day], queryFn: () => api<Sales>(`/tuckshop/sales?date=${day}`) });

  const exportCsv = () =>
    sales.data &&
    downloadCsv(`tuck-shop-${day}.csv`, [
      ['Time', 'Child', 'Item', 'Amount (₦)', 'Sold by', 'Undone'],
      ...sales.data.items.map((s) => [time(s.createdAt), s.studentName, s.note ?? '', Number(s.amountKobo) / 100, s.soldBy ?? '', s.refunded ? 'Yes' : '']),
    ]);

  return (
    <>
      <PageHeader
        title="Tuck shop"
        subtitle="Children pay from their wallet: your staff type the child’s tuck shop ID, or the child pays from their own phone. No cash, no cards."
        actions={
          <Button variant="secondary" icon={<Download className="size-4" />} disabled={!sales.data?.items.length} onClick={exportCsv}>
            Export CSV
          </Button>
        }
      />
      <PinSetting />
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Input label="Day" type="date" max={todayIso()} value={day} onChange={(e) => setDay(e.target.value || todayIso())} wrapperClassName="w-48" />
      </div>

      {sales.isPending ? (
        <Loading />
      ) : sales.error ? (
        <ErrorBox error={sales.error} onRetry={sales.refetch} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Stat label="Sales" value={naira(sales.data.totalKobo)} hint="Money moved from children’s wallets to your school" icon={<ShoppingBasket className="size-5" />} tone="mint" />
            <Stat label="Purchases" value={sales.data.count} hint={day === todayIso() ? 'So far today' : 'That day'} icon={<Receipt className="size-5" />} tone="violet" />
          </div>
          {sales.data.items.length === 0 ? (
            <div className="mt-4">
              <Empty
                icon={<ShoppingBasket className="size-7" />}
                title="No sales this day"
                message={
                  <>
                    Add your tuck-shop staff on the <Link href="/dashboard/staff" className="font-bold text-violet-600 underline">Staff</Link> page. They sign in on the BrainBox phone app and type each child’s tuck shop ID (it’s on the login slip and the student’s page).
                  </>
                }
              />
            </div>
          ) : (
            <div className="mt-4">
              <Table head={['Time', 'Child', 'Item', 'Amount', 'Sold by']}>
                {sales.data.items.map((s) => (
                  <tr key={s.id} className="hover:bg-paper">
                    <td className="px-4 py-3 text-ink-500">{time(s.createdAt)}</td>
                    <td className="px-4 py-3 font-bold">{s.studentName}</td>
                    <td className="px-4 py-3 text-ink-500">{s.note ?? '—'}</td>
                    <td className="px-4 py-3 font-bold">
                      <span className={s.refunded ? 'text-ink-300 line-through' : ''}>{naira(s.amountKobo)}</span>
                      {s.refunded ? (
                        <span className="ml-2">
                          <Badge tone="ink">
                            <Undo2 className="size-3" /> Undone
                          </Badge>
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-ink-500">{s.soldBy ?? '—'}</td>
                  </tr>
                ))}
              </Table>
            </div>
          )}
          <div className="mt-4">
            <Notice tone="sky">Tuck-shop sales go into your school’s BrainBox balance, alongside the fees parents pay in the app.</Notice>
          </div>
        </>
      )}
    </>
  );
}

/** Off by default: the ID alone is enough, with the parent's daily limit as the safety net. */
function PinSetting() {
  const overview = useOverview();
  const qc = useQueryClient();
  const key = useSchoolKey();
  const save = useMutation({
    mutationFn: (on: boolean) => api('/school', { method: 'PATCH', body: { tuckShopRequirePin: on } }),
    onSuccess: (_, on) => {
      toast.success(on ? 'Children will type their PIN at the counter' : 'The tuck shop ID is enough now');
      qc.invalidateQueries({ queryKey: [key, 'overview'] });
    },
    onError: (e) => toast.error(errorText(e)),
  });
  if (!overview.data) return null;
  const on = overview.data.school.tuckShopRequirePin;
  return (
    <Card className="mb-4">
      <label className="flex cursor-pointer items-start gap-3">
        <input type="checkbox" className="mt-1 size-5 accent-violet-500" checked={on} disabled={save.isPending} onChange={(e) => save.mutate(e.target.checked)} />
        <span>
          <span className="block font-bold">Also ask for the child’s PIN at the counter</span>
          <span className="block text-sm text-ink-500">Off: staff type the tuck shop ID and charge. On: the child also types their 4-digit PIN on the staff phone. Either way, parents set a daily spending limit (₦1,500 unless they change it) and get a notification for every purchase.</span>
        </span>
      </label>
    </Card>
  );
}
