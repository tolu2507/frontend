'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Bot, Coins, Gauge, Hash, Timer } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { BarList, ChartCard, compact, Meter, TrendChart } from '@/components/overwatch/charts';
import { dateTime, Kpi, label, RangeTabs } from '@/components/overwatch/kit';
import { Badge, Button, ErrorBox, Loading, Notice, PageHeader, Table } from '@/components/ui';
import { api } from '@/lib/api';
import { naira } from '@/lib/format';

type Usage = {
  config: { model: string; configured: boolean; inputPerM: number; outputPerM: number; ngnPerUsd: number };
  totals: { calls: number; failed: number; inputTokens: number; outputTokens: number; costMicroUsd: number; costKobo: number; avgLatencyMs: number };
  series: { day: string; calls: number; failed: number; tokens: number; costKobo: number }[];
  byFeature: { feature: string; calls: number; tokens: number; costKobo: number }[];
  bySchool: { id: string; name: string; status: string; students: number; curriculum: string | null; aiEnabled: boolean; topics: number; calls: number; tokens: number; costKobo: number; monthCostKobo: number; monthlyBudgetKobo: number | null; perStudentKobo: number }[];
  unattributed: { calls: number; costKobo: number };
  recent: { id: string; at: string; feature: string; model: string; school: string | null; inputTokens: number; outputTokens: number; costKobo: number; ok: boolean; latencyMs: number; error: string | null }[];
};

/** Kobo amounts this small need decimals: ₦0.42 rather than ₦0. */
const money = (kobo: number) => (kobo > 0 && kobo < 10_000 ? `₦${(kobo / 100).toFixed(2)}` : naira(kobo));

export default function AiPage() {
  const [days, setDays] = useState(30);
  const q = useQuery({ queryKey: ['ow', 'ai', days], queryFn: () => api<Usage>(`/admin/ai/usage?days=${days}`) });
  return (
    <>
      <PageHeader title="AI & curriculum" subtitle="What AI costs, what it’s used for, and how it’s set up for each school." actions={<RangeTabs value={days} onChange={setDays} />} />
      {q.isPending ? <Loading rows={6} /> : q.error ? <ErrorBox error={q.error} onRetry={q.refetch} /> : <AiDashboard d={q.data} days={days} />}
    </>
  );
}

function AiDashboard({ d, days }: { d: Usage; days: number }) {
  const t = d.totals;
  const failRate = t.calls ? Math.round((t.failed / t.calls) * 100) : 0;
  const notSetUp = d.bySchool.filter((s) => s.status === 'ACTIVE' && !s.curriculum).length;
  return (
    <div className="flex flex-col gap-6">
      {!d.config.configured ? (
        <Notice tone="coral" title="AI is off">
          No <code>GEMINI_API_KEY</code> is set on the server, so quizzes and reports use the non-AI fallbacks.
        </Notice>
      ) : null}
      <Notice tone="sky">
        Model <b>{d.config.model}</b> · priced at ${d.config.inputPerM} per million input tokens and ${d.config.outputPerM} per million output tokens, at ₦{d.config.ngnPerUsd.toLocaleString()}/$. Change these with <code>AI_PRICE_INPUT_PER_M</code>, <code>AI_PRICE_OUTPUT_PER_M</code> and <code>AI_NGN_PER_USD</code> in the backend <code>.env</code> to match your Google bill.
      </Notice>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Kpi label="AI cost" tone="coral" value={money(t.costKobo)} hint={`≈ $${(t.costMicroUsd / 1_000_000).toFixed(2)} · ${days} days`} icon={<Coins className="size-5" />} />
        <Kpi label="AI calls" value={t.calls.toLocaleString()} hint={t.calls ? `${money(Math.round(t.costKobo / t.calls))} per call` : undefined} icon={<Bot className="size-5" />} />
        <Kpi label="Tokens used" tone="sky" value={compact(t.inputTokens + t.outputTokens)} hint={`${compact(t.inputTokens)} in · ${compact(t.outputTokens)} out`} icon={<Hash className="size-5" />} />
        <Kpi label="Failed calls" tone={failRate > 10 ? 'coral' : 'mint'} value={`${failRate}%`} hint={`${t.failed} of ${t.calls}; fallbacks were used`} icon={<AlertTriangle className="size-5" />} />
        <Kpi label="Avg. response" tone="sun" value={`${(t.avgLatencyMs / 1000).toFixed(1)}s`} icon={<Timer className="size-5" />} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="AI cost per day" subtitle="In naira, at the configured rate">
          <TrendChart data={d.series} series={[{ key: 'costKobo', label: 'Cost', color: '#e2552f' }]} format={(v) => (v < 10_000 ? `₦${(v / 100).toFixed(v ? 1 : 0)}` : `₦${compact(v / 100)}`)} empty="No AI calls in this period" />
        </ChartCard>
        <ChartCard title="AI calls per day" subtitle="Failed calls fell back to non-AI content">
          <TrendChart data={d.series} series={[{ key: 'calls', label: 'All calls' }, { key: 'failed', label: 'Failed', color: '#e2552f' }]} format={compact} empty="No AI calls in this period" />
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <ChartCard title="What AI is used for" subtitle={`Cost by feature, last ${days} days`}>
          <BarList items={[...d.byFeature].sort((a, b) => b.costKobo - a.costKobo).map((f) => ({ key: f.feature, label: label(f.feature), value: f.costKobo, hint: `${f.calls.toLocaleString()} calls · ${compact(f.tokens)} tokens` }))} format={money} color="#e2552f" empty="No AI calls yet." />
          {d.unattributed.calls ? <p className="text-xs text-ink-500">{d.unattributed.calls} calls ({money(d.unattributed.costKobo)}) were for children without a school.</p> : null}
        </ChartCard>
        <ChartCard title="Each school’s AI" subtitle={notSetUp ? `${notSetUp} live school${notSetUp === 1 ? ' hasn’t' : 's haven’t'} been set up yet. Their AI uses general Nigerian-school instructions.` : 'Curriculum, scheme of work and spend this month'}>
          <Table head={['School', 'Curriculum', 'Scheme of work', `Cost (${days}d)`, 'This month vs budget', '']} className="shadow-none">
            {d.bySchool.map((s) => {
              const used = s.monthlyBudgetKobo ? (s.monthCostKobo / s.monthlyBudgetKobo) * 100 : null;
              return (
                <tr key={s.id} className="hover:bg-paper">
                  <td className="px-4 py-2.5">
                    <div className="font-bold">{s.name}</div>
                    <div className="text-xs text-ink-500">
                      {s.students} students{s.students && s.costKobo ? ` · ${money(s.perStudentKobo)}/student` : ''}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    {s.curriculum ? label(s.curriculum) : <Badge tone="sun">Not set up</Badge>}
                    {!s.aiEnabled ? (
                      <div className="mt-1">
                        <Badge tone="coral">AI off</Badge>
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-2.5">{s.topics ? `${s.topics} topics` : <span className="text-ink-300">None</span>}</td>
                  <td className="px-4 py-2.5 font-semibold">
                    {money(s.costKobo)}
                    <div className="text-xs font-normal text-ink-500">{s.calls} calls</div>
                  </td>
                  <td className="min-w-40 px-4 py-2.5">
                    {used === null ? (
                      <span className="text-sm text-ink-500">{money(s.monthCostKobo)} · no cap</span>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <Meter value={used} tone={used >= 100 ? 'coral' : used >= 80 ? 'sun' : 'mint'} />
                        <span className="text-xs text-ink-500">
                          {money(s.monthCostKobo)} of {money(s.monthlyBudgetKobo!)}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Link href={`/overwatch/schools/${s.id}/ai`}>
                      <Button size="sm" variant="secondary" icon={<Gauge className="size-4" />}>
                        Set up AI
                      </Button>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </Table>
        </ChartCard>
      </div>

      <ChartCard title="Latest AI calls" subtitle="Newest first">
        {d.recent.length === 0 ? (
          <p className="text-sm text-ink-500">No AI calls in this period.</p>
        ) : (
          <Table head={['When', 'Feature', 'School', 'Tokens in / out', 'Cost', 'Time', 'Result']} className="shadow-none">
            {d.recent.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-2 whitespace-nowrap text-ink-500">{dateTime(r.at)}</td>
                <td className="px-4 py-2 font-semibold">{label(r.feature)}</td>
                <td className="px-4 py-2 text-ink-700">{r.school ?? '—'}</td>
                <td className="px-4 py-2">
                  {r.inputTokens.toLocaleString()} / {r.outputTokens.toLocaleString()}
                </td>
                <td className="px-4 py-2 font-semibold">{money(r.costKobo)}</td>
                <td className="px-4 py-2 text-ink-500">{(r.latencyMs / 1000).toFixed(1)}s</td>
                <td className="max-w-72 px-4 py-2">
                  {r.ok ? (
                    <Badge tone="mint">ok</Badge>
                  ) : (
                    <>
                      <Badge tone="coral">failed</Badge>
                      <div className="mt-1 line-clamp-2 text-xs text-ink-500" title={r.error ?? ''}>
                        {r.error}
                      </div>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </ChartCard>
    </div>
  );
}
