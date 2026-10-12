"use client";
import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function ApplyPage() {
  const [status, setStatus] = useState('idle');
  const [formData, setFormData] = useState({ name: '', email: '', schoolName: '', password: '' });
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    try {
      const res = await api.post('/auth/register', { ...formData, role: 'PRINCIPAL' });
      if (res.access_token) {
        localStorage.setItem('access_token', res.access_token);
        setStatus('success');
        setTimeout(() => router.push('/dashboard/setup'), 2000);
      }
    } catch (err) {
      console.error(err);
      setStatus('idle');
      alert('Failed to register');
    }
  };

  return (
    <main className="container" style={{ minHeight: '100vh', padding: '4rem 2rem' }}>
      <Link href="/" style={{ color: 'var(--accent-blue)', display: 'inline-block', marginBottom: '2rem' }}>
        &larr; Back to Home
      </Link>
      
      <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1 className="title-xl" style={{ fontSize: '2.5rem', textAlign: 'center' }}>
          Join <span className="text-gradient">Nexus</span>
        </h1>
        <p className="subtitle" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          Register your school to start using our cashless ecosystem.
        </p>

        {status === 'success' ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Application Submitted!</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Our team will review your application and contact you shortly to complete the onboarding process.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">School Name</label>
              <input required type="text" className="form-input" placeholder="e.g. Greenfield Academy" value={formData.schoolName} onChange={e => setFormData({...formData, schoolName: e.target.value})} />
            </div>
            
            <div className="form-group">
              <label className="form-label">Principal / Admin Name</label>
              <input required type="text" className="form-input" placeholder="John Doe" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>

            <div className="form-group">
              <label className="form-label">Official Email Address</label>
              <input required type="email" className="form-input" placeholder="admin@greenfield.edu" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>

            <div className="form-group">
              <label className="form-label">Estimated Number of Students</label>
              <select required className="form-input" style={{ appearance: 'none' }}>
                <option value="">Select range...</option>
                <option value="1-100">1 - 100</option>
                <option value="101-500">101 - 500</option>
                <option value="500+">500+</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input required type="password" className="form-input" placeholder="Create a secure password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              style={{ width: '100%', marginTop: '1rem' }}
              disabled={status === 'submitting'}
            >
              {status === 'submitting' ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
