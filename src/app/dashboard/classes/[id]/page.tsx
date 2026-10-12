'use client';

import { ArrowLeft, BookOpen, CalendarCheck, ClipboardList, Table2, Users } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import { ErrorBox, Loading, PageHeader, Tabs } from '@/components/ui';
import { useClasses, useOverview } from '@/lib/queries';
import { AttendanceTab, BroadsheetTab, ScoresTab, StudentsTab, SubjectsTab } from './tabs';

type Tab = 'attendance' | 'scores' | 'broadsheet' | 'students' | 'subjects';

function ClassPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const search = useSearchParams();
  const tab = (search.get('tab') as Tab) ?? 'attendance';
  const classes = useClasses();
  const overview = useOverview();
  const cls = classes.data?.find((c) => c.id === id);
  const admin = overview.data?.me.isAdmin;

  if (classes.isPending || overview.isPending) return <Loading />;
  if (classes.error) return <ErrorBox error={classes.error} onRetry={classes.refetch} />;
  if (!cls) return <ErrorBox error={new Error('This class doesn’t exist or isn’t one of yours.')} />;

  return (
    <>
      <PageHeader
        back={
          <Link href="/dashboard/classes" className="mb-2 inline-flex items-center gap-1 text-sm font-bold text-ink-500 hover:text-violet-700">
            <ArrowLeft className="size-4" /> Classes
          </Link>
        }
        title={cls.name}
        subtitle={`${cls.studentCount} ${cls.studentCount === 1 ? 'student' : 'students'}${cls.formTeacher ? ` · Form teacher ${cls.formTeacher.firstName} ${cls.formTeacher.lastName}` : ''}`}
      />
      <Tabs
        value={tab}
        onChange={(t) => router.replace(`/dashboard/classes/${id}?tab=${t}`, { scroll: false })}
        tabs={[
          { value: 'attendance', label: 'Attendance', icon: <CalendarCheck className="size-4" /> },
          { value: 'scores', label: 'Scores', icon: <ClipboardList className="size-4" /> },
          { value: 'broadsheet', label: 'Broadsheet', icon: <Table2 className="size-4" /> },
          { value: 'students', label: 'Students', icon: <Users className="size-4" /> },
          ...(admin ? [{ value: 'subjects' as const, label: 'Subjects & teachers', icon: <BookOpen className="size-4" /> }] : []),
        ]}
      />
      {tab === 'attendance' ? (
        <AttendanceTab classId={id} />
      ) : tab === 'scores' ? (
        <ScoresTab classId={id} />
      ) : tab === 'broadsheet' ? (
        <BroadsheetTab classId={id} className={cls.name} />
      ) : tab === 'students' ? (
        <StudentsTab classId={id} />
      ) : (
        <SubjectsTab cls={cls} />
      )}
    </>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <ClassPage />
    </Suspense>
  );
}
