'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, Trash2, UserPlus, UsersRound } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Avatar, Badge, Button, Empty, ErrorBox, Input, Loading, Modal, Notice, PageHeader, Select, Table } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { api, errorText } from '@/lib/api';
import { ROLE } from '@/lib/format';
import { useOverview, useSchoolKey, useStaff } from '@/lib/queries';

type InviteResult = { inviteSent: boolean; hasAccount: boolean; code?: string };
/** `app`: tuck-shop staff sign in on the phone app, not this dashboard. */
type Handover = { name: string; email: string; code: string; app: boolean };

export default function StaffPage() {
  const overview = useOverview();
  const staff = useStaff();
  const qc = useQueryClient();
  const key = useSchoolKey();
  const [inviting, setInviting] = useState(false);
  const [handover, setHandover] = useState<Handover | null>(null);
  const owner = overview.data?.me.role === 'SCHOOL_OWNER';

  const resend = useMutation({
    mutationFn: (m: { membershipId: string; name: string; email: string; app: boolean }) => api<InviteResult>(`/school/staff/${m.membershipId}/resend`, { body: {} }).then((r) => ({ r, m })),
    onSuccess: ({ r, m }) => {
      if (r.hasAccount) toast.success(`${m.name} already has a password and can sign in.`);
      else if (r.inviteSent) toast.success(`New invite sent to ${m.email}`);
      else if (r.code) setHandover({ name: m.name, email: m.email, code: r.code, app: m.app });
    },
    onError: (e) => toast.error(errorText(e)),
  });
  const remove = useMutation({
    mutationFn: (membershipId: string) => api(`/school/staff/${membershipId}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Removed from staff');
      qc.invalidateQueries({ queryKey: [key] });
    },
    onError: (e) => toast.error(errorText(e)),
  });

  if (staff.isPending) return <Loading />;
  if (staff.error) return <ErrorBox error={staff.error} onRetry={staff.refetch} />;

  return (
    <>
      <PageHeader
        title="Staff"
        subtitle="Teachers see only their own classes. Tuck-shop staff sell at the counter from the phone app. Administrators can manage everything except billing agreements."
        actions={
          <Button icon={<UserPlus className="size-4" />} onClick={() => setInviting(true)}>
            Invite staff
          </Button>
        }
      />
      {staff.data.length <= 1 ? (
        <Empty icon={<UsersRound className="size-7" />} title="Invite your teachers" message="Each teacher gets an email to set their password. Then they can take attendance and enter scores for their classes." action={<Button onClick={() => setInviting(true)}>Invite staff</Button>} />
      ) : null}
      <div className="mt-4">
        <Table head={['Name', 'Role', 'Contact', 'Status', '']}>
          {staff.data.map((m) => (
            <tr key={m.membershipId} className="hover:bg-paper">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3 font-bold">
                  <Avatar name={`${m.firstName} ${m.lastName}`} />
                  {m.firstName} {m.lastName}
                </div>
              </td>
              <td className="px-4 py-3">
                <Badge tone={m.role === 'TEACHER' ? 'sky' : m.role === 'TUCK_SHOP' ? 'sun' : 'violet'}>{ROLE[m.role]}</Badge>
              </td>
              <td className="px-4 py-3 text-ink-500">{m.email ?? m.phone}</td>
              <td className="px-4 py-3">{m.hasSignedIn ? <Badge tone="mint">Active</Badge> : <Badge tone="sun">Invited</Badge>}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-1">
                  {!m.hasSignedIn ? (
                    <Button size="sm" variant="ghost" icon={<Mail className="size-4" />} loading={resend.isPending && resend.variables?.membershipId === m.membershipId} onClick={() => resend.mutate({ membershipId: m.membershipId, name: m.firstName, email: m.email ?? '', app: m.role === 'TUCK_SHOP' })}>
                      Resend
                    </Button>
                  ) : null}
                  {m.role !== 'SCHOOL_OWNER' ? (
                    <button type="button" onClick={() => confirm(`Remove ${m.firstName} from your staff? They lose access to your school straight away.`) && remove.mutate(m.membershipId)} className="grid size-9 place-items-center rounded-lg text-ink-300 hover:bg-coral-50 hover:text-coral-700" aria-label={`Remove ${m.firstName}`}>
                      <Trash2 className="size-4" />
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </div>
      {inviting ? <InviteForm owner={owner} onClose={() => setInviting(false)} onHandover={setHandover} /> : null}
      {handover ? (
        <Modal open onClose={() => setHandover(null)} title={`Give ${handover.name} this code`} footer={<Button onClick={() => setHandover(null)}>Done</Button>}>
          <Notice tone="sun">We couldn’t email the invite (email isn’t switched on yet), so pass this on yourself.</Notice>
          <div className="my-4 rounded-2xl bg-violet-50 p-5 text-center">
            <div className="font-display text-4xl font-extrabold tracking-[0.3em]">{handover.code}</div>
            <div className="mt-1 text-sm text-ink-500">valid for 7 days</div>
          </div>
          <p className="text-[15px]">
            {handover.app ? (
              <>
                They install the BrainBox app, tap <b>Sign in</b>, then <b>Got a code?</b>, enter <b>{handover.email}</b> and this code, then choose a password.
              </>
            ) : (
              <>
                They go to <b>{typeof window !== 'undefined' ? window.location.origin : ''}/set-password</b>, enter <b>{handover.email}</b> and this code, then choose a password.
              </>
            )}
          </p>
        </Modal>
      ) : null}
    </>
  );
}

const schema = z.object({
  firstName: z.string().trim().min(1, 'Enter a first name.'),
  lastName: z.string().trim().min(1, 'Enter a surname.'),
  email: z.email('Enter a valid email. The invite goes there.'),
  phone: z.union([z.literal(''), z.string().regex(/^\+?[0-9 ]{10,18}$/, 'Enter a valid phone number.')]),
  role: z.enum(['TEACHER', 'TUCK_SHOP', 'SCHOOL_ADMIN']),
});

function InviteForm({ owner, onClose, onHandover }: { owner: boolean; onClose: () => void; onHandover: (h: Handover) => void }) {
  const qc = useQueryClient();
  const key = useSchoolKey();
  const { register, handleSubmit, formState } = useForm({ resolver: zodResolver(schema), defaultValues: { firstName: '', lastName: '', email: '', phone: '', role: 'TEACHER' as z.infer<typeof schema>['role'] } });
  const invite = useMutation({
    mutationFn: (v: z.infer<typeof schema>) => api<InviteResult & { userId: string }>('/school/staff', { body: { ...v, email: v.email.toLowerCase(), phone: v.phone.replace(/\s/g, '') || undefined } }),
    onSuccess: (r, v) => {
      qc.invalidateQueries({ queryKey: [key] });
      onClose();
      if (r.hasAccount) toast.success(`${v.firstName} already uses BrainBox and can sign in now.`);
      else if (r.inviteSent) toast.success(`Invite sent to ${v.email}`);
      else if (r.code) onHandover({ name: v.firstName, email: v.email.toLowerCase(), code: r.code, app: v.role === 'TUCK_SHOP' });
    },
    onError: (e) => toast.error(errorText(e)),
  });
  const submit = handleSubmit((v) => invite.mutate(v));
  const e = formState.errors;
  return (
    <Modal
      open
      onClose={onClose}
      title="Invite a staff member"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={invite.isPending} onClick={submit}>
            Send invite
          </Button>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Input label="First name" error={e.firstName?.message} {...register('firstName')} />
        <Input label="Surname" error={e.lastName?.message} {...register('lastName')} />
        <Input label="Email" type="email" wrapperClassName="sm:col-span-2" error={e.email?.message} {...register('email')} />
        <Input label="Phone (optional)" type="tel" error={e.phone?.message} {...register('phone')} />
        <Select
          label="Role"
          options={[{ value: 'TEACHER', label: 'Teacher' }, { value: 'TUCK_SHOP', label: 'Tuck shop' }, ...(owner ? [{ value: 'SCHOOL_ADMIN', label: 'Administrator' }] : [])]}
          hint={owner ? 'Tuck-shop staff sell from the phone app. Administrators can manage students, staff and fees.' : 'Tuck-shop staff sell from the phone app. Only the owner can add administrators.'}
          {...register('role')}
        />
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
