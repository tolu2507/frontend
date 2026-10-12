'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileSpreadsheet, Printer, Search, UserPlus, Users } from 'lucide-react';
import Link from 'next/link';
import { useDeferredValue, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { ParentCodeBox, type ParentNotice } from '@/components/school/ParentCode';
import { Avatar, Badge, Button, Card, Empty, ErrorBox, Input, Loading, Modal, Notice, PageHeader, Select, Table } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { api, errorText } from '@/lib/api';
import { downloadCsv, parseCsv } from '@/lib/csv';
import { useClasses, useOverview, useSchoolKey } from '@/lib/queries';
import type { SchoolClass, StudentRow } from '@/lib/types';

type Login = { name: string; className: string; username: string; pin: string; shopCode: string; parentName?: string; parent?: ParentNotice | null };

export default function StudentsPage() {
  const key = useSchoolKey();
  const overview = useOverview();
  const classes = useClasses();
  const [classId, setClassId] = useState('');
  const [search, setSearch] = useState('');
  const q = useDeferredValue(search.trim());
  const students = useQuery({
    queryKey: [key, 'students', classId || 'all', q],
    queryFn: () => api<StudentRow[]>(`/school/students?${new URLSearchParams({ ...(classId ? { classId } : {}), ...(q ? { q } : {}) })}`),
  });
  const [adding, setAdding] = useState(false);
  const [importing, setImporting] = useState(false);
  const [slips, setSlips] = useState<Login[] | null>(null);
  const admin = overview.data?.me.isAdmin;
  const noYear = overview.data && !overview.data.year;

  return (
    <>
      <PageHeader
        title="Students"
        subtitle="Everyone enrolled this session."
        actions={
          admin ? (
            <>
              <Button variant="secondary" icon={<FileSpreadsheet className="size-4" />} onClick={() => setImporting(true)} disabled={!!noYear || !classes.data?.length}>
                Import from Excel
              </Button>
              <Button icon={<UserPlus className="size-4" />} onClick={() => setAdding(true)} disabled={!!noYear || !classes.data?.length}>
                Add student
              </Button>
            </>
          ) : null
        }
      />
      {admin && noYear ? (
        <Notice tone="sun" title="Set up your session first" action={<Link href="/dashboard/settings"><Button size="sm">Settings</Button></Link>}>
          Students are enrolled into a session (like 2026/2027). Add it with its term dates first.
        </Notice>
      ) : admin && classes.data && !classes.data.length ? (
        <Notice tone="sun" title="Create your classes first" action={<Link href="/dashboard/classes"><Button size="sm">Classes</Button></Link>}>
          Every student belongs to a class.
        </Notice>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-3">
        <label className="relative min-w-60 flex-1">
          <span className="sr-only">Search</span>
          <Search className="pointer-events-none absolute top-3 left-3 size-5 text-ink-300" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or admission number" className="h-11 w-full rounded-xl border-2 border-ink-200 bg-white pr-3 pl-10 text-[15px] outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100" />
        </label>
        <select aria-label="Class" value={classId} onChange={(e) => setClassId(e.target.value)} className="h-11 rounded-xl border-2 border-ink-200 bg-white px-3 text-[15px] font-semibold">
          <option value="">All classes</option>
          {(classes.data ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {students.isPending ? (
        <Loading />
      ) : students.error ? (
        <ErrorBox error={students.error} onRetry={students.refetch} />
      ) : students.data.length === 0 ? (
        <Empty
          icon={<Users className="size-7" />}
          title={q || classId ? 'No students match' : 'No students yet'}
          message={q || classId ? 'Try another name or class.' : admin ? 'Add students one by one, or import your whole list from Excel in one go.' : 'Students in your classes will show here.'}
        />
      ) : (
        <>
          <p className="mb-2 text-sm font-semibold text-ink-500">{students.data.length} students</p>
          <Table head={['Student', 'Class', 'Admission no.', 'Parent / guardian']}>
            {students.data.map((s) => (
              <tr key={s.id} className="hover:bg-paper">
                <td className="px-4 py-3">
                  <Link href={`/dashboard/students/${s.id}`} className="flex items-center gap-3 font-bold hover:text-violet-700">
                    <Avatar name={`${s.firstName} ${s.lastName}`} />
                    {s.lastName}, {s.firstName}
                  </Link>
                </td>
                <td className="px-4 py-3">{s.className}</td>
                <td className="px-4 py-3 text-ink-500">{s.admissionNo ?? '—'}</td>
                <td className="px-4 py-3">{s.parents.length ? <span className="text-ink-700">{s.parents.map((p) => p.name).join(', ')}</span> : <Badge tone="sun">Not linked</Badge>}</td>
              </tr>
            ))}
          </Table>
        </>
      )}

      {adding && classes.data ? <AddStudent classes={classes.data} defaultClassId={classId} onClose={() => setAdding(false)} onAdded={(l) => setSlips([l])} /> : null}
      {importing && classes.data ? <ImportStudents classes={classes.data} onClose={() => setImporting(false)} onDone={(ls) => ls.length && setSlips(ls)} /> : null}
      {slips ? <LoginSlips logins={slips} onClose={() => setSlips(null)} /> : null}
    </>
  );
}

// ── Add one ────────────────────────────────────────────────

const PHONE = /^\+?[0-9 ]{10,18}$/;
const addSchema = z
  .object({
    firstName: z.string().trim().min(1, 'Enter a first name.'),
    lastName: z.string().trim().min(1, 'Enter a surname.'),
    otherNames: z.string().trim(),
    admissionNo: z.string().trim(),
    dateOfBirth: z.string(),
    classId: z.string().min(1, 'Choose a class.'),
    pFirst: z.string().trim(),
    pLast: z.string().trim(),
    pEmail: z.union([z.literal(''), z.email('Enter a valid email.')]),
    pPhone: z.union([z.literal(''), z.string().regex(PHONE, 'Enter a valid phone number.')]),
    pRel: z.enum(['MOTHER', 'FATHER', 'GUARDIAN']),
  })
  .refine((v) => !v.pFirst || v.pEmail || v.pPhone, { path: ['pEmail'], message: 'Add the parent’s email or phone so they can sign in.' })
  .refine((v) => !(v.pEmail || v.pPhone) || (v.pFirst && v.pLast), { path: ['pFirst'], message: 'Enter the parent’s name.' });

function AddStudent({ classes, defaultClassId, onClose, onAdded }: { classes: SchoolClass[]; defaultClassId: string; onClose: () => void; onAdded: (l: Login) => void }) {
  const qc = useQueryClient();
  const key = useSchoolKey();
  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(addSchema),
    defaultValues: { firstName: '', lastName: '', otherNames: '', admissionNo: '', dateOfBirth: '', classId: defaultClassId, pFirst: '', pLast: '', pEmail: '', pPhone: '', pRel: 'MOTHER' as const },
  });
  const add = useMutation({
    mutationFn: (v: z.infer<typeof addSchema>) =>
      api<{ username: string; pin: string; shopCode: string; parentInvited: boolean; parent: ParentNotice | null }>('/school/students', {
        body: {
          firstName: v.firstName,
          lastName: v.lastName,
          otherNames: v.otherNames || undefined,
          admissionNo: v.admissionNo || undefined,
          dateOfBirth: v.dateOfBirth || undefined,
          classId: v.classId,
          parent: v.pFirst ? { firstName: v.pFirst, lastName: v.pLast, email: v.pEmail || undefined, phone: v.pPhone.replace(/\s/g, '') || undefined, relationship: v.pRel } : undefined,
        },
      }),
    onSuccess: (r, v) => {
      toast.success(`${v.firstName} added`);
      qc.invalidateQueries({ queryKey: [key] });
      onClose();
      onAdded({ name: `${v.firstName} ${v.lastName}`, className: classes.find((c) => c.id === v.classId)?.name ?? '', username: r.username, pin: r.pin, shopCode: r.shopCode, parentName: v.pFirst ? `${v.pFirst} ${v.pLast}`.trim() : undefined, parent: r.parent });
    },
    onError: (e) => toast.error(errorText(e)),
  });
  const submit = handleSubmit((v) => add.mutate(v));
  const e = formState.errors;
  return (
    <Modal
      open
      onClose={onClose}
      title="Add a student"
      wide
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={add.isPending} onClick={submit}>
            Add student
          </Button>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="First name" error={e.firstName?.message} {...register('firstName')} />
          <Input label="Surname" error={e.lastName?.message} {...register('lastName')} />
          <Input label="Other names (optional)" {...register('otherNames')} />
          <Input label="Admission number (optional)" {...register('admissionNo')} />
          <Select label="Class" placeholder="Choose…" options={classes.map((c) => ({ value: c.id, label: c.name }))} error={e.classId?.message} {...register('classId')} />
          <Input label="Date of birth (optional)" type="date" {...register('dateOfBirth')} />
        </div>
        <div role="group" className="grid gap-4 rounded-2xl bg-paper p-4 sm:grid-cols-2">
          <h3 className="text-sm font-extrabold sm:col-span-2">Parent or guardian</h3>
          <p className="text-sm text-ink-500 sm:col-span-2">They get the Nexus app with weekly reports and fee payments. If they already have a Nexus account, they’ll be asked to accept the child in their app first.</p>
          <Input label="First name" error={e.pFirst?.message} {...register('pFirst')} />
          <Input label="Surname" {...register('pLast')} />
          <Input label="Email" type="email" error={e.pEmail?.message} {...register('pEmail')} />
          <Input label="Phone / WhatsApp" type="tel" placeholder="0803 000 0000" error={e.pPhone?.message} {...register('pPhone')} />
          <Select
            label="Relationship"
            options={[
              { value: 'MOTHER', label: 'Mother' },
              { value: 'FATHER', label: 'Father' },
              { value: 'GUARDIAN', label: 'Guardian' },
            ]}
            {...register('pRel')}
          />
        </div>
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}

// ── Import ─────────────────────────────────────────────────

const HEADERS = ['First name', 'Surname', 'Class', 'Admission number', 'Date of birth (YYYY-MM-DD)', 'Parent first name', 'Parent surname', 'Parent email', 'Parent phone', 'Relationship (Mother/Father/Guardian)'];
type Row = { firstName: string; lastName: string; classId: string; className: string; admissionNo?: string; dateOfBirth?: string; parent?: { firstName: string; lastName: string; email?: string; phone?: string; relationship: string }; problem?: string };

function ImportStudents({ classes, onClose, onDone }: { classes: SchoolClass[]; onClose: () => void; onDone: (logins: Login[]) => void }) {
  const qc = useQueryClient();
  const key = useSchoolKey();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const run = useMutation({
    mutationFn: (good: Row[]) =>
      api<{ added: number; failed: number; results: { row: number; ok: boolean; name: string; username?: string; pin?: string; shopCode?: string; parent?: ParentNotice | null; error?: string }[] }>('/school/students/import', {
        body: { students: good.map((r) => ({ firstName: r.firstName, lastName: r.lastName, classId: r.classId, admissionNo: r.admissionNo, dateOfBirth: r.dateOfBirth, parent: r.parent })) },
      }),
    onSuccess: (r, good) => {
      qc.invalidateQueries({ queryKey: [key] });
      if (r.failed) toast.error(`${r.failed} couldn’t be added: ${r.results.find((x) => !x.ok)?.error}`);
      if (r.added) toast.success(`${r.added} students added`);
      onClose();
      onDone(r.results.filter((x) => x.ok).map((x) => ({ name: x.name, className: good[x.row - 1].className, username: x.username!, pin: x.pin!, shopCode: x.shopCode!, parentName: good[x.row - 1].parent ? `${good[x.row - 1].parent!.firstName} ${good[x.row - 1].parent!.lastName}` : undefined, parent: x.parent })));
    },
    onError: (e) => toast.error(errorText(e)),
  });

  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, '');
  const readFile = async (file: File) => {
    setFileError(null);
    if (!file.name.toLowerCase().endsWith('.csv')) return setFileError('Save your spreadsheet as CSV first (in Excel: File → Save As → CSV).');
    const table = parseCsv(await file.text());
    if (table.length < 2) return setFileError('The file has no students in it.');
    const [, ...body] = table;
    setRows(
      body.map((c) => {
        const [first = '', last = '', cls = '', adm = '', dob = '', pf = '', pl = '', pe = '', pp = '', rel = ''] = c.map((x) => x.trim());
        const match = classes.find((k) => norm(k.name) === norm(cls));
        const relationship = ['MOTHER', 'FATHER', 'GUARDIAN'].includes(rel.toUpperCase()) ? rel.toUpperCase() : 'GUARDIAN';
        const problem = !first || !last ? 'Missing name' : !match ? `Unknown class “${cls}”` : dob && !/^\d{4}-\d{2}-\d{2}$/.test(dob) ? 'Date of birth must look like 2015-03-21' : pf && !pe && !pp ? 'Parent needs an email or phone' : undefined;
        return {
          firstName: first,
          lastName: last,
          classId: match?.id ?? '',
          className: match?.name ?? cls,
          admissionNo: adm || undefined,
          dateOfBirth: dob || undefined,
          parent: pf ? { firstName: pf, lastName: pl || last, email: pe.toLowerCase() || undefined, phone: pp.replace(/\s/g, '') || undefined, relationship } : undefined,
          problem,
        };
      }),
    );
  };

  const good = rows?.filter((r) => !r.problem) ?? [];
  return (
    <Modal
      open
      onClose={onClose}
      title="Import students"
      wide
      footer={
        rows ? (
          <>
            <Button variant="ghost" onClick={() => setRows(null)}>
              Choose another file
            </Button>
            <Button loading={run.isPending} disabled={!good.length} onClick={() => run.mutate(good)}>
              Import {good.length} students
            </Button>
          </>
        ) : null
      }
    >
      {!rows ? (
        <div className="flex flex-col gap-4">
          <ol className="flex list-decimal flex-col gap-2 pl-5 text-[15px] text-ink-700">
            <li>Download the template and fill it in Excel or Google Sheets, one student per row.</li>
            <li>
              Use your class names exactly as on Nexus: <b>{classes.map((c) => c.name).join(', ')}</b>.
            </li>
            <li>Save as CSV and upload it here. You’ll check everything before anything is saved.</li>
          </ol>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" icon={<FileSpreadsheet className="size-4" />} onClick={() => downloadCsv('Nexus student import template.csv', [HEADERS, ['Ada', 'Obi', classes[0]?.name ?? 'Primary 4', 'A1023', '2016-05-14', 'Ngozi', 'Obi', 'ngozi@example.com', '08031234567', 'Mother']])}>
              Download template
            </Button>
          </div>
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50 px-6 py-10 text-center hover:bg-violet-100">
            <FileSpreadsheet className="size-8 text-violet-500" />
            <span className="font-bold text-violet-700">Choose your CSV file</span>
            <span className="text-sm text-ink-500">Up to 1,000 students at a time</span>
            <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0])} />
          </label>
          {fileError ? <p className="font-semibold text-coral-700">{fileError}</p> : null}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-[15px]">
            <b>{good.length}</b> ready to import{rows.length - good.length ? <>, <b className="text-coral-700">{rows.length - good.length}</b> need fixing in your file (they’ll be skipped).</> : '.'}
          </p>
          <div className="max-h-[50vh] overflow-auto rounded-2xl border border-ink-100">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-paper text-xs font-extrabold text-ink-500 uppercase">
                <tr>
                  <th className="px-3 py-2">Student</th>
                  <th className="px-3 py-2">Class</th>
                  <th className="px-3 py-2">Parent</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {rows.map((r, i) => (
                  <tr key={i} className={r.problem ? 'bg-coral-50' : ''}>
                    <td className="px-3 py-2 font-semibold">
                      {r.firstName} {r.lastName}
                    </td>
                    <td className="px-3 py-2">{r.className}</td>
                    <td className="px-3 py-2 text-ink-500">{r.parent ? `${r.parent.firstName} · ${r.parent.email ?? r.parent.phone}` : '—'}</td>
                    <td className="px-3 py-2">{r.problem ? <span className="font-semibold text-coral-700">{r.problem}</span> : <Badge tone="mint">Ready</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ── Login slips ────────────────────────────────────────────

/** Children sign in to the app with a username and PIN. Shown once here so the school can print slips. */
function LoginSlips({ logins, onClose }: { logins: Login[]; onClose: () => void }) {
  return (
    <Modal
      open
      onClose={onClose}
      title={logins.length === 1 ? 'App login for the student' : `App logins for ${logins.length} students`}
      wide
      footer={
        <>
          <Button variant="secondary" onClick={() => downloadCsv('Nexus student logins.csv', [['Student', 'Class', 'Username', 'PIN', 'Tuck shop ID', 'Parent', 'Parent signs in with', 'Parent app code'], ...logins.map((l) => [l.name, l.className, l.username, l.pin, l.shopCode, l.parentName ?? '', l.parent?.signInWith ?? '', l.parent?.code ?? (l.parent?.status === 'AWAITING_PARENT' ? 'Has an account: accepts in app' : l.parent?.sent ? 'Sent' : '')])])}>
            Download CSV
          </Button>
          <Button icon={<Printer className="size-4" />} onClick={() => window.print()}>
            Print slips
          </Button>
        </>
      }
    >
      <Notice tone="sun">Save or print these now: PINs and parent codes aren’t shown again (you can send a parent a new code from the student’s page). Parents can change the PIN in their app, and you can reset it from the student’s page.</Notice>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {logins.map((l) => (
          <Card key={l.username} className="border-2 border-dashed break-inside-avoid">
            <div className="text-sm font-bold text-ink-500">{l.className}</div>
            <div className="font-display text-lg font-bold">{l.name}</div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div>
                <div className="text-xs font-bold text-ink-500 uppercase">Username</div>
                <div className="font-mono text-base font-bold">{l.username}</div>
              </div>
              <div>
                <div className="text-xs font-bold text-ink-500 uppercase">PIN</div>
                <div className="font-mono text-base font-bold tracking-widest">{l.pin}</div>
              </div>
              <div className="col-span-2">
                <div className="text-xs font-bold text-ink-500 uppercase">Tuck shop ID</div>
                <div className="font-mono text-base font-bold tracking-wider">{l.shopCode}</div>
              </div>
            </div>
            <p className="mt-2 text-xs text-ink-500">Open the Nexus app → “I’m a student” → enter the username and PIN. At the tuck shop, give the tuck shop ID.</p>
            {l.parent ? (
              <div className="mt-3">
                <ParentCodeBox notice={l.parent} parentName={l.parentName} childName={l.name.split(' ')[0]} compact />
              </div>
            ) : null}
          </Card>
        ))}
      </div>
    </Modal>
  );
}
