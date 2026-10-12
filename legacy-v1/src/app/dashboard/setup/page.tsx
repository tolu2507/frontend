"use client";
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function SetupWizard() {
  const [step, setStep] = useState(1);
  const [className, setClassName] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const router = useRouter();

  const handleAddClass = async () => {
    try {
      await api.post('/classes', { name: className });
      setClassName('');
      setStep(2);
    } catch (e) {
      alert('Failed to add class');
    }
  };

  const handleAddTeacher = async () => {
    try {
      await api.post('/users', { name: teacherName, email: teacherEmail, password: teacherPassword, role: 'TEACHER' });
      setTeacherName('');
      setTeacherEmail('');
      setTeacherPassword('');
      setStep(3);
    } catch (error) {
      console.error(error);
      alert('Failed to add teacher');
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 className="title-xl" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>School Setup Wizard</h1>
      <p className="subtitle" style={{ margin: '0 0 2rem 0' }}>Complete these steps to get your school fully operational on Nexus.</p>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        {[1, 2, 3, 4].map((num) => (
          <div key={num} style={{ flex: 1, height: '4px', background: step >= num ? 'var(--accent-blue)' : 'var(--card-border)', borderRadius: '2px' }} />
        ))}
      </div>

      <div className="glass-card">
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Step 1: Create Classes</h2>
            <div className="form-group">
              <label className="form-label">Class Name (e.g. JSS 1A)</label>
              <input type="text" className="form-input" placeholder="Enter class name" value={className} onChange={e => setClassName(e.target.value)} />
            </div>
            <button className="btn-primary" style={{ width: '100%' }} onClick={handleAddClass}>Add Class</button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Step 2: Add Teachers</h2>
            <div className="form-group">
              <label className="form-label">Teacher Name</label>
              <input type="text" className="form-input" placeholder="Enter teacher name" value={teacherName} onChange={e => setTeacherName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-input" placeholder="teacher@school.edu" value={teacherEmail} onChange={e => setTeacherEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Temporary Password</label>
              <input type="password" className="form-input" placeholder="Create password" value={teacherPassword} onChange={e => setTeacherPassword(e.target.value)} />
            </div>
            <button className="btn-primary" style={{ width: '100%' }} onClick={handleAddTeacher}>Invite Teacher</button>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Step 3: Assign Teachers to Classes</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Select a teacher and assign them to a class.</p>
            <div className="form-group">
              <select className="form-input">
                <option>Select Teacher...</option>
                <option>Mr. Anderson</option>
              </select>
            </div>
            <div className="form-group">
              <select className="form-input">
                <option>Select Class...</option>
                <option>JSS 1A</option>
              </select>
            </div>
            <button className="btn-primary" style={{ width: '100%' }}>Assign</button>
          </div>
        )}

        {step === 4 && (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Setup Complete!</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>You are ready to start onboarding students and managing assets.</p>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--card-border)' }}>
          <button 
            style={{ background: 'transparent', border: '1px solid var(--card-border)', padding: '0.8rem 1.5rem', borderRadius: '8px', cursor: 'pointer', visibility: step === 1 ? 'hidden' : 'visible' }}
            onClick={() => setStep(s => s - 1)}
          >
            Back
          </button>
          <button 
            className="btn-primary"
            onClick={() => { if (step === 4) router.push('/dashboard'); else setStep(s => Math.min(4, s + 1)); }}
          >
            {step === 4 ? 'Go to Dashboard' : 'Next Step'}
          </button>
        </div>
      </div>
    </div>
  );
}
