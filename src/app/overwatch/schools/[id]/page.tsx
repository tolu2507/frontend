'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Activity, ArrowLeft, Bot, Calculator, FileSignature, Lock } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Badge, Button, Card, cx, ErrorBox, Input, Loading, Modal, Notice, PageHeader, Stat } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { api, errorText } from '@/lib/api';
import { date, naira } from '@/lib/format';

type Detail = {
  id: string;
  name: string;
  status: string;
  address: string | null;
  state: string | null;
  email: string | null;
  phone: string | null;
  createdAt: string;
  students: number;
  classes: number;
  owedToSchoolKobo: string;
  admins: { role: string; firstName: string; lastName: string; email: string | null; phone: string | null }[];
  agreements: { id: string; planName: string; revenueShareBp: number; sharedStreams: string[]; startsAt: string; endsAt: string | null; status: string }[];
  statements: { id: string; periodStart: string; periodEnd: string; grossKobo: string; revenueShareBp: number; schoolKobo: string; status: string; breakdown: Record<string, string> }[];
};
const STREAM: Record<string, string> = { SCHOOL_FEES: 'School fees', TUCK_SHOP: 'Tuck shop', SUBSCRIPTION: 'Subscriptions', OTHER: 'Other' };

export default function OverwatchSchool() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['ow', 'school', id], queryFn: () => api<Detail>(`/admin/schools/${id}`) });
  const [modal, setModal] = useState<'agreement' | 'statement' | null>(null);
  const status = useMutation({
    mutationFn: (s: 'ACTIVE' | 'SUSPENDED') => api(`/admin/schools/${id}`, { method: 'PATCH', body: { status: s } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ow'] }),
    onError: (e) => toast.error(errorText(e)),
  });

  if (q.isPending) return <Loading rows={5} />;
  if (q.error) return <ErrorBox error={q.error} onRetry={q.refetch} />;
  const s = q.data;
  const active = s.agreements.find((a) => a.status === 'ACTIVE');

  return (
    <>
      <PageHeader
        back={
          <Link href="/overwatch/schools" className="mb-2 inline-flex items-center gap-1 text-sm font-bold text-ink-500 hover:text-violet-700">
            <ArrowLeft className="size-4" /> Schools
          </Link>
        }
        title={s.name}
        subtitle={[s.state, s.address, s.phone].filter(Boolean).join(' · ') || undefined}
        actions={
          <>
            <Link href={`/overwatch/schools/${id}/ai`}>
              <Button variant="secondary" icon={<Bot className="size-4" />}>
                AI setup
              </Button>
            </Link>
            <Link href={`/overwatch/activity?schoolId=${id}`}>
              <Button variant="secondary" icon={<Activity className="size-4" />}>
                Activity
              </Button>
            </Link>
          {s.status === 'SUSPENDED' ? (
            <Button variant="success" loading={status.isPending} onClick={() => status.mutate('ACTIVE')}>
              Reactivate
            </Button>
          ) : (
            <Button variant="danger" loading={status.isPending} onClick={() => confirm(`Suspend ${s.name}? Their staff lose dashboard access at their next sign-in.`) && status.mutate('SUSPENDED')}>
              Suspend
            </Button>
          )}
          </>
        }
      />
      {s.status === 'SUSPENDED' ? <Notice tone="coral" title="Suspended">Staff can’t open this school’s dashboard. Parents and students keep their app access.</Notice> : null}

      <div className="my-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Students" value={s.students} hint={`${s.classes} ${s.classes === 1 ? 'class' : 'classes'}`} />
        <Stat label="Owed to school" tone="mint" value={naira(s.owedToSchoolKobo)} hint="Fees parents paid through Nexus, awaiting payout" />
        <Stat label="Revenue share" tone="sun" value={active ? `${active.revenueShareBp / 100}%` : '—'} hint={active ? active.planName : 'No agreement yet'} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold">
              <Lock className="size-4 text-ink-300" /> Agreements
            </h2>
            <Button size="sm" variant="secondary" icon={<FileSignature className="size-4" />} onClick={() => setModal('agreement')}>
              New agreement
            </Button>
          </div>
          <p className="mb-3 text-sm text-ink-500">Only visible in Overwatch. Schools never see this through their dashboard.</p>
          {s.agreements.length === 0 ? (
            <p className="text-ink-500">No agreement yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {s.agreements.map((a) => (
                <li key={a.id} className={cx('rounded-xl p-3', a.status === 'ACTIVE' ? 'bg-mint-50' : 'bg-paper')}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold">
                      {a.planName} · {a.revenueShareBp / 100}%
                    </span>
                    <Badge tone={a.status === 'ACTIVE' ? 'mint' : 'ink'}>{a.status.toLowerCase()}</Badge>
                  </div>
                  <div className="text-sm text-ink-500">
                    {a.sharedStreams.map((x) => STREAM[x] ?? x).join(', ')} · from {date(a.startsAt)}
                    {a.endsAt ? ` to ${date(a.endsAt)}` : ''}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-display text-lg font-bold">Statements</h2>
            <Button size="sm" variant="secondary" icon={<Calculator className="size-4" />} disabled={!active} onClick={() => setModal('statement')}>
              Calculate
            </Button>
          </div>
          {s.statements.length === 0 ? (
            <p className="text-ink-500">{active ? 'Calculate the school’s share for any period.' : 'Add an agreement first.'}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {s.statements.map((st) => (
                <li key={st.id} className="rounded-xl bg-paper p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold">
                      {date(st.periodStart)} – {date(new Date(new Date(st.periodEnd).getTime() - 86_400_000))}
                    </span>
                    <Badge tone={st.status === 'PAID' ? 'mint' : 'sun'}>{st.status.toLowerCase()}</Badge>
                  </div>
                  <div className="mt-1 flex justify-between text-sm">
                    <span className="text-ink-500">
                      {naira(st.grossKobo)} × {st.revenueShareBp / 100}%
                    </span>
                    <span className="font-display text-lg font-extrabold">{naira(st.schoolKobo)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="mb-3 font-display text-lg font-bold">Owner & administrators</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {s.admins.map((a) => (
              <li key={`${a.email}-${a.role}`} className="rounded-xl bg-paper p-3">
                <div className="font-bold">
                  {a.firstName} {a.lastName} <Badge tone={a.role === 'SCHOOL_OWNER' ? 'violet' : 'sky'}>{a.role === 'SCHOOL_OWNER' ? 'Owner' : 'Admin'}</Badge>
                </div>
                <div className="text-sm text-ink-500">{[a.email, a.phone].filter(Boolean).join(' · ')}</div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {modal === 'agreement' ? <AgreementForm schoolId={id} onClose={() => setModal(null)} /> : null}
      {modal === 'statement' ? <StatementForm schoolId={id} onClose={() => setModal(null)} /> : null}
    </>
  );
}

const agreementSchema = z.object({
  planName: z.string().trim().min(2, 'Name the plan.'),
  percent: z.string().regex(/^\d{1,3}(\.\d{1,2})?$/, 'Enter a percentage.').refine((v) => Number(v) <= 100, 'At most 100%.'),
  streams: z.array(z.string()).min(1, 'Choose at least one revenue stream.'),
  startsAt: z.string().min(1, 'Pick a date.'),
  endsAt: z.string(),
});

function AgreementForm({ schoolId, onClose }: { schoolId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const { register, handleSubmit, formState } = useForm({ resolver: zodResolver(agreementSchema), defaultValues: { planName: 'Standard', percent: '', streams: ['SCHOOL_FEES'], startsAt: new Date().toISOString().slice(0, 10), endsAt: '' } });
  const save = useMutation({
    mutationFn: (v: z.infer<typeof agreementSchema>) =>
      api(`/admin/schools/${schoolId}/agreements`, { body: { planName: v.planName, revenueShareBp: Math.round(Number(v.percent) * 100), sharedStreams: v.streams, startsAt: v.startsAt, endsAt: v.endsAt || undefined } }),
    onSuccess: () => {
      toast.success('Agreement saved. It replaces any earlier one.');
      qc.invalidateQueries({ queryKey: ['ow'] });
      onClose();
    },
    onError: (e) => toast.error(errorText(e)),
  });
  const submit = handleSubmit((v) => save.mutate(v));
  return (
    <Modal
      open
      onClose={onClose}
      title="New agreement"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={save.isPending} onClick={submit}>
            Save agreement
          </Button>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Input label="Plan name" error={formState.errors.planName?.message} {...register('planName')} />
        <Input label="School’s share (%)" inputMode="decimal" error={formState.errors.percent?.message} {...register('percent')} />
        <fieldset className="sm:col-span-2">
          <legend className="mb-2 text-sm font-bold">Revenue that counts</legend>
          <div className="flex flex-wrap gap-3">
            {Object.entries(STREAM).map(([v, label]) => (
              <label key={v} className="flex items-center gap-2 rounded-xl bg-paper px-3 py-2 font-semibold">
                <input type="checkbox" value={v} className="size-4 accent-violet-500" {...register('streams')} /> {label}
              </label>
            ))}
          </div>
          <p className="mt-2 text-sm text-ink-500">Lesson-teacher bookings are never shared with schools.</p>
          {formState.errors.streams ? <p className="text-[13px] font-semibold text-coral-700">{formState.errors.streams.message}</p> : null}
        </fieldset>
        <Input label="Starts" type="date" error={formState.errors.startsAt?.message} {...register('startsAt')} />
        <Input label="Ends (optional)" type="date" {...register('endsAt')} />
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}

function StatementForm({ schoolId, onClose }: { schoolId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
  const last = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const [from, setFrom] = useState(first);
  const [to, setTo] = useState(last);
  const run = useMutation({
    mutationFn: () => api(`/admin/schools/${schoolId}/statements`, { body: { from, to } }),
    onSuccess: () => {
      toast.success('Statement calculated');
      qc.invalidateQueries({ queryKey: ['ow', 'school', schoolId] });
      onClose();
    },
    onError: (e) => toast.error(errorText(e)),
  });
  return (
    <Modal
      open
      onClose={onClose}
      title="Calculate statement"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={run.isPending} onClick={() => run.mutate()}>
            Calculate
          </Button>
        </>
      }
    >
      <p className="mb-4 text-[15px] text-ink-500">Adds up the money attributed to this school in the period, for the streams in the active agreement. The end date isn’t included.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input label="Up to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>
    </Modal>
  );
}
