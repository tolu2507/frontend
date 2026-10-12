"use client";
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

export default function TeacherProfilePage() {
  const params = useParams();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const teacherId = params.id as string;

  const { data: teacher, isLoading } = useQuery({
    queryKey: ['teacher', teacherId],
    queryFn: () => api.get(`/users/${teacherId}`)
  });

  if (isLoading) return <div style={{ padding: '2rem' }}>Loading teacher profile...</div>;
  if (!teacher) return <div style={{ padding: '2rem' }}>Teacher not found.</div>;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/curriculum/upload', formData);
      
      // Store the notes in localStorage to pass to the next page
      localStorage.setItem('generated_notes', response.data.notes);
      router.push('/dashboard/curriculum');
    } catch (error) {
      alert('Failed to upload curriculum and generate notes');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <Link href="/dashboard/teachers" style={{ display: 'inline-block', marginBottom: '1.5rem', color: '#64748b', textDecoration: 'none', fontWeight: 500 }}>
        &larr; Back to Teachers
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 className="title-xl" style={{ margin: 0, fontSize: '2rem' }}>{teacher.name}</h1>
          <p style={{ color: '#64748b', fontSize: '1.1rem', marginTop: '0.25rem' }}>
            Email: <strong>{teacher.email || 'N/A'}</strong> &bull; Status: <span style={{ color: '#166534', fontWeight: 500 }}>Active</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            onChange={handleFileUpload} 
            accept=".txt,.pdf,.docx"
          />
          <button 
            className="btn-primary" 
            style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', fontSize: '0.95rem', opacity: uploading ? 0.7 : 1 }}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Generating AI Notes...' : 'Upload Curriculum'}
          </button>
          <button style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem' }}>Edit Profile</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="glass-card">
          <h3 style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Classes Assigned</h3>
          <p style={{ fontSize: '2rem', fontWeight: 700, margin: '0.5rem 0' }}>{teacher.class ? '1' : '0'}</p>
        </div>
        <div className="glass-card">
          <h3 style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Transactions Processed</h3>
          <p style={{ fontSize: '2rem', fontWeight: 700, margin: '0.5rem 0' }}>{teacher.teacherTransactions?.length || 0}</p>
        </div>
        <div className="glass-card">
          <h3 style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Curriculums Uploaded</h3>
          <p style={{ fontSize: '2rem', fontWeight: 700, margin: '0.5rem 0' }}>0</p>
        </div>
      </div>

      <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Activity Log (Tuck-shop & Actions)</h3>
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Action / Description</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            {!teacher.teacherTransactions || teacher.teacherTransactions.length === 0 ? (
              <tr><td colSpan={3} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No activity logs found.</td></tr>
            ) : (
              teacher.teacherTransactions.map((tx: any) => (
                <tr key={tx.id}>
                  <td style={{ color: '#64748b', fontSize: '0.9rem' }}>{new Date(tx.createdAt).toLocaleString()}</td>
                  <td style={{ fontWeight: 500 }}>{tx.description}</td>
                  <td>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '999px', 
                      fontSize: '0.75rem', 
                      fontWeight: 600, 
                      background: '#e0f2fe', 
                      color: '#0369a1' 
                    }}>
                      {tx.type.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
