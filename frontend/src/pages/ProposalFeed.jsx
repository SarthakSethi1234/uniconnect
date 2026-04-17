import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Users, Calendar, Briefcase, PlusCircle, Flag, Edit2, CheckCircle, XCircle, Zap, TrendingUp } from 'lucide-react';

const statusBadge = (status) => {
  if (status === 'closed')    return <span className="badge badge-red">Closed</span>;
  if (status === 'completed') return <span className="badge badge-green">Team Full</span>;
  return <span className="badge badge-green" style={{ background: '#D1FAE5' }}>Open</span>;
};

export default function ProposalFeed() {
  const { token, user } = useContext(AuthContext);
  const [proposals, setProposals] = useState([]);
  const [skills, setSkills] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [reportingId, setReportingId] = useState(null);
  const [reportReason, setReportReason] = useState('');

  const fetchData = () => {
    Promise.all([
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/proposals`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/analytics/skills`).then(r => r.json()),
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/analytics/recommendations`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json())
    ]).then(([props, sks, recs]) => {
      setProposals(props);
      setSkills(sks);
      setRecommendations(recs);
      setLoading(false);
    }).catch(err => { console.error(err); setLoading(false); });
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const submitReport = async (e) => {
    e.preventDefault();
    if (!reportReason) return;
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/proposals/report`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposal_id: reportingId, reason: reportReason })
      });
      alert('Proposal reported to admins.');
      setReportingId(null);
      setReportReason('');
    } catch { alert('Error reporting proposal.'); }
  };

  const applyToProposal = async (proposalId) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/proposals/${proposalId}/apply`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
         alert('Applied successfully! The creator will review your application.');
         fetchData();
      }
      else alert(data.error || 'Could not apply.');
    } catch { alert('Error applying to proposal.'); }
  };

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
        fetchData();
      } else {
        alert('Error: ' + (data.error || 'Unknown'));
      }
    } catch { alert('Failed to save changes.'); }
  };

  if (loading) return (
    <div className="loading-state"><div className="spinner" /><span>Loading feed...</span></div>
  );

  const myProposals = proposals.filter(p => p.creator_id === user?.id);
  const communityProposals = proposals.filter(p => p.creator_id !== user?.id);

  const renderProposal = (prop, idx) => (
    <div
      key={prop.proposal_id}
      className="card animate-in"
      style={{ animationDelay: `${idx * 0.04}s`, position: 'relative', overflow: 'hidden' }}
    >
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: '4px', background: 'linear-gradient(180deg, var(--primary), #10B981)',
        borderRadius: 'var(--radius-md) 0 0 var(--radius-md)'
      }} />
      <div style={{ paddingLeft: '0.5rem' }}>

        {editingId === prop.proposal_id ? (
          /* ── Inline Edit Form ── */
          <form onSubmit={(e) => handleEditSubmit(e, prop.proposal_id)}>
            <div className="flex-between mb-2">
              <h2 style={{ fontSize: '1.1rem' }}>Edit Proposal</h2>
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
              <input type="text" className="form-control" value={editForm.requiredSkills} onChange={e => setEditForm({ ...editForm, requiredSkills: e.target.value })} placeholder="e.g. Python, React, SQL" />
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
        ) : reportingId === prop.proposal_id ? (
           /* ── Inline Report Form ── */
           <form onSubmit={submitReport}>
            <div className="flex-between mb-2">
              <h2 style={{ fontSize: '1.1rem' }}>Report Proposal</h2>
              <button type="button" onClick={() => { setReportingId(null); setReportReason(''); }} className="btn btn-outline btn-sm">
                <XCircle size={14} /> Cancel
              </button>
            </div>
            <div className="form-group">
              <label>Reason for reporting</label>
              <textarea rows="3" className="form-control" value={reportReason} onChange={e => setReportReason(e.target.value)} required placeholder="Provide details here..." />
            </div>
            <button type="submit" className="btn btn-danger btn-sm">
              Submit Report
            </button>
          </form>
        ) : (
          /* ── Proposal Card View ── */
          <>
            <div className="flex-between" style={{ marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{prop.proposal_title}</h2>
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexShrink: 0 }}>
                {statusBadge(prop.status)}
                <span className="badge badge-gray">
                  <Users size={11} style={{ marginRight: '0.25rem' }} />
                  {prop.current_members}/{prop.max_members}
                </span>
              </div>
            </div>

            {/* Creator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <div className="avatar avatar-sm">
                {prop.creator_name?.charAt(0)}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>{prop.creator_name}</p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                   {prop.creator_email}{prop.creator_phone ? ` ·  ${prop.creator_phone}` : ''}
                </p>
              </div>
            </div>

            {/* Skills */}
            {prop.required_skills && (
              <div style={{ marginBottom: '0.85rem' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  <Briefcase size={11} style={{ marginRight: '0.25rem' }} /> Skills Needed
                </p>
                {prop.required_skills.split(',').map(s => (
                  <span key={s} className="badge">{s.trim()}</span>
                ))}
              </div>
            )}

            {/* Footer row */}
            <div className="flex-between" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Calendar size={13} /> {new Date(prop.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {prop.application_count} applicant{prop.application_count !== 1 ? 's' : ''}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {prop.creator_id !== user?.id && (
                  <button
                    onClick={(e) => { e.preventDefault(); setReportingId(prop.proposal_id); }}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                  >
                    <Flag size={12} /> Report
                  </button>
                )}
                {prop.creator_id === user?.id && (
                  <button onClick={() => startEdit(prop)} className="btn btn-outline btn-sm">
                    <Edit2 size={13} /> Edit
                  </button>
                )}
                {prop.status === 'open' && prop.creator_id !== user?.id && (
                  <button onClick={() => applyToProposal(prop.proposal_id)} className="btn btn-primary btn-sm">
                    Apply Now
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '2rem' }}>
      
      {/* ── Main Feed ── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="page-title flex-between">
          <div>
            <h1>Proposal Feed</h1>
            <p>Find a team, collaborate, and build something great</p>
          </div>
          <Link to="/proposals/new" className="btn btn-primary">
            <PlusCircle size={16} /> New Proposal
          </Link>
        </div>

        {myProposals.length > 0 && (
          <div style={{ marginBottom: '2.5rem' }}>
            <div className="section-divider">
              <h2>My Proposals</h2>
            </div>
            {myProposals.map((prop, idx) => renderProposal(prop, idx))}
          </div>
        )}

        <div>
           <div className="section-divider">
              <h2>Community Proposals</h2>
           </div>
           {communityProposals.length === 0 ? (
            <div className="card empty-state">
              <span className="empty-icon"></span>
              <h3>No proposals yet</h3>
              <p>Check back later or post one yourself!</p>
            </div>
          ) : (
            communityProposals.map((prop, idx) => renderProposal(prop, idx))
          )}
        </div>
      </div>

      {/* ── Sidebar ── */}
      <div style={{ width: '260px', flexShrink: 0, position: 'sticky', top: '80px' }}>
        {/* Recommended Peers */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="flex-between mb-2">
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700 }}>
              <Zap size={15} style={{ color: 'var(--primary)', marginRight: '0.3rem' }} />
              Recommended Peers
            </h3>
          </div>
          {recommendations.length > 0 ? recommendations.slice(0, 5).map((rec, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0', borderTop: idx > 0 ? '1px solid var(--border-light)' : 'none' }}>
              <div className="avatar avatar-sm" style={{ background: `hsl(${idx * 60 + 200}, 60%, 63%)` }}>
                {rec.recommended_student?.charAt(0)}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>{rec.recommended_student}</p>
                <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>{rec.shared_course}</p>
              </div>
            </div>
          )) : (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>No recommendations yet.</p>
          )}
        </div>

        {/* Top Skills */}
        <div className="card">
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            <TrendingUp size={15} style={{ color: 'var(--secondary)', marginRight: '0.3rem' }} />
            Top Skills
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {skills.slice(0, 8).map((s, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-main)' }}>{s.skill}</span>
                <span className="badge badge-gray" style={{ fontSize: '0.7rem', marginBottom: 0 }}>{s.user_count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
