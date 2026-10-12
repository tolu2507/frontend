'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, BadgeCheck, GraduationCap, Phone } from 'lucide-react';
import { useState } from 'react';

import { Badge, Button, Card, Empty, ErrorBox, Loading, Modal, PageHeader, Tabs, Textarea } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { api, errorText } from '@/lib/api';
import { date, LEVEL, naira } from '@/lib/format';

type Application = {
  id: string;
  status: string;
  name: string;
  email: string | null;
  phone: string | null;
  ninNumber: string | null;
  referees: { name: string; phone: string; relationship: string }[] | null;
  profile: { headline: string | null; state: string | null; rateKobo: string };
  tests: { subject: string; level: string; score: number | null; passed: boolean | null; integrity: { appSwitches?: number } | null }[];
  updatedAt: string;
};

const TABS = [
  { value: 'INTERVIEW', label: 'Ready for interview' },
  { value: 'TEST_ASSIGNED', label: 'Taking tests' },
  { value: 'SUBMITTED', label: 'Filling profile' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Not approved' },
] as const;

export default function TutorsPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]['value']>('INTERVIEW');
  const q = useQuery({ queryKey: ['ow', 'tutors', tab], queryFn: () => api<Application[]>(`/admin/tutor-applications?status=${tab}`) });
  const [deciding, setDeciding] = useState<{ app: Application; approve: boolean } | null>(null);

  return (
    <>
      <PageHeader title="Tutor applications" subtitle="Approve only after the interview. Parents see “Nexus approved” on every tutor you approve." />
      <Tabs value={tab} onChange={setTab} tabs={[...TABS]} />
      {q.isPending ? (
        <Loading />
      ) : q.error ? (
        <ErrorBox error={q.error} onRetry={q.refetch} />
      ) : q.data.length === 0 ? (
        <Empty icon={<GraduationCap className="size-7" />} title="Nobody here right now" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {q.data.map((a) => (
            <Card key={a.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-display text-xl font-bold">{a.name}</h3>
                  <p className="text-sm text-ink-500">{a.profile.headline ?? 'No headline yet'}</p>
                </div>
                <span className="text-xs text-ink-500">{date(a.updatedAt, { day: 'numeric', month: 'short' })}</span>
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                {a.profile.state ? <Badge tone="sky">{a.profile.state}</Badge> : null}
                {Number(a.profile.rateKobo) ? <Badge tone="violet">{naira(a.profile.rateKobo)}/hr</Badge> : null}
                {a.ninNumber ? <Badge>NIN {a.ninNumber}</Badge> : <Badge tone="sun">No NIN yet</Badge>}
              </div>
              {a.tests.length ? (
                <ul className="flex flex-col gap-1.5">
                  {a.tests.map((t, i) => {
                    const switches = t.integrity?.appSwitches ?? 0;
                    return (
                      <li key={i} className="flex items-center justify-between gap-2 rounded-xl bg-paper px-3 py-2 text-sm">
                        <span className="font-semibold">
                          {t.subject} · {LEVEL[t.level as keyof typeof LEVEL] ?? t.level}
                        </span>
                        <span className="flex items-center gap-2">
                          {switches > 2 ? (
                            <span title={`Left the test app ${switches} times`} className="flex items-center gap-1 text-xs font-bold text-coral-700">
                              <AlertTriangle className="size-3.5" /> {switches} app switches
                            </span>
                          ) : null}
                          {t.score === null ? <Badge>in progress</Badge> : <Badge tone={t.passed ? 'mint' : 'coral'}>{Math.round(t.score * 100)}%</Badge>}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
              {a.referees?.length ? (
                <div className="text-sm">
                  <div className="mb-1 font-bold">Referees</div>
                  {a.referees.map((r) => (
                    <div key={r.phone} className="flex items-center gap-2 text-ink-700">
                      <Phone className="size-3.5" /> {r.name} ({r.relationship}) · <a href={`tel:${r.phone}`} className="font-semibold text-violet-700">{r.phone}</a>
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="text-sm text-ink-500">{[a.email, a.phone].filter(Boolean).join(' · ')}</div>
              {tab === 'INTERVIEW' || tab === 'TEST_ASSIGNED' ? (
                <div className="mt-auto flex gap-2 pt-1">
                  <Button size="sm" variant="success" icon={<BadgeCheck className="size-4" />} disabled={!a.tests.some((t) => t.passed)} onClick={() => setDeciding({ app: a, approve: true })}>
                    Approve
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => setDeciding({ app: a, approve: false })}>
                    Don’t approve
                  </Button>
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      )}
      {deciding ? <Decide {...deciding} onClose={() => setDeciding(null)} /> : null}
    </>
  );
}

function Decide({ app, approve, onClose }: { app: Application; approve: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [note, setNote] = useState('');
  const decide = useMutation({
    mutationFn: () => api(`/admin/tutor-applications/${app.id}/${approve ? 'approve' : 'reject'}`, { body: { note: note.trim() || undefined } }),
    onSuccess: () => {
      toast.success(approve ? `${app.name} is Nexus approved` : 'Application closed');
      qc.invalidateQueries({ queryKey: ['ow'] });
      onClose();
    },
    onError: (e) => toast.error(errorText(e)),
  });
  return (
    <Modal
      open
      onClose={onClose}
      title={approve ? `Approve ${app.name}?` : `Don’t approve ${app.name}?`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant={approve ? 'success' : 'danger'} loading={decide.isPending} onClick={() => decide.mutate()}>
            {approve ? 'Approve' : 'Confirm'}
          </Button>
        </>
      }
    >
      <p className="mb-4 text-[15px] text-ink-500">{approve ? 'They’ll be told by notification and email, and parents can start booking them.' : 'They’ll be told by notification and email. Your note is included in the email.'}</p>
      <Textarea label={approve ? 'Interview notes (private)' : 'Note to the tutor (optional)'} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
    </Modal>
  );
}
