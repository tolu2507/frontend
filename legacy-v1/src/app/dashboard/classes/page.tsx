"use client";
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function ClassesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [className, setClassName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: () => api.get('/classes')
  });

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/classes', { name: className });
      await queryClient.invalidateQueries({ queryKey: ['classes'] });
      setIsModalOpen(false);
      setClassName('');
    } catch (err) {
      alert('Failed to add class');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="title-xl" style={{ margin: 0 }}>Classes & Curriculum</h1>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)} style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem', borderRadius: '6px' }}>+ New Class</button>
      </div>
      
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Class Name</th>
              <th>Assigned Teacher</th>
              <th>Total Students</th>
              <th>Curriculum Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>Loading classes...</td></tr>
            ) : classes.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No classes found. Add your first class!</td></tr>
            ) : (
              classes.map((cls: any) => (
                <tr key={cls.id}>
                  <td style={{ fontWeight: 600 }}>{cls.name}</td>
                  <td>{cls.teacher ? cls.teacher.name : 'Unassigned'}</td>
                  <td>{cls._count?.students || 0}</td>
                  <td><span style={{ color: '#854d0e', background: '#fef08a', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 500 }}>PENDING</span></td>
                  <td>
                    <button style={{ color: 'var(--accent-blue)', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: '0.9rem' }}>Manage</button>
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
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Add New Class</h2>
            <form onSubmit={handleAddClass}>
              <div className="form-group">
                <label className="form-label">Class Name (e.g. JSS 1A)</label>
                <input required type="text" className="form-input" value={className} onChange={e => setClassName(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '0.6rem', background: 'transparent', border: '1px solid var(--card-border)', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '0.6rem', borderRadius: '6px' }} disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
