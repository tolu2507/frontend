'use client';

import { useQuery } from '@tanstack/react-query';
import { Download, Receipt, ShoppingBasket, Undo2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Badge, Button, Empty, ErrorBox, Input, Loading, Notice, PageHeader, Stat, Table } from '@/components/ui';
import { api } from '@/lib/api';
import { downloadCsv } from '@/lib/csv';
import { naira, todayIso } from '@/lib/format';
import { useSchoolKey } from '@/lib/queries';

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
        subtitle="Children pay from their wallet with their PIN on your counter staff’s phone. No cash, no cards."
        actions={
          <Button variant="secondary" icon={<Download className="size-4" />} disabled={!sales.data?.items.length} onClick={exportCsv}>
            Export CSV
          </Button>
        }
      />
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
                    Add your tuck-shop staff on the <Link href="/dashboard/staff" className="font-bold text-violet-600 underline">Staff</Link> page. They sign in on the Nexus phone app, pick a child, and the child types their PIN to pay.
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
            <Notice tone="sky">Tuck-shop sales go into your school’s Nexus balance, alongside the fees parents pay in the app.</Notice>
          </div>
        </>
      )}
    </>
  );
}
