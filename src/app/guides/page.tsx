import { ArrowRight, BookOpenCheck } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { Footer } from '@/components/landing/Footer';
import { Nav } from '@/components/landing/Nav';
import { brand } from '@/config/brand';
import { GUIDES } from '@/content/guides';

import '../landing.css';

export const metadata: Metadata = {
  title: { absolute: `Exam Guides for Nigerian Parents: JAMB, WAEC, BECE | ${brand.name}` },
  description: 'Clear, practical guides for parents on JAMB, WAEC, NECO, BECE, Common Entrance and nursery learning: how each exam works and how to help your child prepare.',
  alternates: { canonical: '/guides' },
  openGraph: { url: '/guides', title: 'Exam guides for Nigerian parents', description: 'How JAMB, WAEC, NECO, BECE and Common Entrance work, and how to help your child prepare.', images: ['/opengraph-image'] },
};

export default function GuidesPage() {
  return (
    <div className="lp">
      <Nav />
      <main>
        <section className="lp-section">
          <div className="lp-wrap">
            <div className="lp-section-head center">
              <span className="lp-eyebrow">
                <span className="lp-eyebrow-dot">
                  <BookOpenCheck size={13} />
                </span>
                Guides for parents
              </span>
              <h1 className="lp-h2">Everything you need to know about your child’s exams</h1>
              <p className="lp-lead">How each exam works, what it tests, and simple ways to help your child prepare at home.</p>
            </div>
            <div className="lp-guides">
              {GUIDES.map((g) => (
                <Link key={g.slug} href={`/guides/${g.slug}`} className="lp-guide-card">
                  <span className="lp-tag" style={{ background: '#E4DEFF', color: '#4426C9' }}>
                    {g.tag}
                  </span>
                  <h2>{g.title}</h2>
                  <p>{g.description}</p>
                  <span className="lp-guide-more">
                    Read the guide <ArrowRight size={16} />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
