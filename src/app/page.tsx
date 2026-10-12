import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  CalendarCheck,
  Check,
  ClipboardList,
  Eye,
  FileSpreadsheet,
  Flame,
  GraduationCap,
  HandCoins,
  HeartHandshake,
  Lock,
  Mail,
  MessageCircle,
  Plus,
  ReceiptText,
  School,
  ShieldCheck,
  ShoppingBasket,
  Smartphone,
  Sparkles,
  Star,
  Trophy,
  Users,
} from 'lucide-react';

import { DemoForm } from '@/components/landing/DemoForm';
import { Logo } from '@/components/landing/Logo';
import { Nav } from '@/components/landing/Nav';
import { RevealObserver } from '@/components/landing/RevealObserver';
import { brand } from '@/config/brand';

import './landing.css';

const N = brand.name;

export default function LandingPage() {
  return (
    <div className="lp">
      <Nav />
      <main>
        <Hero />
        <Pains />
        <Features />
        <DeepDives />
        <People />
        <HowItWorks />
        <Trust />
        <Faq />
        <Demo />
      </main>
      <Footer />
      <RevealObserver />
    </div>
  );
}

/* ── Hero ─────────────────────────────────────────────── */

function Hero() {
  return (
    <section className="lp-hero">
      <div className="lp-wrap lp-hero-grid">
        <div>
          <span className="lp-eyebrow">
            <span className="lp-eyebrow-dot">
              <Sparkles size={13} />
            </span>
            Built for Nigerian nursery, primary and secondary schools
          </span>
          <h1>
            The school system that keeps parents{' '}
            <span className="lp-hl">
              coming back
              <svg viewBox="0 0 300 20" preserveAspectRatio="none" aria-hidden="true">
                <path d="M4 14 C 80 4, 200 4, 296 12" fill="none" stroke="#FFC53D" strokeWidth="9" strokeLinecap="round" />
              </svg>
            </span>
          </h1>
          <p className="lp-hero-sub">
            {N} runs your students, results and fees in one place. Then it turns that data into a weekly progress report for every
            parent, and a learning game every student wants to play.
          </p>
          <div className="lp-hero-ctas">
            <a href="#demo" className="lp-btn">
              Book a free demo <ArrowRight size={20} className="arrow" />
            </a>
            <a href="#features" className="lp-btn ghost">
              See what’s inside
            </a>
          </div>
          <ul className="lp-checks">
            <li>
              <Check size={18} strokeWidth={3} /> No setup fee
            </li>
            <li>
              <Check size={18} strokeWidth={3} /> Works on any smartphone
            </li>
            <li>
              <Check size={18} strokeWidth={3} /> We import your records for you
            </li>
          </ul>
        </div>
        <HeroStage />
      </div>
    </section>
  );
}

function HeroStage() {
  const bars = [62, 78, 54, 88, 70, 94];
  return (
    <div className="lp-stage" aria-label={`Preview of the ${N} school dashboard and parent app`} role="img">
      <div className="lp-dash">
        <div className="lp-dash-top">
          <div>
            <div className="lp-dash-title">This term</div>
            <div className="lp-dash-sub">Greenfield Academy · 2nd term</div>
          </div>
          <span className="lp-pill">
            <span style={{ width: 7, height: 7, borderRadius: 9, background: '#19C39C' }} /> Live
          </span>
        </div>
        <div className="lp-kpis">
          <div className="lp-kpi violet">
            <b>486</b>
            <span>Students</span>
          </div>
          <div className="lp-kpi mint">
            <b>96%</b>
            <span>Attendance</span>
          </div>
          <div className="lp-kpi sun">
            <b>82%</b>
            <span>Fees paid</span>
          </div>
        </div>
        <div className="lp-bars">
          {bars.map((h, i) => (
            <span key={i} className="lp-bar" style={{ height: `${h}%`, animationDelay: `${0.5 + i * 0.08}s` }} />
          ))}
        </div>
        <div className="lp-bar-labels">
          {['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5', 'Wk 6'].map((w) => (
            <span key={w}>{w}</span>
          ))}
        </div>
      </div>

      <div className="lp-phone">
        <div className="lp-phone-screen">
          <div className="lp-phone-notch" />
          <div className="lp-report-head">
            <span className="lp-avatar" style={{ background: '#0E8F7A' }}>
              AO
            </span>
            <div>
              <div className="lp-report-name">Ada’s week</div>
              <div className="lp-report-meta">JSS 2 · Friday report</div>
            </div>
          </div>
          <div className="lp-report-card">
            <div className="lp-ai-tag">
              <Sparkles size={12} /> Weekly summary
            </div>
            <p>Ada was present all 5 days and scored 84% in her Maths test. Spelling is improving; try 10 minutes of reading tonight.</p>
          </div>
          <div className="lp-report-card">
            {[
              ['Maths', 84, '#5B3DF5'],
              ['English', 71, '#19C39C'],
              ['Science', 66, '#FF6B4A'],
            ].map(([s, v, c]) => (
              <div key={s as string} className="lp-subject">
                <span>{s}</span>
                <span className="lp-meter">
                  <i style={{ width: `${v}%`, background: c as string }} />
                </span>
                <span>{v}%</span>
              </div>
            ))}
          </div>
          <div className="lp-wa">
            <MessageCircle size={14} /> Also sent on WhatsApp
          </div>
        </div>
      </div>

      <div className="lp-chip xp">
        <span className="lp-chip-icon" style={{ background: '#FFF1CC', color: '#D49A00' }}>
          <Flame size={20} />
        </span>
        <span>
          +40 XP · 12-day streak
          <small>Tunde finished a Maths quest</small>
        </span>
      </div>
      <div className="lp-chip tutor">
        <span className="lp-chip-icon" style={{ background: '#E4DEFF', color: '#5B3DF5' }}>
          <BadgeCheck size={20} />
        </span>
        <span>
          {N} approved tutor
          <small>Physics · SS2 · 4.9 rating</small>
        </span>
      </div>
      <div className="lp-chip fee">
        <span className="lp-chip-icon" style={{ background: '#E2F5EF', color: '#0E8F7A' }}>
          <ReceiptText size={20} />
        </span>
        <span>
          School fees paid
          <small>₦185,000 · receipt sent</small>
        </span>
      </div>
    </div>
  );
}

/* ── Pains ────────────────────────────────────────────── */

function Pains() {
  const items = [
    {
      q: '“How is my child doing?” only gets answered on report day.',
      a: `${N} sends every parent a clear progress report every Friday, written for them.`,
    },
    {
      q: 'Collecting fees means chasing parents, receipts and spreadsheets.',
      a: 'Send invoices from your dashboard. Parents pay online and you see who’s paid straight away.',
    },
    {
      q: 'Students forget half of what they learnt over the holidays.',
      a: 'Short learning quests with XP, streaks and leagues keep them practising at home.',
    },
  ];
  return (
    <section className="lp-pains" aria-label="Problems we solve">
      <div className="lp-wrap lp-pains-grid">
        {items.map((it, i) => (
          <div key={i} className="lp-pain" data-reveal style={{ '--d': `${i * 0.08}s` } as React.CSSProperties}>
            <p className="lp-pain-q">{it.q}</p>
            <p className="lp-pain-a">
              <Check size={18} strokeWidth={3} />
              {it.a}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Feature bento ────────────────────────────────────── */

function Features() {
  const tiles = [
    {
      tone: 'violet',
      wide: true,
      icon: Users,
      title: 'Students, classes and staff',
      body: 'Enrol students, set up classes, subjects and terms, and link every child to their parents. Bring your current records over from Excel.',
    },
    {
      tone: 'mint',
      wide: true,
      icon: CalendarCheck,
      title: 'Attendance and results',
      body: 'Teachers mark attendance in seconds and record CA, test and exam scores from their phone or laptop.',
    },
    { tone: 'sun', icon: HandCoins, title: 'Fees and payments', body: 'Send fee invoices, take card or transfer payments, and track what’s outstanding.' },
    { tone: 'sky', icon: Sparkles, title: 'AI parent reports', body: 'A weekly report for every child, built from attendance, scores and teacher notes.' },
    { tone: 'coral', icon: Trophy, title: 'Gamified learning', body: 'Quests, XP, streaks, badges and weekly leagues, for both primary and secondary.' },
    { tone: 'paper', icon: ShoppingBasket, title: 'Cashless tuck shop', body: 'Parents top up a spending wallet and see exactly what their child bought.' },
    { tone: 'violet', icon: GraduationCap, title: 'Exam preparation', body: 'Practice for Common Entrance, BECE, WAEC, NECO and JAMB inside the student app.' },
    { tone: 'mint', icon: BadgeCheck, title: 'Approved lesson teachers', body: 'Parents can book home or online lessons with vetted, rated tutors.' },
  ] as const;
  return (
    <section id="features" className="lp-section">
      <div className="lp-wrap">
        <div className="lp-section-head center" data-reveal>
          <span className="lp-eyebrow">
            <span className="lp-eyebrow-dot">
              <School size={13} />
            </span>
            One platform
          </span>
          <h2 className="lp-h2">Everything your school runs on, in one place</h2>
          <p className="lp-lead">
            A dashboard for your office, an app for parents, students and teachers, all working from the same records.
          </p>
        </div>
        <div className="lp-bento">
          {tiles.map((t, i) => {
            const Icon = t.icon;
            return (
              <article
                key={t.title}
                className={`lp-tile tone-${t.tone}${'wide' in t && t.wide ? ' wide' : ''}`}
                data-reveal
                style={{ '--d': `${(i % 3) * 0.07}s` } as React.CSSProperties}
              >
                <span className="lp-tile-icon">
                  <Icon size={26} />
                </span>
                <h3>{t.title}</h3>
                <p>{t.body}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ── Deep dives ───────────────────────────────────────── */

function ListIcon({ color }: { color: string }) {
  return (
    <span className="lp-list-icon" style={{ background: color }}>
      <Check size={16} strokeWidth={3} />
    </span>
  );
}

function DeepDives() {
  return (
    <section className="lp-section" style={{ paddingTop: 0 }}>
      <div className="lp-wrap">
        {/* Reports */}
        <div id="reports" className="lp-feature">
          <div className="lp-feature-copy" data-reveal>
            <span className="lp-tag" style={{ background: '#E2F5EF', color: '#0B5A4C' }}>
              Weekly parent reports
            </span>
            <h2 className="lp-h2">Every parent gets a report. Every Friday.</h2>
            <p className="lp-lead">
              {N} writes a short, personal progress report for each child from what your teachers already record. Parents finally
              know what’s happening, and your teachers don’t write a single extra line.
            </p>
            <ul className="lp-list">
              <li>
                <ListIcon color="#0E8F7A" />
                <span>
                  <b>Built from real data:</b> attendance, test scores and teacher notes.
                </span>
              </li>
              <li>
                <ListIcon color="#0E8F7A" />
                <span>
                  <b>Delivered where parents are:</b> the app, email and WhatsApp.
                </span>
              </li>
              <li>
                <ListIcon color="#0E8F7A" />
                <span>
                  <b>Practical next steps:</b> what to practise at home this week.
                </span>
              </li>
            </ul>
          </div>
          <div className="lp-feature-art" style={{ background: 'linear-gradient(150deg, #D3F5EA, #EAF2FF)' }} data-reveal>
            <div className="lp-mock-report">
              <div className="lp-mock-row">
                <div className="lp-report-head" style={{ margin: 0 }}>
                  <span className="lp-avatar" style={{ background: '#1D6FE0' }}>
                    CE
                  </span>
                  <div>
                    <div className="lp-report-name">Chidi Eze</div>
                    <div className="lp-report-meta">Primary 4 · Week 6</div>
                  </div>
                </div>
                <span className="lp-pill">
                  <Star size={12} /> Great week
                </span>
              </div>
              <div className="lp-stat-row">
                <div className="lp-stat">
                  <b>5/5</b>
                  <span>Days present</span>
                </div>
                <div className="lp-stat">
                  <b>78%</b>
                  <span>Avg. score</span>
                </div>
                <div className="lp-stat">
                  <b>+12%</b>
                  <span>vs last week</span>
                </div>
              </div>
              <div className="lp-report-card" style={{ background: '#F5F4FB', margin: 0 }}>
                <div className="lp-ai-tag">
                  <Sparkles size={12} /> What to do at home
                </div>
                <p>Chidi is strong on fractions but rushed his word problems. Ask him to read each question out loud before answering.</p>
              </div>
              <div className="lp-channels">
                <span className="lp-channel">
                  <Smartphone size={14} /> App
                </span>
                <span className="lp-channel">
                  <MessageCircle size={14} /> WhatsApp
                </span>
                <span className="lp-channel">
                  <Mail size={14} /> Email
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Learning */}
        <div id="learning" className="lp-feature flip">
          <div className="lp-feature-copy" data-reveal>
            <span className="lp-tag" style={{ background: '#E4DEFF', color: '#4426C9' }}>
              Student app
            </span>
            <h2 className="lp-h2">Homework they actually want to do</h2>
            <p className="lp-lead">
              Short learning quests matched to each child’s class and subjects. Students earn XP, keep streaks alive and climb
              weekly leagues with their classmates.
            </p>
            <ul className="lp-list">
              <li>
                <ListIcon color="#5B3DF5" />
                <span>
                  <b>Two worlds:</b> a bright, playful app for primary and a focused exam-prep app for secondary.
                </span>
              </li>
              <li>
                <ListIcon color="#5B3DF5" />
                <span>
                  <b>Bronze to Diamond leagues</b> that reset every week, so everyone has a fresh chance.
                </span>
              </li>
              <li>
                <ListIcon color="#5B3DF5" />
                <span>
                  <b>Teachers see who’s practising</b> and which topics the class is stuck on.
                </span>
              </li>
            </ul>
          </div>
          <div className="lp-feature-art" style={{ background: 'linear-gradient(150deg, #E4DEFF, #FFF1CC)' }} data-reveal>
            <div className="lp-mock-game">
              <span className="lp-xp-float">+25 XP</span>
              <div className="lp-game-card">
                <div className="lp-xp">
                  <svg className="lp-ring" viewBox="0 0 86 86" aria-hidden="true">
                    <circle cx="43" cy="43" r="36" fill="none" stroke="#EEEBFB" strokeWidth="10" />
                    <circle className="progress" cx="43" cy="43" r="36" fill="none" stroke="#5B3DF5" strokeWidth="10" strokeLinecap="round" />
                  </svg>
                  <div>
                    <div className="lp-report-meta">Level 7 · 740 / 1000 XP</div>
                    <div className="lp-xp-level">Maths explorer</div>
                    <span className="lp-streak">
                      <Flame size={14} /> 12-day streak
                    </span>
                  </div>
                </div>
              </div>
              <div className="lp-game-card">
                <div className="lp-mock-row" style={{ marginBottom: 8 }}>
                  <b style={{ fontFamily: 'var(--display)' }}>Gold league</b>
                  <span className="lp-report-meta">Ends Sunday</span>
                </div>
                {[
                  ['1', 'Temi A.', '1,240', '#FF6B4A', false],
                  ['2', 'You', '1,180', '#5B3DF5', true],
                  ['3', 'Musa B.', '990', '#19C39C', false],
                ].map(([rank, name, xp, color, me]) => (
                  <div key={rank as string} className={`lp-league-row${me ? ' me' : ''}`}>
                    <span className="rank">{rank}</span>
                    <span className="lp-avatar" style={{ width: 34, height: 34, borderRadius: 11, fontSize: 13, background: color as string }}>
                      {(name as string)[0]}
                    </span>
                    <span>{name}</span>
                    <span>{xp} XP</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tutors */}
        <div id="tutors" className="lp-feature">
          <div className="lp-feature-copy" data-reveal>
            <span className="lp-tag" style={{ background: '#FFE1D9', color: '#A3330F' }}>
              Lesson teachers
            </span>
            <h2 className="lp-h2">Extra lessons parents can trust</h2>
            <p className="lp-lead">
              When a child needs extra help, parents can book a lesson teacher in the app. Every tutor is checked by {N} before a
              parent ever sees them.
            </p>
            <ul className="lp-list">
              <li>
                <ListIcon color="#E2552F" />
                <span>
                  <b>Three-step vetting:</b> ID and documents, a subject test, then an interview.
                </span>
              </li>
              <li>
                <ListIcon color="#E2552F" />
                <span>
                  <b>Payment held safely</b> until the lesson has happened.
                </span>
              </li>
              <li>
                <ListIcon color="#E2552F" />
                <span>
                  <b>Matched to the report:</b> parents see suggestions for the subjects their child finds hardest.
                </span>
              </li>
            </ul>
          </div>
          <div className="lp-feature-art" style={{ background: 'linear-gradient(150deg, #FFE1D9, #FFF6DA)' }} data-reveal>
            <div className="lp-mock-tutor">
              <div className="lp-tutor-card">
                <div className="lp-report-head" style={{ margin: 0 }}>
                  <span className="lp-avatar" style={{ background: '#E2552F', width: 48, height: 48, borderRadius: 16 }}>
                    FO
                  </span>
                  <div>
                    <div className="lp-report-name">Mrs Funmi O.</div>
                    <div className="lp-report-meta">Mathematics · Further Maths</div>
                    <span className="lp-approved" style={{ marginTop: 4 }}>
                      <BadgeCheck size={13} /> {N} approved
                    </span>
                  </div>
                </div>
                <div className="lp-steps-mini">
                  {['ID and documents checked', 'Passed Maths subject test', 'Interviewed by our team'].map((s) => (
                    <div key={s} className="lp-step-mini">
                      <i>
                        <Check size={14} strokeWidth={3} />
                      </i>
                      {s}
                    </div>
                  ))}
                </div>
              </div>
              <div className="lp-escrow">
                <span className="lp-chip-icon" style={{ background: '#E2F5EF', color: '#0E8F7A' }}>
                  <Lock size={18} />
                </span>
                <span>
                  ₦12,000 held safely
                  <small style={{ display: 'block', fontWeight: 600, color: '#5A5680', fontSize: 12 }}>
                    Released after Saturday’s lesson
                  </small>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Who it's for ─────────────────────────────────────── */

function People() {
  const people = [
    {
      icon: School,
      tone: '#5B3DF5',
      bg: '#F4F2FF',
      title: 'Proprietors and principals',
      body: 'See attendance, results and fee collection across the whole school at a glance.',
    },
    {
      icon: ClipboardList,
      tone: '#1D6FE0',
      bg: '#EAF2FF',
      title: 'Teachers',
      body: 'Mark attendance, enter scores and leave quick notes. The weekly report writes itself.',
    },
    {
      icon: HeartHandshake,
      tone: '#0E8F7A',
      bg: '#E2F5EF',
      title: 'Parents',
      body: 'Weekly reports, fee payments, tuck shop top-ups and trusted tutors in one app.',
    },
    {
      icon: Trophy,
      tone: '#E2552F',
      bg: '#FFF5F1',
      title: 'Students',
      body: 'Fun quests, XP, streaks and leagues that make practice feel like a game.',
    },
  ];
  return (
    <section className="lp-section" style={{ background: 'var(--paper)' }}>
      <div className="lp-wrap">
        <div className="lp-section-head center" data-reveal>
          <h2 className="lp-h2">Made for everyone in your school community</h2>
        </div>
        <div className="lp-people">
          {people.map((p, i) => {
            const Icon = p.icon;
            return (
              <article key={p.title} className="lp-person" data-reveal style={{ '--d': `${i * 0.07}s` } as React.CSSProperties}>
                <span className="lp-tile-icon" style={{ background: p.bg, color: p.tone, boxShadow: 'none' }}>
                  <Icon size={26} />
                </span>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ── How it works ─────────────────────────────────────── */

function HowItWorks() {
  const steps = [
    { color: '#5B3DF5', icon: CalendarCheck, title: 'Book a demo', body: 'A 30-minute call or visit. We show you around and answer every question.' },
    {
      color: '#19C39C',
      icon: FileSpreadsheet,
      title: 'We set you up',
      body: 'Send us your student list in Excel. We import your classes, students and parent contacts.',
    },
    {
      color: '#FF6B4A',
      icon: Smartphone,
      title: 'Parents and students join',
      body: 'Everyone gets an invite to the app, and the first weekly reports go out that Friday.',
    },
  ];
  return (
    <section id="how" className="lp-section">
      <div className="lp-wrap">
        <div className="lp-section-head center" data-reveal>
          <span className="lp-eyebrow">
            <span className="lp-eyebrow-dot">
              <BookOpenCheck size={13} />
            </span>
            How it works
          </span>
          <h2 className="lp-h2">Live in days, not terms</h2>
        </div>
        <div className="lp-steps">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="lp-step" data-reveal style={{ '--d': `${i * 0.1}s` } as React.CSSProperties}>
                <span className="lp-step-num" style={{ background: s.color }}>
                  {i + 1}
                </span>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {s.title} <Icon size={20} color={s.color} />
                </h3>
                <p>{s.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ── Trust ────────────────────────────────────────────── */

function Trust() {
  const items = [
    { icon: ShieldCheck, title: 'Parent consent first', body: 'Parents choose what their child’s data is used for, and can change it at any time.' },
    { icon: Lock, title: 'Role-based access', body: 'Teachers see their classes, parents see their own children, and nobody sees more.' },
    { icon: Eye, title: 'Every view is logged', body: 'A record of who opened a student’s file, and when.' },
    { icon: HeartHandshake, title: 'Never sold', body: 'We never share or sell children’s data to advertisers.' },
  ];
  return (
    <section className="lp-section" style={{ paddingTop: 0 }}>
      <div className="lp-wrap">
        <div className="lp-trust" data-reveal>
          <div className="lp-section-head" style={{ margin: 0, position: 'relative', zIndex: 1 }}>
            <h2 className="lp-h2">Children’s data, handled with care</h2>
            <p className="lp-lead">You’re trusted with your students’ information. We built {N} so you can keep that trust.</p>
          </div>
          <div className="lp-trust-grid">
            {items.map((it) => {
              const Icon = it.icon;
              return (
                <div key={it.title} className="lp-trust-item">
                  <h4>
                    <Icon size={20} /> {it.title}
                  </h4>
                  <p>{it.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── FAQ ──────────────────────────────────────────────── */

function Faq() {
  const faqs = [
    {
      q: `How much does ${N} cost?`,
      a: `There’s no setup fee. We’ll walk you through pricing for your school on the demo.`,
    },
    {
      q: 'Do parents need a smartphone?',
      a: 'The app gives parents the most, but weekly reports also go out by email, and on WhatsApp for parents who choose it, so no parent is left out.',
    },
    {
      q: 'We already keep records in Excel. Do we start from scratch?',
      a: 'No. Send us your spreadsheets and we’ll import your classes, students and parent contacts for you.',
    },
    {
      q: 'Does it work for both primary and secondary?',
      a: 'Yes. Nursery, primary, junior and senior secondary are all supported, and the student app changes its look and content to suit each age group.',
    },
    {
      q: 'How are lesson teachers vetted?',
      a: 'Every tutor submits ID and documents, passes a subject test and is interviewed by our team. Only tutors who pass all three appear to parents.',
    },
    {
      q: 'Who owns our school’s data?',
      a: 'Your school does. We only use it to run the service for you and your parents, with consent, and we never sell it.',
    },
  ];
  return (
    <section id="faq" className="lp-section" style={{ paddingTop: 40 }}>
      <div className="lp-wrap">
        <div className="lp-section-head center" data-reveal>
          <h2 className="lp-h2">Questions schools ask us</h2>
        </div>
        <div className="lp-faq" data-reveal>
          {faqs.map((f) => (
            <details key={f.q}>
              <summary>
                {f.q}
                <Plus size={22} />
              </summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Demo ─────────────────────────────────────────────── */

function Demo() {
  return (
    <section id="demo" className="lp-section" style={{ paddingTop: 40, paddingBottom: 0 }}>
      <div className="lp-wrap">
        <div className="lp-demo" data-reveal>
          <div>
            <h2 className="lp-h2">See {N} working for your school</h2>
            <p className="lp-lead" style={{ marginTop: 18 }}>
              Tell us a little about your school and we’ll set up a free, no-pressure demo at a time that suits you.
            </p>
            <ul className="lp-demo-points">
              <li>
                <Check size={20} strokeWidth={3} /> A 30-minute walkthrough, online or at your school
              </li>
              <li>
                <Check size={20} strokeWidth={3} /> A sample parent report using your own class setup
              </li>
              <li>
                <Check size={20} strokeWidth={3} /> Clear answers on setup, pricing and support
              </li>
            </ul>
          </div>
          <DemoForm />
        </div>
      </div>
    </section>
  );
}

/* ── Footer ───────────────────────────────────────────── */

function Footer() {
  return (
    <footer className="lp-footer">
      <div className="lp-wrap">
        <div className="lp-footer-inner">
          <div>
            <Logo />
            <p>School management, weekly parent reports and gamified learning for Nigerian schools.</p>
          </div>
          <nav className="lp-footer-links" aria-label="Footer">
            <a href="#features">Features</a>
            <a href="#reports">Parent reports</a>
            <a href="#learning">Student app</a>
            <a href="#tutors">Lesson teachers</a>
            <a href="#faq">FAQ</a>
            <a href="/login">Log in</a>
          </nav>
        </div>
        <div className="lp-footer-base">
          © {new Date().getFullYear()} {N}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
