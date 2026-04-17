import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { CheckCircle, XCircle, Edit2, Archive, Inbox } from 'lucide-react';

const statusColor = (status) => {
  if (status === 'completed') return 'badge-green';
  if (status === 'closed')    return 'badge-red';
  if (status === 'archived')  return 'badge-gray';
  return 'badge';
};

export default function MyProposals() {
  const { token } = useContext(AuthContext);
  const [activeProposals, setActiveProposals] = useState([]);
  const [pastProposals, setPastProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    Promise.all([
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/proposals/mine/active`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/proposals/mine/past`,   { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json())
    ]).then(([active, past]) => {
      setActiveProposals(Array.isArray(active) ? active : []);
      setPastProposals(Array.isArray(past)   ? past   : []);
      setLoading(false);
    }).catch(e => { console.error(e); setLoading(false); });
  }, [token]);

  const startEdit = (prop) => {
    setEditingId(prop.proposal_id);
    setEditForm({
      title: prop.proposal_title,
      description: prop.description || '',
      requiredSkills: prop.required_skills || '',
      maxMembers: prop.max_members,
      deadline: prop.deadline ? new Date(prop.deadline).toISOString().split('T')[0] : ''
    });
  };

  const handleEditSubmit = async (e, proposalId) => {
    e.preventDefault();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/proposals/${proposalId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (data.success) {
        setEditingId(null);
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/proposals/mine/active`, { headers: { 'Authorization': `Bearer ${token}` } })
          .then(r => r.json()).then(d => setActiveProposals(Array.isArray(d) ? d : []));
      } else {
        alert('Error: ' + (data.error || 'Unknown'));
      }
    } catch { alert('Failed to save changes.'); }
  };

  if (loading) return (
    <div className="loading-state"><div className="spinner" /><span>Loading your proposals…</span></div>
  );

  const ProposalCard = ({ prop, editable }) => (
    <div
      key={prop.proposal_id}
      className="card animate-in"
      style={{ position: 'relative', overflow: 'hidden', borderLeft: `4px solid ${editable ? 'var(--primary)' : 'var(--border)'}` }}
    >
      {editingId === prop.proposal_id ? (
        <form onSubmit={(e) => handleEditSubmit(e, prop.proposal_id)}>
          <div className="flex-between mb-2">
            <h3 style={{ fontSize: '1rem' }}>Edit Proposal</h3>
            <button type="button" onClick={() => setEditingId(null)} className="btn btn-outline btn-sm">
              <XCircle size={14} /> Cancel
            </button>
          </div>
          <div className="form-group">
            <label>Title</label>
            <input type="text" className="form-control" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea rows="3" className="form-control" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Required Skills <span className="text-xs text-muted">(comma-separated)</span></label>
            <input type="text" className="form-control" value={editForm.requiredSkills} onChange={e => setEditForm({ ...editForm, requiredSkills: e.target.value })} />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label>Max Members</label>
              <input type="number" className="form-control" min="1" max="20" value={editForm.maxMembers} onChange={e => setEditForm({ ...editForm, maxMembers: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Deadline</label>
              <input type="date" className="form-control" value={editForm.deadline} onChange={e => setEditForm({ ...editForm, deadline: e.target.value })} required />
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-sm">
            <CheckCircle size={14} /> Save Changes
          </button>
        </form>
      ) : (
        <>
          <div className="flex-between" style={{ marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>{prop.proposal_title}</h3>
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              {editable && (
                <button onClick={() => startEdit(prop)} className="btn btn-outline btn-sm">
                  <Edit2 size={13} /> Edit
                </button>
              )}
              <span className={`badge ${statusColor(prop.status)}`}>{prop.status.toUpperCase()}</span>
            </div>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 0.65rem' }}>
            Deadline: {new Date(prop.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            {prop.closed_at ? ` · Closed ${new Date(prop.closed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
          </p>

          {prop.description && (
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0 0 0.75rem', lineHeight: 1.6 }}>
              {prop.description}
            </p>
          )}

          {prop.required_skills && (
            <div style={{ marginBottom: '0.75rem' }}>
              {prop.required_skills.split(',').map(s => (
                <span key={s} className="badge">{s.trim()}</span>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span>👥 {prop.current_members}/{prop.max_members} members</span>
            <span> {prop.application_count} application{prop.application_count !== 1 ? 's' : ''}</span>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div>
      <div className="page-title">
        <div>
          <h1>My Proposals</h1>
          <p>Manage your active and past academic project proposals</p>
        </div>
      </div>

      {/* Active */}
      <div className="section-divider">
        <h2><Inbox size={15} style={{ marginRight: '0.35rem', color: 'var(--primary)' }} />Active ({activeProposals.length})</h2>
      </div>

      {activeProposals.length === 0 && (
        <div className="card empty-state">
          <span className="empty-icon"></span>
          <h3>No active proposals</h3>
          <p style={{ fontSize: '0.82rem' }}>Create a new proposal and invite collaborators!</p>
        </div>
      )}
      {activeProposals.map(prop => <ProposalCard key={prop.proposal_id} prop={prop} editable />)}

      {/* Past */}
      <div className="section-divider" style={{ marginTop: '3rem' }}>
        <h2><Archive size={15} style={{ marginRight: '0.35rem', color: 'var(--text-muted)' }} />Past ({pastProposals.length})</h2>
      </div>

      {pastProposals.length === 0 && (
        <div className="card empty-state">
          <span className="empty-icon">📦</span>
          <h3>No past proposals yet</h3>
          <p style={{ fontSize: '0.82rem' }}>Completed and closed proposals will appear here.</p>
        </div>
      )}
      {pastProposals.map(prop => <ProposalCard key={prop.proposal_id} prop={prop} editable={false} />)}
    </div>
  );
}
