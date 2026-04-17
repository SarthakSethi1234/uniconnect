import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Shield, Trash2, CheckSquare, AlertTriangle, Users } from 'lucide-react';

export default function AdminPanel() {
  const { token } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setUsers(data.users || []);
      setReports(data.reported || []);
      setLoading(false);
    } catch (e) { console.error(e); setLoading(false); }
  };

  useEffect(() => { fetchAdminData(); }, []); // eslint-disable-line

  const deleteUser = async (id) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/users/${id}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }
      fetchAdminData();
    } catch (error) { 
      alert(`Error deleting user: ${error.message}`); 
    }
  };

  const deleteProposal = async (proposalId) => {
    if (!window.confirm('Take down this proposal? This cannot be undone.')) return;
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/proposals/${proposalId}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchAdminData();
    } catch { alert('Error deleting proposal.'); }
  };

  const dismissReport = async (reportId) => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/reports/${reportId}/dismiss`, {
        method: 'PUT', headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchAdminData();
    } catch { alert('Error dismissing report.'); }
  };

  if (loading) return (
    <div className="loading-state"><div className="spinner" /><span>Loading admin panel…</span></div>
  );

  return (
    <div>
      <div className="page-title">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            Admin Dashboard
          </h1>
          <p>Manage users and review flagged content</p>
        </div>
        {/* Stats */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div className="stat-chip" style={{ minWidth: '100px' }}>
            <span className="stat-value">{users.length}</span>
            <span className="stat-label">Total Users</span>
          </div>
          <div className="stat-chip" style={{ minWidth: '100px', background: 'var(--danger-light)' }}>
            <span className="stat-value" style={{ color: 'var(--danger)' }}>{reports.length}</span>
            <span className="stat-label">Flagged</span>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: '2rem', alignItems: 'flex-start' }}>
        {/* ── Users Table ── */}
        <div>
          <div className="section-divider">
            <h2><Users size={15} style={{ marginRight: '0.3rem', color: 'var(--primary)' }} />Users</h2>
          </div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="table-clean">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Proposals</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.user_id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div className="avatar avatar-sm">{u.name?.charAt(0)}</div>
                        <span style={{ fontWeight: 500 }}>{u.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'badge-red' : ''}`}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{u.proposals_created || 0}</td>
                    <td>
                      {u.role !== 'admin' && (
                        <button onClick={() => deleteUser(u.user_id)} className="btn btn-danger btn-sm">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Flagged Proposals ── */}
        <div>
          <div className="section-divider">
            <h2>
              Flagged Proposals
            </h2>
          </div>

          {reports.length === 0 && (
            <div className="card empty-state">
              <h3>All clear!</h3>
              <p style={{ fontSize: '0.82rem' }}>No flagged proposals at the moment.</p>
            </div>
          )}

          {reports.map(report => (
            <div key={report.report_id} className="card animate-in" style={{
              borderLeft: '4px solid var(--danger)', position: 'relative', overflow: 'hidden'
            }}>
              <div className="flex-between mb-1">
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{report.title}</h3>
                <span className="badge badge-red">Flagged</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 0.25rem' }}>
                <strong>Reported by:</strong> {report.reporter}
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 0.25rem' }}>
                <strong>Reason:</strong> {report.reason}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', margin: '0 0 0.85rem' }}>
                {new Date(report.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button onClick={() => dismissReport(report.report_id)} className="btn btn-secondary btn-sm">
                  <CheckSquare size={13} /> Dismiss
                </button>
                <button onClick={() => deleteProposal(report.proposal_id)} className="btn btn-danger btn-sm">
                  <Trash2 size={13} /> Take Down
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
