import { ArrowLeft, ArrowRight, Lightbulb } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Footer } from '@/components/landing/Footer';
import { GetApp } from '@/components/landing/GetApp';
import { GuideText } from '@/components/landing/GuideText';
import { Nav } from '@/components/landing/Nav';
import { brand } from '@/config/brand';
import { seo } from '@/config/seo';
import { GUIDES, guideBySlug, type Block } from '@/content/guides';

import '../../landing.css';

export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: PageProps<'/guides/[slug]'>): Promise<Metadata> {
  const g = guideBySlug((await params).slug);
  if (!g) return {};
  const path = `/guides/${g.slug}`;
  return {
    title: { absolute: `${g.metaTitle} | ${brand.name}` },
    description: g.description,
    alternates: { canonical: path },
    openGraph: { type: 'article', url: path, title: g.title, description: g.description, siteName: brand.name, locale: seo.locale, modifiedTime: g.updated },
    twitter: { card: 'summary_large_image', title: g.title, description: g.description },
  };
}

export default async function GuidePage({ params }: PageProps<'/guides/[slug]'>) {
  const g = guideBySlug((await params).slug);
  if (!g) notFound();
  const url = `${brand.siteUrl}/guides/${g.slug}`;
  const structured = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: g.title,
        description: g.description,
        dateModified: g.updated,
        inLanguage: 'en-NG',
        mainEntityOfPage: url,
        author: { '@type': 'Organization', name: brand.name, url: brand.siteUrl },
        publisher: { '@type': 'Organization', name: brand.name, logo: { '@type': 'ImageObject', url: `${brand.siteUrl}/logo.png` } },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: brand.siteUrl },
          { '@type': 'ListItem', position: 2, name: 'Guides', item: `${brand.siteUrl}/guides` },
          { '@type': 'ListItem', position: 3, name: g.short, item: url },
        ],
      },
    ],
  };
  const related = g.related.map(guideBySlug).filter((x) => x !== undefined);

  return (
    <div className="lp">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structured).replace(/</g, '\\u003c') }} />
      <Nav />
      <main>
        <article className="lp-section lp-article">
          <div className="lp-wrap lp-article-wrap">
            <nav aria-label="Breadcrumb" className="lp-crumbs">
              <Link href="/guides">
                <ArrowLeft size={15} /> All guides
              </Link>
            </nav>
            <span className="lp-tag" style={{ background: '#E4DEFF', color: '#4426C9' }}>
              {g.tag}
            </span>
            <h1 className="lp-h2">{g.title}</h1>
            <p className="lp-lead">{g.intro}</p>
            <p className="lp-article-meta">Updated {new Date(g.updated).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

            {g.body.map((b, i) => (
              <BlockView key={i} b={b} />
            ))}

            <aside className="lp-article-cta">
              <h2>{g.cta}</h2>
              <p>Daily practice from easy to hard, a mock every Friday, and a weekly report for you.</p>
              <GetApp />
            </aside>

            {related.length ? (
              <nav aria-label="Related guides" className="lp-related">
                <h2>Keep reading</h2>
                {related.map((r) => (
                  <Link key={r.slug} href={`/guides/${r.slug}`} className="lp-related-card">
                    <span>
                      <small>{r.tag}</small>
                      {r.title}
                    </span>
                    <ArrowRight size={18} />
                  </Link>
                ))}
              </nav>
            ) : null}
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}

function BlockView({ b }: { b: Block }) {
  if ('h2' in b) return <h2>{b.h2}</h2>;
  if ('p' in b)
    return (
      <p>
        <GuideText text={b.p} />
      </p>
    );
  if ('ul' in b || 'ol' in b) {
    const items = 'ul' in b ? b.ul : b.ol;
    const List = 'ul' in b ? 'ul' : 'ol';
    return (
      <List>
        {items.map((t, i) => (
          <li key={i}>
            <GuideText text={t} />
          </li>
        ))}
      </List>
    );
  }
  if ('table' in b)
    return (
      <div className="lp-table">
        <table>
          <thead>
            <tr>
              {b.table.head.map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {b.table.rows.map((r, i) => (
              <tr key={i}>
                {r.map((c, j) => (
                  <td key={j}>{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  return (
    <div className="lp-tip">
      <Lightbulb size={20} />
      <p>
        <GuideText text={b.tip} />
      </p>
    </div>
  );
}
