"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/api';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser, logout } = useAuthStore();
  const [loading, setLoading] = useState(!user);

  useEffect(() => {
    if (!user) {
      api.get('/auth/me').then(data => {
        setUser(data);
      }).catch(() => {
        logout();
        router.push('/login');
      }).finally(() => setLoading(false));
    }
  }, [user, setUser, logout, router]);

  const schoolThemeColor = "#1e40af"; // Hardcoded for now, can be added to School model later
  const schoolName = user?.school?.name || "Loading...";
  const userName = user?.name || "Loading...";
  const userInitials = userName.split(' ').map((n: string) => n[0]).join('').substring(0, 2);
  const schoolInitial = schoolName.charAt(0) || "N";

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0f172a', color: '#94a3b8' }}>
        Loading Nexus CRM...
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <aside className={`dashboard-sidebar ${collapsed ? 'collapsed' : ''}`} style={{ background: schoolThemeColor }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               {/* Placeholder for School Logo */}
              <div style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{schoolInitial}</div>
              <h2 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 700, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
                {schoolName}
              </h2>
            </div>
          )}
          <button 
            onClick={() => setCollapsed(!collapsed)}
            style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.5rem', marginLeft: collapsed ? '0' : 'auto' }}
          >
            ☰
          </button>
        </div>
        
        <nav>
          <Link href="/dashboard" className="dashboard-nav-item">
            <span className="nav-icon">📊</span>
            <span className="nav-text">Overview</span>
          </Link>
          <Link href="/dashboard/setup" className="dashboard-nav-item" style={!collapsed ? { background: 'rgba(255,255,255,0.15)', fontWeight: 600 } : {}}>
            <span className="nav-icon">🚀</span>
            <span className="nav-text">Setup Wizard</span>
          </Link>
          <Link href="/dashboard/classes" className="dashboard-nav-item">
            <span className="nav-icon">🏫</span>
            <span className="nav-text">Classes & Curr.</span>
          </Link>
          <Link href="/dashboard/teachers" className="dashboard-nav-item">
            <span className="nav-icon">👨‍🏫</span>
            <span className="nav-text">Teachers</span>
          </Link>
          <Link href="/dashboard/students" className="dashboard-nav-item">
            <span className="nav-icon">🎓</span>
            <span className="nav-text">Students & Wallets</span>
          </Link>
          <Link href="/dashboard/assets" className="dashboard-nav-item">
            <span className="nav-icon">📦</span>
            <span className="nav-text">Assets</span>
          </Link>
          <Link href="/dashboard/analytics" className="dashboard-nav-item">
            <span className="nav-icon">📈</span>
            <span className="nav-text">Analytics</span>
          </Link>
          <Link href="/dashboard/settings" className="dashboard-nav-item">
            <span className="nav-icon">⚙️</span>
            <span className="nav-text">Settings</span>
          </Link>
        </nav>

        <div style={{ position: 'absolute', bottom: '2rem', width: collapsed ? 'calc(100% - 2rem)' : 'calc(100% - 4rem)' }}>
          <div className="glass-card" style={{ padding: '1rem', textAlign: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '1rem' }}>
            {!collapsed && <p style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Logged in as</p>}
            <p style={{ fontWeight: 600, fontSize: collapsed ? '0.8rem' : '1rem' }}>{collapsed ? userInitials : userName}</p>
            {!collapsed && <button onClick={() => { logout(); router.push('/login'); }} style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.75rem', cursor: 'pointer', marginTop: '0.5rem', fontWeight: 600 }}>Log Out</button>}
          </div>
          
          {!collapsed && (
            <div style={{ textAlign: 'center', opacity: 0.7 }}>
              <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Powered by</p>
              <p style={{ fontWeight: 800, fontSize: '0.9rem' }}>NEXUS</p>
            </div>
          )}
        </div>
      </aside>

      <main className="dashboard-main">
        {children}
      </main>
    </div>
  );
}
