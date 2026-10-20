import Link from 'next/link';
import { Fragment } from 'react';

/** Guide text: **bold** and [links](/path). Everything else is plain text. */
export function GuideText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
  return (
    <>
      {parts.map((part, i) => {
        const bold = part.match(/^\*\*(.+)\*\*$/);
        if (bold) return <strong key={i}>{bold[1]}</strong>;
        const link = part.match(/^\[(.+)\]\((.+)\)$/);
        if (link) return <Link key={i} href={link[2]}>{link[1]}</Link>;
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}
