'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarRange, Check, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Badge, Button, Card, Empty, ErrorBox, Input, Loading, Modal, PageHeader, Tabs } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { api, errorText } from '@/lib/api';
import { date, TERM } from '@/lib/format';
import { useOverview, useSchoolKey, useSubjects, useYears } from '@/lib/queries';
import type { Overview } from '@/lib/types';

const SUGGESTED = {
  primary: ['Mathematics', 'English Language', 'Basic Science', 'Social Studies', 'Verbal Reasoning', 'Quantitative Reasoning', 'Civic Education', 'Cultural and Creative Arts'],
  secondary: ['Mathematics', 'English Language', 'Basic Science', 'Basic Technology', 'Business Studies', 'Physics', 'Chemistry', 'Biology', 'Economics', 'Further Mathematics', 'Literature in English', 'Government'],
};

export default function SettingsPage() {
  const [tab, setTab] = useState<'session' | 'subjects' | 'school'>('session');
  return (
    <>
      <PageHeader title="Settings" subtitle="Your school’s calendar, subjects and details." />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'session', label: 'Sessions & terms' },
          { value: 'subjects', label: 'Subjects' },
          { value: 'school', label: 'School details' },
        ]}
      />
      {tab === 'session' ? <Sessions /> : tab === 'subjects' ? <Subjects /> : <SchoolDetails />}
    </>
  );
}

// ── Sessions ─────────────────────────────────────────────

const yearSchema = z
  .object({
    name: z.string().regex(/^\d{4}\/\d{4}$/, 'Write it like 2026/2027.'),
    t1s: z.string().min(1, 'Pick a date.'),
    t1e: z.string().min(1, 'Pick a date.'),
    t2s: z.string().min(1, 'Pick a date.'),
    t2e: z.string().min(1, 'Pick a date.'),
    t3s: z.string().min(1, 'Pick a date.'),
    t3e: z.string().min(1, 'Pick a date.'),
  })
  .refine((v) => v.t1s < v.t1e, { path: ['t1e'], message: 'Must be after the start.' })
  .refine((v) => v.t2s < v.t2e, { path: ['t2e'], message: 'Must be after the start.' })
  .refine((v) => v.t3s < v.t3e, { path: ['t3e'], message: 'Must be after the start.' })
  .refine((v) => v.t1e < v.t2s, { path: ['t2s'], message: 'Second term starts after first term ends.' })
  .refine((v) => v.t2e < v.t3s, { path: ['t3s'], message: 'Third term starts after second term ends.' });

function Sessions() {
  const years = useYears();
  const qc = useQueryClient();
  const key = useSchoolKey();
  const [open, setOpen] = useState(false);
  const now = new Date().getFullYear();
  const startYear = new Date().getMonth() >= 7 ? now : now - 1;
  const { register, handleSubmit, formState, reset } = useForm({
    resolver: zodResolver(yearSchema),
    defaultValues: {
      name: `${startYear}/${startYear + 1}`,
      t1s: `${startYear}-09-08`,
      t1e: `${startYear}-12-12`,
      t2s: `${startYear + 1}-01-05`,
      t2e: `${startYear + 1}-04-02`,
      t3s: `${startYear + 1}-04-27`,
      t3e: `${startYear + 1}-07-24`,
    },
  });
  const create = useMutation({
    mutationFn: (v: z.infer<typeof yearSchema>) =>
      api('/school/years', {
        body: {
          name: v.name,
          terms: [
            { name: 'FIRST', startDate: v.t1s, endDate: v.t1e },
            { name: 'SECOND', startDate: v.t2s, endDate: v.t2e },
            { name: 'THIRD', startDate: v.t3s, endDate: v.t3e },
          ],
        },
      }),
    onSuccess: () => {
      toast.success('Session saved');
      setOpen(false);
      reset();
      qc.invalidateQueries({ queryKey: [key] });
    },
    onError: (e) => toast.error(errorText(e)),
  });
  const makeCurrent = useMutation({
    mutationFn: (id: string) => api(`/school/years/${id}/current`, { body: {} }),
    onSuccess: () => {
      toast.success('Current session changed');
      qc.invalidateQueries({ queryKey: [key] });
    },
    onError: (e) => toast.error(errorText(e)),
  });

  if (years.isPending) return <Loading />;
  if (years.error) return <ErrorBox error={years.error} onRetry={years.refetch} />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button icon={<Plus className="size-4" />} onClick={() => setOpen(true)}>
          Add session
        </Button>
      </div>
      {years.data.length === 0 ? (
        <Empty icon={<CalendarRange className="size-7" />} title="Add your first session" message="Enter this session’s three term dates. Attendance, scores and fees are all organised by term." action={<Button onClick={() => setOpen(true)}>Add session</Button>} />
      ) : (
        years.data.map((y) => (
          <Card key={y.id}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="font-display text-xl font-bold">{y.name}</h3>
                {y.isCurrent ? <Badge tone="mint">Current</Badge> : null}
              </div>
              {!y.isCurrent ? (
                <Button size="sm" variant="secondary" loading={makeCurrent.isPending} onClick={() => makeCurrent.mutate(y.id)}>
                  Make current
                </Button>
              ) : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {y.terms.map((t) => (
                <div key={t.id} className="rounded-xl bg-paper p-3">
                  <div className="text-sm font-extrabold">{TERM[t.name]}</div>
                  <div className="text-[14px] text-ink-500">
                    {date(t.startDate, { day: 'numeric', month: 'short' })} – {date(t.endDate, { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add a session"
        wide
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button loading={create.isPending} onClick={handleSubmit((v) => create.mutate(v))}>
              Save session
            </Button>
          </>
        }
      >
        <form className="flex flex-col gap-4" onSubmit={handleSubmit((v) => create.mutate(v))} noValidate>
          <Input label="Session" placeholder="2026/2027" error={formState.errors.name?.message} {...register('name')} />
          {(
            [
              ['First term', 't1s', 't1e'],
              ['Second term', 't2s', 't2e'],
              ['Third term', 't3s', 't3e'],
            ] as const
          ).map(([label, s, e]) => (
            <div key={label} role="group" className="grid gap-3 rounded-2xl bg-paper p-3 sm:grid-cols-2">
              <h3 className="text-sm font-extrabold sm:col-span-2">{label}</h3>
              <Input label="Starts" type="date" error={formState.errors[s]?.message} {...register(s)} />
              <Input label="Ends" type="date" error={formState.errors[e]?.message} {...register(e)} />
            </div>
          ))}
          <button type="submit" hidden />
        </form>
      </Modal>
    </div>
  );
}

// ── Subjects ─────────────────────────────────────────────

function Subjects() {
  const subjects = useSubjects();
  const qc = useQueryClient();
  const key = useSchoolKey();
  const [name, setName] = useState('');
  const add = useMutation({
    mutationFn: (names: string[]) => api('/school/subjects', { body: { names } }),
    onSuccess: () => {
      setName('');
      qc.invalidateQueries({ queryKey: [key] });
    },
    onError: (e) => toast.error(errorText(e)),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api(`/school/subjects/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [key] }),
    onError: (e) => toast.error(errorText(e)),
  });
  if (subjects.isPending) return <Loading />;
  if (subjects.error) return <ErrorBox error={subjects.error} onRetry={subjects.refetch} />;
  const have = new Set(subjects.data.map((s) => s.name));

  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      <Card>
        <h3 className="mb-3 font-display text-lg font-bold">Your subjects</h3>
        <form
          className="mb-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim().length >= 2) add.mutate([name.trim()]);
          }}
        >
          <Input label="Add a subject" placeholder="e.g. Agricultural Science" value={name} onChange={(e) => setName(e.target.value)} wrapperClassName="flex-1" />
          <Button type="submit" className="mt-[26px]" loading={add.isPending} disabled={name.trim().length < 2}>
            Add
          </Button>
        </form>
        {subjects.data.length === 0 ? (
          <p className="text-[15px] text-ink-500">No subjects yet. Add your own or pick from the suggestions.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {subjects.data.map((s) => (
              <li key={s.id} className="flex items-center gap-1 rounded-full bg-violet-50 py-1 pr-1 pl-3 text-sm font-bold text-violet-700">
                {s.name}
                <button type="button" onClick={() => remove.mutate(s.id)} className="grid size-7 place-items-center rounded-full hover:bg-violet-100" aria-label={`Remove ${s.name}`}>
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card>
        <h3 className="mb-3 font-display text-lg font-bold">Suggestions</h3>
        {(['primary', 'secondary'] as const).map((group) => {
          const missing = SUGGESTED[group].filter((n) => !have.has(n));
          return (
            <div key={group} className="mb-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-extrabold text-ink-500 uppercase">{group}</span>
                {missing.length ? (
                  <Button size="sm" variant="secondary" onClick={() => add.mutate(missing)}>
                    Add all
                  </Button>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED[group].map((n) =>
                  have.has(n) ? (
                    <span key={n} className="flex items-center gap-1 rounded-full bg-mint-50 px-3 py-1 text-sm font-bold text-mint-800">
                      <Check className="size-3.5" /> {n}
                    </span>
                  ) : (
                    <button key={n} type="button" onClick={() => add.mutate([n])} className="rounded-full border-2 border-ink-200 px-3 py-1 text-sm font-bold hover:border-violet-200 hover:bg-violet-50">
                      + {n}
                    </button>
                  ),
                )}
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

// ── School details ───────────────────────────────────────

const schoolSchema = z.object({
  name: z.string().trim().min(2, 'Enter your school’s name.'),
  address: z.string().trim(),
  state: z.string().trim(),
  lga: z.string().trim(),
  email: z.union([z.literal(''), z.email('Enter a valid email.')]),
  phone: z.union([z.literal(''), z.string().regex(/^\+?[0-9 ]{10,18}$/, 'Enter a valid phone number.')]),
});

function SchoolDetails() {
  const overview = useOverview();
  if (overview.isPending) return <Loading />;
  if (overview.error) return <ErrorBox error={overview.error} />;
  return <SchoolForm school={overview.data.school} canEdit={overview.data.me.isAdmin} />;
}

function SchoolForm({ school, canEdit }: { school: Overview['school']; canEdit: boolean }) {
  const qc = useQueryClient();
  const key = useSchoolKey();
  const { register, handleSubmit, formState } = useForm({ resolver: zodResolver(schoolSchema), defaultValues: { name: school.name, address: school.address ?? '', state: school.state ?? '', lga: school.lga ?? '', email: school.email ?? '', phone: school.phone ?? '' } });
  const save = useMutation({
    mutationFn: (v: z.infer<typeof schoolSchema>) =>
      api('/school', { method: 'PATCH', body: Object.fromEntries(Object.entries({ ...v, phone: v.phone.replace(/\s/g, '') }).filter(([, x]) => x !== '')) }),
    onSuccess: () => {
      toast.success('School details saved');
      qc.invalidateQueries({ queryKey: [key] });
    },
    onError: (e) => toast.error(errorText(e)),
  });
  return (
    <Card>
      <form onSubmit={handleSubmit((v) => save.mutate(v))} noValidate className="grid gap-4 sm:grid-cols-2">
        <Input label="School name" wrapperClassName="sm:col-span-2" error={formState.errors.name?.message} disabled={!canEdit} {...register('name')} />
        <Input label="Address" wrapperClassName="sm:col-span-2" disabled={!canEdit} {...register('address')} />
        <Input label="State" disabled={!canEdit} {...register('state')} />
        <Input label="LGA" disabled={!canEdit} {...register('lga')} />
        <Input label="School email" type="email" error={formState.errors.email?.message} disabled={!canEdit} {...register('email')} />
        <Input label="School phone" type="tel" error={formState.errors.phone?.message} disabled={!canEdit} {...register('phone')} />
        {canEdit ? (
          <div className="sm:col-span-2">
            <Button type="submit" loading={save.isPending}>
              Save details
            </Button>
          </div>
        ) : null}
      </form>
    </Card>
  );
}
