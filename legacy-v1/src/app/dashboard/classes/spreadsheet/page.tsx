"use client";
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

export default function SpreadsheetPage() {
  const [rowData, setRowData] = useState([
    { studentId: 'NEX-001', name: 'Alfonso K.', math: 85, science: 92, english: 88, attendance: 'Present' },
    { studentId: 'NEX-002', name: 'Beatrice M.', math: 90, science: 88, english: 95, attendance: 'Present' },
    { studentId: 'NEX-003', name: 'Carlos D.', math: 78, science: 85, english: 82, attendance: 'Absent' },
    { studentId: 'NEX-004', name: 'Diana R.', math: 95, science: 98, english: 94, attendance: 'Present' },
    { studentId: 'NEX-005', name: 'Evan S.', math: 82, science: 79, english: 85, attendance: 'Late' },
    { studentId: 'NEX-006', name: 'Fiona G.', math: 88, science: 91, english: 89, attendance: 'Present' },
  ]);

  const [saving, setSaving] = useState(false);
  const [colDefs] = useState<any[]>([
    { field: 'studentId', headerName: 'ID', flex: 1, editable: false, pinned: 'left' },
    { field: 'name', headerName: 'Student Name', flex: 2, editable: false, pinned: 'left' },
    { field: 'math', headerName: 'Mathematics', flex: 1, editable: true, type: 'numericColumn' },
    { field: 'science', headerName: 'Science', flex: 1, editable: true, type: 'numericColumn' },
    { field: 'english', headerName: 'English', flex: 1, editable: true, type: 'numericColumn' },
    { 
      field: 'attendance', 
      headerName: 'Today\'s Attendance', 
      flex: 1, 
      editable: true, 
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: ['Present', 'Absent', 'Late', 'Excused'] }
    },
  ]);

  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true,
  }), []);

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      // In a real app, you would extract rowData from the grid API or state and send to backend
      // await api.post('/classes/bulk-update', { rows: rowData });
      await new Promise(r => setTimeout(r, 800)); // Simulate network request
      alert('Successfully saved all grades and attendance!');
    } catch (err) {
      alert('Failed to save data');
    }
    setSaving(false);
  };

  return (
    <div>
      <Link href="/dashboard/classes" style={{ display: 'inline-block', marginBottom: '1.5rem', color: '#64748b', textDecoration: 'none', fontWeight: 500 }}>
        &larr; Back to Classes
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 className="title-xl" style={{ margin: 0, fontSize: '2rem' }}>Mass Grading & Attendance</h1>
          <p style={{ color: '#64748b', fontSize: '1.1rem', marginTop: '0.25rem' }}>
            Class: <strong>Grade 10 - Alpha</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-primary" onClick={handleSaveAll} disabled={saving} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', fontSize: '0.95rem' }}>
            {saving ? 'Saving...' : '💾 Save All Changes'}
          </button>
        </div>
      </div>

      <div className="ag-theme-alpine" style={{ height: '600px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <AgGridReact
          rowData={rowData}
          columnDefs={colDefs}
          defaultColDef={defaultColDef}
          animateRows={true}
          rowSelection="multiple"
        />
      </div>
    </div>
  );
}
