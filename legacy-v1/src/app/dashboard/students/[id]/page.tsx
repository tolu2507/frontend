"use client";
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function StudentProfilePage() {
  const params = useParams();
  const studentId = params.id as string;
  const [isFundModalOpen, setIsFundModalOpen] = useState(false);
  const [fundAmount, setFundAmount] = useState('');
  const [loadingPayment, setLoadingPayment] = useState(false);

  const { data: student, isLoading } = useQuery({
    queryKey: ['student', studentId],
    queryFn: () => api.get(`/users/${studentId}`)
  });

  const handleFund = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingPayment(true);
    try {
      const response = await api.post('/wallets/fund/initiate', {
        studentId: student.studentId,
        amount: parseFloat(fundAmount),
        email: student.email || 'parent@nexus.com',
        callbackUrl: window.location.href // return to this page after GTsquad
      });
      // Redirect to GTsquad checkout
      if (response.checkoutUrl) {
        window.location.href = response.checkoutUrl;
      }
    } catch (err) {
      alert('Failed to initiate payment');
      setLoadingPayment(false);
    }
  };

  if (isLoading) return <div style={{ padding: '2rem' }}>Loading student profile...</div>;
  if (!student) return <div style={{ padding: '2rem' }}>Student not found.</div>;

  // Mock data for the 4-week chart until we have enough real transactions
  const chartData = [
    { name: 'Week 1', spent: 1200 },
    { name: 'Week 2', spent: 800 },
    { name: 'Week 3', spent: 1500 },
    { name: 'Week 4', spent: 400 },
  ];

  return (
    <div>
      <Link href="/dashboard/students" style={{ display: 'inline-block', marginBottom: '1.5rem', color: '#64748b', textDecoration: 'none', fontWeight: 500 }}>
        &larr; Back to Students
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 className="title-xl" style={{ margin: 0, fontSize: '2rem' }}>{student.name}</h1>
          <p style={{ color: '#64748b', fontSize: '1.1rem', marginTop: '0.25rem' }}>
            ID: <strong>{student.studentId || 'N/A'}</strong> &bull; Class: {student.class?.name || 'Unassigned'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-primary" onClick={() => setIsFundModalOpen(true)} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', fontSize: '0.95rem' }}>Fund Wallet</button>
          <button style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem' }}>Withdraw</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
        <div className="glass-card" style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', color: 'white' }}>
          <h3 style={{ margin: 0, opacity: 0.8, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Wallet Balance</h3>
          <h2 style={{ fontSize: '3rem', margin: '0.5rem 0', fontWeight: 800 }}>₦{(student.wallet?.balance || 0).toLocaleString()}</h2>
          <p style={{ margin: 0, opacity: 0.8, fontSize: '0.85rem' }}>Last updated just now</p>
        </div>

        <div className="glass-card">
          <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem' }}>Wallet Spending (Last 4 Weeks)</h3>
          <div style={{ height: '200px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(val) => `₦${val}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  formatter={(value: any) => [`₦${value}`, 'Spent']}
                />
                <Line type="monotone" dataKey="spent" stroke="var(--accent-blue)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <h3 style={{ marginTop: '3rem', marginBottom: '1rem', fontSize: '1.2rem' }}>Transaction History</h3>
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Type</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {!student.studentTransactions || student.studentTransactions.length === 0 ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No recent transactions.</td></tr>
            ) : (
              student.studentTransactions.map((tx: any) => (
                <tr key={tx.id}>
                  <td style={{ color: '#64748b', fontSize: '0.9rem' }}>{new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString()}</td>
                  <td style={{ fontWeight: 500 }}>{tx.description}</td>
                  <td>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '999px', 
                      fontSize: '0.75rem', 
                      fontWeight: 600, 
                      background: tx.type.includes('FUNDING') ? '#dcfce7' : '#fee2e2', 
                      color: tx.type.includes('FUNDING') ? '#166534' : '#991b1b' 
                    }}>
                      {tx.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: tx.type.includes('FUNDING') ? '#16a34a' : '#ef4444' }}>
                    {tx.type.includes('FUNDING') ? '+' : '-'}₦{tx.amount.toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isFundModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-card" style={{ width: '400px', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Fund Wallet</h2>
              <button onClick={() => setIsFundModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: '#94a3b8' }}>&times;</button>
            </div>
            <form onSubmit={handleFund}>
              <div className="form-group">
                <label className="form-label">Amount to Fund (₦)</label>
                <input 
                  required 
                  type="number" 
                  min="100"
                  className="form-input" 
                  placeholder="e.g. 5000"
                  value={fundAmount} 
                  onChange={e => setFundAmount(e.target.value)} 
                />
              </div>
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', color: '#64748b' }}>
                You will be redirected to the secure GTsquad payment gateway to complete this transaction.
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px' }} disabled={loadingPayment}>
                {loadingPayment ? 'Connecting to GTsquad...' : 'Proceed to Payment'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
