"use client";
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function AssetsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', quantity: 1 });
  const [submitting, setSubmitting] = useState(false);

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['assets'],
    queryFn: () => api.get('/assets')
  });

  const handleLogAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/assets', { ...formData, status: 'GOOD' });
      await queryClient.invalidateQueries({ queryKey: ['assets'] });
      setIsModalOpen(false);
      setFormData({ name: '', quantity: 1 });
    } catch (err) {
      alert('Failed to log asset');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="title-xl" style={{ margin: 0 }}>Asset Management</h1>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)} style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem', borderRadius: '6px' }}>+ Log New Asset</button>
      </div>
      
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Asset Name</th>
              <th>Quantity</th>
              <th>Condition Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>Loading assets...</td></tr>
            ) : assets.length === 0 ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No assets found. Log your first asset!</td></tr>
            ) : (
              assets.map((asset: any) => (
                <tr key={asset.id}>
                  <td style={{ fontWeight: 600 }}>{asset.name}</td>
                  <td>{asset.quantity}</td>
                  <td><span style={{ color: asset.status === 'GOOD' ? '#166534' : '#854d0e', background: asset.status === 'GOOD' ? '#dcfce7' : '#fef08a', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 500 }}>{asset.status}</span></td>
                  <td>
                    <button style={{ color: 'var(--accent-blue)', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: '0.9rem' }}>Update</button>
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
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Log New Asset</h2>
            <form onSubmit={handleLogAsset}>
              <div className="form-group">
                <label className="form-label">Asset Name</label>
                <input required type="text" className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Quantity</label>
                <input required type="number" min="1" className="form-input" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '0.6rem', background: 'transparent', border: '1px solid var(--card-border)', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '0.6rem', borderRadius: '6px' }} disabled={submitting}>
                  {submitting ? 'Saving...' : 'Log Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
