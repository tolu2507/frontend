'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ban, Banknote, Download, Plus, ReceiptText, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { Badge, Button, Card, cx, Empty, ErrorBox, Input, Loading, Modal, Notice, PageHeader, Select, Stat, Table } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { api, errorText } from '@/lib/api';
import { downloadCsv } from '@/lib/csv';
import { date, naira, TERM, todayIso } from '@/lib/format';
import { useClasses, useSchoolKey, useYears } from '@/lib/queries';
import type { Invoice, SchoolClass, Year } from '@/lib/types';

type Fees = { termId: string | null; termLabel?: string; totals: { billedKobo: string; paidKobo: string; count: number; paid: number; partPaid: number; unpaid: number } | null; invoices: Invoice[] };
const STATUS = { PAID: { label: 'Paid', tone: 'mint' }, PART_PAID: { label: 'Part paid', tone: 'sun' }, UNPAID: { label: 'Unpaid', tone: 'coral' }, VOID: { label: 'Cancelled', tone: 'ink' } } as const;

export default function FeesPage() {
  const key = useSchoolKey();
  const years = useYears();
  const classes = useClasses();
  const [termId, setTermId] = useState('');
  const [classId, setClassId] = useState('');
  const [status, setStatus] = useState('');
  const fees = useQuery({
    queryKey: [key, 'fees', termId, classId, status],
    queryFn: () => api<Fees>(`/school/fees?${new URLSearchParams({ ...(termId ? { termId } : {}), ...(classId ? { classId } : {}), ...(status ? { status } : {}) })}`),
  });
  const [billing, setBilling] = useState(false);
  const [paying, setPaying] = useState<Invoice | null>(null);
  const qc = useQueryClient();
  const voidIt = useMutation({
    mutationFn: (id: string) => api(`/school/fees/${id}/void`, { body: {} }),
    onSuccess: () => {
      toast.success('Invoice cancelled');
      qc.invalidateQueries({ queryKey: [key] });
    },
    onError: (e) => toast.error(errorText(e)),
  });

  const terms = (years.data ?? []).flatMap((y) => y.terms.map((t) => ({ value: t.id, label: `${y.name} · ${TERM[t.name]}` })));
  const currentTerm = fees.data?.termId ?? '';

  if (years.isPending || classes.isPending) return <Loading />;
  if (!years.data?.length)
    return (
      <>
        <PageHeader title="Fees" />
        <Notice tone="sun" title="Set up your session first" action={<Link href="/dashboard/settings"><Button size="sm">Settings</Button></Link>}>
          Fees are billed per term. Add your session and term dates first.
        </Notice>
      </>
    );

  const t = fees.data?.totals;
  const pct = t && Number(t.billedKobo) ? Math.round((Number(t.paidKobo) / Number(t.billedKobo)) * 100) : 0;

  return (
    <>
      <PageHeader
        title="Fees"
        subtitle={fees.data?.termLabel ? `${fees.data.termLabel[0].toUpperCase()}${fees.data.termLabel.slice(1)}. Parents pay in the app; record cash and transfers here.` : undefined}
        actions={
          <>
            {fees.data?.invoices.length ? (
              <Button
                variant="secondary"
                icon={<Download className="size-4" />}
                onClick={() =>
                  downloadCsv(`Fees ${fees.data.termLabel}.csv`, [
                    ['Student', 'Admission no', 'Class', 'Billed (₦)', 'Paid (₦)', 'Owed (₦)', 'Status', 'Due'],
                    ...fees.data.invoices.map((i) => [i.studentName, i.admissionNo, i.className, Number(i.totalKobo) / 100, Number(i.paidKobo) / 100, (Number(i.totalKobo) - Number(i.paidKobo)) / 100, STATUS[i.status].label, date(i.dueDate)]),
                  ])
                }
              >
                Export
              </Button>
            ) : null}
            <Button icon={<Plus className="size-4" />} onClick={() => setBilling(true)} disabled={!classes.data?.length}>
              Bill a term
            </Button>
          </>
        }
      />

      {t && t.count ? (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <Stat label="Collected" tone="mint" value={naira(t.paidKobo)} hint={`${pct}% of ${naira(t.billedKobo)}`} icon={<Banknote className="size-5" />} />
          <Stat label="Still owed" tone="coral" value={naira(Number(t.billedKobo) - Number(t.paidKobo))} hint={`${t.unpaid} unpaid · ${t.partPaid} part paid`} icon={<ReceiptText className="size-5" />} />
          <Stat label="Fully paid" tone="violet" value={`${t.paid} of ${t.count}`} hint="students" />
        </div>
      ) : null}
      {t && t.count ? (
        <div className="mb-6 h-3 overflow-hidden rounded-full bg-ink-100" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Fees collected">
          <div className="h-full rounded-full bg-mint-600 transition-[width] duration-700" style={{ width: `${pct}%` }} />
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-3">
        <select aria-label="Term" value={termId || currentTerm} onChange={(e) => setTermId(e.target.value)} className="h-11 rounded-xl border-2 border-ink-200 bg-white px-3 font-semibold">
          {terms.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select aria-label="Class" value={classId} onChange={(e) => setClassId(e.target.value)} className="h-11 rounded-xl border-2 border-ink-200 bg-white px-3 font-semibold">
          <option value="">All classes</option>
          {(classes.data ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)} className="h-11 rounded-xl border-2 border-ink-200 bg-white px-3 font-semibold">
          <option value="">Any status</option>
          <option value="UNPAID">Unpaid</option>
          <option value="PART_PAID">Part paid</option>
          <option value="PAID">Paid</option>
        </select>
      </div>

      {fees.isPending ? (
        <Loading />
      ) : fees.error ? (
        <ErrorBox error={fees.error} onRetry={fees.refetch} />
      ) : fees.data.invoices.length === 0 ? (
        <Empty icon={<ReceiptText className="size-7" />} title={classId || status ? 'No bills match' : 'No bills for this term yet'} message="Bill whole classes at once. Parents get a notification and can pay by card or transfer in the app." action={<Button onClick={() => setBilling(true)}>Bill a term</Button>} />
      ) : (
        <Table head={['Student', 'Class', 'Billed', 'Paid', 'Status', '']}>
          {fees.data.invoices.map((i) => {
            const owed = Number(i.totalKobo) - Number(i.paidKobo);
            return (
              <tr key={i.id} className={cx('hover:bg-paper', i.status === 'VOID' && 'opacity-50')}>
                <td className="px-4 py-3">
                  <Link href={`/dashboard/students/${i.studentId}`} className="font-bold hover:text-violet-700">
                    {i.studentName}
                  </Link>
                  {i.admissionNo ? <div className="text-xs text-ink-500">{i.admissionNo}</div> : null}
                </td>
                <td className="px-4 py-3">{i.className}</td>
                <td className="px-4 py-3 font-semibold">{naira(i.totalKobo)}</td>
                <td className="px-4 py-3">
                  <div className="font-semibold">{naira(i.paidKobo)}</div>
                  {owed > 0 && i.status !== 'VOID' ? <div className="text-xs text-coral-700">{naira(owed)} owed</div> : null}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={STATUS[i.status].tone}>{STATUS[i.status].label}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    {i.status === 'UNPAID' || i.status === 'PART_PAID' ? (
                      <Button size="sm" variant="secondary" onClick={() => setPaying(i)}>
                        Record payment
                      </Button>
                    ) : null}
                    {i.status === 'UNPAID' ? (
                      <button type="button" title="Cancel bill" aria-label={`Cancel bill for ${i.studentName}`} onClick={() => confirm(`Cancel ${i.studentName}’s bill?`) && voidIt.mutate(i.id)} className="grid size-9 place-items-center rounded-lg text-ink-300 hover:bg-coral-50 hover:text-coral-700">
                        <Ban className="size-4" />
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </Table>
      )}

      {billing && classes.data ? <BillForm years={years.data} classes={classes.data} defaultTerm={termId || currentTerm} onClose={() => setBilling(false)} /> : null}
      {paying ? <PaymentForm invoice={paying} onClose={() => setPaying(null)} /> : null}
    </>
  );
}

const billSchema = z.object({
  termId: z.string().min(1, 'Choose a term.'),
  classIds: z.array(z.string()).min(1, 'Choose at least one class.'),
  items: z.array(z.object({ label: z.string().trim().min(2, 'Name it.'), amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Enter an amount in naira.') })).min(1),
  dueDate: z.string().min(1, 'Pick a date.'),
});

function BillForm({ years, classes, defaultTerm, onClose }: { years: Year[]; classes: SchoolClass[]; defaultTerm: string; onClose: () => void }) {
  const qc = useQueryClient();
  const key = useSchoolKey();
  const { register, handleSubmit, formState, control, setValue } = useForm({
    resolver: zodResolver(billSchema),
    defaultValues: { termId: defaultTerm, classIds: [] as string[], items: [{ label: 'Tuition', amount: '' }], dueDate: todayIso() },
  });
  const items = useFieldArray({ control, name: 'items' });
  const watched = useWatch({ control, name: 'items' });
  const picked = useWatch({ control, name: 'classIds' });
  const total = watched.reduce((n, i) => n + (Number(i.amount) || 0), 0);
  const studentCount = classes.filter((c) => picked.includes(c.id)).reduce((n, c) => n + c.studentCount, 0);

  const bill = useMutation({
    mutationFn: (v: z.infer<typeof billSchema>) => api<{ created: number; skipped: number }>('/school/fees', { body: { ...v, items: v.items.map((i) => ({ label: i.label, amountKobo: Math.round(Number(i.amount) * 100) })) } }),
    onSuccess: (r) => {
      toast.success(`${r.created} bills sent${r.skipped ? ` (${r.skipped} already had one)` : ''}. Parents have been notified.`);
      qc.invalidateQueries({ queryKey: [key] });
      onClose();
    },
    onError: (e) => toast.error(errorText(e)),
  });
  const submit = handleSubmit((v) => bill.mutate(v));

  return (
    <Modal
      open
      onClose={onClose}
      title="Bill a term"
      wide
      footer={
        <>
          <span className="mr-auto self-center text-sm text-ink-500">
            {studentCount} students × {naira(total * 100)}
          </span>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={bill.isPending} onClick={submit}>
            Send bills
          </Button>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Term" options={years.flatMap((y) => y.terms.map((t) => ({ value: t.id, label: `${y.name} · ${TERM[t.name]}` })))} error={formState.errors.termId?.message} {...register('termId')} />
          <Input label="Due date" type="date" error={formState.errors.dueDate?.message} {...register('dueDate')} />
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-bold">Classes</legend>
          <div className="flex flex-wrap gap-2">
            {classes.map((c) => {
              const on = picked.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setValue('classIds', on ? picked.filter((x) => x !== c.id) : [...picked, c.id], { shouldValidate: formState.isSubmitted })}
                  className={cx('rounded-full border-2 px-3 py-1.5 text-sm font-bold transition', on ? 'border-violet-500 bg-violet-500 text-white' : 'border-ink-200 hover:border-violet-200')}
                >
                  {c.name}
                </button>
              );
            })}
            <button type="button" onClick={() => setValue('classIds', classes.map((c) => c.id))} className="rounded-full px-3 py-1.5 text-sm font-bold text-violet-700 hover:bg-violet-50">
              Select all
            </button>
          </div>
          {formState.errors.classIds ? <p className="mt-1 text-[13px] font-semibold text-coral-700">{formState.errors.classIds.message}</p> : null}
        </fieldset>
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-sm font-bold">What’s on the bill</legend>
          {items.fields.map((f, i) => (
            <div key={f.id} className="flex items-start gap-2">
              <Input label="Item" wrapperClassName="flex-1" placeholder="e.g. Books" error={formState.errors.items?.[i]?.label?.message} {...register(`items.${i}.label`)} />
              <Input label="Amount (₦)" inputMode="decimal" wrapperClassName="w-40" placeholder="150000" error={formState.errors.items?.[i]?.amount?.message} {...register(`items.${i}.amount`)} />
              {items.fields.length > 1 ? (
                <button type="button" onClick={() => items.remove(i)} className="mt-7 grid size-11 place-items-center rounded-xl text-ink-300 hover:bg-coral-50 hover:text-coral-700" aria-label="Remove item">
                  <Trash2 className="size-4" />
                </button>
              ) : null}
            </div>
          ))}
          <Button type="button" size="sm" variant="secondary" className="self-start" icon={<Plus className="size-4" />} onClick={() => items.append({ label: '', amount: '' })}>
            Add item
          </Button>
        </fieldset>
        <Card className="bg-paper">
          <div className="flex items-center justify-between">
            <span className="font-bold">Total per student</span>
            <span className="font-display text-2xl font-extrabold">{naira(total * 100)}</span>
          </div>
        </Card>
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}

function PaymentForm({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const qc = useQueryClient();
  const key = useSchoolKey();
  const owedNaira = (Number(invoice.totalKobo) - Number(invoice.paidKobo)) / 100;
  const schema = z.object({
    amount: z
      .string()
      .regex(/^\d+(\.\d{1,2})?$/, 'Enter an amount in naira.')
      .refine((v) => Number(v) >= 1 && Number(v) <= owedNaira, `Between ₦1 and ${naira(owedNaira * 100)}.`),
    method: z.enum(['CASH', 'TRANSFER', 'POS']),
    reference: z.string().trim().max(100),
  });
  const { register, handleSubmit, formState } = useForm({ resolver: zodResolver(schema), defaultValues: { amount: String(owedNaira), method: 'CASH' as const, reference: '' } });
  const pay = useMutation({
    mutationFn: (v: z.infer<typeof schema>) => api(`/school/fees/${invoice.id}/payments`, { body: { amountKobo: Math.round(Number(v.amount) * 100), method: v.method, reference: v.reference || undefined } }),
    onSuccess: () => {
      toast.success('Payment recorded');
      qc.invalidateQueries({ queryKey: [key] });
      onClose();
    },
    onError: (e) => toast.error(errorText(e)),
  });
  const submit = handleSubmit((v) => pay.mutate(v));
  return (
    <Modal
      open
      onClose={onClose}
      title={`Payment from ${invoice.studentName}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="success" loading={pay.isPending} onClick={submit}>
            Record payment
          </Button>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <p className="text-[15px] text-ink-500">For money paid straight to the school. Payments made in the Nexus app are recorded automatically.</p>
        <Input label="Amount (₦)" inputMode="decimal" hint={`${naira(owedNaira * 100)} still owed`} error={formState.errors.amount?.message} {...register('amount')} />
        <Select
          label="Paid by"
          options={[
            { value: 'CASH', label: 'Cash' },
            { value: 'TRANSFER', label: 'Bank transfer to the school' },
            { value: 'POS', label: 'POS' },
          ]}
          {...register('method')}
        />
        <Input label="Reference (optional)" placeholder="Teller or transfer reference" {...register('reference')} />
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
