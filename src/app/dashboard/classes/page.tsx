'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, Pencil, Plus, School } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { Badge, Button, Card, Empty, ErrorBox, Input, Loading, Modal, PageHeader, Select } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { api, errorText } from '@/lib/api';
import { LEVEL } from '@/lib/format';
import { useClasses, useOverview, useSchoolKey, useStaff } from '@/lib/queries';
import type { Level, SchoolClass } from '@/lib/types';

const GRADES: Record<Level, string[]> = {
  NURSERY: ['Creche', 'Nursery 1', 'Nursery 2', 'Kindergarten'],
  PRIMARY: ['Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6'],
  JUNIOR_SECONDARY: ['JSS1', 'JSS2', 'JSS3'],
  SENIOR_SECONDARY: ['SS1', 'SS2', 'SS3'],
};

const schema = z.object({
  level: z.enum(['NURSERY', 'PRIMARY', 'JUNIOR_SECONDARY', 'SENIOR_SECONDARY']),
  gradeName: z.string().trim().min(1, 'Choose or type the class.'),
  armName: z.string().trim().max(20),
  formTeacherId: z.string(),
});

export default function ClassesPage() {
  const overview = useOverview();
  const classes = useClasses();
  const [editing, setEditing] = useState<SchoolClass | 'new' | null>(null);
  const admin = overview.data?.me.isAdmin;

  if (classes.isPending || overview.isPending) return <Loading />;
  if (classes.error) return <ErrorBox error={classes.error} onRetry={classes.refetch} />;

  const byLevel = (Object.keys(LEVEL) as Level[]).map((l) => ({ level: l, items: classes.data.filter((c) => c.level === l) })).filter((g) => g.items.length);

  return (
    <>
      <PageHeader
        title="Classes"
        subtitle={admin ? 'Open a class to take attendance, enter scores or see the broadsheet.' : 'Your classes. Open one to take attendance or enter scores.'}
        actions={
          admin ? (
            <Button icon={<Plus className="size-4" />} onClick={() => setEditing('new')}>
              New class
            </Button>
          ) : null
        }
      />
      {classes.data.length === 0 ? (
        <Empty
          icon={<School className="size-7" />}
          title={admin ? 'Create your first class' : 'No classes yet'}
          message={admin ? 'Add each class and arm, like “Primary 4 Gold” or “JSS2 B”. Then give it subjects and teachers.' : 'An administrator needs to make you a form teacher or subject teacher.'}
          action={admin ? <Button onClick={() => setEditing('new')}>New class</Button> : null}
        />
      ) : (
        <div className="flex flex-col gap-8">
          {byLevel.map((g) => (
            <section key={g.level}>
              <h2 className="mb-3 text-sm font-extrabold tracking-wide text-ink-500 uppercase">{LEVEL[g.level]}</h2>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {g.items.map((c) => (
                  <Card key={c.id} className="group relative flex flex-col gap-3 transition hover:-translate-y-0.5 hover:border-violet-200">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-display text-xl font-bold">{c.name}</h3>
                        <p className="text-[14px] text-ink-500">{c.formTeacher ? `Form teacher: ${c.formTeacher.firstName} ${c.formTeacher.lastName}` : 'No form teacher yet'}</p>
                      </div>
                      {admin ? (
                        <button type="button" onClick={() => setEditing(c)} className="relative z-10 grid size-9 place-items-center rounded-xl text-ink-500 hover:bg-ink-100" aria-label={`Edit ${c.name}`}>
                          <Pencil className="size-4" />
                        </button>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone="violet">{c.studentCount} {c.studentCount === 1 ? 'student' : 'students'}</Badge>
                      <Badge tone={c.subjects.length ? 'mint' : 'sun'}>{c.subjects.length ? `${c.subjects.length} ${c.subjects.length === 1 ? 'subject' : 'subjects'}` : 'No subjects yet'}</Badge>
                    </div>
                    <Link href={`/dashboard/classes/${c.id}`} className="mt-auto flex items-center gap-1 text-sm font-extrabold text-violet-700 after:absolute after:inset-0" aria-label={`Open ${c.name}`}>
                      Open class <ChevronRight className="size-4 transition group-hover:translate-x-0.5" />
                    </Link>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
      {editing ? <ClassForm cls={editing === 'new' ? null : editing} onClose={() => setEditing(null)} /> : null}
    </>
  );
}

function ClassForm({ cls, onClose }: { cls: SchoolClass | null; onClose: () => void }) {
  const qc = useQueryClient();
  const key = useSchoolKey();
  const staff = useStaff();
  const { register, handleSubmit, formState, control } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { level: cls?.level ?? 'PRIMARY', gradeName: cls?.gradeName ?? '', armName: cls?.armName ?? '', formTeacherId: cls?.formTeacher?.id ?? '' },
  });
  const level = useWatch({ control, name: 'level' }) as Level;
  const save = useMutation({
    mutationFn: (v: z.infer<typeof schema>) =>
      api(cls ? `/school/classes/${cls.id}` : '/school/classes', { method: cls ? 'PUT' : 'POST', body: { ...v, armName: v.armName || undefined, formTeacherId: v.formTeacherId || null } }),
    onSuccess: () => {
      toast.success(cls ? 'Class updated' : 'Class created');
      qc.invalidateQueries({ queryKey: [key] });
      onClose();
    },
    onError: (e) => toast.error(errorText(e)),
  });
  const remove = useMutation({
    mutationFn: () => api(`/school/classes/${cls!.id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Class deleted');
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
      title={cls ? `Edit ${cls.name}` : 'New class'}
      footer={
        <>
          {cls ? (
            <Button variant="danger" className="mr-auto" loading={remove.isPending} onClick={() => confirm(`Delete ${cls.name}? Only empty classes can be deleted.`) && remove.mutate()}>
              Delete
            </Button>
          ) : null}
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={save.isPending} onClick={submit}>
            {cls ? 'Save' : 'Create class'}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Select label="Level" wrapperClassName="sm:col-span-2" options={(Object.keys(LEVEL) as Level[]).map((l) => ({ value: l, label: LEVEL[l] }))} {...register('level')} />
        <Input label="Class" list="grade-options" placeholder={GRADES[level][0]} error={formState.errors.gradeName?.message} {...register('gradeName')} />
        <datalist id="grade-options">
          {GRADES[level].map((g) => (
            <option key={g} value={g} />
          ))}
        </datalist>
        <Input label="Arm (optional)" placeholder="e.g. Gold, A" error={formState.errors.armName?.message} {...register('armName')} />
        <Select
          label="Form teacher"
          wrapperClassName="sm:col-span-2"
          placeholder="Not yet"
          options={(staff.data ?? []).filter((s) => s.status !== 'LEFT').map((s) => ({ value: s.id, label: `${s.firstName} ${s.lastName}` }))}
          hint="Invite teachers on the Staff page first."
          {...register('formTeacherId')}
        />
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
