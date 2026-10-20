import Link from 'next/link';

import { brand } from '@/config/brand';
import { GUIDES } from '@/content/guides';

import { Logo } from './Logo';

export function Footer() {
  return (
    <footer className="lp-footer">
      <div className="lp-wrap">
        <div className="lp-footer-inner">
          <div>
            <Logo />
            <p>Exam prep, daily practice and weekly progress reports for Nigerian families.</p>
          </div>
          <nav className="lp-footer-links" aria-label="Footer">
            <a href={brand.appUrl}>Use {brand.name} on the web</a>
            <Link href="/#exam-prep">Exam prep</Link>
            <Link href="/#little-learners">Nursery and primary</Link>
            <Link href="/#reports">Weekly reports</Link>
            <Link href="/guides">Guides</Link>
            <Link href="/#faq">FAQ</Link>
            <Link href="/#schools">For schools</Link>
            <Link href="/login">Log in</Link>
          </nav>
        </div>
        <nav className="lp-footer-links" aria-label="Guides" style={{ marginTop: 20 }}>
          {GUIDES.map((g) => (
            <Link key={g.slug} href={`/guides/${g.slug}`}>
              {g.short}
            </Link>
          ))}
        </nav>
        <div className="lp-footer-base">
          © {new Date().getFullYear()} {brand.name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
