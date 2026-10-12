'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Eye, EyeOff, KeyRound, MessageSquarePlus, Pencil, Sparkles, Trash2, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Avatar, Badge, Button, Card, ErrorBox, Input, Loading, Modal, Notice, PageHeader, Select, Textarea } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { api, errorText } from '@/lib/api';
import { date, naira } from '@/lib/format';
import { useClasses, useOverview, useSchoolKey } from '@/lib/queries';
import type { StudentDetail } from '@/lib/types';

const NOTE_TONE = { ACHIEVEMENT: 'mint', EFFORT: 'violet', BEHAVIOUR: 'sun', WELLBEING: 'sky' } as const;
const INVOICE_TONE = { PAID: 'mint', PART_PAID: 'sun', UNPAID: 'coral', VOID: 'ink' } as const;

export default function StudentPage() {
  const { id } = useParams<{ id: string }>();
  const key = useSchoolKey();
  const overview = useOverview();
  const q = useQuery({ queryKey: [key, 'student', id], queryFn: () => api<StudentDetail>(`/school/students/${id}`) });
  const [modal, setModal] = useState<'note' | 'parent' | 'edit' | null>(null);
  const [pin, setPin] = useState<{ username: string; pin: string } | null>(null);
  const qc = useQueryClient();
  const admin = overview.data?.me.isAdmin;

  const resetPin = useMutation({
    mutationFn: () => api<{ username: string; pin: string }>(`/school/students/${id}/reset-pin`, { body: {} }),
    onSuccess: setPin,
    onError: (e) => toast.error(errorText(e)),
  });
  const delNote = useMutation({
    mutationFn: (noteId: string) => api(`/school/notes/${noteId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [key, 'student', id] }),
    onError: (e) => toast.error(errorText(e)),
  });
  const unlink = useMutation({
    mutationFn: (parentId: string) => api(`/school/students/${id}/parents/${parentId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [key] }),
    onError: (e) => toast.error(errorText(e)),
  });

  if (q.isPending) return <Loading rows={6} />;
  if (q.error) return <ErrorBox error={q.error} onRetry={q.refetch} />;
  const s = q.data;
  const att = s.attendance;
  const days = att.present + att.late + att.absent + att.excused;

  return (
    <>
      <PageHeader
        back={
          <Link href="/dashboard/students" className="mb-2 inline-flex items-center gap-1 text-sm font-bold text-ink-500 hover:text-violet-700">
            <ArrowLeft className="size-4" /> Students
          </Link>
        }
        title={`${s.firstName} ${s.lastName}`}
        subtitle={[s.class?.name, s.admissionNo && `Adm. ${s.admissionNo}`, `Tuck shop ID: ${s.shopCode}`, s.username && `App: ${s.username}`].filter(Boolean).join(' · ')}
        actions={
          <>
            <Button variant="secondary" icon={<MessageSquarePlus className="size-4" />} onClick={() => setModal('note')}>
              Add note
            </Button>
            {admin ? (
              <>
                <Button variant="secondary" icon={<Pencil className="size-4" />} onClick={() => setModal('edit')}>
                  Edit
                </Button>
                <Button variant="secondary" icon={<KeyRound className="size-4" />} loading={resetPin.isPending} onClick={() => confirm(`Give ${s.firstName} a new app PIN? The old one stops working.`) && resetPin.mutate()}>
                  New PIN
                </Button>
              </>
            ) : null}
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <div className="text-sm font-bold text-ink-500">Attendance this term</div>
              <div className="font-display text-3xl font-extrabold">{days ? `${Math.round(((att.present + att.late) / days) * 100)}%` : '—'}</div>
              <div className="text-[13px] text-ink-500">{days ? `${att.absent} absent · ${att.late} late of ${days} ${days === 1 ? 'day' : 'days'}` : 'Not taken yet'}</div>
            </Card>
            <Card>
              <div className="text-sm font-bold text-ink-500">Learning XP</div>
              <div className="font-display text-3xl font-extrabold">{s.xp.toLocaleString()}</div>
              <div className="text-[13px] text-ink-500">From quests in the app</div>
            </Card>
            <Card>
              <div className="text-sm font-bold text-ink-500">Practice streak</div>
              <div className="font-display text-3xl font-extrabold">{s.streak} {s.streak === 1 ? 'day' : 'days'}</div>
              <div className="text-[13px] text-ink-500">Days in a row</div>
            </Card>
          </div>

          <Card>
            <h2 className="mb-3 font-display text-lg font-bold">Scores this term</h2>
            {s.results.length === 0 ? (
              <p className="text-[15px] text-ink-500">No scores yet. Teachers add them from the class’s Scores tab.</p>
            ) : (
              <ul className="divide-y divide-ink-100">
                {s.results.map((r) => {
                  const pct = Math.round((r.score / r.maxScore) * 100);
                  return (
                    <li key={r.id} className="flex items-center gap-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <div className="font-bold">{r.subject}</div>
                        <div className="text-xs text-ink-500">
                          {r.title} · {date(r.heldOn, { day: 'numeric', month: 'short' })}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-display text-lg font-extrabold ${pct >= 70 ? 'text-mint-700' : pct < 40 ? 'text-coral-700' : ''}`}>{pct}%</div>
                        <div className="text-xs text-ink-500">
                          {r.score}/{r.maxScore}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Teacher notes</h2>
              <Button size="sm" variant="secondary" onClick={() => setModal('note')}>
                Add note
              </Button>
            </div>
            {s.notes.length === 0 ? (
              <p className="text-[15px] text-ink-500">A quick note about effort or behaviour makes the parent’s weekly report personal.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {s.notes.map((n) => (
                  <li key={n.id} className="rounded-xl bg-paper p-3">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <Badge tone={NOTE_TONE[n.category as keyof typeof NOTE_TONE] ?? 'ink'}>{n.category.toLowerCase()}</Badge>
                      <span className="text-xs text-ink-500">
                        {n.author} · {date(n.createdAt, { day: 'numeric', month: 'short' })}
                      </span>
                      <span className="ml-auto flex items-center gap-1 text-xs font-bold text-ink-500">
                        {n.visibleToParent ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                        {n.visibleToParent ? 'Parent can see' : 'Staff only'}
                      </span>
                      <button type="button" onClick={() => confirm('Delete this note?') && delNote.mutate(n.id)} className="grid size-7 place-items-center rounded-lg text-ink-300 hover:bg-white hover:text-coral-700" aria-label="Delete note">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                    <p className="text-[15px]">{n.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Parents</h2>
              {admin ? (
                <Button size="sm" variant="secondary" icon={<UserPlus className="size-4" />} onClick={() => setModal('parent')}>
                  Add
                </Button>
              ) : null}
            </div>
            {s.parents.length === 0 ? (
              <Notice tone="sun">No parent linked, so nobody gets this child’s weekly report.</Notice>
            ) : (
              <ul className="flex flex-col gap-3">
                {s.parents.map((p) => (
                  <li key={p.id} className="flex items-start gap-3">
                    <Avatar name={`${p.firstName} ${p.lastName}`} />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold">
                        {p.firstName} {p.lastName} <span className="text-xs font-semibold text-ink-500">· {p.relationship.toLowerCase()}</span>
                      </div>
                      <div className="truncate text-sm text-ink-500">{p.email ?? p.phone}</div>
                      <Badge tone={p.hasSignedIn ? 'mint' : 'sun'}>{p.hasSignedIn ? 'Uses the app' : 'Hasn’t signed in yet'}</Badge>
                    </div>
                    {admin ? (
                      <button type="button" onClick={() => confirm(`Unlink ${p.firstName}? They’ll stop seeing ${s.firstName}.`) && unlink.mutate(p.id)} className="grid size-8 place-items-center rounded-lg text-ink-300 hover:bg-coral-50 hover:text-coral-700" aria-label={`Unlink ${p.firstName}`}>
                        <Trash2 className="size-4" />
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="bg-[#12302B] text-white">
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-mint-400">
              <Sparkles className="size-4" /> Latest weekly report
            </div>
            {s.latestReport ? (
              <>
                <div className="font-display text-lg font-bold">{s.latestReport.headline}</div>
                <p className="mt-1 text-[14px] text-mint-100">{s.latestReport.summary}</p>
                <p className="mt-2 text-xs text-mint-100/70">Week of {date(s.latestReport.weekStart, { day: 'numeric', month: 'long' })}</p>
              </>
            ) : (
              <p className="text-[14px] text-mint-100">No report yet. Reports go out on Fridays once there’s attendance, scores or app activity, and a parent has switched them on.</p>
            )}
          </Card>

          {admin && s.invoices.length ? (
            <Card>
              <h2 className="mb-3 font-display text-lg font-bold">Fees</h2>
              <ul className="flex flex-col gap-2">
                {s.invoices.map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-2 rounded-xl bg-paper p-3">
                    <div>
                      <div className="text-sm font-bold">{i.term}</div>
                      <div className="text-xs text-ink-500">
                        {naira(i.paidKobo)} of {naira(i.totalKobo)}
                      </div>
                    </div>
                    <Badge tone={INVOICE_TONE[i.status as keyof typeof INVOICE_TONE] ?? 'ink'}>{i.status.replace('_', ' ').toLowerCase()}</Badge>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>
      </div>

      {modal === 'note' ? <NoteForm studentId={id} name={s.firstName} onClose={() => setModal(null)} /> : null}
      {modal === 'parent' ? <ParentForm studentId={id} name={s.firstName} onClose={() => setModal(null)} /> : null}
      {modal === 'edit' ? <EditStudent student={s} onClose={() => setModal(null)} /> : null}
      {pin ? (
        <Modal open onClose={() => setPin(null)} title={`New app PIN for ${s.firstName}`} footer={<Button onClick={() => setPin(null)}>Done</Button>}>
          <div className="grid grid-cols-2 gap-4 rounded-2xl bg-violet-50 p-5 text-center">
            <div>
              <div className="text-xs font-bold text-ink-500 uppercase">Username</div>
              <div className="font-mono text-xl font-bold">{pin.username}</div>
            </div>
            <div>
              <div className="text-xs font-bold text-ink-500 uppercase">PIN</div>
              <div className="font-mono text-3xl font-extrabold tracking-[0.3em]">{pin.pin}</div>
            </div>
          </div>
          <p className="mt-3 text-sm text-ink-500">Write this down for {s.firstName}: it isn’t shown again. They’ve been signed out of the app on every phone.</p>
        </Modal>
      ) : null}
    </>
  );
}

const noteSchema = z.object({
  category: z.enum(['ACHIEVEMENT', 'EFFORT', 'BEHAVIOUR', 'WELLBEING']),
  body: z.string().trim().min(3, 'Write a sentence or two.').max(1000),
  visibleToParent: z.boolean(),
});

function NoteForm({ studentId, name, onClose }: { studentId: string; name: string; onClose: () => void }) {
  const qc = useQueryClient();
  const key = useSchoolKey();
  const { register, handleSubmit, formState } = useForm({ resolver: zodResolver(noteSchema), defaultValues: { category: 'ACHIEVEMENT' as const, body: '', visibleToParent: true } });
  const save = useMutation({
    mutationFn: (v: z.infer<typeof noteSchema>) => api(`/school/students/${studentId}/notes`, { body: v }),
    onSuccess: () => {
      toast.success('Note added');
      qc.invalidateQueries({ queryKey: [key, 'student', studentId] });
      onClose();
    },
    onError: (e) => toast.error(errorText(e)),
  });
  const submit = handleSubmit((v) => save.mutate(v));
  return (
    <Modal
      open
      onClose={onClose}
      title={`Note about ${name}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={save.isPending} onClick={submit}>
            Save note
          </Button>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <Select
          label="Type"
          options={[
            { value: 'ACHIEVEMENT', label: 'Achievement' },
            { value: 'EFFORT', label: 'Effort' },
            { value: 'BEHAVIOUR', label: 'Behaviour' },
            { value: 'WELLBEING', label: 'Wellbeing' },
          ]}
          {...register('category')}
        />
        <Textarea label="Note" placeholder={`e.g. ${name} explained equivalent fractions to the class today.`} error={formState.errors.body?.message} {...register('body')} />
        <label className="flex items-start gap-3 rounded-xl bg-paper p-3">
          <input type="checkbox" className="mt-1 size-5 accent-violet-500" {...register('visibleToParent')} />
          <span>
            <span className="block font-bold">Include in the parent’s weekly report</span>
            <span className="text-sm text-ink-500">Untick for notes only staff should see.</span>
          </span>
        </label>
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}

const parentSchema = z
  .object({
    firstName: z.string().trim().min(1, 'Enter their first name.'),
    lastName: z.string().trim().min(1, 'Enter their surname.'),
    email: z.union([z.literal(''), z.email('Enter a valid email.')]),
    phone: z.union([z.literal(''), z.string().regex(/^\+?[0-9 ]{10,18}$/, 'Enter a valid phone number.')]),
    relationship: z.enum(['MOTHER', 'FATHER', 'GUARDIAN']),
  })
  .refine((v) => v.email || v.phone, { path: ['email'], message: 'Add an email or phone so they can sign in.' });

function ParentForm({ studentId, name, onClose }: { studentId: string; name: string; onClose: () => void }) {
  const qc = useQueryClient();
  const key = useSchoolKey();
  const { register, handleSubmit, formState } = useForm({ resolver: zodResolver(parentSchema), defaultValues: { firstName: '', lastName: '', email: '', phone: '', relationship: 'MOTHER' as const } });
  const save = useMutation({
    mutationFn: (v: z.infer<typeof parentSchema>) => api<{ invited: boolean }>(`/school/students/${studentId}/parents`, { body: { ...v, email: v.email || undefined, phone: v.phone.replace(/\s/g, '') || undefined } }),
    onSuccess: (r) => {
      toast.success(r.invited ? 'Parent added and emailed a sign-in code' : 'Parent linked. They’ll see the child in their app.');
      qc.invalidateQueries({ queryKey: [key] });
      onClose();
    },
    onError: (e) => toast.error(errorText(e)),
  });
  const submit = handleSubmit((v) => save.mutate(v));
  const e = formState.errors;
  return (
    <Modal
      open
      onClose={onClose}
      title={`Add a parent for ${name}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={save.isPending} onClick={submit}>
            Add parent
          </Button>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Input label="First name" error={e.firstName?.message} {...register('firstName')} />
        <Input label="Surname" error={e.lastName?.message} {...register('lastName')} />
        <Input label="Email" type="email" error={e.email?.message} {...register('email')} />
        <Input label="Phone / WhatsApp" type="tel" error={e.phone?.message} {...register('phone')} />
        <Select
          label="Relationship"
          options={[
            { value: 'MOTHER', label: 'Mother' },
            { value: 'FATHER', label: 'Father' },
            { value: 'GUARDIAN', label: 'Guardian' },
          ]}
          {...register('relationship')}
        />
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}

const editSchema = z.object({
  firstName: z.string().trim().min(1, 'Enter a first name.'),
  lastName: z.string().trim().min(1, 'Enter a surname.'),
  admissionNo: z.string().trim(),
  classId: z.string().min(1),
});

function EditStudent({ student, onClose }: { student: StudentDetail; onClose: () => void }) {
  const qc = useQueryClient();
  const key = useSchoolKey();
  const classes = useClasses();
  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(editSchema),
    defaultValues: { firstName: student.firstName, lastName: student.lastName, admissionNo: student.admissionNo ?? '', classId: student.class?.id ?? '' },
  });
  const save = useMutation({
    mutationFn: (v: z.infer<typeof editSchema>) => api(`/school/students/${student.id}`, { method: 'PATCH', body: v }),
    onSuccess: () => {
      toast.success('Saved');
      qc.invalidateQueries({ queryKey: [key] });
      onClose();
    },
    onError: (e) => toast.error(errorText(e)),
  });
  const submit = handleSubmit((v) => save.mutate(v));
  return (
    <Modal
      open
      onClose={onClose}
      title={`Edit ${student.firstName}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={save.isPending} onClick={submit}>
            Save
          </Button>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Input label="First name" error={formState.errors.firstName?.message} {...register('firstName')} />
        <Input label="Surname" error={formState.errors.lastName?.message} {...register('lastName')} />
        <Input label="Admission number" {...register('admissionNo')} />
        <Select label="Class" hint="Moving class keeps this term’s scores." options={(classes.data ?? []).map((c) => ({ value: c.id, label: c.name }))} {...register('classId')} />
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
