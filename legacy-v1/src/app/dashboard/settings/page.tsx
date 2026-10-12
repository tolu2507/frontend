"use client";
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [settings, setSettings] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/settings').then(setSettings).catch(console.error);
  }, []);

  const handleSave = async (e: any) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/settings', settings);
      alert('Settings saved successfully!');
    } catch (err) {
      alert('Failed to save settings');
    }
    setSaving(false);
  };

  const updateSetting = (key: string, value: string) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }));
  };

  return (
    <div>
      <h1 className="title-xl" style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Platform Settings</h1>

      <div style={{ display: 'flex', gap: '2rem' }}>
        {/* Sidebar Tabs */}
        <div className="glass-card" style={{ width: '250px', display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1.5rem 1rem' }}>
          <button 
            className={activeTab === 'profile' ? 'btn-primary' : ''}
            style={{ padding: '0.75rem 1rem', borderRadius: '8px', textAlign: 'left', border: 'none', background: activeTab === 'profile' ? '' : 'transparent', color: activeTab === 'profile' ? 'white' : '#64748b', fontWeight: 600, cursor: 'pointer' }}
            onClick={() => setActiveTab('profile')}
          >
            🏫 School Profile
          </button>
          <button 
            className={activeTab === 'security' ? 'btn-primary' : ''}
            style={{ padding: '0.75rem 1rem', borderRadius: '8px', textAlign: 'left', border: 'none', background: activeTab === 'security' ? '' : 'transparent', color: activeTab === 'security' ? 'white' : '#64748b', fontWeight: 600, cursor: 'pointer' }}
            onClick={() => setActiveTab('security')}
          >
            🔒 Security
          </button>
          <button 
            className={activeTab === 'integrations' ? 'btn-primary' : ''}
            style={{ padding: '0.75rem 1rem', borderRadius: '8px', textAlign: 'left', border: 'none', background: activeTab === 'integrations' ? '' : 'transparent', color: activeTab === 'integrations' ? 'white' : '#64748b', fontWeight: 600, cursor: 'pointer' }}
            onClick={() => setActiveTab('integrations')}
          >
            🔌 Integrations (API)
          </button>
        </div>

        {/* Main Content Area */}
        <div style={{ flex: 1 }}>
          {activeTab === 'profile' && (
            <div className="glass-card">
              <h2 style={{ marginBottom: '1.5rem' }}>School Information</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label">School Name</label>
                  <input type="text" className="form-input" value={settings.schoolName || ''} onChange={e => updateSetting('schoolName', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Email</label>
                  <input type="email" className="form-input" value={settings.contactEmail || ''} onChange={e => updateSetting('contactEmail', e.target.value)} />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">School Address</label>
                  <input type="text" className="form-input" value={settings.address || ''} onChange={e => updateSetting('address', e.target.value)} />
                </div>
              </div>
              <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ marginTop: '2rem', padding: '0.75rem 2rem', borderRadius: '8px' }}>{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="glass-card">
              <h2 style={{ marginBottom: '1.5rem' }}>Change Password</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '400px' }}>
                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <input type="password" className="form-input" placeholder="••••••••" />
                </div>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input type="password" className="form-input" placeholder="••••••••" />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input type="password" className="form-input" placeholder="••••••••" />
                </div>
              </div>
              <button className="btn-primary" style={{ marginTop: '2rem', padding: '0.75rem 2rem', borderRadius: '8px' }}>Update Password</button>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="glass-card">
              <h2 style={{ marginBottom: '0.5rem' }}>Third-Party Integrations</h2>
              <p style={{ color: '#64748b', marginBottom: '2rem' }}>Manage your API keys for external services.</p>
              
              <div style={{ marginBottom: '2rem', padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>🤖 Google Gemini AI</h3>
                <div className="form-group">
                  <label className="form-label">API Key</label>
                  <input type="password" className="form-input" value={settings.geminiApiKey || ''} onChange={e => updateSetting('geminiApiKey', e.target.value)} />
                </div>
              </div>

              <div style={{ marginBottom: '2rem', padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>💳 GTsquad Payments</h3>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Public Key</label>
                  <input type="text" className="form-input" value={settings.gtsquadPubKey || ''} onChange={e => updateSetting('gtsquadPubKey', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Secret Key</label>
                  <input type="password" className="form-input" value={settings.gtsquadSecKey || ''} onChange={e => updateSetting('gtsquadSecKey', e.target.value)} />
                </div>
              </div>

              <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ padding: '0.75rem 2rem', borderRadius: '8px' }}>{saving ? 'Saving...' : 'Save Integrations'}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
