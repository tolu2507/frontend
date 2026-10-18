'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BarChart3, BookOpenCheck, Flame, GraduationCap, Pencil, Plus, Sparkles, Target, Trash2, Trophy, Wand2 } from 'lucide-react';
import { useState } from 'react';

import { BarList, ChartCard, ColumnChart, compact, Meter, TrendChart } from '@/components/overwatch/charts';
import { Filters, FilterSelect, Kpi, label, Pager, qs, RangeTabs, SchoolFilter, SearchBox, useSchoolOptions, type Paged } from '@/components/overwatch/kit';
import { Badge, Button, cx, Empty, ErrorBox, Input, Loading, Modal, Notice, PageHeader, Select, Table, Tabs } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { api, errorText } from '@/lib/api';

type Level = 'NURSERY' | 'PRIMARY' | 'JUNIOR_SECONDARY' | 'SENIOR_SECONDARY';
const LEVELS: Level[] = ['NURSERY', 'PRIMARY', 'JUNIOR_SECONDARY', 'SENIOR_SECONDARY'];
const TYPES = ['QUIZ', 'PRACTICE', 'CHALLENGE', 'READING', 'GAME'];

type Who = { id: string; name: string; school: string | null; grade: string | null; streak: number; xpTotal: number };
type Learning = {
  totals: { students: number; activeLearners: number; attempts: number; avgScore: number | null; xp: number; lessonQuizzes: number };
  series: { day: string; attempts: number; learners: number; avgScore: number | null }[];
  bySubject: { subject: string; attempts: number; learners: number; avgScore: number | null }[];
  bySchool: { id: string; name: string; students: number; learners: number; attempts: number; avgScore: number | null; participation: number }[];
  streaks: { bucket: string; students: number }[];
  topStudents: (Who & { xp: number })[];
  struggling: (Who & { attempts: number; avgScore: number | null })[];
  hardest: { id: string; title: string; subject: string; level: string; attempts: number; avgScore: number | null }[];
};

export default function LearningPage() {
  const [tab, setTab] = useState<'analytics' | 'quests'>('analytics');
  return (
    <>
      <PageHeader title="Learning" subtitle="How students are learning, and the quests they learn with." />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'analytics', label: 'Student progress', icon: <BarChart3 className="size-4" /> },
          { value: 'quests', label: 'Quests', icon: <BookOpenCheck className="size-4" /> },
        ]}
      />
      {tab === 'analytics' ? <Analytics /> : <Quests />}
    </>
  );
}

// ── Analytics ──────────────────────────────────────────

const scoreTone = (s: number | null) => (s === null ? 'ink' : s >= 70 ? 'mint' : s >= 50 ? 'sun' : 'coral');

function Analytics() {
  const [days, setDays] = useState(30);
  const [schoolId, setSchoolId] = useState('');
  const q = useQuery({ queryKey: ['ow', 'learning', days, schoolId], queryFn: () => api<Learning>(`/admin/learning?${qs({ days, schoolId })}`), placeholderData: keepPreviousData });
  return (
    <>
      <Filters>
        <SchoolFilter value={schoolId} onChange={setSchoolId} />
        <div className="ml-auto">
          <RangeTabs value={days} onChange={setDays} />
        </div>
      </Filters>
      {q.isPending ? (
        <Loading rows={6} />
      ) : q.error ? (
        <ErrorBox error={q.error} onRetry={q.refetch} />
      ) : (
        <div className={cx('flex flex-col gap-6 transition', q.isPlaceholderData && 'opacity-60')}>
          <LearningDashboard d={q.data} days={days} />
        </div>
      )}
    </>
  );
}

function LearningDashboard({ d, days }: { d: Learning; days: number }) {
  const t = d.totals;
  const participation = t.students ? Math.round((t.activeLearners / t.students) * 100) : 0;
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Students learning" value={t.activeLearners.toLocaleString()} hint={`${participation}% of ${t.students.toLocaleString()} students`} icon={<GraduationCap className="size-5" />} />
        <Kpi label="Quests finished" tone="sky" value={t.attempts.toLocaleString()} hint={t.activeLearners ? `${(t.attempts / t.activeLearners).toFixed(1)} per learner` : undefined} icon={<BookOpenCheck className="size-5" />} />
        <Kpi label="Average score" tone={t.avgScore === null ? 'ink' : t.avgScore >= 70 ? 'mint' : t.avgScore >= 50 ? 'sun' : 'coral'} value={t.avgScore === null ? '—' : `${t.avgScore}%`} icon={<Target className="size-5" />} />
        <Kpi label="XP earned" tone="sun" value={compact(t.xp)} icon={<Sparkles className="size-5" />} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Learning every day" subtitle="Quests finished and students who learned">
          <TrendChart data={d.series} series={[{ key: 'attempts', label: 'Quests finished' }, { key: 'learners', label: 'Students learning', color: '#0e8f7a' }]} format={compact} empty="No quests finished in this period" />
        </ChartCard>
        <ChartCard title="Average score" subtitle="Per day, across all quests (%)">
          <TrendChart data={d.series} series={[{ key: 'avgScore', label: 'Average score', color: '#1d6fe0' }]} format={(v) => `${v}%`} empty="No scores yet" />
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Subjects" subtitle="Quests finished, with average score">
          <BarList items={d.bySubject.map((s) => ({ key: s.subject, label: s.subject, value: s.attempts, hint: `${s.learners} students · average ${s.avgScore ?? '—'}%` }))} empty="No quests finished yet." />
        </ChartCard>
        <ChartCard title="Streaks" subtitle="Students by current daily streak">
          <ColumnChart data={d.streaks} x="bucket" xFormat={(v) => `${v} days`} series={[{ key: 'students', label: 'Students', color: '#d49a00' }]} format={compact} height={200} />
        </ChartCard>
        <ChartCard title="Hardest quests" subtitle="Lowest average score (3+ attempts). Check the questions.">
          {d.hardest.length ? (
            <ul className="flex flex-col divide-y divide-ink-100">
              {d.hardest.map((h) => (
                <li key={h.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{h.title}</div>
                    <div className="text-xs text-ink-500">
                      {h.subject} · {label(h.level)} · {h.attempts} tries
                    </div>
                  </div>
                  <Badge tone={scoreTone(h.avgScore)}>{h.avgScore}%</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-500">Not enough attempts yet.</p>
          )}
        </ChartCard>
      </div>

      <ChartCard title="Schools" subtitle={`Participation = share of the school’s students who finished a quest in the last ${days} days`}>
        <Table head={['School', 'Students', 'Learning', 'Participation', 'Quests', 'Average score']} className="shadow-none">
          {d.bySchool.map((s) => (
            <tr key={s.id} className="hover:bg-paper">
              <td className="px-4 py-2.5 font-bold">{s.name}</td>
              <td className="px-4 py-2.5">{s.students}</td>
              <td className="px-4 py-2.5">{s.learners}</td>
              <td className="min-w-36 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <Meter value={s.participation} tone={s.participation >= 50 ? 'mint' : s.participation >= 20 ? 'sun' : 'coral'} />
                  <span className="w-10 text-right text-sm font-semibold">{s.participation}%</span>
                </div>
              </td>
              <td className="px-4 py-2.5">{s.attempts}</td>
              <td className="px-4 py-2.5">{s.avgScore === null ? <span className="text-ink-300">—</span> : <Badge tone={scoreTone(s.avgScore)}>{s.avgScore}%</Badge>}</td>
            </tr>
          ))}
        </Table>
      </ChartCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Top learners" subtitle={`Most XP in the last ${days} days`}>
          <People rows={d.topStudents} right={(s) => <span className="font-display font-bold">{s.xp.toLocaleString()} XP</span>} empty="No XP earned yet." icon={<Trophy className="size-4 text-sun-600" />} />
        </ChartCard>
        <ChartCard title="Students who need help" subtitle="Averaging under 50% over 3 or more quests. Worth telling their parent or school.">
          <People rows={d.struggling} right={(s) => <Badge tone="coral">{s.avgScore}% · {s.attempts} quests</Badge>} empty="Nobody is struggling right now." />
        </ChartCard>
      </div>
    </>
  );
}

function People<T extends Who>({ rows, right, empty, icon }: { rows: T[]; right: (r: T) => React.ReactNode; empty: string; icon?: React.ReactNode }) {
  if (!rows.length) return <p className="text-sm text-ink-500">{empty}</p>;
  return (
    <ol className="flex flex-col divide-y divide-ink-100">
      {rows.map((s, i) => (
        <li key={s.id} className="flex items-center gap-3 py-2">
          <span className="w-5 text-right text-sm font-bold text-ink-300">{i + 1}</span>
          {icon && i < 3 ? icon : null}
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold">{s.name}</div>
            <div className="text-xs text-ink-500">
              {[s.school ?? 'No school', s.grade && label(s.grade)].filter(Boolean).join(' · ')}
              {s.streak ? (
                <span className="ml-1 inline-flex items-center gap-0.5">
                  · <Flame className="size-3 text-coral-500" aria-hidden /> {s.streak}
                </span>
              ) : null}
            </div>
          </div>
          {right(s)}
        </li>
      ))}
    </ol>
  );
}

// ── Quests (content manager) ───────────────────────────

type QuestRow = { id: string; title: string; subject: string; level: Level; gradeName: string | null; topic: string | null; type: string; xpReward: number; isPublished: boolean; school: { id: string; name: string } | null; questions: number; attempts: number; avgScore: number | null; createdAt: string };
type Question = { prompt: string; options: string[]; answerIndex: number };
type Draft = { id?: string; schoolId: string; subject: string; level: Level; gradeName: string; topic: string; title: string; type: string; xpReward: number; isPublished: boolean; questions: Question[]; attempts?: number };

const blankQuestion = (): Question => ({ prompt: '', options: ['', '', '', ''], answerIndex: 0 });
const blankDraft = (): Draft => ({ schoolId: '', subject: 'Mathematics', level: 'PRIMARY', gradeName: '', topic: '', title: '', type: 'QUIZ', xpReward: 10, isPublished: false, questions: [blankQuestion(), blankQuestion(), blankQuestion()] });
const PAGE = 25;

function Quests() {
  const qc = useQueryClient();
  const [f, setF] = useState({ q: '', level: '', subject: '', schoolId: '', published: '' });
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Draft | null>(null);
  const set = (k: keyof typeof f) => (v: string) => (setF((x) => ({ ...x, [k]: v })), setPage(1));
  const list = useQuery({ queryKey: ['ow', 'quests', f, page], queryFn: () => api<Paged<QuestRow> & { subjects: string[] }>(`/admin/activities?${qs({ ...f, page, pageSize: PAGE })}`), placeholderData: keepPreviousData });

  const toggle = useMutation({
    mutationFn: (r: QuestRow) => api(`/admin/activities/${r.id}`, { method: 'PATCH', body: { isPublished: !r.isPublished } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ow', 'quests'] }),
    onError: (e) => toast.error(errorText(e)),
  });
  const remove = useMutation({
    mutationFn: (r: QuestRow) => api<{ deleted: boolean }>(`/admin/activities/${r.id}`, { method: 'DELETE' }),
    onSuccess: (r) => {
      toast.success(r.deleted ? 'Quest deleted.' : 'Students have played this quest, so it was unpublished instead of deleted.');
      qc.invalidateQueries({ queryKey: ['ow', 'quests'] });
    },
    onError: (e) => toast.error(errorText(e)),
  });
  const open = async (id: string) => {
    try {
      const a = await api<Draft & { schoolId: string | null; gradeName: string | null; topic: string | null }>(`/admin/activities/${id}`);
      setEditing({ ...a, schoolId: a.schoolId ?? '', gradeName: a.gradeName ?? '', topic: a.topic ?? '' });
    } catch (e) {
      toast.error(errorText(e));
    }
  };

  return (
    <>
      <Filters>
        <SearchBox value={f.q} onChange={set('q')} placeholder="Title or topic" />
        <FilterSelect label="Level" value={f.level} onChange={set('level')} options={[{ value: '', label: 'All levels' }, ...LEVELS.map((l) => ({ value: l, label: label(l) }))]} />
        <FilterSelect label="Subject" value={f.subject} onChange={set('subject')} options={[{ value: '', label: 'All subjects' }, ...(list.data?.subjects ?? []).map((s) => ({ value: s, label: s }))]} />
        <SchoolFilter value={f.schoolId} onChange={set('schoolId')} allLabel="All quests" extra={[{ value: 'global', label: 'Every school (shared)' }]} />
        <FilterSelect label="State" value={f.published} onChange={set('published')} options={[{ value: '', label: 'Live & drafts' }, { value: 'true', label: 'Live' }, { value: 'false', label: 'Drafts' }]} />
        <div className="ml-auto">
          <Button icon={<Plus className="size-4" />} onClick={() => setEditing(blankDraft())}>
            New quest
          </Button>
        </div>
      </Filters>
      {list.isPending ? (
        <Loading />
      ) : list.error ? (
        <ErrorBox error={list.error} onRetry={list.refetch} />
      ) : list.data.rows.length === 0 ? (
        <Empty icon={<BookOpenCheck className="size-7" />} title="No quests found" action={<Button onClick={() => setEditing(blankDraft())}>New quest</Button>} />
      ) : (
        <div className={list.isPlaceholderData ? 'opacity-60 transition' : 'transition'}>
          <Table head={['Quest', 'Subject & level', 'For', 'Played', 'Avg. score', 'State', '']}>
            {list.data.rows.map((r) => (
              <tr key={r.id} className="hover:bg-paper">
                <td className="px-4 py-3">
                  <button type="button" onClick={() => open(r.id)} className="text-left font-bold hover:text-violet-700">
                    {r.title}
                  </button>
                  <div className="text-xs text-ink-500">
                    {r.topic ?? label(r.type)} · {r.questions} questions · {r.xpReward} XP
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold">{r.subject}</div>
                  <div className="text-xs text-ink-500">{r.gradeName ?? label(r.level)}</div>
                </td>
                <td className="px-4 py-3">{r.school ? r.school.name : <Badge tone="violet">Every school</Badge>}</td>
                <td className="px-4 py-3">{r.attempts.toLocaleString()}</td>
                <td className="px-4 py-3">{r.avgScore === null ? <span className="text-ink-300">—</span> : <Badge tone={scoreTone(r.avgScore)}>{r.avgScore}%</Badge>}</td>
                <td className="px-4 py-3">
                  <button type="button" onClick={() => toggle.mutate(r)} title={r.isPublished ? 'Click to unpublish' : 'Click to publish'}>
                    <Badge tone={r.isPublished ? 'mint' : 'ink'}>{r.isPublished ? 'live' : 'draft'}</Badge>
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" icon={<Pencil className="size-4" />} onClick={() => open(r.id)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="ghost" aria-label={`Delete ${r.title}`} icon={<Trash2 className="size-4" />} onClick={() => confirm(`Delete “${r.title}”?${r.attempts ? ' Students have played it, so it will be unpublished instead.' : ''}`) && remove.mutate(r)} />
                  </div>
                </td>
              </tr>
            ))}
          </Table>
          <Pager page={page} pageSize={PAGE} total={list.data.total} onPage={setPage} />
        </div>
      )}
      {editing ? <QuestEditor initial={editing} onClose={() => setEditing(null)} /> : null}
    </>
  );
}

function QuestEditor({ initial, onClose }: { initial: Draft; onClose: () => void }) {
  const qc = useQueryClient();
  const schools = useSchoolOptions();
  const [d, setD] = useState<Draft>(initial);
  const [count, setCount] = useState(5);
  const upd = (patch: Partial<Draft>) => setD((x) => ({ ...x, ...patch }));
  const updQ = (i: number, patch: Partial<Question>) => setD((x) => ({ ...x, questions: x.questions.map((q, j) => (j === i ? { ...q, ...patch } : q)) }));

  const draft = useMutation({
    mutationFn: () => api<{ title: string; questions: Question[] }>('/admin/activities/draft', { method: 'POST', body: { schoolId: d.schoolId || undefined, subject: d.subject, level: d.level, gradeName: d.gradeName || undefined, topic: d.topic, count } }),
    onSuccess: (r) => {
      upd({ title: d.title || r.title, questions: r.questions });
      toast.success('Draft written. Check every answer before publishing.');
    },
    onError: (e) => toast.error(errorText(e)),
  });
  const save = useMutation({
    mutationFn: () => {
      const body = { schoolId: d.schoolId || null, subject: d.subject, level: d.level, gradeName: d.gradeName || null, topic: d.topic || null, title: d.title, type: d.type, xpReward: d.xpReward, isPublished: d.isPublished, questions: d.questions };
      return d.id ? api(`/admin/activities/${d.id}`, { method: 'PATCH', body }) : api('/admin/activities', { method: 'POST', body });
    },
    onSuccess: () => {
      toast.success(d.isPublished ? 'Quest saved and live for students.' : 'Quest saved as a draft.');
      qc.invalidateQueries({ queryKey: ['ow', 'quests'] });
      onClose();
    },
    onError: (e) => toast.error(errorText(e)),
  });
  const incomplete = !d.title.trim() || d.questions.length < 3 || d.questions.some((q) => !q.prompt.trim() || q.options.some((o) => !o.trim()));

  return (
    <Modal
      open
      wide
      onClose={onClose}
      title={d.id ? 'Edit quest' : 'New quest'}
      footer={
        <>
          <label className="mr-auto flex cursor-pointer items-center gap-2 text-sm font-bold">
            <input type="checkbox" checked={d.isPublished} onChange={(e) => upd({ isPublished: e.target.checked })} className="size-5 accent-mint-600" />
            Live for students
          </label>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={save.isPending} disabled={incomplete} onClick={() => save.mutate()}>
            Save quest
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {d.attempts ? <Notice tone="sun">Students have played this quest {d.attempts} times. Their past scores stay as they were.</Notice> : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <Select label="For" value={d.schoolId} onChange={(e) => upd({ schoolId: e.target.value })} options={[{ value: '', label: 'Every school (shared)' }, ...(schools.data ?? []).map((s) => ({ value: s.id, label: `${s.name} only` }))]} hint={d.schoolId ? 'Uses this school’s curriculum when the AI drafts.' : undefined} />
          <Input label="Subject" value={d.subject} onChange={(e) => upd({ subject: e.target.value })} />
          <Select label="Level" value={d.level} onChange={(e) => upd({ level: e.target.value as Level })} options={LEVELS.map((l) => ({ value: l, label: label(l) }))} />
          <Input label="Class (optional)" value={d.gradeName} onChange={(e) => upd({ gradeName: e.target.value })} placeholder="e.g. JSS2" />
          <Input label="Topic" value={d.topic} onChange={(e) => upd({ topic: e.target.value })} placeholder="e.g. Fractions" />
          <Input label="Quest title" value={d.title} onChange={(e) => upd({ title: e.target.value })} />
          <Select label="Type" value={d.type} onChange={(e) => upd({ type: e.target.value })} options={TYPES.map((t) => ({ value: t, label: label(t) }))} />
          <Input label="XP reward" type="number" min={5} max={200} value={d.xpReward} onChange={(e) => upd({ xpReward: Number(e.target.value) })} />
        </div>

        <div className="flex flex-wrap items-end gap-2 rounded-2xl bg-violet-50 p-3">
          <Wand2 className="mb-2.5 size-5 text-violet-700" aria-hidden />
          <div className="min-w-0 flex-1 text-sm text-violet-700">
            <b>Write it with AI.</b> Fill in subject, level and topic, then let the AI draft the questions. You review and edit them before saving.
          </div>
          <label className="flex items-center gap-2 text-sm font-bold text-violet-700">
            Questions
            <select value={count} onChange={(e) => setCount(Number(e.target.value))} className="h-9 rounded-lg border-2 border-violet-200 bg-white px-2">
              {[5, 8, 10, 15].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
          <Button size="sm" loading={draft.isPending} disabled={d.topic.trim().length < 2 || d.subject.trim().length < 2} onClick={() => draft.mutate()} icon={<Sparkles className="size-4" />}>
            Draft with AI
          </Button>
        </div>

        <ol className="flex flex-col gap-3">
          {d.questions.map((q, i) => (
            <li key={i} className="rounded-2xl border border-ink-100 p-3">
              <div className="mb-2 flex items-start gap-2">
                <span className="mt-2.5 w-6 text-sm font-extrabold text-ink-300">{i + 1}.</span>
                <input value={q.prompt} onChange={(e) => updQ(i, { prompt: e.target.value })} placeholder="Question" aria-label={`Question ${i + 1}`} className="h-11 min-w-0 flex-1 rounded-xl border-2 border-ink-200 px-3 font-semibold outline-none focus:border-violet-500" />
                <Button size="sm" variant="ghost" className="mt-1" aria-label={`Remove question ${i + 1}`} disabled={d.questions.length <= 3} onClick={() => upd({ questions: d.questions.filter((_, j) => j !== i) })} icon={<Trash2 className="size-4" />} />
              </div>
              <div className="grid gap-2 pl-8 sm:grid-cols-2">
                {q.options.map((o, j) => (
                  <label key={j} className={cx('flex items-center gap-2 rounded-xl border-2 px-2', q.answerIndex === j ? 'border-mint-600 bg-mint-50' : 'border-ink-200')}>
                    <input type="radio" name={`answer-${i}`} checked={q.answerIndex === j} onChange={() => updQ(i, { answerIndex: j })} className="size-4 accent-mint-600" aria-label={`Option ${'ABCD'[j]} is correct`} />
                    <span className="text-xs font-extrabold text-ink-300">{'ABCD'[j]}</span>
                    <input value={o} onChange={(e) => updQ(i, { options: q.options.map((x, k) => (k === j ? e.target.value : x)) })} placeholder={`Option ${'ABCD'[j]}`} className="h-10 min-w-0 flex-1 bg-transparent outline-none" />
                  </label>
                ))}
              </div>
            </li>
          ))}
        </ol>
        <div>
          <Button size="sm" variant="secondary" icon={<Plus className="size-4" />} disabled={d.questions.length >= 20} onClick={() => upd({ questions: [...d.questions, blankQuestion()] })}>
            Add question
          </Button>
          <span className="ml-3 text-xs text-ink-500">Tick the circle beside the right answer.</span>
        </div>
      </div>
    </Modal>
  );
}
