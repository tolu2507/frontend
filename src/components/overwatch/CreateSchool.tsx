'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button, Input, Modal, Notice } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { api, errorText } from '@/lib/api';

export type Enquiry = { id: string; contactName: string; role: string; schoolName: string; email: string; phone: string; state: string | null; studentCount: string | null; levels: string[]; message: string | null; handled: boolean; createdAt: string };

const schema = z.object({
  name: z.string().trim().min(2, 'Enter the school’s name.'),
  state: z.string().trim(),
  address: z.string().trim(),
  phone: z.union([z.literal(''), z.string().regex(/^\+?[0-9 ]{10,18}$/, 'Enter a valid phone number.')]),
  ownerFirst: z.string().trim().min(1, 'Enter the owner’s first name.'),
  ownerLast: z.string().trim().min(1, 'Enter the owner’s surname.'),
  ownerEmail: z.email('Enter the owner’s email. Their invite goes there.'),
  ownerPhone: z.union([z.literal(''), z.string().regex(/^\+?[0-9 ]{10,18}$/, 'Enter a valid phone number.')]),
});

/** Creates a live school and its owner account. The owner gets a code to set their password. */
export function CreateSchool({ enquiry, onClose }: { enquiry?: Enquiry; onClose: () => void }) {
  const qc = useQueryClient();
  const [first, ...rest] = (enquiry?.contactName ?? '').replace(/^(mr|mrs|ms|dr|miss)\.?\s+/i, '').split(' ');
  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: enquiry?.schoolName ?? '',
      state: enquiry?.state ?? '',
      address: '',
      phone: '',
      ownerFirst: first ?? '',
      ownerLast: rest.join(' '),
      ownerEmail: enquiry?.email ?? '',
      ownerPhone: enquiry?.phone ?? '',
    },
  });
  const [handover, setHandover] = useState<{ code: string; email: string } | null>(null);
  const create = useMutation({
    mutationFn: (v: z.infer<typeof schema>) =>
      api<{ id: string; ownerInvited: boolean; ownerHasAccount: boolean; code?: string }>('/admin/schools', {
        body: {
          enquiryId: enquiry?.id,
          name: v.name,
          state: v.state || undefined,
          address: v.address || undefined,
          phone: v.phone.replace(/\s/g, '') || undefined,
          owner: { firstName: v.ownerFirst, lastName: v.ownerLast, email: v.ownerEmail.toLowerCase(), phone: v.ownerPhone.replace(/\s/g, '') || undefined },
        },
      }),
    onSuccess: (r, v) => {
      qc.invalidateQueries({ queryKey: ['ow'] });
      if (r.code) setHandover({ code: r.code, email: v.ownerEmail.toLowerCase() });
      else {
        toast.success(r.ownerHasAccount ? 'School created. The owner can sign in with their existing account.' : `School created. Invite emailed to ${v.ownerEmail}.`);
        onClose();
      }
    },
    onError: (e) => toast.error(errorText(e)),
  });
  const submit = handleSubmit((v) => create.mutate(v));
  const e = formState.errors;

  if (handover)
    return (
      <Modal open onClose={onClose} title="School created" footer={<Button onClick={onClose}>Done</Button>}>
        <Notice tone="sun">Email isn’t switched on yet, so give the owner this code yourself.</Notice>
        <div className="my-4 rounded-2xl bg-violet-50 p-5 text-center font-display text-4xl font-extrabold tracking-[0.3em]">{handover.code}</div>
        <p className="text-[15px]">
          They open <b>{typeof window !== 'undefined' ? window.location.origin : ''}/set-password</b>, enter <b>{handover.email}</b> and this code (valid 7 days).
        </p>
      </Modal>
    );

  return (
    <Modal
      open
      onClose={onClose}
      title={enquiry ? `Set up ${enquiry.schoolName}` : 'Add a school'}
      wide
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={create.isPending} onClick={submit}>
            Create school and invite owner
          </Button>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="School name" wrapperClassName="sm:col-span-2" error={e.name?.message} {...register('name')} />
          <Input label="State" {...register('state')} />
          <Input label="School phone (optional)" error={e.phone?.message} {...register('phone')} />
          <Input label="Address (optional)" wrapperClassName="sm:col-span-2" {...register('address')} />
        </div>
        <div role="group" className="grid gap-4 rounded-2xl bg-paper p-4 sm:grid-cols-2">
          <h3 className="text-sm font-extrabold sm:col-span-2">Owner / proprietor</h3>
          <Input label="First name" error={e.ownerFirst?.message} {...register('ownerFirst')} />
          <Input label="Surname" error={e.ownerLast?.message} {...register('ownerLast')} />
          <Input label="Email" type="email" error={e.ownerEmail?.message} {...register('ownerEmail')} />
          <Input label="Phone (optional)" error={e.ownerPhone?.message} {...register('ownerPhone')} />
        </div>
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
