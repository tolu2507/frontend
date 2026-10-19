'use client';

import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { brand } from '@/config/brand';

import { Logo } from './Logo';

const links = [
  { href: '#exam-prep', label: 'Exam prep' },
  { href: '#little-learners', label: 'Nursery and primary' },
  { href: '#reports', label: 'Weekly reports' },
  { href: '#faq', label: 'FAQ' },
  { href: '#schools', label: 'For schools' },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`lp-nav${scrolled ? ' scrolled' : ''}`}>
      <div className="lp-wrap lp-nav-inner">
        <Link href="/" aria-label="Home">
          <Logo />
        </Link>
        <nav className="lp-nav-links" aria-label="Main">
          {links.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>
        <div className="lp-nav-actions">
          <a href={brand.appUrl} className="lp-nav-login">
            Log in
          </a>
          <a href={brand.appUrl} className="lp-btn sm">
            Open the app
          </a>
          <button
            type="button"
            className="lp-menu-btn"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="lp-mobile-menu"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      <nav id="lp-mobile-menu" className={`lp-mobile-menu${open ? ' open' : ''}`} aria-label="Mobile">
        {links.map((l) => (
          <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
            {l.label}
          </a>
        ))}
        <a href={brand.appUrl} onClick={() => setOpen(false)}>
          Log in
        </a>
      </nav>
    </header>
  );
}
