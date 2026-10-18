'use client';

import 'katex/dist/katex.min.css';

import katex from 'katex';
import { Fragment, useMemo } from 'react';

/** Splits text on $…$ (inline maths), keeping escaped \$ as a dollar sign. */
function pieces(text: string) {
  const out: { maths: boolean; text: string }[] = [];
  const re = /(?<!\\)\$([^$]+?)(?<!\\)\$/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index > last) out.push({ maths: false, text: text.slice(last, m.index) });
    out.push({ maths: true, text: m[1] });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ maths: false, text: text.slice(last) });
  return out.map((p) => (p.maths ? p : { ...p, text: p.text.replace(/\\\$/g, '$') }));
}

/** Question text with $…$ maths rendered the way students see it. Bad LaTeX shows in red instead of breaking the page. */
export function MathText({ text, className }: { text: string; className?: string }) {
  const parts = useMemo(
    () => pieces(text).map((p) => (p.maths ? { ...p, html: katex.renderToString(p.text, { throwOnError: false, strict: 'ignore', output: 'html' }) } : { ...p, html: '' })),
    [text],
  );
  return (
    <span className={className}>
      {parts.map((p, i) =>
        p.maths ? (
          <span key={i} dangerouslySetInnerHTML={{ __html: p.html }} />
        ) : (
          <Fragment key={i}>
            {p.text.split('\n').map((line, j) => (
              <Fragment key={j}>
                {j > 0 ? <br /> : null}
                {line}
              </Fragment>
            ))}
          </Fragment>
        ),
      )}
    </span>
  );
}
