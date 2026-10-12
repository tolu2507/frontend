"use client";
import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

const revenueData: any[] = [];

const studentDemographics: any[] = [];
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function DashboardOverview() {
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<any>(null);

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/auth/dashboard/stats'),
  });

  const openReceipt = (tx: any) => {
    setSelectedTx(tx);
    setReceiptOpen(true);
  };

  return (
    <div>
      <h1 className="title-xl" style={{ marginBottom: '1.5rem' }}>Dashboard Overview</h1>

      <div className="features-grid" style={{ marginTop: '0', marginBottom: '2.5rem', gap: '1.5rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Wallet Balance</h3>
          <p className="text-gradient" style={{ fontSize: '2rem', fontWeight: 700, margin: '0.5rem 0' }}>₦{(stats?.walletBalance || 0).toLocaleString()}</p>
          <p style={{ color: 'var(--accent-blue)', fontSize: '0.85rem', fontWeight: 500 }}>Real-time balance</p>
        </div>
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Students</h3>
          <p style={{ fontSize: '2rem', fontWeight: 700, margin: '0.5rem 0' }}>{stats?.students || 0}</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Registered in database</p>
        </div>
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Today's Transactions</h3>
          <p style={{ fontSize: '2rem', fontWeight: 700, margin: '0.5rem 0' }}>{stats?.transactions || 0}</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Pending analytics integration</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 600 }}>Wallet Activity Trends</h2>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₦${value/1000}k`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontSize: '0.9rem', fontWeight: 500 }}
                />
                <Line type="monotone" dataKey="revenue" name="Funding" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="deductions" name="Spending" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 600 }}>Student Distribution</h2>
          <div style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie
                  data={studentDemographics}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {studentDemographics.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
              {studentDemographics.map((entry, index) => (
                <div key={entry.name} style={{ display: 'flex', alignItems: 'center', fontSize: '0.85rem', color: '#64748b' }}>
                  <span style={{ display: 'inline-block', width: '10px', height: '10px', backgroundColor: COLORS[index % COLORS.length], borderRadius: '50%', marginRight: '6px' }}></span>
                  {entry.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: 600 }}>Recent Wallet Activity</h2>
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Time</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No recent transactions found.</td>
            </tr>
          </tbody>
        </table>
      </div>

      {receiptOpen && selectedTx && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-card" style={{ width: '400px', background: 'white' }}>
            <div style={{ textAlign: 'center', borderBottom: '1px dashed var(--card-border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Transaction Receipt</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Nexus School Management</p>
            </div>
            <div style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
              <p style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}><span style={{ color: 'var(--text-secondary)' }}>Ref ID:</span> <strong>{selectedTx.ref}</strong></p>
              <p style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}><span style={{ color: 'var(--text-secondary)' }}>Date:</span> <strong>{selectedTx.date} {selectedTx.time}</strong></p>
              <p style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}><span style={{ color: 'var(--text-secondary)' }}>Student:</span> <strong>{selectedTx.student}</strong></p>
              <p style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}><span style={{ color: 'var(--text-secondary)' }}>Type:</span> <strong>{selectedTx.type}</strong></p>
            </div>
            <div style={{ textAlign: 'center', borderTop: '1px dashed var(--card-border)', paddingTop: '1rem', marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Amount</p>
              <p style={{ fontSize: '2rem', fontWeight: 700 }}>{selectedTx.amount}</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setReceiptOpen(false)} style={{ flex: 1, padding: '0.6rem', background: 'transparent', border: '1px solid var(--card-border)', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>Close</button>
              <button className="btn-primary" style={{ flex: 1, padding: '0.6rem', borderRadius: '6px' }}>Print Receipt</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
