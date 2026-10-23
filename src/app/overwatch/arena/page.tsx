'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Banknote, CalendarClock, Crown, DoorOpen, Gamepad2, Radio, Search, Swords, Trophy, Users } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { BarList, ChartCard, TrendChart } from '@/components/overwatch/charts';
import { dateTime, Filters, FilterSelect, Kpi, Pager, qs, RangeTabs, type Paged } from '@/components/overwatch/kit';
import { Badge, Card, cx, Empty, ErrorBox, Loading, Notice, PageHeader, Table, Tabs, type Tone } from '@/components/ui';
import { api } from '@/lib/api';
import { date, naira } from '@/lib/format';

type Kind = 'GHOST' | 'ROOM' | 'LIVE' | 'OLYMPIAD';
type Status = 'WAITING' | 'PLAYING' | 'FINISHED' | 'CANCELLED';
const KIND: Record<Kind, { label: string; tone: Tone }> = {
  GHOST: { label: 'Ghost Race', tone: 'violet' },
  LIVE: { label: 'Quick Match', tone: 'sky' },
  ROOM: { label: 'Friends’ room', tone: 'mint' },
  OLYMPIAD: { label: 'Olympiad', tone: 'sun' },
};
const STATUS: Record<Status, { label: string; tone: Tone }> = {
  WAITING: { label: 'in the lobby', tone: 'sky' },
  PLAYING: { label: 'playing', tone: 'violet' },
  FINISHED: { label: 'finished', tone: 'mint' },
  CANCELLED: { label: 'cancelled', tone: 'ink' },
};
/** Under this average time to a right answer, a run is worth a look before paying a prize. Questions allow 10 seconds. */
const FAST_MS = 1500;

type Who = { id: string; name: string; class: string; school: string };
type Overview = {
  live: { roomsWaiting: number; roomsPlaying: number; quickPlaying: number; playersInGames: number; searching: number };
  totals: { matches: { value: number; changePct: number | null }; players: { value: number; changePct: number | null }; prizesKobo: { value: string; count: number; previousKobo: string }; byKind: Record<Kind, number>; cancelled: number };
  series: ({ day: string } & Record<Kind, number>)[];
  bySubject: { id: string; name: string; exam: string; matches: number; players: number }[];
  leaders: (Who & { rank: number; trophies: number })[];
  switchedOff: { arena: number; chat: number };
  olympiad: { status: 'upcoming' | 'open' | 'closed'; opensAt: string; closesAt: string; prizesOn: boolean; prizesNaira: number[]; minPlayers: number; today: { id: string; subject: string; entries: number }[] };
};
type Olympiad = {
  id: string;
  day: string;
  subject: string;
  exam: string;
  opensAt: string;
  closesAt: string;
  settledAt: string | null;
  entered: number;
  finished: number;
  top: (Who & { place: number; score: number; correct: number; questions: number; avgMs: number | null; prizeKobo: string })[];
};
type Match = {
  id: string;
  kind: Kind;
  status: Status;
  subject: string;
  exam: string;
  code: string | null;
  questions: number;
  createdAt: string;
  finishedAt: string | null;
  ghostOf: { name: string; score: number } | null;
  players: (Who & { score: number; correct: number; place: number | null; trophies: number | null; xp: number | null; finished: boolean; avgMs: number | null })[];
};

const time = (iso: string) => new Date(iso).toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit', timeZone: 'Africa/Lagos' });
const seconds = (ms: number | null) => (ms === null ? '—' : `${(ms / 1000).toFixed(1)}s`);

/** The arena and the Daily Olympiad: what's live, how much is played, who wins, and what prizes went out. */
export default function ArenaPage() {
  const [days, setDays] = useState(30);
  const [tab, setTab] = useState<'olympiads' | 'matches'>('olympiads');
  const q = useQuery({ queryKey: ['ow', 'arena', days], queryFn: () => api<Overview>(`/admin/arena?days=${days}`), placeholderData: keepPreviousData, refetchInterval: 30_000 });
  return (
    <>
      <PageHeader title="Arena" subtitle="Ghost Races, Quick Matches, friends’ rooms and the Daily Olympiad." actions={<RangeTabs value={days} onChange={setDays} />} />
      {q.isPending ? (
        <Loading rows={6} />
      ) : q.error ? (
        <ErrorBox error={q.error} onRetry={q.refetch} />
      ) : (
        <div className={cx('flex flex-col gap-6 transition', q.isPlaceholderData && 'opacity-60')}>
          <Dashboard d={q.data} />
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { value: 'olympiads', label: 'Daily Olympiads', icon: <Crown className="size-4" /> },
              { value: 'matches', label: 'Matches', icon: <Swords className="size-4" /> },
            ]}
          />
          {tab === 'olympiads' ? <Olympiads /> : <Matches />}
        </div>
      )}
    </>
  );
}

function Dashboard({ d }: { d: Overview }) {
  const t = d.totals;
  const o = d.olympiad;
  const entries = o.today.reduce((n, x) => n + x.entries, 0);
  return (
    <>
      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold">
          <Radio className="size-4 text-coral-700" aria-hidden /> Right now
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="Children in live games" tone="coral" value={d.live.playersInGames.toLocaleString()} hint="rooms and Quick Matches" icon={<Gamepad2 className="size-5" />} />
          <Kpi label="Friends’ rooms" tone="mint" value={(d.live.roomsWaiting + d.live.roomsPlaying).toLocaleString()} hint={`${d.live.roomsPlaying} playing, ${d.live.roomsWaiting} in the lobby`} icon={<DoorOpen className="size-5" />} />
          <Kpi label="Looking for a Quick Match" tone="sky" value={d.live.searching.toLocaleString()} hint={`${d.live.quickPlaying} Quick Match${d.live.quickPlaying === 1 ? '' : 'es'} playing`} icon={<Search className="size-5" />} />
          <Kpi
            label="Today’s Olympiad"
            tone="sun"
            value={o.status === 'open' ? 'Open now' : o.status === 'upcoming' ? `Opens ${time(o.opensAt)}` : 'Closed'}
            hint={o.status === 'upcoming' ? `until ${time(o.closesAt)}` : `${entries.toLocaleString()} ${entries === 1 ? 'entry' : 'entries'} today`}
            icon={<CalendarClock className="size-5" />}
          />
        </div>
      </section>

      {o.prizesOn ? (
        <Notice tone="sun" title="Olympiad cash prizes are on">
          Top 3 in each subject win {o.prizesNaira.map((n) => naira(n * 100)).join(', ')} into their parent’s rewards balance, when at least {o.minPlayers} children finish that subject’s Olympiad. Runs with a very fast average answer are marked below so you can check them. Change this in{' '}
          <Link href="/overwatch/settings" className="font-bold underline">
            Settings
          </Link>
          .
        </Notice>
      ) : (
        <Notice tone="sky" title="Olympiad cash prizes are off">
          Children play for glory and trophies only. Turn prizes on, and set the amounts, in{' '}
          <Link href="/overwatch/settings" className="font-bold underline">
            Settings → Daily Olympiad
          </Link>
          .
        </Notice>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Matches played" value={t.matches.value.toLocaleString()} changePct={t.matches.changePct} hint={t.cancelled ? `${t.cancelled} cancelled` : undefined} icon={<Swords className="size-5" />} />
        <Kpi label="Children who played" tone="mint" value={t.players.value.toLocaleString()} changePct={t.players.changePct} icon={<Users className="size-5" />} />
        <Kpi label="Olympiad prizes paid" tone="sun" value={naira(t.prizesKobo.value)} hint={`${t.prizesKobo.count} prize${t.prizesKobo.count === 1 ? '' : 's'}`} icon={<Banknote className="size-5" />} />
        <Kpi label="Arena switched off" tone="ink" value={d.switchedOff.arena.toLocaleString()} hint={`by parents · chat off for ${d.switchedOff.chat}`} icon={<Trophy className="size-5" />} />
      </div>

      <ChartCard title="Matches each day" subtitle="Finished matches, by kind. An Olympiad counts once per child who played it.">
        <TrendChart
          data={d.series}
          series={(Object.keys(KIND) as Kind[]).map((k) => ({ key: k, label: KIND[k].label }))}
          empty="No matches in this period yet."
        />
      </ChartCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Most played subjects" subtitle="Finished matches in this period.">
          <BarList
            items={d.bySubject.map((s) => ({ key: s.id, label: s.name, value: s.matches, hint: `${s.players.toLocaleString()} ${s.players === 1 ? 'child' : 'children'} · ${s.exam === 'COMMON_ENTRANCE' ? 'Common Entrance' : s.exam.charAt(0) + s.exam.slice(1).toLowerCase()}` }))}
            empty="No matches in this period yet."
          />
        </ChartCard>
        <Card className="p-0">
          <div className="px-4 pt-4 pb-2">
            <h2 className="font-display text-lg font-bold">Trophy leaders</h2>
            <p className="text-sm text-ink-500">Trophies come from Ghost Races and Quick Matches. They never turn into money.</p>
          </div>
          {d.leaders.length ? (
            <Table head={['#', 'Child', 'School', 'Trophies']} className="shadow-none">
              {d.leaders.map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-2.5 font-display font-bold">{l.rank <= 3 ? ['🥇', '🥈', '🥉'][l.rank - 1] : l.rank}</td>
                  <td className="px-4 py-2.5">
                    <div className="font-bold">{l.name}</div>
                    <div className="text-xs text-ink-500">{l.class}</div>
                  </td>
                  <td className="px-4 py-2.5 text-ink-500">{l.school}</td>
                  <td className="px-4 py-2.5 font-bold">🏆 {l.trophies.toLocaleString()}</td>
                </tr>
              ))}
            </Table>
          ) : (
            <Empty icon={<Trophy className="size-7" />} title="No trophies yet" message="Children win trophies in Ghost Races and Quick Matches." />
          )}
        </Card>
      </div>
    </>
  );
}

function Olympiads() {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const q = useQuery({ queryKey: ['ow', 'arena', 'olympiads', page], queryFn: () => api<Paged<Olympiad>>(`/admin/arena/olympiads?${qs({ page, pageSize })}`), placeholderData: keepPreviousData });
  if (q.isPending) return <Loading rows={4} />;
  if (q.error) return <ErrorBox error={q.error} onRetry={q.refetch} />;
  if (!q.data.rows.length) return <Empty icon={<Crown className="size-8" />} title="No Olympiads yet" message="Each subject’s Olympiad starts the first time a child enters it during the evening window." />;
  return (
    <div className={cx('flex flex-col gap-4 transition', q.isPlaceholderData && 'opacity-60')}>
      {q.data.rows.map((o) => (
        <Card key={o.id} className="flex flex-col gap-3 p-0">
          <div className="flex flex-wrap items-start justify-between gap-2 px-4 pt-4">
            <div>
              <h3 className="font-display text-lg font-bold">{o.subject}</h3>
              <p className="text-sm text-ink-500">
                {date(`${o.day}T12:00:00Z`, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} · {time(o.opensAt)}–{time(o.closesAt)} · {o.finished.toLocaleString()} finished of {o.entered.toLocaleString()} entered
              </p>
            </div>
            {o.settledAt ? <Badge tone="mint">places final</Badge> : <Badge tone="sky">still running</Badge>}
          </div>
          {o.top.length ? (
            <Table head={['Place', 'Child', 'Score', 'Right', 'Avg. answer', 'Prize']} className="shadow-none">
              {o.top.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-2.5 font-display font-bold">{['🥇', '🥈', '🥉'][t.place - 1]}</td>
                  <td className="px-4 py-2.5">
                    <div className="font-bold">{t.name}</div>
                    <div className="text-xs text-ink-500">
                      {t.class} · {t.school}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 font-bold">{t.score.toLocaleString()}</td>
                  <td className="px-4 py-2.5">
                    {t.correct}/{t.questions}
                  </td>
                  <td className="px-4 py-2.5">
                    {seconds(t.avgMs)}
                    {t.avgMs !== null && t.avgMs < FAST_MS ? (
                      <div className="mt-1">
                        <Badge tone="coral">very fast, check</Badge>
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-2.5 font-bold">{Number(t.prizeKobo) ? naira(t.prizeKobo) : <span className="font-normal text-ink-500">—</span>}</td>
                </tr>
              ))}
            </Table>
          ) : (
            <p className="px-4 pb-4 text-sm text-ink-500">Nobody has finished this one yet.</p>
          )}
        </Card>
      ))}
      <Pager page={page} pageSize={pageSize} total={q.data.total} onPage={setPage} />
    </div>
  );
}

function Matches() {
  const [kind, setKind] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const q = useQuery({ queryKey: ['ow', 'arena', 'matches', kind, status, page], queryFn: () => api<Paged<Match>>(`/admin/arena/matches?${qs({ kind, status, page, pageSize })}`), placeholderData: keepPreviousData });
  return (
    <div className="flex flex-col gap-4">
      <Filters>
        <FilterSelect
          label="Kind"
          value={kind}
          onChange={(v) => {
            setKind(v);
            setPage(1);
          }}
          options={[{ value: '', label: 'All kinds' }, ...(Object.keys(KIND) as Kind[]).map((k) => ({ value: k, label: KIND[k].label }))]}
        />
        <FilterSelect
          label="Status"
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
          options={[{ value: '', label: 'Any status' }, ...(Object.keys(STATUS) as Status[]).map((s) => ({ value: s, label: STATUS[s].label }))]}
        />
      </Filters>
      {q.isPending ? (
        <Loading rows={5} />
      ) : q.error ? (
        <ErrorBox error={q.error} onRetry={q.refetch} />
      ) : q.data.rows.length ? (
        <div className={cx('transition', q.isPlaceholderData && 'opacity-60')}>
          <Table head={['When', 'Kind', 'Subject', 'Players', 'Status']}>
            {q.data.rows.map((m) => (
              <tr key={m.id} className="align-top hover:bg-paper">
                <td className="whitespace-nowrap px-4 py-2.5 text-sm">{dateTime(m.createdAt)}</td>
                <td className="px-4 py-2.5">
                  <Badge tone={KIND[m.kind].tone}>{KIND[m.kind].label}</Badge>
                  {m.code ? <div className="mt-1 font-mono text-xs text-ink-500">{m.code}</div> : null}
                </td>
                <td className="px-4 py-2.5 text-sm">{m.subject}</td>
                <td className="px-4 py-2.5">
                  <ul className="flex flex-col gap-1 text-sm">
                    {m.players.map((p) => (
                      <li key={p.id} className="flex flex-wrap items-baseline gap-x-2">
                        <span className="font-bold">{p.name}</span>
                        <span className="text-ink-500">
                          {p.score.toLocaleString()} pts · {p.correct}/{m.questions} right · {seconds(p.avgMs)}
                        </span>
                        {p.trophies ? <span className={cx('font-bold', p.trophies > 0 ? 'text-mint-800' : 'text-coral-700')}>{p.trophies > 0 ? `+${p.trophies}` : p.trophies} 🏆</span> : null}
                        {!p.finished && m.status === 'FINISHED' ? <span className="text-xs text-ink-500">(left early)</span> : null}
                      </li>
                    ))}
                    {m.ghostOf ? <li className="text-ink-500">vs ghost of {m.ghostOf.name} ({m.ghostOf.score.toLocaleString()} pts)</li> : null}
                  </ul>
                </td>
                <td className="px-4 py-2.5">
                  <Badge tone={STATUS[m.status].tone}>{STATUS[m.status].label}</Badge>
                </td>
              </tr>
            ))}
          </Table>
          <Pager page={page} pageSize={pageSize} total={q.data.total} onPage={setPage} />
        </div>
      ) : (
        <Empty icon={<Swords className="size-8" />} title="No matches" message={kind || status ? 'Nothing matches these filters.' : 'Matches show here as children play in the arena.'} />
      )}
    </div>
  );
}
