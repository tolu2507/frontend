'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, CheckCheck, CircleCheck, Clock, Flag, Library, Pencil, RotateCcw, X } from 'lucide-react';
import { useState } from 'react';

import { MathText } from '@/components/math/MathText';
import { Filters, FilterSelect, Kpi, label, Pager, qs, SearchBox } from '@/components/overwatch/kit';
import { Badge, Button, Card, cx, Empty, ErrorBox, Input, Loading, Modal, Notice, PageHeader, Select, Table, Textarea, type Tone } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { api, errorText } from '@/lib/api';

type Status = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'RETIRED';
type Exam = 'JAMB' | 'WAEC' | 'NECO' | 'BECE' | 'COMMON_ENTRANCE' | 'PRIMARY' | 'NURSERY';
const EXAMS: Exam[] = ['JAMB', 'WAEC', 'NECO', 'BECE', 'COMMON_ENTRANCE', 'PRIMARY', 'NURSERY'];
const EXAM_LABEL: Record<Exam, string> = { JAMB: 'JAMB', WAEC: 'WAEC', NECO: 'NECO', BECE: 'BECE', COMMON_ENTRANCE: 'Common Entrance', PRIMARY: 'Primary class practice', NURSERY: 'Nursery class practice' };
const STATUS: Record<Status, { label: string; tone: Tone }> = {
  DRAFT: { label: 'Draft', tone: 'ink' },
  IN_REVIEW: { label: 'Waiting review', tone: 'sun' },
  APPROVED: { label: 'Live', tone: 'mint' },
  RETIRED: { label: 'Retired', tone: 'coral' },
};
const DIFFICULTY = ['', 'Very easy', 'Easy', 'Medium', 'Hard', 'Very hard'];
const ORIGIN: Record<string, string> = { TEMPLATE: 'Template (answer worked out by code)', GENERATED: 'Written by AI, checked by AI', AUTHORED: 'Written by the BrainBox team' };
const PAGE = 20;

type Counts = Record<Status, number>;
type Summary = {
  openReports: number;
  subjects: { id: string; exam: Exam; name: string; topics: number; pastQuestions: number; questions: Counts }[];
};
type TopicTree = { id: string; name: string; weight: number | null; yearsSeen: number | null; subtopics: { id: string; name: string; questions: number }[] }[];
type Option = { id: string; label: string };
type Question = {
  id: string;
  exam: Exam;
  subject: string;
  topicId: string;
  topic: string;
  difficulty: number;
  stem: string;
  options: Option[];
  answerId: string;
  explanation: string;
  origin: string;
  status: Status;
  checkNotes: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  timesServed: number;
  timesCorrect: number;
  reports: { id: string; reason: string; note: string | null; createdAt: string }[];
  template: { id: string; key: string | null; status: Status; questions: number } | null;
  createdAt: string;
};
type Page = { total: number; page: number; pageSize: number; items: Question[] };
type TemplateRow = { id: string; key: string; status: Status; difficulty: number; topic: string; questions: number; sample: { stem: string; options: Option[]; answerId: string; explanation: string } | null };

const sum = (c: Counts) => c.DRAFT + c.IN_REVIEW + c.APPROVED + c.RETIRED;

export default function QuestionBankPage() {
  const qc = useQueryClient();
  const [f, setF] = useState({ exam: '', subjectId: '', topicId: '', status: 'IN_REVIEW', origin: '', difficulty: '', reported: '', q: '' });
  const [page, setPage] = useState(1);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Question | null>(null);
  const [view, setView] = useState<'questions' | 'templates'>('questions');
  const set = (k: keyof typeof f) => (v: string) => {
    setF((x) => ({ ...x, [k]: v, ...(k === 'exam' ? { subjectId: '', topicId: '' } : k === 'subjectId' ? { topicId: '' } : {}) }));
    setPage(1);
    setPicked(new Set());
  };

  const summary = useQuery({ queryKey: ['ow', 'qbank'], queryFn: () => api<Summary>('/admin/question-bank') });
  const topics = useQuery({ queryKey: ['ow', 'qbank', 'topics', f.subjectId], queryFn: () => api<TopicTree>(`/admin/question-bank/subjects/${f.subjectId}/topics`), enabled: !!f.subjectId });
  const list = useQuery({
    queryKey: ['ow', 'qbank', 'list', f, page],
    queryFn: () => api<Page>(`/admin/question-bank/questions?${qs({ ...f, page, pageSize: PAGE })}`),
    placeholderData: keepPreviousData,
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['ow', 'qbank'] });
  const setStatus = useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: Status }) => api<{ updated: number }>('/admin/question-bank/questions/status', { method: 'POST', body: { ids, status } }),
    onSuccess: (r, v) => {
      toast.success(`${r.updated} ${r.updated === 1 ? 'question' : 'questions'} ${v.status === 'APPROVED' ? 'now live for students' : v.status === 'RETIRED' ? 'retired' : 'sent back to review'}.`);
      setPicked(new Set());
      refresh();
    },
    onError: (e) => toast.error(errorText(e)),
  });
  const templateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Status }) => api<{ updated: number }>(`/admin/question-bank/templates/${id}/status`, { method: 'POST', body: { status } }),
    onSuccess: (r, v) => {
      toast.success(`Template ${v.status === 'APPROVED' ? 'approved' : v.status === 'RETIRED' ? 'retired' : 'sent back to review'}: ${r.updated} questions updated. Future questions from it follow automatically.`);
      refresh();
    },
    onError: (e) => toast.error(errorText(e)),
  });
  const approveMatching = useMutation({
    mutationFn: () => api<{ updated: number; templates: number }>('/admin/question-bank/questions/approve-matching', { method: 'POST', body: { ...Object.fromEntries(Object.entries(f).filter(([k, v]) => v && k !== 'status')), ...(f.difficulty ? { difficulty: Number(f.difficulty) } : {}), ...(f.reported ? { reported: f.reported === 'true' } : {}) } }),
    onSuccess: (r) => {
      toast.success(`${r.updated.toLocaleString()} questions now live for students${r.templates ? `, and ${r.templates} templates approved, so their future questions go live too` : ''}.`);
      setPicked(new Set());
      setPage(1);
      refresh();
    },
    onError: (e) => toast.error(errorText(e)),
  });
  const dismiss = useMutation({
    mutationFn: (reportId: string) => api(`/admin/question-bank/reports/${reportId}/dismiss`, { method: 'POST', body: {} }),
    onSuccess: () => {
      toast.success('Report closed. The question stays as it is.');
      refresh();
    },
    onError: (e) => toast.error(errorText(e)),
  });

  const totals = (summary.data?.subjects ?? []).reduce<Counts>(
    (t, s) => ({ DRAFT: t.DRAFT + s.questions.DRAFT, IN_REVIEW: t.IN_REVIEW + s.questions.IN_REVIEW, APPROVED: t.APPROVED + s.questions.APPROVED, RETIRED: t.RETIRED + s.questions.RETIRED }),
    { DRAFT: 0, IN_REVIEW: 0, APPROVED: 0, RETIRED: 0 },
  );
  const subjects = (summary.data?.subjects ?? []).filter((s) => !f.exam || s.exam === f.exam);
  const withContent = (summary.data?.subjects ?? []).filter((s) => s.topics || s.pastQuestions || sum(s.questions));
  const items = list.data?.items ?? [];
  const allPicked = items.length > 0 && items.every((q) => picked.has(q.id));
  const toggle = (id: string) => setPicked((p) => {
    const n = new Set(p);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    return n;
  });

  return (
    <>
      <PageHeader title="Question bank" subtitle="Every question students can get, by exam, subject and topic. Questions go live only after you approve them." />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Live for students" value={totals.APPROVED.toLocaleString()} icon={<CircleCheck className="size-5" />} tone="mint" />
        <Kpi label="Waiting review" value={totals.IN_REVIEW.toLocaleString()} icon={<Clock className="size-5" />} tone="sun" />
        <Kpi label="Retired" value={totals.RETIRED.toLocaleString()} icon={<Archive className="size-5" />} tone="ink" />
        <Kpi label="Open reports" value={(summary.data?.openReports ?? 0).toLocaleString()} icon={<Flag className="size-5" />} tone="coral" hint="Students flagged these questions" />
      </div>

      {withContent.length ? (
        <Card className="mb-6 p-0">
          <div className="px-4 pt-4 pb-2">
            <h2 className="font-display text-lg font-bold">Coverage</h2>
            <p className="text-sm text-ink-500">Subjects with a syllabus, analysed past papers or questions. Click one to see its questions.</p>
          </div>
          <Table head={['Subject', 'Syllabus topics', 'Past questions analysed', 'Live', 'Waiting review', 'Retired']}>
            {withContent.map((s) => (
              <tr key={s.id} className={cx('cursor-pointer hover:bg-paper', f.subjectId === s.id && 'bg-violet-50')} onClick={() => { setF((x) => ({ ...x, exam: s.exam, subjectId: s.id, topicId: '' })); setPage(1); }}>
                <td className="px-4 py-3 font-bold">
                  {EXAM_LABEL[s.exam]} {s.name}
                </td>
                <td className="px-4 py-3">{s.topics || <span className="text-ink-300">—</span>}</td>
                <td className="px-4 py-3">{s.pastQuestions ? s.pastQuestions.toLocaleString() : <span className="text-ink-300">—</span>}</td>
                <td className="px-4 py-3">{s.questions.APPROVED.toLocaleString()}</td>
                <td className="px-4 py-3">{s.questions.IN_REVIEW ? <Badge tone="sun">{s.questions.IN_REVIEW}</Badge> : 0}</td>
                <td className="px-4 py-3">{s.questions.RETIRED}</td>
              </tr>
            ))}
          </Table>
          <p className="px-4 py-3 text-xs text-ink-500">
            {(summary.data?.subjects.length ?? 0) - withContent.length} more subjects have nothing yet. Each one appears here once its syllabus and questions are added.
          </p>
        </Card>
      ) : null}

      <Filters>
        <FilterSelect label="Exam" value={f.exam} onChange={set('exam')} options={[{ value: '', label: 'All exams' }, ...EXAMS.map((e) => ({ value: e, label: EXAM_LABEL[e] }))]} />
        <FilterSelect label="Subject" value={f.subjectId} onChange={set('subjectId')} options={[{ value: '', label: 'All subjects' }, ...subjects.map((s) => ({ value: s.id, label: f.exam ? s.name : `${EXAM_LABEL[s.exam]} ${s.name}` }))]} />
        {f.subjectId ? (
          <FilterSelect
            label="Topic"
            value={f.topicId}
            onChange={set('topicId')}
            options={[{ value: '', label: 'All topics' }, ...(topics.data ?? []).flatMap((t) => [{ value: t.id, label: t.name }, ...t.subtopics.map((s) => ({ value: s.id, label: `  › ${s.name} (${s.questions})` }))])]}
          />
        ) : null}
        <FilterSelect label="Status" value={f.status} onChange={set('status')} options={[{ value: '', label: 'Any status' }, ...(Object.keys(STATUS) as Status[]).map((s) => ({ value: s, label: STATUS[s].label }))]} />
        <FilterSelect label="Source" value={f.origin} onChange={set('origin')} options={[{ value: '', label: 'Any source' }, { value: 'TEMPLATE', label: 'Templates' }, { value: 'GENERATED', label: 'AI written' }, { value: 'AUTHORED', label: 'BrainBox team' }]} />
        <FilterSelect label="Difficulty" value={f.difficulty} onChange={set('difficulty')} options={[{ value: '', label: 'Any difficulty' }, ...[1, 2, 3, 4, 5].map((d) => ({ value: String(d), label: `${d} · ${DIFFICULTY[d]}` }))]} />
        <FilterSelect label="Reports" value={f.reported} onChange={set('reported')} options={[{ value: '', label: 'Reported or not' }, { value: 'true', label: 'Reported only' }]} />
        <SearchBox value={f.q} onChange={set('q')} placeholder="Search question text" />
      </Filters>

      {f.subjectId ? (
        <div className="mb-4 flex w-fit gap-1 rounded-xl bg-ink-100 p-1 text-sm font-bold" role="tablist">
          {(['questions', 'templates'] as const).map((v) => (
            <button key={v} type="button" role="tab" aria-selected={view === v} onClick={() => setView(v)} className={cx('rounded-lg px-3 py-1.5', view === v ? 'bg-white shadow-sm' : 'text-ink-500')}>
              {v === 'questions' ? 'Questions' : 'Templates'}
            </button>
          ))}
        </div>
      ) : null}

      {f.subjectId && view === 'templates' ? (
        <TemplateReview subjectId={f.subjectId} onStatus={(id, status) => templateStatus.mutateAsync({ id, status })} />
      ) : (
      <>
      {picked.size ? (
        <div className="sticky top-2 z-10 mb-3 flex flex-wrap items-center gap-2 rounded-2xl bg-ink px-4 py-3 text-white shadow-lg">
          <span className="mr-auto text-sm font-bold">{picked.size} selected</span>
          <Button size="sm" loading={setStatus.isPending} onClick={() => setStatus.mutate({ ids: [...picked], status: 'APPROVED' })} icon={<CheckCheck className="size-4" />}>
            Approve
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setStatus.mutate({ ids: [...picked], status: 'IN_REVIEW' })} icon={<RotateCcw className="size-4" />}>
            Back to review
          </Button>
          <Button size="sm" variant="secondary" onClick={() => confirm(`Retire ${picked.size} questions? Students stop getting them.`) && setStatus.mutate({ ids: [...picked], status: 'RETIRED' })} icon={<Archive className="size-4" />}>
            Retire
          </Button>
          <Button size="sm" variant="ghost" className="text-white" aria-label="Clear selection" onClick={() => setPicked(new Set())} icon={<X className="size-4" />} />
        </div>
      ) : null}

      {list.isPending ? (
        <Loading />
      ) : list.error ? (
        <ErrorBox error={list.error} onRetry={list.refetch} />
      ) : items.length === 0 ? (
        <Empty
          icon={<Library className="size-7" />}
          title={f.status === 'IN_REVIEW' ? 'Nothing waiting for review' : 'No questions match'}
          message={totals.IN_REVIEW + totals.APPROVED === 0 ? 'Questions appear here once templates or the writing script add them for a subject.' : 'Try another filter.'}
        />
      ) : (
        <div className={list.isPlaceholderData ? 'opacity-60 transition' : 'transition'}>
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <label className="mr-auto flex w-fit cursor-pointer items-center gap-2 text-sm font-bold text-ink-500">
              <input type="checkbox" className="size-4 accent-violet-600" checked={allPicked} onChange={() => setPicked(allPicked ? new Set() : new Set(items.map((q) => q.id)))} />
              Select all on this page
            </label>
            {f.status === 'IN_REVIEW' && list.data.total > items.length ? (
              <Button
                size="sm"
                variant="secondary"
                loading={approveMatching.isPending}
                icon={<CheckCheck className="size-4" />}
                onClick={() => confirm(`Approve all ${list.data.total.toLocaleString()} questions waiting review that match these filters? They go live for students straight away.`) && approveMatching.mutate()}
              >
                Approve all {list.data.total.toLocaleString()} waiting
              </Button>
            ) : null}
          </div>
          <ol className="flex flex-col gap-3">
            {items.map((q) => (
              <QuestionCard
                key={q.id}
                q={q}
                picked={picked.has(q.id)}
                onPick={() => toggle(q.id)}
                onEdit={() => setEditing(q)}
                onStatus={(status) => setStatus.mutate({ ids: [q.id], status })}
                onDismiss={(id) => dismiss.mutate(id)}
                onTemplate={(id, status) => templateStatus.mutate({ id, status })}
              />
            ))}
          </ol>
          <Pager page={page} pageSize={PAGE} total={list.data.total} onPage={(p) => { setPage(p); setPicked(new Set()); window.scrollTo({ top: 0 }); }} />
        </div>
      )}
      </>
      )}
      {editing ? <QuestionEditor q={editing} onClose={() => setEditing(null)} onSaved={refresh} /> : null}
    </>
  );
}

/** Every template in a subject with one sample each: check the sample, then decide for all its questions at once. */
function TemplateReview({ subjectId, onStatus }: { subjectId: string; onStatus: (id: string, s: Status) => Promise<unknown> }) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['ow', 'qbank', 'templates', subjectId], queryFn: () => api<TemplateRow[]>(`/admin/question-bank/subjects/${subjectId}/templates`) });
  const [busy, setBusy] = useState(false);
  if (q.isPending) return <Loading />;
  if (q.error) return <ErrorBox error={q.error} onRetry={q.refetch} />;
  const rows = q.data;
  if (!rows.length) return <Empty icon={<Library className="size-7" />} title="No templates in this subject" message="Its questions come from other sources. Switch to Questions to review them." />;
  const waiting = rows.filter((t) => t.status === 'IN_REVIEW' || t.status === 'DRAFT');
  const approveAll = async () => {
    if (!confirm(`Approve all ${waiting.length} waiting templates (${waiting.reduce((n, t) => n + t.questions, 0).toLocaleString()} questions)? Only do this after checking their samples.`)) return;
    setBusy(true);
    let updated = 0;
    try {
      // One at a time and without a toast each; one summary at the end.
      for (const t of waiting) updated += (await api<{ updated: number }>(`/admin/question-bank/templates/${t.id}/status`, { method: 'POST', body: { status: 'APPROVED' } })).updated;
      toast.success(`${waiting.length} templates approved: ${updated.toLocaleString()} questions now live for students.`);
    } catch (e) {
      toast.error(errorText(e));
    } finally {
      setBusy(false);
      qc.invalidateQueries({ queryKey: ['ow', 'qbank'] });
    }
  };
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 text-sm text-ink-500">
        <span className="mr-auto">
          {rows.length} templates · {waiting.length} waiting review · {rows.filter((t) => t.status === 'APPROVED').length} live
        </span>
        {waiting.length > 1 ? (
          <Button size="sm" variant="secondary" loading={busy} onClick={approveAll} icon={<CheckCheck className="size-4" />}>
            Approve all {waiting.length} waiting
          </Button>
        ) : null}
      </div>
      <ol className="flex flex-col gap-3">
        {rows.map((t) => (
          <TemplateCard key={t.id} t={t} onStatus={(s) => onStatus(t.id, s)} />
        ))}
      </ol>
    </div>
  );
}

function TemplateCard({ t, onStatus }: { t: TemplateRow; onStatus: (s: Status) => Promise<unknown> }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="rounded-2xl border border-ink-100 bg-white p-4">
      <div className="mb-2 flex flex-wrap items-center gap-1.5 text-xs">
        <Badge tone={STATUS[t.status].tone}>{STATUS[t.status].label}</Badge>
        <code className="rounded bg-paper px-1.5 py-0.5 text-xs">{t.key}</code>
        <span className="font-semibold text-ink-500">{t.topic}</span>
        <span className="text-ink-300">·</span>
        <span className="text-ink-500">
          {t.questions.toLocaleString()} questions · difficulty {t.difficulty}
        </span>
      </div>
      {t.sample ? (
        <>
          <MathText text={t.sample.stem} className="block text-[15px] leading-relaxed font-semibold" />
          <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {t.sample.options.map((o, i) => (
              <li key={o.id} className={cx('flex items-start gap-2 rounded-xl border-2 px-3 py-2 text-sm', o.id === t.sample!.answerId ? 'border-mint-600 bg-mint-50 font-bold' : 'border-ink-100')}>
                <span className="font-extrabold text-ink-300">{'ABCDE'[i]}</span>
                <MathText text={o.label} />
                {o.id === t.sample!.answerId ? <CircleCheck className="ml-auto size-4 shrink-0 text-mint-700" aria-label="Correct answer" /> : null}
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => setOpen((x) => !x)} className="mt-2 text-sm font-bold text-violet-700 hover:underline">
            {open ? 'Hide explanation' : 'Show explanation'}
          </button>
          {open ? (
            <div className="mt-2 rounded-xl bg-paper p-3 text-sm leading-relaxed">
              <MathText text={t.sample.explanation} />
            </div>
          ) : null}
        </>
      ) : (
        <p className="text-sm text-ink-500">No questions made from this template yet.</p>
      )}
      <div className="mt-3 flex flex-wrap justify-end gap-1 border-t border-ink-100 pt-3">
        {t.status !== 'APPROVED' ? (
          <Button size="sm" icon={<CheckCheck className="size-4" />} onClick={() => onStatus('APPROVED')}>
            Approve all {t.questions.toLocaleString()}
          </Button>
        ) : null}
        {t.status !== 'RETIRED' ? (
          <Button size="sm" variant="ghost" icon={<Archive className="size-4" />} onClick={() => confirm(`Retire this template? Its ${t.questions} questions stop being used.`) && onStatus('RETIRED')}>
            Retire
          </Button>
        ) : (
          <Button size="sm" variant="ghost" icon={<RotateCcw className="size-4" />} onClick={() => onStatus('IN_REVIEW')}>
            Back to review
          </Button>
        )}
      </div>
    </li>
  );
}

function QuestionCard({ q, picked, onPick, onEdit, onStatus, onDismiss, onTemplate }: { q: Question; picked: boolean; onPick: () => void; onEdit: () => void; onStatus: (s: Status) => void; onDismiss: (reportId: string) => void; onTemplate: (id: string, s: Status) => void }) {
  const [open, setOpen] = useState(false);
  const rate = q.timesServed ? Math.round((q.timesCorrect / q.timesServed) * 100) : null;
  return (
    <li className={cx('rounded-2xl border bg-white p-4', picked ? 'border-violet-400 ring-4 ring-violet-100' : 'border-ink-100')}>
      <div className="flex items-start gap-3">
        <input type="checkbox" className="mt-1 size-4 shrink-0 accent-violet-600" checked={picked} onChange={onPick} aria-label="Select question" />
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-1.5 text-xs">
            <Badge tone={STATUS[q.status].tone}>{STATUS[q.status].label}</Badge>
            <Badge tone="violet">
              {EXAM_LABEL[q.exam]} {q.subject}
            </Badge>
            <span className="font-semibold text-ink-500">{q.topic}</span>
            <span className="text-ink-300">·</span>
            <span className="text-ink-500">
              Difficulty {q.difficulty} ({DIFFICULTY[q.difficulty]})
            </span>
            <span className="text-ink-300">·</span>
            <span className="text-ink-500">{ORIGIN[q.origin] ?? label(q.origin)}</span>
            {q.reports.length ? (
              <Badge tone="coral">
                <Flag className="size-3" /> {q.reports.length} {q.reports.length === 1 ? 'report' : 'reports'}
              </Badge>
            ) : null}
          </div>
          <MathText text={q.stem} className="block text-[15px] leading-relaxed font-semibold" />
          <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {q.options.map((o, i) => (
              <li key={o.id} className={cx('flex items-start gap-2 rounded-xl border-2 px-3 py-2 text-sm', o.id === q.answerId ? 'border-mint-600 bg-mint-50 font-bold' : 'border-ink-100')}>
                <span className="font-extrabold text-ink-300">{'ABCDE'[i]}</span>
                <MathText text={o.label} />
                {o.id === q.answerId ? <CircleCheck className="ml-auto size-4 shrink-0 text-mint-700" aria-label="Correct answer" /> : null}
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => setOpen((x) => !x)} className="mt-2 text-sm font-bold text-violet-700 hover:underline">
            {open ? 'Hide explanation' : 'Show explanation'}
          </button>
          {open ? (
            <div className="mt-2 rounded-xl bg-paper p-3 text-sm leading-relaxed">
              <MathText text={q.explanation} />
              {q.checkNotes ? <p className="mt-2 text-xs text-ink-500">Automatic check: {q.checkNotes}</p> : null}
            </div>
          ) : null}
          {q.template ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-sky-100/60 p-3 text-sm">
              <span className="mr-auto text-sky-800">
                One of <b>{q.template.questions}</b> questions from the template <code className="rounded bg-white px-1 text-xs">{q.template.key}</code>. Every one is made the same way and its answer is worked out by code, so if a few are right, they all are. Check a few, then decide for all of them.
              </span>
              {q.template.status !== 'APPROVED' ? (
                <Button size="sm" onClick={() => onTemplate(q.template!.id, 'APPROVED')} icon={<CheckCheck className="size-4" />}>
                  Approve all {q.template.questions}
                </Button>
              ) : (
                <Badge tone="mint">Template approved</Badge>
              )}
              {q.template.status !== 'RETIRED' ? (
                <Button size="sm" variant="ghost" onClick={() => confirm(`Retire the whole template? Its ${q.template!.questions} questions stop being used.`) && onTemplate(q.template!.id, 'RETIRED')}>
                  Retire template
                </Button>
              ) : null}
            </div>
          ) : null}
          {q.reports.map((r) => (
            <Notice key={r.id} tone="coral" title={`Reported: ${r.reason}`} action={<Button size="sm" variant="ghost" onClick={() => onDismiss(r.id)}>Question is fine</Button>}>
              {r.note || 'No note.'} Editing the question closes the report.
            </Notice>
          ))}
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-ink-100 pt-3 text-xs text-ink-500">
            <span>
              {q.timesServed ? `Answered ${q.timesServed.toLocaleString()} times · ${rate}% right` : 'Not answered yet'}
              {q.reviewedBy ? ` · reviewed by ${q.reviewedBy}` : ''}
            </span>
            <div className="ml-auto flex gap-1">
              <Button size="sm" variant="ghost" icon={<Pencil className="size-4" />} onClick={onEdit}>
                Edit
              </Button>
              {q.status !== 'APPROVED' ? (
                <Button size="sm" variant="secondary" icon={<CheckCheck className="size-4" />} onClick={() => onStatus('APPROVED')}>
                  Approve
                </Button>
              ) : null}
              {q.status !== 'RETIRED' ? (
                <Button size="sm" variant="ghost" icon={<Archive className="size-4" />} onClick={() => confirm('Retire this question? Students stop getting it.') && onStatus('RETIRED')}>
                  Retire
                </Button>
              ) : (
                <Button size="sm" variant="ghost" icon={<RotateCcw className="size-4" />} onClick={() => onStatus('IN_REVIEW')}>
                  Back to review
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

function QuestionEditor({ q, onClose, onSaved }: { q: Question; onClose: () => void; onSaved: () => void }) {
  const [d, setD] = useState({ stem: q.stem, options: q.options, answerId: q.answerId, explanation: q.explanation, difficulty: q.difficulty, topicId: q.topicId });
  const subjectId = useQuery({ queryKey: ['ow', 'qbank'], queryFn: () => api<Summary>('/admin/question-bank') }).data?.subjects.find((s) => s.exam === q.exam && s.name === q.subject)?.id;
  const topics = useQuery({ queryKey: ['ow', 'qbank', 'topics', subjectId], queryFn: () => api<TopicTree>(`/admin/question-bank/subjects/${subjectId}/topics`), enabled: !!subjectId });
  const save = useMutation({
    mutationFn: () => api(`/admin/question-bank/questions/${q.id}`, { method: 'PATCH', body: d }),
    onSuccess: () => {
      toast.success(q.reports.length ? 'Question saved and its reports closed.' : 'Question saved.');
      onSaved();
      onClose();
    },
    onError: (e) => toast.error(errorText(e)),
  });
  const incomplete = d.stem.trim().length < 5 || !d.explanation.trim() || d.options.some((o) => !o.label.trim());

  return (
    <Modal
      open
      wide
      onClose={onClose}
      title="Edit question"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={save.isPending} disabled={incomplete} onClick={() => save.mutate()}>
            Save
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {q.timesServed ? <Notice tone="sun">Students have answered this {q.timesServed} times. Their past results stay as they were.</Notice> : null}
        <p className="text-sm text-ink-500">
          Write maths between dollar signs, e.g. <code className="rounded bg-paper px-1">{'$\\frac{2}{5}$'}</code>. The preview under each box shows what students see.
        </p>
        <div>
          <Textarea label="Question" rows={4} value={d.stem} onChange={(e) => setD({ ...d, stem: e.target.value })} />
          <div className="mt-1 rounded-xl bg-paper p-2 text-sm">
            <MathText text={d.stem} />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-bold">Options (tick the right answer)</span>
          {d.options.map((o, i) => (
            <label key={o.id} className={cx('flex items-center gap-2 rounded-xl border-2 px-2 py-1', d.answerId === o.id ? 'border-mint-600 bg-mint-50' : 'border-ink-200')}>
              <input type="radio" name="answer" checked={d.answerId === o.id} onChange={() => setD({ ...d, answerId: o.id })} className="size-4 accent-mint-600" aria-label={`Option ${'ABCDE'[i]} is correct`} />
              <span className="text-xs font-extrabold text-ink-300">{'ABCDE'[i]}</span>
              <input value={o.label} onChange={(e) => setD({ ...d, options: d.options.map((x) => (x.id === o.id ? { ...x, label: e.target.value } : x)) })} className="h-10 min-w-0 flex-1 bg-transparent outline-none" />
              <span className="hidden max-w-[40%] truncate text-sm sm:block">
                <MathText text={o.label} />
              </span>
            </label>
          ))}
        </div>
        <div>
          <Textarea label="Explanation" rows={5} value={d.explanation} onChange={(e) => setD({ ...d, explanation: e.target.value })} />
          <div className="mt-1 rounded-xl bg-paper p-2 text-sm">
            <MathText text={d.explanation} />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Select label="Difficulty" value={String(d.difficulty)} onChange={(e) => setD({ ...d, difficulty: Number(e.target.value) })} options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n} · ${DIFFICULTY[n]}` }))} />
          <Select
            label="Topic"
            value={d.topicId}
            onChange={(e) => setD({ ...d, topicId: e.target.value })}
            options={(topics.data ?? []).flatMap((t) => (t.subtopics.length ? t.subtopics.map((s) => ({ value: s.id, label: `${t.name} › ${s.name}` })) : [{ value: t.id, label: t.name }]))}
          />
        </div>
        <Input label="Subject" value={`${EXAM_LABEL[q.exam]} ${q.subject}`} disabled readOnly />
      </div>
    </Modal>
  );
}
