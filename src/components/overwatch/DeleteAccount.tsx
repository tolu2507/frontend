'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button, ErrorBox, Input, Loading, Modal, Notice } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { api, errorText } from '@/lib/api';
import { naira } from '@/lib/format';

type Preview = {
  userId: string;
  kind: 'PARENT' | 'STUDENT';
  name: string;
  children: { studentId: string; userId: string; name: string; otherParents: number; blockers: string[] }[];
  rewardsKobo: string;
  keepsRecords: boolean;
  blockers: string[];
};

/** "Delete" for a parent or child account: shows exactly what goes and what's kept, then asks for DELETE to be typed. */
export function DeleteAccountButton({ userId, label = 'Delete', onDeleted }: { userId: string; label?: string; onDeleted?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" variant="ghost" icon={<Trash2 className="size-4" />} onClick={() => setOpen(true)} className="text-coral-700">
        {label}
      </Button>
      {open ? <DeleteDialog userId={userId} onClose={() => setOpen(false)} onDeleted={onDeleted} /> : null}
    </>
  );
}

function DeleteDialog({ userId, onClose, onDeleted }: { userId: string; onClose: () => void; onDeleted?: () => void }) {
  const qc = useQueryClient();
  const preview = useQuery({ queryKey: ['ow', 'delete-preview', userId], queryFn: () => api<Preview>(`/admin/people/${userId}/delete-preview`), gcTime: 0 });
  const [withChildren, setWithChildren] = useState(true);
  const [typed, setTyped] = useState('');
  const del = useMutation({
    mutationFn: () => api<{ deleted: number; anonymised: boolean }>(`/admin/people/${userId}/delete`, { method: 'POST', body: { withChildren } }),
    onSuccess: (r) => {
      toast.success(r.deleted > 1 ? `Deleted ${r.deleted} accounts.` : 'Account deleted.');
      void qc.invalidateQueries({ queryKey: ['ow'] });
      onDeleted?.();
      onClose();
    },
    onError: (e) => toast.error(errorText(e)),
  });

  const p = preview.data;
  const going = p?.kind === 'PARENT' ? p.children.filter((c) => c.otherParents === 0) : [];
  const staying = p?.kind === 'PARENT' ? p.children.filter((c) => c.otherParents > 0) : [];
  const blockers = p ? [...p.blockers, ...(withChildren ? going.flatMap((c) => c.blockers) : [])] : [];
  const ready = !!p && !blockers.length && typed.trim().toUpperCase() === 'DELETE';

  return (
    <Modal
      open
      onClose={onClose}
      title={p ? `Delete ${p.name}?` : 'Delete account'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" disabled={!ready} loading={del.isPending} onClick={() => del.mutate()}>
            Delete for good
          </Button>
        </>
      }
    >
      {preview.isPending ? (
        <Loading rows={3} />
      ) : preview.error ? (
        <ErrorBox error={preview.error} />
      ) : p ? (
        <div className="flex flex-col gap-4 text-[15px]">
          {p.kind === 'STUDENT' ? (
            <p>Their login, progress, stickers, coins, Friday mocks and weekly reports are all deleted. Parents linked to them stay.</p>
          ) : (
            <>
              <p>
                Their login and personal details are deleted.
                {p.keepsRecords ? ' They have payments or rewards sent, which the law says we keep: the account stays as an unnamed “Deleted user” holding only those records.' : ''}
              </p>
              {going.length ? (
                <label className="flex items-start gap-3 rounded-2xl bg-coral-50 p-3">
                  <input type="checkbox" className="mt-1 size-4 accent-coral-600" checked={withChildren} onChange={(e) => setWithChildren(e.target.checked)} />
                  <span>
                    <b>Also delete {going.map((c) => c.name).join(', ')}</b>
                    <span className="block text-sm text-ink-500">{going.length === 1 ? 'This child has' : 'These children have'} no other parent on BrainBox. Untick to keep them (they can still sign in, with no parent).</span>
                  </span>
                </label>
              ) : null}
              {staying.length ? <p className="text-sm text-ink-500">{staying.map((c) => c.name).join(', ')} stay{staying.length === 1 ? 's' : ''} with their other parent.</p> : null}
              {Number(p.rewardsKobo) > 0 ? (
                <Notice tone="sun">
                  {naira(Number(p.rewardsKobo))} of rewards their children earned hasn’t been collected. It’s lost when they’re deleted.
                </Notice>
              ) : null}
            </>
          )}
          {blockers.length ? (
            <Notice tone="coral" title="Can’t delete yet">
              <ul className="list-disc pl-5">
                {blockers.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </Notice>
          ) : (
            <Input label="Type DELETE to confirm" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="DELETE" autoComplete="off" />
          )}
          <p className="text-xs text-ink-500">This can’t be undone. It’s recorded in the activity log without their name.</p>
        </div>
      ) : null}
    </Modal>
  );
}

/** Downloads everything we hold about a parent and their children as a JSON file, for "send me my data" requests. */
export function ExportDataButton({ userId, name }: { userId: string; name: string }) {
  const m = useMutation({
    mutationFn: () => api<unknown>(`/admin/people/${userId}/export`),
    onSuccess: (data) => {
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      const a = Object.assign(document.createElement('a'), { href: url, download: `brainbox-data-${name.toLowerCase().replace(/\s+/g, '-')}.json` });
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Downloaded. Send it to them from your support email.');
    },
    onError: (e) => toast.error(errorText(e)),
  });
  return (
    <Button size="sm" variant="secondary" loading={m.isPending} onClick={() => m.mutate()}>
      Download data
    </Button>
  );
}
