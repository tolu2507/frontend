'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, BookOpen, Check, FlaskConical, Plus, Save, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';

import { label } from '@/components/overwatch/kit';
import { Badge, Button, Card, cx, Empty, ErrorBox, Input, Loading, Modal, Notice, PageHeader, Select, Textarea } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { api, errorText } from '@/lib/api';
import { date, naira } from '@/lib/format';

type Level = 'NURSERY' | 'PRIMARY' | 'JUNIOR_SECONDARY' | 'SENIOR_SECONDARY';
type Topic = { id: string; level: Level; gradeName: string | null; subject: string; term: 'FIRST' | 'SECOND' | 'THIRD'; week: number | null; topic: string; objectives: string | null };
type SchoolAi = {
  school: { id: string; name: string };
  profile: { curriculum: string; instructions: string; aiEnabled: boolean; monthlyBudgetKobo: number | null; updatedAt: string | null; saved: boolean };
  status: string | null;
  month: { calls: number; costKobo: number; byFeature: { feature: string; calls: number; costKobo: number }[] };
  topics: Topic[];
  subjects: string[];
  grades: Record<Level, string[]>;
};
type Sample = { guidance: string; title: string; questions: { prompt: string; options: string[]; answerIndex: number }[] };

const CURRICULA = ['NIGERIAN', 'BLENDED', 'BRITISH', 'AMERICAN', 'MONTESSORI', 'IB'];
const LEVELS: Level[] = ['NURSERY', 'PRIMARY', 'JUNIOR_SECONDARY', 'SENIOR_SECONDARY'];
const TERMS = ['FIRST', 'SECOND', 'THIRD'] as const;
const money = (kobo: number) => (kobo > 0 && kobo < 10_000 ? `₦${(kobo / 100).toFixed(2)}` : naira(kobo));

export default function SchoolAiPage() {
  const { id } = useParams<{ id: string }>();
  const q = useQuery({ queryKey: ['ow', 'school-ai', id], queryFn: () => api<SchoolAi>(`/admin/schools/${id}/ai`) });
  if (q.isPending) return <Loading rows={6} />;
  if (q.error) return <ErrorBox error={q.error} onRetry={q.refetch} />;
  const d = q.data;
  return (
    <>
      <PageHeader
        back={
          <Link href={`/overwatch/schools/${id}`} className="mb-2 inline-flex items-center gap-1 text-sm font-bold text-ink-500 hover:text-violet-700">
            <ArrowLeft className="size-4" /> {d.school.name}
          </Link>
        }
        title="AI setup"
        subtitle="Tell the AI how this school teaches. It’s added to every quiz, quest and parent report the AI writes for this school’s students."
      />
      {d.status ? (
        <Notice tone="coral" title="AI isn’t running for this school">
          {d.status} Students still get quizzes and reports from the non-AI fallbacks.
        </Notice>
      ) : null}
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <ProfileForm d={d} />
        <MonthCard d={d} />
      </div>
      <SchemeOfWork d={d} />
      <TryIt d={d} />
    </>
  );
}

function ProfileForm({ d }: { d: SchoolAi }) {
  const qc = useQueryClient();
  const [curriculum, setCurriculum] = useState(d.profile.curriculum);
  const [instructions, setInstructions] = useState(d.profile.instructions);
  const [aiEnabled, setAiEnabled] = useState(d.profile.aiEnabled);
  const [budget, setBudget] = useState(d.profile.monthlyBudgetKobo === null ? '' : String(d.profile.monthlyBudgetKobo / 100));
  const budgetNum = budget.trim() === '' ? null : Number(budget);
  const badBudget = budgetNum !== null && (!Number.isFinite(budgetNum) || budgetNum < 0);
  const save = useMutation({
    mutationFn: () => api(`/admin/schools/${d.school.id}/ai`, { method: 'PUT', body: { curriculum, instructions, aiEnabled, monthlyBudgetKobo: budgetNum === null ? null : Math.round(budgetNum * 100) } }),
    onSuccess: () => {
      toast.success('AI setup saved. It applies to the next AI request.');
      qc.invalidateQueries({ queryKey: ['ow'] });
    },
    onError: (e) => toast.error(errorText(e)),
  });
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-lg font-bold">How this school teaches</h2>
        {d.profile.saved && d.profile.updatedAt ? <span className="text-xs text-ink-500">Saved {date(d.profile.updatedAt)}</span> : <Badge tone="sun">Not saved yet</Badge>}
      </div>
      <Select label="Curriculum" value={curriculum} onChange={(e) => setCurriculum(e.target.value)} options={CURRICULA.map((c) => ({ value: c, label: label(c) }))} />
      <Textarea
        label="The school’s own rules for the AI"
        hint="Plain sentences. For example: “Use British spelling. Maths follows the Singapore method. Primary 1–3 questions must be one short sentence. We are a Christian school; use Bible names in examples.”"
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
        maxLength={4000}
        className="min-h-32"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Monthly AI budget (₦)" inputMode="decimal" placeholder="No cap" value={budget} onChange={(e) => setBudget(e.target.value)} error={badBudget ? 'Enter an amount in naira, or leave it empty.' : undefined} hint="When it’s used up, the app switches to non-AI content until next month." />
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border-2 border-ink-200 p-3 has-[:checked]:border-mint-600 has-[:checked]:bg-mint-50">
          <input type="checkbox" checked={aiEnabled} onChange={(e) => setAiEnabled(e.target.checked)} className="mt-1 size-5 accent-mint-600" />
          <span>
            <span className="block font-bold">AI switched on</span>
            <span className="text-[13px] text-ink-500">Turn off to stop all AI for this school’s students.</span>
          </span>
        </label>
      </div>
      <div className="flex justify-end">
        <Button icon={<Save className="size-4" />} loading={save.isPending} disabled={badBudget} onClick={() => save.mutate()}>
          Save AI setup
        </Button>
      </div>
    </Card>
  );
}

function MonthCard({ d }: { d: SchoolAi }) {
  const used = d.profile.monthlyBudgetKobo ? Math.min(100, (d.month.costKobo / d.profile.monthlyBudgetKobo) * 100) : null;
  return (
    <Card className="flex flex-col gap-4">
      <h2 className="font-display text-lg font-bold">This month</h2>
      <div className="flex flex-wrap gap-8">
        <div>
          <div className="text-sm font-bold text-ink-500">AI cost</div>
          <div className="font-display text-3xl font-extrabold">{money(d.month.costKobo)}</div>
        </div>
        <div>
          <div className="text-sm font-bold text-ink-500">AI calls</div>
          <div className="font-display text-3xl font-extrabold">{d.month.calls.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-sm font-bold text-ink-500">Scheme of work</div>
          <div className="font-display text-3xl font-extrabold">{d.topics.length}</div>
          <div className="text-xs text-ink-500">topics</div>
        </div>
      </div>
      {used !== null ? (
        <div className="flex flex-col gap-1">
          <div className="h-2.5 rounded-full bg-ink-100">
            <div className={cx('h-2.5 rounded-full', used >= 100 ? 'bg-coral-500' : used >= 80 ? 'bg-sun-600' : 'bg-mint-600')} style={{ width: `${used}%` }} />
          </div>
          <span className="text-sm text-ink-500">
            {Math.round(used)}% of the {money(d.profile.monthlyBudgetKobo!)} budget used
          </span>
        </div>
      ) : (
        <p className="text-sm text-ink-500">No monthly cap.</p>
      )}
      {d.month.byFeature.length ? (
        <ul className="divide-y divide-ink-100 text-sm">
          {d.month.byFeature.map((f) => (
            <li key={f.feature} className="flex justify-between py-2">
              <span className="font-semibold">
                {label(f.feature)} <span className="font-normal text-ink-500">· {f.calls}</span>
              </span>
              <span className="font-bold">{money(f.costKobo)}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}

function SchemeOfWork({ d }: { d: SchoolAi }) {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [subject, setSubject] = useState('');
  const remove = useMutation({
    mutationFn: (topicId: string) => api(`/admin/ai/topics/${topicId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ow', 'school-ai', d.school.id] }),
    onError: (e) => toast.error(errorText(e)),
  });
  const subjects = [...new Set(d.topics.map((t) => t.subject))];
  const shown = d.topics.filter((t) => !subject || t.subject === subject);
  // Group: subject · class → term → topics
  const groups = useMemo(() => {
    const m = new Map<string, Topic[]>();
    for (const t of shown) {
      const k = `${t.subject} · ${t.gradeName ?? label(t.level)}`;
      m.set(k, [...(m.get(k) ?? []), t]);
    }
    return [...m.entries()];
  }, [shown]);

  return (
    <Card className="mt-6 flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold">Scheme of work</h2>
          <p className="text-[13px] text-ink-500">The topics this school teaches, term by term. The AI keeps quizzes and quests to these topics and this order.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {subjects.length > 1 ? (
            <select value={subject} onChange={(e) => setSubject(e.target.value)} className="h-9 rounded-xl border-2 border-ink-200 bg-white px-2 text-sm font-bold" aria-label="Subject">
              <option value="">All subjects</option>
              {subjects.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          ) : null}
          <Button size="sm" icon={<Plus className="size-4" />} onClick={() => setAdding(true)}>
            Add topics
          </Button>
        </div>
      </div>
      {groups.length === 0 ? (
        <Empty icon={<BookOpen className="size-7" />} title="No scheme of work yet" message="Paste the school’s scheme of work, one topic per line. You can do one subject and class at a time." action={<Button onClick={() => setAdding(true)}>Add topics</Button>} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {groups.map(([title, topics]) => (
            <div key={title} className="rounded-2xl border border-ink-100 p-4">
              <h3 className="mb-2 font-bold">{title}</h3>
              {TERMS.map((term) => {
                const list = topics.filter((t) => t.term === term);
                if (!list.length) return null;
                return (
                  <div key={term} className="mb-2">
                    <div className="mb-1 text-[11px] font-extrabold tracking-wide text-ink-300 uppercase">{label(term)}</div>
                    <ul className="flex flex-col">
                      {list.map((t) => (
                        <li key={t.id} className="group flex items-start gap-2 rounded-lg px-1 py-1 text-sm hover:bg-paper">
                          <span className="w-14 shrink-0 text-ink-500">{t.week ? `Week ${t.week}` : '—'}</span>
                          <span className="min-w-0 flex-1">
                            <span className="font-semibold">{t.topic}</span>
                            {t.objectives ? <span className="block text-xs text-ink-500">{t.objectives}</span> : null}
                          </span>
                          <button type="button" aria-label={`Remove ${t.topic}`} onClick={() => remove.mutate(t.id)} className="grid size-7 shrink-0 place-items-center rounded-lg text-ink-300 opacity-0 group-hover:opacity-100 hover:bg-coral-50 hover:text-coral-700 focus:opacity-100">
                            <Trash2 className="size-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
      {adding ? <AddTopics d={d} onClose={() => setAdding(false)} /> : null}
    </Card>
  );
}

/** "Week 3: Fractions - add and subtract", "3. Fractions", "Fractions" → { week, topic, objectives }. */
function parseLines(text: string) {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const m = line.match(/^(?:wk|week)?\s*(\d{1,2})\s*[:.)\-–]\s*(.+)$/i);
      const week = m ? Number(m[1]) : null;
      const rest = (m ? m[2] : line).trim();
      const [topic, ...obj] = rest.split(/\s+[—–-]\s+/);
      return { week: week && week <= 20 ? week : null, topic: topic.slice(0, 200), objectives: obj.join(' – ').slice(0, 500) || null };
    });
}

function AddTopics({ d, onClose }: { d: SchoolAi; onClose: () => void }) {
  const qc = useQueryClient();
  const [subject, setSubject] = useState('Mathematics');
  const [level, setLevel] = useState<Level>('PRIMARY');
  const [grade, setGrade] = useState('');
  const [term, setTerm] = useState<(typeof TERMS)[number]>('FIRST');
  const [text, setText] = useState('');
  const lines = parseLines(text);
  const add = useMutation({
    mutationFn: () => api<{ added: number }>(`/admin/schools/${d.school.id}/ai/topics`, { method: 'POST', body: { subject, level, gradeName: grade || null, term, topics: lines } }),
    onSuccess: (r) => {
      toast.success(`${r.added} topic${r.added === 1 ? '' : 's'} added.`);
      qc.invalidateQueries({ queryKey: ['ow'] });
      onClose();
    },
    onError: (e) => toast.error(errorText(e)),
  });
  return (
    <Modal
      open
      wide
      onClose={onClose}
      title="Add scheme-of-work topics"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={add.isPending} disabled={!lines.length || !subject.trim()} onClick={() => add.mutate()}>
            Add {lines.length || ''} topic{lines.length === 1 ? '' : 's'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Input label="Subject" list="ai-subjects" value={subject} onChange={(e) => setSubject(e.target.value)} />
            <datalist id="ai-subjects">
              {d.subjects.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>
          <Select label="Level" value={level} onChange={(e) => (setLevel(e.target.value as Level), setGrade(''))} options={LEVELS.map((l) => ({ value: l, label: label(l) }))} />
          <Select label="Class" value={grade} onChange={(e) => setGrade(e.target.value)} options={[{ value: '', label: `Every ${label(level)} class` }, ...(d.grades[level] ?? []).map((g) => ({ value: g, label: g }))]} />
          <Select label="Term" value={term} onChange={(e) => setTerm(e.target.value as (typeof TERMS)[number])} options={TERMS.map((t) => ({ value: t, label: label(t) }))} />
        </div>
        <Textarea
          label="Topics, one per line"
          hint="Start a line with the week if you have it, and add objectives after a dash. E.g. “Week 2: LCM and HCF – find the LCM of up to 3 numbers”."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-48 font-mono text-sm"
          placeholder={'Week 1: Whole numbers and place value\nWeek 2: LCM and HCF – find the LCM of up to 3 numbers\nWeek 3: Fractions'}
        />
        {lines.length ? (
          <div className="rounded-xl bg-paper p-3 text-sm">
            <div className="mb-1 font-bold">Preview</div>
            <ul className="flex max-h-40 flex-col gap-0.5 overflow-y-auto">
              {lines.map((l, i) => (
                <li key={i}>
                  <span className="inline-block w-16 text-ink-500">{l.week ? `Week ${l.week}` : '—'}</span>
                  <b>{l.topic}</b>
                  {l.objectives ? <span className="text-ink-500"> · {l.objectives}</span> : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

function TryIt({ d }: { d: SchoolAi }) {
  const first = d.topics[0];
  const [subject, setSubject] = useState(first?.subject ?? 'Mathematics');
  const [level, setLevel] = useState<Level>(first?.level ?? 'PRIMARY');
  const [grade, setGrade] = useState(first?.gradeName ?? '');
  const [topic, setTopic] = useState(first?.topic ?? '');
  const test = useMutation({
    mutationFn: () => api<Sample>(`/admin/schools/${d.school.id}/ai/test`, { method: 'POST', body: { subject, level, gradeName: grade || undefined, topic } }),
    onError: (e) => toast.error(errorText(e)),
  });
  return (
    <Card className="mt-6 flex flex-col gap-4">
      <div>
        <h2 className="font-display text-lg font-bold">Try it</h2>
        <p className="text-[13px] text-ink-500">See exactly what the AI is told for this school, and a sample quest it writes. Save your changes above first. This makes one real AI call, charged to this school.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input label="Subject" list="ai-subjects-try" value={subject} onChange={(e) => setSubject(e.target.value)} />
        <datalist id="ai-subjects-try">
          {d.subjects.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <Select label="Level" value={level} onChange={(e) => (setLevel(e.target.value as Level), setGrade(''))} options={LEVELS.map((l) => ({ value: l, label: label(l) }))} />
        <Select label="Class" value={grade} onChange={(e) => setGrade(e.target.value)} options={[{ value: '', label: 'Any' }, ...(d.grades[level] ?? []).map((g) => ({ value: g, label: g }))]} />
        <Input label="Topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. LCM and HCF" />
      </div>
      <div>
        <Button variant="secondary" icon={<FlaskConical className="size-4" />} loading={test.isPending} disabled={topic.trim().length < 2 || subject.trim().length < 2} onClick={() => test.mutate()}>
          Write a sample quest
        </Button>
      </div>
      {test.data ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <div className="mb-1 text-sm font-bold text-ink-500">What the AI is told about this school</div>
            <pre className="max-h-96 overflow-auto rounded-xl bg-ink p-4 text-[12.5px] leading-relaxed whitespace-pre-wrap text-ink-100">{test.data.guidance}</pre>
          </div>
          <div>
            <div className="mb-1 text-sm font-bold text-ink-500">Sample quest: {test.data.title}</div>
            <ol className="flex flex-col gap-3">
              {test.data.questions.map((q, i) => (
                <li key={i} className="rounded-xl border border-ink-100 p-3">
                  <div className="mb-2 font-semibold">
                    {i + 1}. {q.prompt}
                  </div>
                  <ul className="grid gap-1 sm:grid-cols-2">
                    {q.options.map((o, j) => (
                      <li key={j} className={cx('flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm', j === q.answerIndex ? 'bg-mint-50 font-bold text-mint-800' : 'bg-paper')}>
                        {j === q.answerIndex ? <Check className="size-4" aria-label="Correct answer" /> : <span className="w-4" />}
                        {o}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
