'use client';

import { ArrowRight, CalendarCheck, CheckCircle2, Circle, ReceiptText, School, Sparkles, Users } from 'lucide-react';
import Link from 'next/link';

import { Button, Card, ErrorBox, Loading, Notice, PageHeader, Stat } from '@/components/ui';
import { naira, TERM } from '@/lib/format';
import { useOverview } from '@/lib/queries';

export default function Overview() {
  const { data, isPending, error, refetch } = useOverview();
  if (isPending) return <Loading rows={5} />;
  if (error) return <ErrorBox error={error} onRetry={refetch} />;

  const { setup, me } = data;
  const steps = [
    { done: setup.hasYear, label: 'Add your session and term dates', href: '/dashboard/settings', admin: true },
    { done: setup.hasSubjects, label: 'Add the subjects you teach', href: '/dashboard/settings', admin: true },
    { done: setup.hasClasses, label: 'Create your classes', href: '/dashboard/classes', admin: true },
    { done: setup.hasClassSubjects, label: 'Give each class its subjects and teachers', href: '/dashboard/classes', admin: true },
    { done: setup.hasStudents, label: 'Add students and their parents', href: '/dashboard/students', admin: true },
  ];
  const setupDone = steps.every((s) => s.done);
  const pct = data.attendanceToday.marked ? Math.round((data.attendanceToday.present / data.attendanceToday.marked) * 100) : null;
  const collected = data.fees && Number(data.fees.billedKobo) ? Math.round((Number(data.fees.paidKobo) / Number(data.fees.billedKobo)) * 100) : null;

  return (
    <>
      <PageHeader
        title={data.school.name}
        subtitle={data.year && data.term ? `${data.year.name} · ${TERM[data.term.name]}` : 'Let’s get your school set up'}
        actions={
          <Link href="/dashboard/classes">
            <Button icon={<CalendarCheck className="size-4" />}>Take attendance</Button>
          </Link>
        }
      />

      {me.isAdmin && !setupDone ? (
        <Card className="mb-6 animate-rise">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-xl font-bold">Set up your school</h2>
              <p className="text-[15px] text-ink-500">Five steps and your parents start getting weekly reports.</p>
            </div>
            <span className="text-sm font-extrabold text-violet-700">
              {steps.filter((s) => s.done).length} of {steps.length} done
            </span>
          </div>
          <ol className="flex flex-col gap-2">
            {steps.map((s, i) => (
              <li key={s.label}>
                <Link href={s.href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-violet-50">
                  {s.done ? <CheckCircle2 className="size-6 text-mint-600" /> : <Circle className="size-6 text-ink-200" />}
                  <span className={`flex-1 font-semibold ${s.done ? 'text-ink-500 line-through' : ''}`}>
                    {i + 1}. {s.label}
                  </span>
                  {!s.done ? <ArrowRight className="size-4 text-violet-500" /> : null}
                </Link>
              </li>
            ))}
          </ol>
        </Card>
      ) : null}

      {!me.isAdmin && data.counts.classes === 0 ? (
        <Notice tone="sun" title="No classes yet">
          Your school hasn’t assigned you to a class or subject. Ask an administrator to add you as a form teacher or subject teacher.
        </Notice>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Students" value={data.counts.students.toLocaleString()} hint={`${data.counts.classes} ${data.counts.classes === 1 ? 'class' : 'classes'}`} icon={<Users className="size-5" />} />
        <Stat
          label="Attendance today"
          tone="mint"
          value={pct === null ? '—' : `${pct}%`}
          hint={data.attendanceToday.marked ? `${data.attendanceToday.present} of ${data.attendanceToday.marked} marked present` : 'Not taken yet today'}
          icon={<CalendarCheck className="size-5" />}
        />
        {data.fees ? (
          <Stat
            label="Fees collected"
            tone="sun"
            value={collected === null ? '—' : `${collected}%`}
            hint={data.fees.invoices ? `${naira(data.fees.paidKobo)} of ${naira(data.fees.billedKobo)}` : 'No bills sent this term'}
            icon={<ReceiptText className="size-5" />}
          />
        ) : (
          <Stat label="Classes" tone="sun" value={data.counts.classes} icon={<School className="size-5" />} />
        )}
        <Stat label="Parent reports this week" tone="sky" value={data.reportsThisWeek} hint="Sent every Friday at 4pm" icon={<Sparkles className="size-5" />} />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          { href: '/dashboard/classes', title: 'Mark attendance', body: 'Open a class and tap present or absent. Takes under a minute.', icon: CalendarCheck },
          { href: '/dashboard/classes', title: 'Enter scores', body: 'Add a test or exam and type in the scores. Parents see progress on Friday.', icon: School },
          { href: '/dashboard/students', title: 'Write a note', body: 'A quick word about effort or behaviour makes the weekly report personal.', icon: Sparkles },
        ].map((x) => (
          <Link key={x.title} href={x.href} className="group">
            <Card className="h-full transition group-hover:-translate-y-0.5 group-hover:border-violet-200">
              <x.icon className="mb-3 size-6 text-violet-500" />
              <h3 className="font-display text-lg font-bold">{x.title}</h3>
              <p className="mt-1 text-[14px] text-ink-500">{x.body}</p>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
