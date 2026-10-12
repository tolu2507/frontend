'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ClipboardList, Download, Plus, Printer, Trash2, Users } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Avatar, Badge, Button, Card, cx, Empty, ErrorBox, Input, Loading, Modal, Notice, Select, Table } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { api, errorText } from '@/lib/api';
import { date, TERM, todayIso } from '@/lib/format';
import { useSchoolKey, useStaff, useSubjects } from '@/lib/queries';
import type { AssessmentType, AttendanceStatus, SchoolClass, StudentRow, TermName } from '@/lib/types';

type Rostered = { id: string; firstName: string; lastName: string; admissionNo: string | null };

// ── Attendance ─────────────────────────────────────────────

const STATUSES: { value: AttendanceStatus; label: string; short: string; on: string }[] = [
  { value: 'PRESENT', label: 'Present', short: 'P', on: 'bg-mint-600 text-white border-mint-600' },
  { value: 'LATE', label: 'Late', short: 'L', on: 'bg-sun-400 text-ink border-sun-400' },
  { value: 'ABSENT', label: 'Absent', short: 'A', on: 'bg-coral-500 text-white border-coral-500' },
  { value: 'EXCUSED', label: 'Excused', short: 'E', on: 'bg-sky-600 text-white border-sky-600' },
];

type Sheet = { date: string; saved: boolean; students: (Rostered & { status: AttendanceStatus | null; note: string | null })[] };

export function AttendanceTab({ classId }: { classId: string }) {
  const [day, setDay] = useState(todayIso());
  const key = useSchoolKey();
  const q = useQuery({ queryKey: [key, 'attendance', classId, day], queryFn: () => api<Sheet>(`/school/classes/${classId}/attendance?date=${day}`) });
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <Input label="Date" type="date" max={todayIso()} value={day} onChange={(e) => e.target.value && setDay(e.target.value)} wrapperClassName="w-48" />
        <div className="flex gap-2 pb-0.5">
          <Button size="sm" variant="secondary" onClick={() => setDay(todayIso())}>
            Today
          </Button>
        </div>
      </div>
      {q.isPending ? <Loading /> : q.error ? <ErrorBox error={q.error} onRetry={q.refetch} /> : <Register key={`${day}-${q.dataUpdatedAt}`} classId={classId} sheet={q.data} />}
    </div>
  );
}

function Register({ classId, sheet }: { classId: string; sheet: Sheet }) {
  const qc = useQueryClient();
  const key = useSchoolKey();
  const [marks, setMarks] = useState<Record<string, AttendanceStatus | null>>(() => Object.fromEntries(sheet.students.map((s) => [s.id, s.status])));
  const dirty = sheet.students.some((s) => marks[s.id] !== s.status);
  const unmarked = sheet.students.filter((s) => !marks[s.id]).length;
  const counts = STATUSES.map((st) => ({ ...st, n: sheet.students.filter((s) => marks[s.id] === st.value).length }));

  const save = useMutation({
    mutationFn: () => api(`/school/classes/${classId}/attendance`, { method: 'PUT', body: { date: sheet.date, entries: sheet.students.filter((s) => marks[s.id]).map((s) => ({ studentId: s.id, status: marks[s.id] })) } }),
    onSuccess: () => {
      toast.success('Attendance saved');
      qc.invalidateQueries({ queryKey: [key] });
    },
    onError: (e) => toast.error(errorText(e)),
  });

  if (!sheet.students.length) return <Empty icon={<Users className="size-7" />} title="No students in this class" message="Add students on the Students page, then come back to take attendance." />;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {counts.map((c) => (
            <Badge key={c.value} tone={c.value === 'PRESENT' ? 'mint' : c.value === 'LATE' ? 'sun' : c.value === 'ABSENT' ? 'coral' : 'sky'}>
              {c.label} {c.n}
            </Badge>
          ))}
          {unmarked ? <Badge tone="ink">Not marked {unmarked}</Badge> : null}
        </div>
        <Button size="sm" variant="secondary" icon={<Check className="size-4" />} onClick={() => setMarks((m) => Object.fromEntries(sheet.students.map((s) => [s.id, m[s.id] ?? 'PRESENT'])))}>
          Mark everyone else present
        </Button>
      </div>
      <Card className="divide-y divide-ink-100 p-0">
        {sheet.students.map((s) => (
          <div key={s.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <Avatar name={`${s.firstName} ${s.lastName}`} />
            <div className="min-w-0 flex-1">
              <div className="truncate font-bold">
                {s.lastName}, {s.firstName}
              </div>
              {s.admissionNo ? <div className="text-xs text-ink-500">{s.admissionNo}</div> : null}
            </div>
            <div role="radiogroup" aria-label={`Attendance for ${s.firstName}`} className="flex gap-1.5">
              {STATUSES.map((st) => {
                const on = marks[s.id] === st.value;
                return (
                  <button
                    key={st.value}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    title={st.label}
                    aria-label={st.label}
                    onClick={() => setMarks((m) => ({ ...m, [s.id]: st.value }))}
                    className={cx('grid size-10 place-items-center rounded-xl border-2 text-sm font-extrabold transition active:scale-95', on ? st.on : 'border-ink-200 bg-white text-ink-500 hover:border-ink-300')}
                  >
                    {st.short}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </Card>
      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-end gap-3 rounded-2xl bg-white/90 p-3 shadow-card backdrop-blur">
        <span className="mr-auto text-sm font-semibold text-ink-500">{dirty ? 'You have unsaved changes' : sheet.saved ? `Saved for ${date(sheet.date, { weekday: 'long', day: 'numeric', month: 'long' })}` : 'Not taken yet'}</span>
        <Button loading={save.isPending} disabled={!dirty} onClick={() => save.mutate()}>
          Save attendance
        </Button>
      </div>
    </>
  );
}

// ── Scores ─────────────────────────────────────────────────

type Assessments = {
  term: { id: string; name: TermName } | null;
  subjects: {
    classSubjectId: string;
    name: string;
    teacher: string | null;
    canEdit: boolean;
    assessments: { id: string; title: string; type: AssessmentType; maxScore: number; weight: number; heldOn: string; topics: string[]; resultCount: number }[];
  }[];
};

const TYPES: { value: AssessmentType; label: string }[] = [
  { value: 'CLASSWORK', label: 'Classwork' },
  { value: 'ASSIGNMENT', label: 'Assignment' },
  { value: 'QUIZ', label: 'Quiz' },
  { value: 'TEST', label: 'Test (CA)' },
  { value: 'EXAM', label: 'Exam' },
];

export function ScoresTab({ classId }: { classId: string }) {
  const key = useSchoolKey();
  const q = useQuery({ queryKey: [key, 'assessments', classId], queryFn: () => api<Assessments>(`/school/classes/${classId}/assessments`) });
  const [creating, setCreating] = useState(false);
  const [sheetId, setSheetId] = useState<string | null>(null);

  if (q.isPending) return <Loading />;
  if (q.error) return <ErrorBox error={q.error} onRetry={q.refetch} />;
  if (!q.data.term) return <Notice tone="sun" title="No current term">Add this session’s term dates in Settings before recording scores.</Notice>;
  const editable = q.data.subjects.filter((s) => s.canEdit);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[15px] text-ink-500">{TERM[q.data.term.name]} scores. Each one feeds the broadsheet and the parent’s weekly report.</p>
        {editable.length ? (
          <Button icon={<Plus className="size-4" />} onClick={() => setCreating(true)}>
            New test or exam
          </Button>
        ) : null}
      </div>
      {q.data.subjects.length === 0 ? (
        <Empty icon={<ClipboardList className="size-7" />} title="This class has no subjects yet" message="An administrator adds subjects and teachers on the “Subjects & teachers” tab." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {q.data.subjects.map((s) => (
            <Card key={s.classSubjectId}>
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-display text-lg font-bold">{s.name}</h3>
                  <p className="text-sm text-ink-500">{s.teacher ?? 'No teacher assigned'}</p>
                </div>
                {s.canEdit ? <Badge tone="violet">You teach this</Badge> : null}
              </div>
              {s.assessments.length === 0 ? (
                <p className="text-[14px] text-ink-500">No scores yet this term.</p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {s.assessments.map((a) => (
                    <li key={a.id}>
                      <button type="button" onClick={() => setSheetId(a.id)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-violet-50">
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-bold">{a.title}</div>
                          <div className="text-xs text-ink-500">
                            {TYPES.find((t) => t.value === a.type)?.label} · out of {a.maxScore} · {date(a.heldOn, { day: 'numeric', month: 'short' })}
                          </div>
                        </div>
                        <Badge tone={a.resultCount ? 'mint' : 'sun'}>{a.resultCount ? `${a.resultCount} scores` : 'Enter scores'}</Badge>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ))}
        </div>
      )}
      {creating ? <NewAssessment classId={classId} subjects={editable} onClose={() => setCreating(false)} onCreated={(id) => setSheetId(id)} /> : null}
      {sheetId ? <ScoreSheet classId={classId} id={sheetId} onClose={() => setSheetId(null)} /> : null}
    </div>
  );
}

const assessmentSchema = z.object({
  classSubjectId: z.string().min(1, 'Choose a subject.'),
  title: z.string().trim().min(2, 'Give it a name, like “First CA test”.'),
  type: z.enum(['CLASSWORK', 'ASSIGNMENT', 'QUIZ', 'TEST', 'EXAM']),
  maxScore: z.coerce.number<string>().min(1, 'At least 1.').max(1000),
  weight: z.coerce.number<string>().min(0).max(100),
  heldOn: z.string().min(1, 'Pick a date.'),
  topics: z.string(),
});

function NewAssessment({ classId, subjects, onClose, onCreated }: { classId: string; subjects: Assessments['subjects']; onClose: () => void; onCreated: (id: string) => void }) {
  const qc = useQueryClient();
  const key = useSchoolKey();
  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(assessmentSchema),
    defaultValues: { classSubjectId: subjects.length === 1 ? subjects[0].classSubjectId : '', title: '', type: 'TEST' as AssessmentType, maxScore: '20', weight: '1', heldOn: todayIso(), topics: '' },
  });
  const create = useMutation({
    mutationFn: (v: z.output<typeof assessmentSchema>) =>
      api<{ id: string }>('/school/assessments', { body: { ...v, topics: v.topics.split(',').map((t) => t.trim()).filter(Boolean) } }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: [key, 'assessments', classId] });
      onClose();
      onCreated(r.id);
    },
    onError: (e) => toast.error(errorText(e)),
  });
  const submit = handleSubmit((v) => create.mutate(v));
  return (
    <Modal
      open
      onClose={onClose}
      title="New test or exam"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={create.isPending} onClick={submit}>
            Create and enter scores
          </Button>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Select label="Subject" wrapperClassName="sm:col-span-2" placeholder="Choose…" options={subjects.map((s) => ({ value: s.classSubjectId, label: s.name }))} error={formState.errors.classSubjectId?.message} {...register('classSubjectId')} />
        <Input label="Name" wrapperClassName="sm:col-span-2" placeholder="e.g. First CA test" error={formState.errors.title?.message} {...register('title')} />
        <Select label="Type" options={TYPES} {...register('type')} />
        <Input label="Date" type="date" max={todayIso()} error={formState.errors.heldOn?.message} {...register('heldOn')} />
        <Input label="Marked out of" type="number" inputMode="numeric" error={formState.errors.maxScore?.message} {...register('maxScore')} />
        <Input label="Weight" type="number" inputMode="decimal" step="0.5" hint="Exams often count 2 or 3× a test." error={formState.errors.weight?.message} {...register('weight')} />
        <Input label="Topics (optional)" wrapperClassName="sm:col-span-2" placeholder="fractions, decimals" hint="Separate with commas. Helps the weekly report say exactly what to practise." {...register('topics')} />
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}

type Scores = { assessment: { id: string; title: string; type: AssessmentType; maxScore: number; heldOn: string; topics: string[]; subject: string }; students: (Rostered & { score: number | null; remark: string | null })[] };

function ScoreSheet({ classId, id, onClose }: { classId: string; id: string; onClose: () => void }) {
  const key = useSchoolKey();
  const q = useQuery({ queryKey: [key, 'scores', id], queryFn: () => api<Scores>(`/school/assessments/${id}`) });
  return (
    <Modal open onClose={onClose} title={q.data ? `${q.data.assessment.subject}: ${q.data.assessment.title}` : 'Scores'} wide>
      {q.isPending ? <Loading /> : q.error ? <ErrorBox error={q.error} /> : <ScoreEntry key={q.dataUpdatedAt} classId={classId} data={q.data} onClose={onClose} />}
    </Modal>
  );
}

function ScoreEntry({ classId, data, onClose }: { classId: string; data: Scores; onClose: () => void }) {
  const qc = useQueryClient();
  const key = useSchoolKey();
  const max = data.assessment.maxScore;
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(data.students.map((s) => [s.id, s.score === null ? '' : String(s.score)])));
  const invalid = Object.entries(values).filter(([, v]) => v !== '' && (Number.isNaN(Number(v)) || Number(v) < 0 || Number(v) > max)).map(([k]) => k);
  const filled = Object.values(values).filter((v) => v !== '').length;

  const save = useMutation({
    mutationFn: () => api(`/school/assessments/${data.assessment.id}/results`, { method: 'PUT', body: { results: Object.entries(values).filter(([, v]) => v !== '').map(([studentId, v]) => ({ studentId, score: Number(v) })) } }),
    onSuccess: () => {
      toast.success('Scores saved');
      qc.invalidateQueries({ queryKey: [key, 'assessments', classId] });
      qc.invalidateQueries({ queryKey: [key, 'broadsheet', classId] });
      onClose();
    },
    onError: (e) => toast.error(errorText(e)),
  });
  const remove = useMutation({
    mutationFn: () => api(`/school/assessments/${data.assessment.id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Deleted');
      qc.invalidateQueries({ queryKey: [key, 'assessments', classId] });
      onClose();
    },
    onError: (e) => toast.error(errorText(e)),
  });

  if (!data.students.length) return <p className="text-ink-500">No students in this class yet.</p>;
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-ink-500">
        Out of {max} · {date(data.assessment.heldOn, { day: 'numeric', month: 'long' })}
        {data.assessment.topics.length ? ` · ${data.assessment.topics.join(', ')}` : ''}. Leave a box empty if the student didn’t sit it. Press Enter to jump to the next student.
      </p>
      <div className="divide-y divide-ink-100 rounded-2xl border border-ink-100">
        {data.students.map((s, i) => {
          const bad = invalid.includes(s.id);
          return (
            <label key={s.id} className="flex items-center gap-3 px-4 py-2">
              <span className="min-w-0 flex-1 truncate font-semibold">
                {s.lastName}, {s.firstName}
              </span>
              <input
                inputMode="decimal"
                data-score={i}
                value={values[s.id]}
                onChange={(e) => setValues((v) => ({ ...v, [s.id]: e.target.value.replace(/[^0-9.]/g, '') }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    (document.querySelector(`[data-score="${i + 1}"]`) as HTMLInputElement | null)?.focus();
                  }
                }}
                aria-invalid={bad || undefined}
                aria-label={`Score for ${s.firstName} ${s.lastName}`}
                className={cx('h-11 w-24 rounded-xl border-2 px-3 text-right font-display text-lg font-bold outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100', bad ? 'border-coral-500' : 'border-ink-200')}
              />
              <span className="w-10 text-sm text-ink-300">/{max}</span>
            </label>
          );
        })}
      </div>
      {invalid.length ? <p className="text-sm font-semibold text-coral-700">Some scores are more than {max}. Fix the boxes in red.</p> : null}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="danger" size="sm" icon={<Trash2 className="size-4" />} loading={remove.isPending} onClick={() => confirm('Delete this test and all its scores?') && remove.mutate()}>
          Delete
        </Button>
        <span className="mr-auto ml-2 text-sm text-ink-500">
          {filled} of {data.students.length} entered
        </span>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button loading={save.isPending} disabled={!!invalid.length || !filled} onClick={() => save.mutate()}>
          Save scores
        </Button>
      </div>
    </div>
  );
}

// ── Broadsheet ─────────────────────────────────────────────

type Broadsheet = { term: { id: string; name: TermName } | null; subjects: string[]; rows: (Rostered & { scores: Record<string, number | null>; average: number | null; position: number })[] };

const ordinal = (n: number) => `${n}${['th', 'st', 'nd', 'rd'][n % 100 > 10 && n % 100 < 14 ? 0 : n % 10 < 4 ? n % 10 : 0]}`;
const scoreTone = (v: number) => (v >= 70 ? 'text-mint-700' : v >= 50 ? 'text-ink' : v >= 40 ? 'text-sun-800' : 'text-coral-700');

export function BroadsheetTab({ classId, className }: { classId: string; className: string }) {
  const key = useSchoolKey();
  const q = useQuery({ queryKey: [key, 'broadsheet', classId], queryFn: () => api<Broadsheet>(`/school/classes/${classId}/broadsheet`) });
  const sorted = useMemo(() => [...(q.data?.rows ?? [])].sort((a, b) => (a.position || 1e9) - (b.position || 1e9)), [q.data]);

  if (q.isPending) return <Loading />;
  if (q.error) return <ErrorBox error={q.error} onRetry={q.refetch} />;
  if (!q.data.term) return <Notice tone="sun">Add this session’s term dates in Settings first.</Notice>;
  if (!q.data.rows.length) return <Empty title="No students yet" />;

  const csv = () => {
    const head = ['Position', 'Surname', 'First name', 'Admission no', ...q.data.subjects, 'Average'];
    const lines = sorted.map((r) => [r.position || '', r.lastName, r.firstName, r.admissionNo ?? '', ...q.data.subjects.map((s) => r.scores[s] ?? ''), r.average ?? '']);
    const text = [head, ...lines].map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([text], { type: 'text/csv' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: `${className} broadsheet.csv` });
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <p className="text-[15px] text-ink-500">{TERM[q.data.term.name]}. Each subject is the weighted average of every score so far, out of 100.</p>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" icon={<Download className="size-4" />} onClick={csv}>
            Download CSV
          </Button>
          <Button size="sm" variant="secondary" icon={<Printer className="size-4" />} onClick={() => window.print()}>
            Print
          </Button>
        </div>
      </div>
      <Table head={['Pos.', 'Student', ...q.data.subjects, 'Average']}>
        {sorted.map((r) => (
          <tr key={r.id} className="hover:bg-paper">
            <td className="px-4 py-3 font-display font-bold">{r.position ? ordinal(r.position) : '—'}</td>
            <td className="px-4 py-3 font-semibold whitespace-nowrap">
              {r.lastName}, {r.firstName}
            </td>
            {q.data.subjects.map((s) => {
              const v = r.scores[s];
              return (
                <td key={s} className={cx('px-4 py-3 font-bold', v === null ? 'text-ink-300' : scoreTone(v))}>
                  {v ?? '—'}
                </td>
              );
            })}
            <td className={cx('px-4 py-3 font-display text-lg font-extrabold', r.average === null ? 'text-ink-300' : scoreTone(r.average))}>{r.average ?? '—'}</td>
          </tr>
        ))}
      </Table>
    </div>
  );
}

// ── Students ───────────────────────────────────────────────

export function StudentsTab({ classId }: { classId: string }) {
  const key = useSchoolKey();
  const q = useQuery({ queryKey: [key, 'students', classId], queryFn: () => api<StudentRow[]>(`/school/students?classId=${classId}`) });
  if (q.isPending) return <Loading />;
  if (q.error) return <ErrorBox error={q.error} onRetry={q.refetch} />;
  if (!q.data.length)
    return (
      <Empty
        icon={<Users className="size-7" />}
        title="No students in this class"
        action={
          <Link href="/dashboard/students">
            <Button>Add students</Button>
          </Link>
        }
      />
    );
  return (
    <Table head={['Student', 'Admission no.', 'Parent', 'App username']}>
      {q.data.map((s) => (
        <tr key={s.id} className="hover:bg-paper">
          <td className="px-4 py-3">
            <Link href={`/dashboard/students/${s.id}`} className="flex items-center gap-3 font-bold hover:text-violet-700">
              <Avatar name={`${s.firstName} ${s.lastName}`} />
              {s.lastName}, {s.firstName}
            </Link>
          </td>
          <td className="px-4 py-3 text-ink-500">{s.admissionNo ?? '—'}</td>
          <td className="px-4 py-3">{s.parents.length ? s.parents.map((p) => p.name).join(', ') : <Badge tone="sun">No parent linked</Badge>}</td>
          <td className="px-4 py-3 font-mono text-[13px] text-ink-500">{s.username}</td>
        </tr>
      ))}
    </Table>
  );
}

// ── Subjects & teachers (admins) ───────────────────────────

export function SubjectsTab({ cls }: { cls: SchoolClass }) {
  const subjects = useSubjects();
  const staff = useStaff();
  const qc = useQueryClient();
  const key = useSchoolKey();
  const [picked, setPicked] = useState<Record<string, string | null>>(() => Object.fromEntries(cls.subjects.map((s) => [s.subjectId, s.teacher?.id ?? null])));
  const save = useMutation({
    mutationFn: () => api(`/school/classes/${cls.id}/subjects`, { method: 'PUT', body: { subjects: Object.entries(picked).map(([subjectId, teacherId]) => ({ subjectId, teacherId })) } }),
    onSuccess: () => {
      toast.success('Subjects saved');
      qc.invalidateQueries({ queryKey: [key] });
    },
    onError: (e) => toast.error(errorText(e)),
  });

  if (subjects.isPending || staff.isPending) return <Loading />;
  if (subjects.error) return <ErrorBox error={subjects.error} />;
  if (!subjects.data.length)
    return (
      <Empty
        title="Add your school’s subjects first"
        action={
          <Link href="/dashboard/settings">
            <Button>Go to Settings</Button>
          </Link>
        }
      />
    );
  const teachers = (staff.data ?? []).map((s) => ({ value: s.id, label: `${s.firstName} ${s.lastName}` }));

  return (
    <Card className="flex flex-col gap-2">
      <p className="mb-2 text-[15px] text-ink-500">Tick the subjects {cls.name} takes and choose who teaches each. Teachers then see this class and can enter its scores.</p>
      {subjects.data.map((s) => {
        const on = s.id in picked;
        return (
          <div key={s.id} className={cx('flex flex-wrap items-center gap-3 rounded-xl px-3 py-2', on && 'bg-violet-50')}>
            <label className="flex min-w-48 flex-1 items-center gap-3 font-bold">
              <input
                type="checkbox"
                checked={on}
                onChange={(e) =>
                  setPicked((p) => {
                    const next = { ...p };
                    if (e.target.checked) next[s.id] = null;
                    else delete next[s.id];
                    return next;
                  })
                }
                className="size-5 accent-violet-500"
              />
              {s.name}
            </label>
            {on ? (
              <select
                aria-label={`Teacher for ${s.name}`}
                value={picked[s.id] ?? ''}
                onChange={(e) => setPicked((p) => ({ ...p, [s.id]: e.target.value || null }))}
                className="h-10 min-w-52 rounded-xl border-2 border-ink-200 bg-white px-3 text-sm font-semibold"
              >
                <option value="">No teacher yet</option>
                {teachers.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
        );
      })}
      <div className="mt-3 flex justify-end">
        <Button loading={save.isPending} onClick={() => save.mutate()}>
          Save subjects
        </Button>
      </div>
    </Card>
  );
}
