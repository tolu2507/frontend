'use client';

import { useQuery } from '@tanstack/react-query';
import { GraduationCap, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

import { ago, ExportButton, Filters, FilterSelect, label, Pager, qs, SchoolFilter, SearchBox, type Paged } from '@/components/overwatch/kit';
import { Badge, Empty, ErrorBox, Loading, PageHeader, Table, Tabs } from '@/components/ui';
import { api } from '@/lib/api';
import { date, naira } from '@/lib/format';

type Kind = 'STUDENT' | 'PARENT' | 'STAFF' | 'TUTOR';
type School = { id: string; name: string } | null;
type Student = { id: string; name: string; username: string | null; school: School; className: string | null; level: string; xp: number; streak: number; lastActive: string | null; quests: number; parents: number; walletKobo: number; walletFrozen: boolean; joined: string };
type Parent = { id: string; name: string; email: string | null; phone: string | null; children: { id: string; name: string; school: string | null; relationship: string }[]; bookings: number; payments: number; lastLoginAt: string | null; joined: string };
type Staff = { id: string; name: string; email: string | null; phone: string | null; role: string; status: string; school: School; subjectsTaught: number; formClasses: number; notesWritten: number; invited: boolean; lastLoginAt: string | null; joined: string };
type Tutor = { id: string; name: string; email: string | null; phone: string | null; state: string | null; status: string; subjects: string[]; rateKobo: number; rating: number | null; reviews: number; bookings: number; earningsKobo: number; accepting: boolean; lastLoginAt: string | null; joined: string };

const PAGE = 25;
const KINDS: Kind[] = ['STUDENT', 'PARENT', 'STAFF', 'TUTOR'];
const TITLE: Record<Kind, string> = { STUDENT: 'Students', PARENT: 'Parents', STAFF: 'Teachers & staff', TUTOR: 'Tutors' };

export default function PeoplePage() {
  return (
    <Suspense fallback={<Loading />}>
      <People />
    </Suspense>
  );
}

function People() {
  const params = useSearchParams();
  const router = useRouter();
  const initial = params.get('kind') as Kind | null;
  const [kind, setKindState] = useState<Kind>(initial && KINDS.includes(initial) ? initial : 'STUDENT');
  const [q, setQ] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const setKind = (k: Kind) => {
    setKindState(k);
    setStatus('');
    setPage(1);
    router.replace(`/overwatch/people?kind=${k}`, { scroll: false });
  };
  const filter = { kind, q, schoolId: kind === 'TUTOR' ? '' : schoolId, status };
  const counts = useQuery({ queryKey: ['ow', 'people-counts'], queryFn: () => api<Record<Kind, number>>('/admin/people/counts') });
  const list = useQuery({
    queryKey: ['ow', 'people', filter, page],
    queryFn: async () => ({ kind, ...(await api<Paged<unknown>>(`/admin/people?${qs({ ...filter, page, pageSize: PAGE })}`)) }),
    // Keep the old rows on screen only while paging or searching the same list, never across tabs.
    placeholderData: (prev) => (prev?.kind === kind ? prev : undefined),
  });
  const fetchAll = (p: number, size: number) => api<Paged<never>>(`/admin/people?${qs({ ...filter, page: p, pageSize: size })}`);

  return (
    <>
      <PageHeader title="People" subtitle="Everyone on Nexus, across every school." />
      <Tabs
        value={kind}
        onChange={setKind}
        tabs={KINDS.map((k) => ({ value: k, label: `${TITLE[k]}${counts.data ? ` · ${counts.data[k].toLocaleString()}` : ''}`, icon: k === 'TUTOR' || k === 'STUDENT' ? <GraduationCap className="size-4" /> : <Users className="size-4" /> }))}
      />
      <Filters>
        <SearchBox value={q} onChange={(v) => (setQ(v), setPage(1))} placeholder="Name, email, phone or username" />
        {kind !== 'TUTOR' ? <SchoolFilter value={schoolId} onChange={(v) => (setSchoolId(v), setPage(1))} /> : null}
        {kind === 'STAFF' ? (
          <FilterSelect label="Role" value={status} onChange={(v) => (setStatus(v), setPage(1))} options={[{ value: '', label: 'All roles' }, ...['SCHOOL_OWNER', 'SCHOOL_ADMIN', 'TEACHER', 'TUCK_SHOP'].map((r) => ({ value: r, label: label(r) }))]} />
        ) : null}
        {kind === 'TUTOR' ? (
          <FilterSelect label="Status" value={status} onChange={(v) => (setStatus(v), setPage(1))} options={[{ value: '', label: 'All tutors' }, { value: 'VERIFIED', label: 'Verified' }, { value: 'PENDING', label: 'Pending' }, { value: 'REJECTED', label: 'Rejected' }]} />
        ) : null}
        <div className="ml-auto">
          {kind === 'STUDENT' ? (
            <ExportButton<Student> filename="nexus-students.csv" fetchPage={fetchAll} columns={[['Name', (r) => r.name], ['Username', (r) => r.username], ['School', (r) => r.school?.name], ['Class', (r) => r.className], ['XP', (r) => r.xp], ['Streak', (r) => r.streak], ['Quests', (r) => r.quests], ['Wallet (₦)', (r) => r.walletKobo / 100], ['Joined', (r) => date(r.joined)]]} />
          ) : kind === 'PARENT' ? (
            <ExportButton<Parent> filename="nexus-parents.csv" fetchPage={fetchAll} columns={[['Name', (r) => r.name], ['Email', (r) => r.email], ['Phone', (r) => r.phone], ['Children', (r) => r.children.map((c) => `${c.name} (${c.school ?? 'no school'})`).join('; ')], ['Lesson bookings', (r) => r.bookings], ['Payments', (r) => r.payments], ['Joined', (r) => date(r.joined)]]} />
          ) : kind === 'STAFF' ? (
            <ExportButton<Staff> filename="nexus-staff.csv" fetchPage={fetchAll} columns={[['Name', (r) => r.name], ['Email', (r) => r.email], ['Phone', (r) => r.phone], ['Role', (r) => label(r.role)], ['School', (r) => r.school?.name], ['Subjects taught', (r) => r.subjectsTaught], ['Signed in', (r) => (r.invited ? 'Invite pending' : r.lastLoginAt ? date(r.lastLoginAt) : 'Never')]]} />
          ) : (
            <ExportButton<Tutor> filename="nexus-tutors.csv" fetchPage={fetchAll} columns={[['Name', (r) => r.name], ['Email', (r) => r.email], ['Phone', (r) => r.phone], ['State', (r) => r.state], ['Status', (r) => r.status], ['Subjects', (r) => r.subjects.join('; ')], ['Rate/hr (₦)', (r) => r.rateKobo / 100], ['Rating', (r) => r.rating], ['Bookings', (r) => r.bookings], ['Earnings (₦)', (r) => r.earningsKobo / 100]]} />
          )}
        </div>
      </Filters>

      {list.isPending ? (
        <Loading />
      ) : list.error ? (
        <ErrorBox error={list.error} onRetry={list.refetch} />
      ) : list.data.rows.length === 0 ? (
        <Empty icon={<Users className="size-7" />} title={`No ${TITLE[kind].toLowerCase()} found`} message={q || schoolId || status ? 'Try a different search or filter.' : undefined} />
      ) : (
        <div className={list.isPlaceholderData ? 'opacity-60 transition' : 'transition'}>
          {list.data.kind === 'STUDENT' ? <Students rows={list.data.rows as Student[]} /> : list.data.kind === 'PARENT' ? <Parents rows={list.data.rows as Parent[]} /> : list.data.kind === 'STAFF' ? <StaffTable rows={list.data.rows as Staff[]} /> : <Tutors rows={list.data.rows as Tutor[]} />}
          <Pager page={page} pageSize={PAGE} total={list.data.total} onPage={setPage} />
        </div>
      )}
    </>
  );
}

const SchoolLink = ({ s }: { s: School }) =>
  s ? (
    <Link href={`/overwatch/schools/${s.id}`} className="font-semibold hover:text-violet-700">
      {s.name}
    </Link>
  ) : (
    <span className="text-ink-300">No school</span>
  );

function Students({ rows }: { rows: Student[] }) {
  return (
    <Table head={['Student', 'School', 'Class', 'XP', 'Streak', 'Quests', 'Wallet', 'Last active']}>
      {rows.map((s) => (
        <tr key={s.id} className="hover:bg-paper">
          <td className="px-4 py-3">
            <div className="font-bold">{s.name}</div>
            <div className="text-xs text-ink-500">
              {s.username ? `@${s.username}` : 'No username'} · {s.parents} parent{s.parents === 1 ? '' : 's'} linked
            </div>
          </td>
          <td className="px-4 py-3">
            <SchoolLink s={s.school} />
          </td>
          <td className="px-4 py-3">{s.className ?? label(s.level)}</td>
          <td className="px-4 py-3 font-semibold">{s.xp.toLocaleString()}</td>
          <td className="px-4 py-3">{s.streak ? <Badge tone="sun">🔥 {s.streak}</Badge> : <span className="text-ink-300">0</span>}</td>
          <td className="px-4 py-3">{s.quests}</td>
          <td className="px-4 py-3">
            <span className="font-semibold">{naira(s.walletKobo)}</span> {s.walletFrozen ? <Badge tone="coral">frozen</Badge> : null}
          </td>
          <td className="px-4 py-3 text-ink-500">{s.lastActive ? date(s.lastActive, { day: 'numeric', month: 'short' }) : 'Never'}</td>
        </tr>
      ))}
    </Table>
  );
}

function Parents({ rows }: { rows: Parent[] }) {
  return (
    <Table head={['Parent', 'Contact', 'Children', 'Lessons booked', 'Payments', 'Last sign-in']}>
      {rows.map((p) => (
        <tr key={p.id} className="align-top hover:bg-paper">
          <td className="px-4 py-3">
            <div className="font-bold">{p.name}</div>
            <div className="text-xs text-ink-500">Joined {date(p.joined)}</div>
          </td>
          <td className="px-4 py-3">
            <div>{p.email ?? '—'}</div>
            <div className="text-xs text-ink-500">{p.phone ?? ''}</div>
          </td>
          <td className="px-4 py-3">
            {p.children.length ? (
              <ul className="flex flex-col gap-0.5">
                {p.children.map((c) => (
                  <li key={c.id}>
                    <span className="font-semibold">{c.name}</span> <span className="text-xs text-ink-500">· {c.school ?? 'no school'}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-ink-300">None linked</span>
            )}
          </td>
          <td className="px-4 py-3">{p.bookings}</td>
          <td className="px-4 py-3">{p.payments}</td>
          <td className="px-4 py-3 text-ink-500">{ago(p.lastLoginAt)}</td>
        </tr>
      ))}
    </Table>
  );
}

function StaffTable({ rows }: { rows: Staff[] }) {
  return (
    <Table head={['Name', 'Role', 'School', 'Teaching', 'Notes written', 'Last sign-in']}>
      {rows.map((s) => (
        <tr key={s.id} className="hover:bg-paper">
          <td className="px-4 py-3">
            <div className="font-bold">{s.name}</div>
            <div className="text-xs text-ink-500">{s.email ?? s.phone ?? '—'}</div>
          </td>
          <td className="px-4 py-3">
            <Badge tone={s.role === 'TEACHER' ? 'sky' : s.role === 'TUCK_SHOP' ? 'sun' : 'violet'}>{label(s.role)}</Badge>
          </td>
          <td className="px-4 py-3">
            <SchoolLink s={s.school} />
          </td>
          <td className="px-4 py-3 text-ink-700">
            {s.subjectsTaught} subject{s.subjectsTaught === 1 ? '' : 's'}
            {s.formClasses ? ` · form teacher of ${s.formClasses}` : ''}
          </td>
          <td className="px-4 py-3">{s.notesWritten}</td>
          <td className="px-4 py-3">{s.invited ? <Badge tone="sun">Invite pending</Badge> : <span className="text-ink-500">{ago(s.lastLoginAt)}</span>}</td>
        </tr>
      ))}
    </Table>
  );
}

function Tutors({ rows }: { rows: Tutor[] }) {
  return (
    <Table head={['Tutor', 'Status', 'Subjects passed', 'Rate / hr', 'Rating', 'Bookings', 'Earnings', 'Last sign-in']}>
      {rows.map((t) => (
        <tr key={t.id} className="hover:bg-paper">
          <td className="px-4 py-3">
            <div className="font-bold">{t.name}</div>
            <div className="text-xs text-ink-500">
              {t.email ?? t.phone ?? '—'}
              {t.state ? ` · ${t.state}` : ''}
            </div>
          </td>
          <td className="px-4 py-3">
            <Badge tone={t.status === 'VERIFIED' ? 'mint' : t.status === 'REJECTED' ? 'coral' : 'sun'}>{t.status.toLowerCase()}</Badge>
            {!t.accepting && t.status === 'VERIFIED' ? <div className="mt-1 text-xs text-ink-500">Not taking students</div> : null}
          </td>
          <td className="max-w-56 px-4 py-3 text-ink-700">{t.subjects.length ? t.subjects.join(', ') : <span className="text-ink-300">None yet</span>}</td>
          <td className="px-4 py-3 font-semibold">{naira(t.rateKobo)}</td>
          <td className="px-4 py-3">{t.rating ? `★ ${t.rating} (${t.reviews})` : <span className="text-ink-300">—</span>}</td>
          <td className="px-4 py-3">{t.bookings}</td>
          <td className="px-4 py-3 font-semibold">{naira(t.earningsKobo)}</td>
          <td className="px-4 py-3 text-ink-500">{ago(t.lastLoginAt)}</td>
        </tr>
      ))}
    </Table>
  );
}
