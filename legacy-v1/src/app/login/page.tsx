"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';

export default function LoginPage() {
  const setUser = useAuthStore(state => state.setUser);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await api.post('/auth/login', formData);
      if (response.access_token) {
        localStorage.setItem('access_token', response.access_token);
        setUser(response.user);
        router.push('/dashboard');
      } else {
        setError('Login failed');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="hero-section">
      <Link href="/" style={{ position: 'absolute', top: '2rem', left: '2rem', color: '#64748b', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        &larr; Back to Home
      </Link>

      <div className="glass-card" style={{ maxWidth: '450px', width: '100%', margin: '0 auto', background: 'white' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 className="title-xl" style={{ margin: 0 }}>Welcome Back</h1>
          <p style={{ color: '#64748b', marginTop: '0.5rem' }}>Sign in to access your Nexus CRM.</p>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', color: '#ef4444', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center', fontWeight: 500 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input 
              required 
              type="email" 
              className="form-input" 
              placeholder="admin@school.com"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              required 
              type="password" 
              className="form-input" 
              placeholder="••••••••"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '2rem', color: '#64748b' }}>
          Don't have an account? <Link href="/apply" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}>Register your school</Link>
        </p>
      </div>
    </main>
  );
}
