"use client";
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function TeachersPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  const { data: teachers = [], isLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => api.get('/users?role=TEACHER')
  });

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/users', { ...formData, role: 'TEACHER' });
      await queryClient.invalidateQueries({ queryKey: ['teachers'] });
      setIsModalOpen(false);
      setFormData({ name: '', email: '', password: '' });
    } catch (err) {
      alert('Failed to add teacher');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="title-xl" style={{ margin: 0 }}>Teachers Management</h1>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)} style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem', borderRadius: '6px' }}>+ Invite Teacher</button>
      </div>
      
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>Loading teachers...</td></tr>
            ) : teachers.length === 0 ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No teachers found. Add your first teacher!</td></tr>
            ) : (
              teachers.map((teacher: any) => (
                <tr key={teacher.id}>
                  <td style={{ fontWeight: 600 }}>{teacher.name}</td>
                  <td>{teacher.email}</td>
                  <td><span style={{ color: '#166534', background: '#dcfce7', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 500 }}>ACTIVE</span></td>
                  <td>
                    <Link href={`/dashboard/teachers/${teacher.id}`} style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 500, fontSize: '0.9rem' }}>
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
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Invite Teacher</h2>
            <form onSubmit={handleAddTeacher}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input required type="text" className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input required type="email" className="form-input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Temporary Password</label>
                <input required type="password" className="form-input" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '0.6rem', background: 'transparent', border: '1px solid var(--card-border)', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '0.6rem', borderRadius: '6px' }} disabled={submitting}>
                  {submitting ? 'Saving...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
