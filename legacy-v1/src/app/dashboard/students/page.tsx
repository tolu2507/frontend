"use client";
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function StudentsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', classId: '' });
  const [submitting, setSubmitting] = useState(false);

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: () => api.get('/users?role=STUDENT')
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: () => api.get('/classes')
  });

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/users', { ...formData, role: 'STUDENT', password: 'password123' });
      await queryClient.invalidateQueries({ queryKey: ['students'] });
      setIsModalOpen(false);
      setFormData({ name: '', email: '', classId: '' });
    } catch (err) {
      alert('Failed to enroll student');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="title-xl" style={{ margin: 0 }}>Students & Wallets</h1>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)} style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem', borderRadius: '6px' }}>+ Enroll Student</button>
      </div>
      
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Name</th>
              <th>Assigned Class</th>
              <th>Wallet Balance</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>Loading students...</td></tr>
            ) : students.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No students found. Enroll your first student!</td></tr>
            ) : (
              students.map((student: any) => (
                <tr key={student.id}>
                  <td style={{ fontWeight: 600 }}>{student.studentId || 'N/A'}</td>
                  <td>{student.name}</td>
                  <td>{student.class?.name || 'Unassigned'}</td>
                  <td style={{ fontWeight: 600, color: student.wallet?.balance < 1000 ? '#ef4444' : 'inherit' }}>
                    ₦{(student.wallet?.balance || 0).toLocaleString()}
                  </td>
                  <td>
                    <Link href={`/dashboard/students/${student.id}`} style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 500, fontSize: '0.9rem' }}>
                      View Profile
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-card" style={{ width: '400px', background: 'white' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Enroll Student</h2>
            <form onSubmit={handleAddStudent}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input required type="text" className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Email (Optional)</label>
                <input type="email" className="form-input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Assign Class</label>
                <select className="form-input" value={formData.classId} onChange={e => setFormData({...formData, classId: e.target.value})}>
                  <option value="">Select Class...</option>
                  {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '0.6rem', background: 'transparent', border: '1px solid var(--card-border)', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '0.6rem', borderRadius: '6px' }} disabled={submitting}>
                  {submitting ? 'Saving...' : 'Enroll Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
