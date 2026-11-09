'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, BookOpen, CheckCheck, CircleCheck, Eye, FileQuestion, GraduationCap, RotateCcw, X } from 'lucide-react';
import { useState } from 'react';

import { Badge, Button, Card, cx, Empty, ErrorBox, Loading, Modal, Notice, PageHeader, Stat, type Tone } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { api, errorText } from '@/lib/api';

type Status = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'RETIRED';
const STATUS: Record<Status, { label: string; tone: Tone }> = {
  DRAFT: { label: 'Draft', tone: 'ink' },
  IN_REVIEW: { label: 'Waiting review', tone: 'sun' },
  APPROVED: { label: 'Live', tone: 'mint' },
  RETIRED: { label: 'Retired', tone: 'coral' },
};

type Section = {
  id: string;
  name: string;
  lesson: { id: string; title: string; status: Status; checkNotes: string | null; minutes: number; slides: number } | null;
  questions: Partial<Record<Status, number>>;
};
type Course = { id: string; code: string; title: string; units: { id: string; name: string; sections: Section[] }[] };

type Slide = { kind: string; [k: string]: unknown };
type LessonDetail = {
  id: string;
  title: string;
  minutes: number;
  hook: string;
  slides: Slide[];
  sources: { title: string }[];
  status: Status;
  checkNotes: string | null;
  course: string;
  unit: string | null;
  section: string;
};

const KIND_LABEL: Record<string, string> = { teach: 'Teach', example: 'Real life', check: 'Quick check', compare: 'Compare', steps: 'Steps', terms: 'Key terms', lecturer: 'Exam corner', recap: 'Recap' };

/** University classes: review each generated lesson (and its questions) before students see it. */
export default function UniversityPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['ow', 'university'], queryFn: () => api<Course[]>('/admin/university') });
  const [open, setOpen] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const setStatus = useMutation({
    mutationFn: (v: { ids: string[]; status: Status; withQuestions: boolean }) => api<{ lessons: number; questions: number }>('/admin/university/lessons/status', { method: 'POST', body: v }),
    onSuccess: (r, v) => {
      const what = `${r.lessons} ${r.lessons === 1 ? 'class' : 'classes'}${r.questions ? ` and ${r.questions} questions` : ''}`;
      toast.success(v.status === 'APPROVED' ? `${what} now live for students.` : v.status === 'RETIRED' ? `${what} retired.` : `${what} sent back to review.`);
      void qc.invalidateQueries({ queryKey: ['ow', 'university'] });
    },
    onError: (e) => toast.error(errorText(e)),
  });

  const courses = q.data ?? [];
  const all = courses.flatMap((c) => c.units.flatMap((u) => u.sections));
  const lessons = all.flatMap((s) => (s.lesson ? [s.lesson] : []));
  const count = (st: Status) => lessons.filter((l) => l.status === st).length;
  const questions = (st: Status) => all.reduce((n, s) => n + (s.questions[st] ?? 0), 0);
  const flagged = lessons.filter((l) => l.checkNotes?.startsWith('Copied') && l.status === 'IN_REVIEW').length;

  return (
    <>
      <PageHeader
        title="University"
        subtitle="Classroom lessons and lecturer-style questions written from the course manuals by `pnpm uni:build`. Students only see what you approve."
      />
      {q.isPending ? (
        <Loading rows={6} />
      ) : q.error ? (
        <ErrorBox error={q.error} onRetry={q.refetch} />
      ) : !lessons.length ? (
        <Empty
          icon={<GraduationCap className="size-7" />}
          title="No classes yet"
          message={
            <>
              Generate them from the backend folder with <code className="rounded bg-ink-100 px-1.5 py-0.5">pnpm uni:build</code>. It reads the course manuals in <code className="rounded bg-ink-100 px-1.5 py-0.5">data/university/pdfs</code>, writes the classes and questions, and they appear here for review.
            </>
          }
        />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Classes waiting review" tone="sun" value={count('IN_REVIEW').toLocaleString()} hint={`${count('APPROVED')} live`} icon={<BookOpen className="size-5" />} />
            <Stat label="Questions waiting review" tone="violet" value={questions('IN_REVIEW').toLocaleString()} hint={`${questions('APPROVED').toLocaleString()} live`} icon={<FileQuestion className="size-5" />} />
            <Stat label="Courses" tone="sky" value={courses.length} hint={`${courses.reduce((n, c) => n + c.units.length, 0)} units, ${all.length} sections`} icon={<GraduationCap className="size-5" />} />
            <Stat label="Flagged for copied wording" tone="coral" value={flagged} hint="check these before approving" icon={<AlertTriangle className="size-5" />} />
          </div>
          {flagged ? (
            <Notice tone="coral" title="Some classes reuse the manual’s exact wording">
              The manuals are copyrighted. Open the flagged classes and retire them (then run the build again for that unit with <code>--redo</code>) rather than approving copied text.
            </Notice>
          ) : null}

          {courses.map((c) => {
            const cl = c.units.flatMap((u) => u.sections.flatMap((s) => (s.lesson ? [s.lesson] : [])));
            const waiting = cl.filter((l) => l.status === 'IN_REVIEW' && !l.checkNotes?.startsWith('Copied'));
            const isOpen = open === c.id;
            return (
              <Card key={c.id} className="flex flex-col gap-4 p-0">
                <div className="flex flex-wrap items-center gap-3 p-5">
                  <button type="button" onClick={() => setOpen(isOpen ? null : c.id)} className="min-w-0 flex-1 text-left" aria-expanded={isOpen}>
                    <div className="text-xs font-extrabold tracking-wider text-violet-700">{c.code}</div>
                    <div className="font-display text-xl font-bold">{c.title}</div>
                    <div className="mt-1 text-sm text-ink-500">
                      {c.units.length} units · {cl.length} classes · {cl.filter((l) => l.status === 'APPROVED').length} live · {cl.filter((l) => l.status === 'IN_REVIEW').length} waiting
                    </div>
                  </button>
                  {waiting.length ? (
                    <Button
                      variant="success"
                      size="sm"
                      icon={<CheckCheck className="size-4" />}
                      loading={setStatus.isPending}
                      onClick={() => {
                        if (confirm(`Approve ${waiting.length} classes in ${c.code} and their questions? Flagged classes are left out.`)) setStatus.mutate({ ids: waiting.map((l) => l.id), status: 'APPROVED', withQuestions: true });
                      }}
                    >
                      Approve all ({waiting.length})
                    </Button>
                  ) : null}
                  <Button variant="secondary" size="sm" onClick={() => setOpen(isOpen ? null : c.id)}>
                    {isOpen ? 'Hide' : 'Show'} units
                  </Button>
                </div>
                {isOpen ? (
                  <div className="flex flex-col gap-4 border-t border-ink-100 p-5">
                    {c.units.map((u, i) => (
                      <div key={u.id} className="flex flex-col gap-2">
                        <h3 className="font-display text-base font-bold">
                          Unit {i + 1}: {u.name}
                        </h3>
                        <div className="overflow-hidden rounded-xl border border-ink-100">
                          {u.sections.map((s) => (
                            <div key={s.id} className="flex flex-wrap items-center gap-3 border-b border-ink-100 px-4 py-3 last:border-b-0">
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold">{s.name}</div>
                                <div className="text-[13px] text-ink-500">
                                  {s.lesson ? `“${s.lesson.title}” · ${s.lesson.slides} slides · ${s.lesson.minutes} min` : 'No class yet (run the build again)'}
                                  {' · '}
                                  {(s.questions.APPROVED ?? 0) + (s.questions.IN_REVIEW ?? 0)} questions
                                </div>
                                {s.lesson?.checkNotes ? <div className={cx('mt-1 text-[13px]', s.lesson.checkNotes.startsWith('Copied') ? 'text-coral-700' : 'text-ink-500')}>{s.lesson.checkNotes}</div> : null}
                              </div>
                              {s.lesson ? <Badge tone={STATUS[s.lesson.status].tone}>{STATUS[s.lesson.status].label}</Badge> : null}
                              {s.lesson ? (
                                <Button variant="ghost" size="sm" icon={<Eye className="size-4" />} onClick={() => setPreview(s.lesson!.id)}>
                                  Read
                                </Button>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}
      <LessonModal id={preview} onClose={() => setPreview(null)} onStatus={(status) => preview && setStatus.mutate({ ids: [preview], status, withQuestions: true }, { onSuccess: () => setPreview(null) })} busy={setStatus.isPending} />
    </>
  );
}

function SlideBody({ s }: { s: Slide }) {
  const text = (v: unknown) => (typeof v === 'string' ? v : '');
  const list = (v: unknown) => (Array.isArray(v) ? v : []);
  switch (s.kind) {
    case 'teach':
      return (
        <>
          <p className="font-bold">{text(s.heading)}</p>
          <p className="whitespace-pre-line">{text(s.body).replace(/\*\*/g, '')}</p>
          {s.visual ? <p className="text-[13px] text-ink-500">Diagram: {JSON.stringify(s.visual)}</p> : null}
        </>
      );
    case 'example':
      return (
        <>
          <p className="font-bold">{text(s.heading)}</p>
          <p>{text(s.story)}</p>
          <p className="font-semibold">→ {text(s.takeaway)}</p>
        </>
      );
    case 'check':
      return (
        <>
          <p className="font-bold">{text(s.question)}</p>
          <ol className="list-[upper-alpha] pl-6">
            {list(s.options).map((o, i) => (
              <li key={i} className={cx(i === s.answerIndex && 'font-bold text-mint-800')}>
                {String(o)}
                {i === s.answerIndex ? ' ✓' : ''}
              </li>
            ))}
          </ol>
          <p className="text-ink-500">{text(s.why)}</p>
        </>
      );
    case 'compare': {
      const side = (x: unknown) => x as { title: string; points: string[] };
      return (
        <>
          <p className="font-bold">{text(s.heading)}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[side(s.left), side(s.right)].map((x, i) => (
              <div key={i}>
                <p className="font-semibold">{x?.title}</p>
                <ul className="list-disc pl-5">{(x?.points ?? []).map((p, j) => <li key={j}>{p}</li>)}</ul>
              </div>
            ))}
          </div>
        </>
      );
    }
    case 'steps':
      return (
        <>
          <p className="font-bold">{text(s.heading)}</p>
          <ol className="list-decimal pl-6">{list(s.steps).map((x, i) => <li key={i}><b>{(x as { title: string }).title}</b>: {(x as { detail: string }).detail}</li>)}</ol>
        </>
      );
    case 'terms':
      return (
        <>
          <p className="font-bold">{text(s.heading)}</p>
          <ul className="pl-1">{list(s.terms).map((x, i) => <li key={i}><b>{(x as { term: string }).term}</b>: {(x as { meaning: string }).meaning}</li>)}</ul>
        </>
      );
    case 'lecturer':
      return (
        <>
          <p className="font-bold">{text(s.heading)}</p>
          <p>{text(s.body)}</p>
          <p className="rounded-lg bg-paper p-2 font-semibold">Q: {text(s.sampleQuestion)}</p>
          <p>How to answer: {text(s.howToAnswer)}</p>
          {list(s.scholars).length ? <p className="text-ink-500">Scholars: {list(s.scholars).join(', ')}</p> : null}
        </>
      );
    case 'recap':
      return <ul className="list-disc pl-5">{list(s.points).map((p, i) => <li key={i}>{String(p).replace(/\*\*/g, '')}</li>)}</ul>;
    default:
      return null;
  }
}

function LessonModal({ id, onClose, onStatus, busy }: { id: string | null; onClose: () => void; onStatus: (s: Status) => void; busy: boolean }) {
  const q = useQuery({ queryKey: ['ow', 'university', 'lesson', id], queryFn: () => api<LessonDetail>(`/admin/university/lessons/${id}`), enabled: !!id });
  const l = q.data;
  return (
    <Modal
      open={!!id}
      onClose={onClose}
      wide
      title={l ? `${l.course}: ${l.title}` : 'Class'}
      footer={
        l ? (
          <div className="flex flex-wrap justify-end gap-2">
            {l.status !== 'RETIRED' ? (
              <Button variant="danger" size="sm" icon={<X className="size-4" />} loading={busy} onClick={() => onStatus('RETIRED')}>
                Retire
              </Button>
            ) : null}
            {l.status === 'APPROVED' || l.status === 'RETIRED' ? (
              <Button variant="secondary" size="sm" icon={<RotateCcw className="size-4" />} loading={busy} onClick={() => onStatus('IN_REVIEW')}>
                Back to review
              </Button>
            ) : null}
            {l.status !== 'APPROVED' ? (
              <Button variant="success" size="sm" icon={<CircleCheck className="size-4" />} loading={busy} onClick={() => onStatus('APPROVED')}>
                Approve with its questions
              </Button>
            ) : null}
          </div>
        ) : null
      }
    >
      {q.isPending ? (
        <Loading rows={5} />
      ) : q.error ? (
        <ErrorBox error={q.error} onRetry={q.refetch} />
      ) : l ? (
        <div className="flex flex-col gap-4 text-[15px]">
          <div className="text-sm text-ink-500">
            {l.unit} › {l.section} · {l.minutes} min · <Badge tone={STATUS[l.status].tone}>{STATUS[l.status].label}</Badge>
          </div>
          {l.checkNotes ? <Notice tone={l.checkNotes.startsWith('Copied') ? 'coral' : 'sky'}>{l.checkNotes}</Notice> : null}
          <p className="rounded-xl bg-violet-50 p-3 font-semibold text-violet-800">{l.hook}</p>
          {l.slides.map((s, i) => (
            <div key={i} className="flex flex-col gap-1.5 border-l-4 border-ink-100 pl-3">
              <div className="text-[11px] font-extrabold tracking-wider text-ink-500 uppercase">
                {i + 1}. {KIND_LABEL[s.kind] ?? s.kind}
              </div>
              <SlideBody s={s} />
            </div>
          ))}
          {l.sources.length ? <p className="text-[13px] text-ink-500">Researched on: {l.sources.map((s) => s.title).join(', ')}</p> : null}
        </div>
      ) : null}
    </Modal>
  );
}
