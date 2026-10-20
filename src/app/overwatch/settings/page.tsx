'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import { useState } from 'react';

import { dateTime } from '@/components/overwatch/kit';
import { Button, Card, ErrorBox, Loading, Notice, PageHeader } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { api, errorText } from '@/lib/api';

type Setting = {
  key: string;
  kind: 'number' | 'switch';
  group: string;
  label: string;
  help: string;
  unit?: string;
  min?: number;
  max?: number;
  default: number | boolean;
  value: number | boolean;
  changed: boolean;
  updatedAt: string | null;
  updatedBy: string | null;
};

const GROUPS = ['Plan', 'Free plan', 'Coins', 'Sticker coins', 'Rewards'];

/** Prices, trial, free plan, coins and rewards: change them here, no deploy needed. Applies within 30 seconds. */
export default function SettingsPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['ow', 'settings'], queryFn: () => api<Setting[]>('/admin/settings') });
  const [draft, setDraft] = useState<Record<string, number | boolean | string>>({});
  const save = useMutation({
    mutationFn: (changes: Record<string, number | boolean>) => api<Setting[]>('/admin/settings', { method: 'PUT', body: { changes } }),
    onSuccess: (rows) => {
      qc.setQueryData(['ow', 'settings'], rows);
      setDraft({});
      toast.success('Saved. Parents and children see it within 30 seconds.');
    },
    onError: (e) => toast.error(errorText(e)),
  });

  if (q.isPending) return <Loading rows={6} />;
  if (q.error) return <ErrorBox error={q.error} onRetry={q.refetch} />;

  const changes = Object.fromEntries(
    Object.entries(draft)
      .map(([k, v]) => [k, typeof v === 'string' ? Number(v.replace(/,/g, '')) : v] as const)
      .filter(([k, v]) => q.data.find((s) => s.key === k)?.value !== v),
  );
  const count = Object.keys(changes).length;

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Prices, the free trial, the free plan, coins and rewards. Every change is in the activity log."
        actions={
          <Button icon={<Save className="size-4" />} disabled={!count} loading={save.isPending} onClick={() => save.mutate(changes)}>
            {count ? `Save ${count} change${count === 1 ? '' : 's'}` : 'Saved'}
          </Button>
        }
      />
      <div className="flex flex-col gap-6">
        <Notice tone="sky">Price and trial changes apply to new payments and new trials. Parents who already paid keep what they paid for.</Notice>
        {GROUPS.map((group) => (
          <Card key={group} className="flex flex-col gap-1">
            <h2 className="mb-2 font-display text-lg font-bold">{group}</h2>
            {q.data
              .filter((s) => s.group === group)
              .map((s) => (
                <Row key={s.key} s={s} value={draft[s.key] ?? s.value} onChange={(v) => setDraft((d) => ({ ...d, [s.key]: v }))} />
              ))}
          </Card>
        ))}
      </div>
    </>
  );
}

function Row({ s, value, onChange }: { s: Setting; value: number | boolean | string; onChange: (v: number | boolean | string) => void }) {
  const id = `setting-${s.key}`;
  const num = typeof value === 'string' ? Number(value.replace(/,/g, '')) : value;
  const out = s.kind === 'number' && (typeof num !== 'number' || !Number.isInteger(num) || num < (s.min ?? -Infinity) || num > (s.max ?? Infinity));
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-ink-100 py-3 first-of-type:border-t-0">
      <div className="min-w-0 flex-1 basis-72">
        <label htmlFor={id} className="font-bold">
          {s.label}
        </label>
        <p className="text-sm text-ink-500">{s.help}</p>
        <p className="mt-0.5 text-xs text-ink-400">
          Default {s.kind === 'switch' ? (s.default ? 'on' : 'off') : `${s.unit === '₦' ? '₦' : ''}${Number(s.default).toLocaleString()}${s.unit && s.unit !== '₦' ? ` ${s.unit}` : ''}`}
          {s.changed && s.updatedAt ? ` · changed ${dateTime(s.updatedAt)}${s.updatedBy ? ` by ${s.updatedBy}` : ''}` : ''}
        </p>
      </div>
      {s.kind === 'switch' ? (
        <label className="flex items-center gap-2 font-semibold">
          <input id={id} type="checkbox" className="size-5 accent-violet-600" checked={value === true} onChange={(e) => onChange(e.target.checked)} />
          {value ? 'On' : 'Off'}
        </label>
      ) : (
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            {s.unit === '₦' ? <span className="font-bold text-ink-500">₦</span> : null}
            <input
              id={id}
              inputMode="numeric"
              value={typeof value === 'number' ? value.toLocaleString() : String(value)}
              onChange={(e) => onChange(e.target.value)}
              aria-invalid={out}
              className={`w-36 rounded-xl border px-3 py-2 text-right font-semibold tabular-nums outline-none focus:ring-2 ${out ? 'border-coral-500 focus:ring-coral-200' : 'border-ink-200 focus:ring-violet-200'}`}
            />
            {s.unit && s.unit !== '₦' ? <span className="w-20 text-sm text-ink-500">{s.unit}</span> : <span className="w-20" />}
          </div>
          {out ? (
            <span className="text-xs text-coral-700">
              Between {s.min?.toLocaleString()} and {s.max?.toLocaleString()}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}
