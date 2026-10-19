'use client';

import { useQuery } from '@tanstack/react-query';
import { Flame, GraduationCap, Target, Trophy, Users } from 'lucide-react';
import { useState } from 'react';

import { Filters, FilterSelect, Kpi } from '@/components/overwatch/kit';
import { Badge, Card, Empty, ErrorBox, Loading, PageHeader, Table, Tabs } from '@/components/ui';
import { api } from '@/lib/api';
import { date } from '@/lib/format';

type Exam = 'JAMB' | 'WAEC' | 'NECO' | 'BECE' | 'COMMON_ENTRANCE' | 'PRIMARY';
const EXAM_LABEL: Record<Exam, string> = { JAMB: 'JAMB', WAEC: 'WAEC', NECO: 'NECO', BECE: 'BECE', COMMON_ENTRANCE: 'Common Entrance', PRIMARY: 'Class practice' };

type Student = { rank: number | null; id: string; name: string; class: string; school: string };
type Rankings = {
  activeThisWeek: number;
  xp: (Student & { xp: number; streak: number })[];
  streaks: (Student & { streak: number })[];
  practice: (Student & { answered: number; accuracy: number })[];
  mocks: { id: string; exam: Exam; title: string; opensAt: string; sat: number; scored: number; averageScore: number | null; top: (Student & { score: number; percentile: number | null })[] }[];
};

/** Who is working hardest and scoring best: XP, streaks, practice accuracy and the Friday mocks. */
export default function RankingsPage() {
  const [exam, setExam] = useState('');
  const [period, setPeriod] = useState<'week' | 'all'>('week');
  const q = useQuery({ queryKey: ['ow', 'rankings', exam, period], queryFn: () => api<Rankings>(`/admin/rankings?period=${period}${exam ? `&exam=${exam}` : ''}`) });

  return (
    <>
      <PageHeader title="Rankings" subtitle="The students working hardest and scoring best, across Nexus." />
      <Filters>
        <FilterSelect label="Exam" value={exam} onChange={setExam} options={[{ value: '', label: 'All students' }, ...(Object.keys(EXAM_LABEL) as Exam[]).map((e) => ({ value: e, label: `Preparing for ${EXAM_LABEL[e]}` }))]} />
      </Filters>
      {q.isPending ? (
        <Loading rows={6} />
      ) : q.error ? (
        <ErrorBox error={q.error} onRetry={q.refetch} />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="Active this week" value={q.data.activeThisWeek.toLocaleString()} icon={<Users className="size-5" />} hint="Earned any XP since Monday" />
            <Kpi label="Top XP" tone="sun" value={q.data.xp[0] ? q.data.xp[0].xp.toLocaleString() : '—'} hint={q.data.xp[0]?.name} icon={<Trophy className="size-5" />} />
            <Kpi label="Longest streak" tone="coral" value={q.data.streaks[0] ? `${q.data.streaks[0].streak} days` : '—'} hint={q.data.streaks[0]?.name} icon={<Flame className="size-5" />} />
            <Kpi label="Best practice accuracy" tone="mint" value={q.data.practice[0] ? `${q.data.practice[0].accuracy}%` : '—'} hint={q.data.practice[0]?.name} icon={<Target className="size-5" />} />
          </div>

          <Card className="p-0">
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-4">
              <h2 className="font-display text-lg font-bold">XP leaderboard</h2>
              <Tabs
                value={period}
                onChange={setPeriod}
                tabs={[
                  { value: 'week', label: 'This week' },
                  { value: 'all', label: 'All time' },
                ]}
              />
            </div>
            {q.data.xp.length ? (
              <Table head={['#', 'Student', 'Class', 'School', 'XP', 'Streak']} className="shadow-none">
                {q.data.xp.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-2.5 font-display font-bold">{medal(s.rank)}</td>
                    <td className="px-4 py-2.5 font-bold">{s.name}</td>
                    <td className="px-4 py-2.5">{s.class}</td>
                    <td className="px-4 py-2.5 text-ink-500">{s.school}</td>
                    <td className="px-4 py-2.5 font-bold">{s.xp.toLocaleString()}</td>
                    <td className="px-4 py-2.5">{s.streak ? `${s.streak} 🔥` : '—'}</td>
                  </tr>
                ))}
              </Table>
            ) : (
              <Empty icon={<Trophy className="size-7" />} title="No XP yet" message={period === 'week' ? 'Students earn XP from practice rounds, quests and mocks. This week’s leaders appear here.' : 'Leaders appear here once students start earning XP.'} />
            )}
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-0">
              <div className="px-4 pt-4 pb-2">
                <h2 className="font-display text-lg font-bold">Practice accuracy</h2>
                <p className="text-sm text-ink-500">Students with 20 or more practice questions, by how many they got right.</p>
              </div>
              {q.data.practice.length ? (
                <Table head={['#', 'Student', 'Answered', 'Right']} className="shadow-none">
                  {q.data.practice.map((s) => (
                    <tr key={s.id}>
                      <td className="px-4 py-2.5 font-display font-bold">{medal(s.rank)}</td>
                      <td className="px-4 py-2.5">
                        <div className="font-bold">{s.name}</div>
                        <div className="text-xs text-ink-500">
                          {s.class} · {s.school}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">{s.answered.toLocaleString()}</td>
                      <td className="px-4 py-2.5 font-bold">{s.accuracy}%</td>
                    </tr>
                  ))}
                </Table>
              ) : (
                <Empty icon={<Target className="size-7" />} title="Not enough practice yet" message="Students appear here after answering 20 practice questions." />
              )}
            </Card>
            <Card className="p-0">
              <div className="px-4 pt-4 pb-2">
                <h2 className="font-display text-lg font-bold">Longest streaks</h2>
                <p className="text-sm text-ink-500">Days in a row with some learning.</p>
              </div>
              {q.data.streaks.length ? (
                <Table head={['#', 'Student', 'Streak']} className="shadow-none">
                  {q.data.streaks.map((s) => (
                    <tr key={s.id}>
                      <td className="px-4 py-2.5 font-display font-bold">{medal(s.rank)}</td>
                      <td className="px-4 py-2.5">
                        <div className="font-bold">{s.name}</div>
                        <div className="text-xs text-ink-500">
                          {s.class} · {s.school}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 font-bold">{s.streak} days</td>
                    </tr>
                  ))}
                </Table>
              ) : (
                <Empty icon={<Flame className="size-7" />} title="No streaks running" message="A streak starts when a student learns on two days in a row." />
              )}
            </Card>
          </div>

          <div>
            <h2 className="mb-3 font-display text-lg font-bold">Friday mocks</h2>
            {q.data.mocks.length ? (
              <div className="grid gap-6 lg:grid-cols-2">
                {q.data.mocks.map((mk) => (
                  <Card key={mk.id} className="p-0">
                    <div className="flex flex-wrap items-start justify-between gap-2 px-4 pt-4 pb-2">
                      <div>
                        <h3 className="font-display font-bold">{mk.title}</h3>
                        <p className="text-sm text-ink-500">
                          {date(mk.opensAt, { day: 'numeric', month: 'short', year: 'numeric' })} · {mk.sat.toLocaleString()} sat · average {mk.averageScore ?? '—'}
                          {mk.exam === 'JAMB' ? ' / 400' : '%'}
                        </p>
                      </div>
                      <Badge tone="violet">{EXAM_LABEL[mk.exam]}</Badge>
                    </div>
                    <Table head={['Rank', 'Student', 'Score', 'Standing']} className="shadow-none">
                      {mk.top.map((s) => (
                        <tr key={s.id}>
                          <td className="px-4 py-2.5 font-display font-bold">{medal(s.rank)}</td>
                          <td className="px-4 py-2.5">
                            <div className="font-bold">{s.name}</div>
                            <div className="text-xs text-ink-500">{s.school}</div>
                          </td>
                          <td className="px-4 py-2.5 font-bold">
                            {s.score}
                            {mk.exam === 'JAMB' ? '' : '%'}
                          </td>
                          <td className="px-4 py-2.5 text-ink-500">{s.percentile === null ? '—' : `Top ${Math.max(1, Math.round(100 - s.percentile))}%`}</td>
                        </tr>
                      ))}
                    </Table>
                  </Card>
                ))}
              </div>
            ) : (
              <Empty icon={<GraduationCap className="size-7" />} title="No mock results yet" message="Results appear here after each Friday mock closes and is marked." />
            )}
          </div>
        </div>
      )}
    </>
  );
}

const medal = (rank: number | null) => (rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : (rank ?? '—'));
