"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

export default function CurriculumPage() {
  const [notes, setNotes] = useState<string | null>(null);

  useEffect(() => {
    const savedNotes = localStorage.getItem('generated_notes');
    if (savedNotes) {
      setNotes(savedNotes);
    }
  }, []);

  return (
    <div>
      <Link href="/dashboard/teachers" style={{ display: 'inline-block', marginBottom: '1.5rem', color: '#64748b', textDecoration: 'none', fontWeight: 500 }}>
        &larr; Back to Teachers
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="title-xl" style={{ margin: 0 }}>AI Generated Lesson Notes</h1>
        <button className="btn-primary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem', borderRadius: '6px' }} onClick={() => window.print()}>
          Print / Export PDF
        </button>
      </div>

      {notes ? (
        <div className="glass-card" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', background: 'white', lineHeight: '1.8' }}>
          <ReactMarkdown>
            {notes}
          </ReactMarkdown>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
          <h3>No Lesson Notes Found</h3>
          <p>Please upload a curriculum file from a teacher\'s profile to generate AI lesson notes.</p>
        </div>
      )}
    </div>
  );
}
