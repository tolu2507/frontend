import {
  BookOpenCheck,
  CalendarCheck,
  Check,
  Crown,
  Eye,
  Flame,
  GraduationCap,
  HeartHandshake,
  Lock,
  Mail,
  MessageCircle,
  Plus,
  RefreshCcw,
  School,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Timer,
  Trophy,
  UserPlus,
  Users,
  Volume2,
} from 'lucide-react';

import { DemoForm } from '@/components/landing/DemoForm';
import { GetApp } from '@/components/landing/GetApp';
import { Logo } from '@/components/landing/Logo';
import { Nav } from '@/components/landing/Nav';
import { RevealObserver } from '@/components/landing/RevealObserver';
import { brand } from '@/config/brand';
import { FAQS, seo } from '@/config/seo';

import './landing.css';

const N = brand.name;
const APP = brand.appUrl;

export default function LandingPage() {
  return (
    <div className="lp">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData()).replace(/</g, '\\u003c') }} />
      <Nav />
      <main>
        <Hero />
        <Pains />
        <Features />
        <DeepDives />
        <HowItWorks />
        <Trust />
        <Faq />
        <Schools />
      </main>
      <Footer />
      <RevealObserver />
    </div>
  );
}

/** Tells search engines who Nexus is, what the app does and what parents ask, so results can show it richly. */
function structuredData() {
  const url = brand.siteUrl;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Organization', '@id': `${url}/#org`, name: N, url, logo: `${url}/logo.png`, areaServed: 'NG' },
      { '@type': 'WebSite', '@id': `${url}/#website`, name: N, url, inLanguage: 'en-NG', publisher: { '@id': `${url}/#org` } },
      {
        '@type': 'SoftwareApplication',
        name: N,
        url: APP,
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Android, iOS, Web',
        description: seo.description,
        publisher: { '@id': `${url}/#org` },
        audience: { '@type': 'EducationalAudience', educationalRole: 'parent' },
      },
      { '@type': 'FAQPage', mainEntity: FAQS.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
    ],
  };
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
            For Nigerian parents · Nursery 1 to SS3
          </span>
          <h1>
            Help your child pass, from Nursery to{' '}
            <span className="lp-hl">
              JAMB
              <svg viewBox="0 0 300 20" preserveAspectRatio="none" aria-hidden="true">
                <path d="M4 14 C 80 4, 200 4, 296 12" fill="none" stroke="#FFC53D" strokeWidth="9" strokeLinecap="round" />
              </svg>
            </span>
          </h1>
          <p className="lp-hero-sub">
            {N} gives your child fun daily practice for their class and their exams, a mock exam every Friday, and gives you a
            clear report on how they’re doing every week. Their school doesn’t need to sign up.
          </p>
          <GetApp />
          <ul className="lp-checks">
            <li>
              <Check size={18} strokeWidth={3} /> On Android, iPhone or any browser
            </li>
            <li>
              <Check size={18} strokeWidth={3} /> All your children on one account
            </li>
            <li>
              <Check size={18} strokeWidth={3} /> A question they’ve never seen, every time
            </li>
          </ul>
        </div>
        <HeroStage />
      </div>
    </section>
  );
}

function HeroStage() {
  const bars = [35, 52, 48, 70, 64, 88];
  return (
    <div className="lp-stage" aria-label={`Preview of the ${N} student practice and the parent’s weekly report`} role="img">
      <div className="lp-dash">
        <div className="lp-dash-top">
          <div>
            <div className="lp-dash-title">Tunde’s JAMB prep</div>
            <div className="lp-dash-sub">English, Maths, Physics, Chemistry</div>
          </div>
          <span className="lp-pill">
            <Flame size={12} color="#E2552F" /> 12 days in a row
          </span>
        </div>
        <div className="lp-kpis">
          <div className="lp-kpi violet">
            <b>18</b>
            <span>Topics conquered</span>
          </div>
          <div className="lp-kpi mint">
            <b>74%</b>
            <span>Friday mock</span>
          </div>
          <div className="lp-kpi sun">
            <b>1,240</b>
            <span>XP this week</span>
          </div>
        </div>
        <div className="lp-bars">
          {bars.map((h, i) => (
            <span key={i} className="lp-bar" style={{ height: `${h}%`, animationDelay: `${0.5 + i * 0.08}s` }} />
          ))}
        </div>
        <div className="lp-bar-labels">
          {['Mock 1', 'Mock 2', 'Mock 3', 'Mock 4', 'Mock 5', 'Mock 6'].map((w) => (
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
              <div className="lp-report-meta">Primary 4 · Friday report</div>
            </div>
          </div>
          <div className="lp-report-card">
            <div className="lp-ai-tag">
              <Sparkles size={12} /> Weekly summary
            </div>
            <p>Ada practised on 5 days and conquered Fractions. Word problems still trip her up; ask her to read each one aloud first.</p>
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
          <Crown size={20} />
        </span>
        <span>
          Boss round beaten!
          <small>Quadratic equations · +100 XP</small>
        </span>
      </div>
      <div className="lp-chip mock">
        <span className="lp-chip-icon" style={{ background: '#E4DEFF', color: '#5B3DF5' }}>
          <Timer size={20} />
        </span>
        <span>
          Friday mock is open
          <small>Timed, just like the real CBT</small>
        </span>
      </div>
      <div className="lp-chip fee">
        <span className="lp-chip-icon" style={{ background: '#FFE1D9', color: '#E2552F' }}>
          <Volume2 size={20} />
        </span>
        <span>
          “Find the letter B”
          <small>Nursery games that talk</small>
        </span>
      </div>
    </div>
  );
}

/* ── Pains ────────────────────────────────────────────── */

function Pains() {
  const items = [
    {
      q: '“How is my child really doing?” only gets answered on report-card day.',
      a: `${N} sends you a short, clear report every week: what they practised, what they’ve mastered and what to help with.`,
    },
    {
      q: 'The exam is coming and you can’t tell what they’ve covered.',
      a: 'Every subject is a map of the topics the exam actually tests, climbed from easy to hard, with a mock every Friday.',
    },
    {
      q: 'They’d rather be on the phone than reading.',
      a: 'Good. Now the phone is where they practise, with points, streaks, badges and weekly leagues.',
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
      icon: GraduationCap,
      title: 'Exam prep for every big exam',
      body: 'Common Entrance, BECE, WAEC, NECO and JAMB. Your child picks their subjects (for JAMB, English plus three) and practises topic by topic.',
    },
    {
      tone: 'mint',
      wide: true,
      icon: BookOpenCheck,
      title: 'Class practice from Nursery 1',
      body: 'Not writing an exam yet? Younger children practise what their own class is learning, from counting and letters in nursery to fractions in Primary 5.',
    },
    { tone: 'sun', icon: Timer, title: 'A mock every Friday', body: 'A timed practice exam that looks and feels like the real CBT, with results the same day.' },
    { tone: 'sky', icon: Sparkles, title: 'Your weekly report', body: 'What they did, what improved and one thing to help with at home. In the app, by email or on WhatsApp.' },
    { tone: 'coral', icon: RefreshCcw, title: 'Never the same question', body: 'A huge bank of original questions, so every round is new and wrong answers come back later to fix.' },
    { tone: 'paper', icon: Trophy, title: 'Rewards that keep them going', body: 'XP, daily streaks, badges, and weekly leagues against other students.' },
    { tone: 'violet', icon: Volume2, title: 'Nursery games that talk', body: 'Little ones hear every question read aloud and tap big pictures. No reading needed.' },
    { tone: 'mint', icon: Users, title: 'All your children, one account', body: 'Add each child with their own login and PIN, then see all of them from your dashboard.' },
  ] as const;
  return (
    <section id="features" className="lp-section">
      <div className="lp-wrap">
        <div className="lp-section-head center" data-reveal>
          <span className="lp-eyebrow">
            <span className="lp-eyebrow-dot">
              <Star size={13} />
            </span>
            What your child gets
          </span>
          <h2 className="lp-h2">A study partner for every stage of school</h2>
          <p className="lp-lead">One app for the whole family: practice for your children, and a clear picture of their progress for you.</p>
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
        {/* Exam prep */}
        <div id="exam-prep" className="lp-feature">
          <div className="lp-feature-copy" data-reveal>
            <span className="lp-tag" style={{ background: '#E4DEFF', color: '#4426C9' }}>
              Exam prep
            </span>
            <h2 className="lp-h2">Practise what the exam actually asks</h2>
            <p className="lp-lead">
              We studied years of past papers to learn which topics come up and how often. Your child climbs each topic level by level,
              then beats a boss round to conquer it.
            </p>
            <ul className="lp-list">
              <li>
                <ListIcon color="#5B3DF5" />
                <span>
                  <b>Most-tested topics first,</b> so their time goes where the marks are.
                </span>
              </li>
              <li>
                <ListIcon color="#5B3DF5" />
                <span>
                  <b>Worked answers</b> after every round, so a wrong answer becomes a lesson.
                </span>
              </li>
              <li>
                <ListIcon color="#5B3DF5" />
                <span>
                  <b>A Friday mock</b> that feels like exam day, so the real one doesn’t scare them.
                </span>
              </li>
            </ul>
          </div>
          <div className="lp-feature-art" style={{ background: 'linear-gradient(150deg, #E4DEFF, #FFF1CC)' }} data-reveal>
            <div className="lp-mock-game">
              <div className="lp-game-card">
                <div className="lp-mock-row" style={{ marginBottom: 10 }}>
                  <b style={{ fontFamily: 'var(--display)', fontSize: 18 }}>Algebra</b>
                  <span className="lp-pill">
                    <Flame size={12} color="#E2552F" /> In every paper
                  </span>
                </div>
                <div className="lp-path">
                  {[
                    { name: 'Simplifying expressions', meta: 'Conquered', state: 'done' },
                    { name: 'Linear equations', meta: 'Level 4 of 5', state: 'on', level: 4 },
                    { name: 'Quadratic equations', meta: 'Level 2 of 5', state: 'on', level: 2 },
                    { name: 'Variation', meta: 'Unlocks after level 1 above', state: 'locked' },
                  ].map((n) => (
                    <div key={n.name} className="lp-path-node">
                      <span className={`lp-path-dot${n.state === 'done' ? ' done' : n.state === 'locked' ? ' locked' : ''}`}>
                        {n.state === 'done' ? <Crown size={18} /> : n.state === 'locked' ? <Lock size={16} /> : n.level}
                      </span>
                      <span>
                        {n.name}
                        <small>{n.meta}</small>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Little learners */}
        <div id="little-learners" className="lp-feature flip">
          <div className="lp-feature-copy" data-reveal>
            <span className="lp-tag" style={{ background: '#FFE1D9', color: '#A3330F' }}>
              Nursery and primary
            </span>
            <h2 className="lp-h2">Learning that feels like play</h2>
            <p className="lp-lead">
              Younger children practise what their own class is learning. Questions start easy, get harder as they improve, and every
              right answer gets a cheer.
            </p>
            <ul className="lp-list">
              <li>
                <ListIcon color="#E2552F" />
                <span>
                  <b>Nursery 1 and 2:</b> counting, letters and sounds, colours, shapes and animals, read aloud with big picture answers.
                </span>
              </li>
              <li>
                <ListIcon color="#E2552F" />
                <span>
                  <b>Primary 1 to 5:</b> Maths, English and Basic Science, with everyday naira and market examples.
                </span>
              </li>
              <li>
                <ListIcon color="#E2552F" />
                <span>
                  <b>Primary 4 upwards</b> can also start Common Entrance practice.
                </span>
              </li>
            </ul>
          </div>
          <div className="lp-feature-art" style={{ background: 'linear-gradient(150deg, #FFE1D9, #FFF6DA)' }} data-reveal>
            <div className="lp-mock-stack">
              <div className="lp-stack-card">
                <div className="lp-say">
                  <i>
                    <Volume2 size={20} />
                  </i>
                  Which animal says “moo”?
                </div>
                <div className="lp-tiles">
                  {['🐶', '🐄', '🐱', '🦆'].map((e) => (
                    <span key={e} className={`lp-tile-pic${e === '🐄' ? ' right' : ''}`}>
                      {e}
                      {e === '🐄' ? (
                        <span className="tick">
                          <Check size={16} strokeWidth={3} />
                        </span>
                      ) : null}
                    </span>
                  ))}
                </div>
              </div>
              <div className="lp-escrow">
                <span className="lp-chip-icon" style={{ background: '#FFF1CC', color: '#D49A00' }}>
                  <Star size={18} />
                </span>
                <span>
                  “Well done!”
                  <small style={{ display: 'block', fontWeight: 600, color: '#5A5680', fontSize: 12 }}>Heard straight away, every right answer</small>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Reports */}
        <div id="reports" className="lp-feature">
          <div className="lp-feature-copy" data-reveal>
            <span className="lp-tag" style={{ background: '#E2F5EF', color: '#0B5A4C' }}>
              For you
            </span>
            <h2 className="lp-h2">Know how they’re doing. Every week.</h2>
            <p className="lp-lead">
              You don’t have to sit beside them to know. Each week {N} sums up your child’s practice in plain words, with one practical
              thing you can do at home.
            </p>
            <ul className="lp-list">
              <li>
                <ListIcon color="#0E8F7A" />
                <span>
                  <b>Built from what they really did:</b> practice, scores, streaks and Friday mocks.
                </span>
              </li>
              <li>
                <ListIcon color="#0E8F7A" />
                <span>
                  <b>Delivered where you are:</b> the app, email, or WhatsApp if you choose.
                </span>
              </li>
              <li>
                <ListIcon color="#0E8F7A" />
                <span>
                  <b>Every child at a glance:</b> tap a child for their subjects, topics and mock results.
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
                    <div className="lp-report-meta">JSS 3 · BECE prep · Week 6</div>
                  </div>
                </div>
                <span className="lp-pill">
                  <Star size={12} /> Great week
                </span>
              </div>
              <div className="lp-stat-row">
                <div className="lp-stat">
                  <b>5/7</b>
                  <span>Days practised</span>
                </div>
                <div className="lp-stat">
                  <b>78%</b>
                  <span>Friday mock</span>
                </div>
                <div className="lp-stat">
                  <b>+12%</b>
                  <span>vs last mock</span>
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
      </div>
    </section>
  );
}

/* ── How it works ─────────────────────────────────────── */

function HowItWorks() {
  const steps = [
    { color: '#5B3DF5', icon: UserPlus, title: 'Create your account', body: 'Get the app (or use it in your browser) and sign up as a parent. It takes a minute.' },
    { color: '#19C39C', icon: Users, title: 'Add your children', body: 'Pick each child’s class. They get their own username and a 4-digit PIN to sign in.' },
    { color: '#FF6B4A', icon: CalendarCheck, title: 'They practise, you see it', body: 'Short rounds every day, a mock on Friday, and your report every week.' },
  ];
  return (
    <section id="how" className="lp-section" style={{ background: 'var(--paper)' }}>
      <div className="lp-wrap">
        <div className="lp-section-head center" data-reveal>
          <span className="lp-eyebrow">
            <span className="lp-eyebrow-dot">
              <BookOpenCheck size={13} />
            </span>
            How it works
          </span>
          <h2 className="lp-h2">Start tonight, no school needed</h2>
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
        <div id="get-app" data-reveal style={{ scrollMarginTop: 120 }}>
          <GetApp center />
        </div>
      </div>
    </section>
  );
}

/* ── Trust ────────────────────────────────────────────── */

function Trust() {
  const items = [
    { icon: ShieldCheck, title: 'You’re in charge', body: 'You create your child’s login and choose what their data is used for. Change it any time.' },
    { icon: Lock, title: 'A safe place to learn', body: 'No ads, and no chatting with strangers. Children sign in with a username and PIN you set.' },
    { icon: Eye, title: 'You see what they see', body: 'Every round, score and mock result shows up on your dashboard.' },
    { icon: HeartHandshake, title: 'Never sold', body: 'We never share or sell children’s data to advertisers.' },
  ];
  return (
    <section className="lp-section">
      <div className="lp-wrap">
        <div className="lp-trust" data-reveal>
          <div className="lp-section-head" style={{ margin: 0, position: 'relative', zIndex: 1 }}>
            <h2 className="lp-h2">Built for children, run by parents</h2>
            <p className="lp-lead">Your child’s learning and data stay in your hands.</p>
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
  return (
    <section id="faq" className="lp-section" style={{ paddingTop: 40 }}>
      <div className="lp-wrap">
        <div className="lp-section-head center" data-reveal>
          <h2 className="lp-h2">Questions parents ask us</h2>
        </div>
        <div className="lp-faq" data-reveal>
          {FAQS.map((f) => (
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

/* ── For schools ──────────────────────────────────────── */

function Schools() {
  return (
    <section id="schools" className="lp-section" style={{ paddingTop: 40, paddingBottom: 0 }}>
      <div className="lp-wrap">
        <div className="lp-demo" data-reveal>
          <div>
            <span className="lp-eyebrow" style={{ background: 'rgba(255,255,255,0.15)', color: '#FFFFFF' }}>
              <span className="lp-eyebrow-dot">
                <School size={13} />
              </span>
              For schools
            </span>
            <h2 className="lp-h2" style={{ marginTop: 16 }}>
              Your parents are already on {N}?
            </h2>
            <p className="lp-lead" style={{ marginTop: 18 }}>
              Connect your school and their weekly reports include your attendance and results, and you get a simple system for
              students, results and fees.
            </p>
            <ul className="lp-demo-points">
              <li>
                <Check size={20} strokeWidth={3} /> Reports parents read, built from what your teachers record
              </li>
              <li>
                <Check size={20} strokeWidth={3} /> We import your students from Excel for you
              </li>
              <li>
                <Check size={20} strokeWidth={3} /> A 30-minute walkthrough, online or at your school
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
            <p>Exam prep, daily practice and weekly progress reports for Nigerian families.</p>
          </div>
          <nav className="lp-footer-links" aria-label="Footer">
            <a href={APP}>Use {N} on the web</a>
            <a href="#exam-prep">Exam prep</a>
            <a href="#little-learners">Nursery and primary</a>
            <a href="#reports">Weekly reports</a>
            <a href="#faq">FAQ</a>
            <a href="#schools">For schools</a>
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
