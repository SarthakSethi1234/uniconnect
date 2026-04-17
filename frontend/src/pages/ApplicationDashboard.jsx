import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { CheckCircle, XCircle, UserMinus, UsersRound, Clock, FileText, ChevronDown, ChevronUp } from 'lucide-react';

const StatusBadge = ({ status }) => {
  if (status === 'accepted') return <span className="badge badge-green">Accepted</span>;
  if (status === 'rejected') return <span className="badge badge-red">Rejected</span>;
  return <span className="badge badge-amber">Pending</span>;
};

export default function ApplicationDashboard() {
  const { token } = useContext(AuthContext);
  const [incoming, setIncoming] = useState([]);
  const [sent, setSent] = useState([]);
  const [contactsMap, setContactsMap] = useState({});
  const [expandedResumes, setExpandedResumes] = useState({});
  const [loading, setLoading] = useState(true);

  const toggleResume = (id) => {
    setExpandedResumes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const fetchDashboard = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/applications/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setIncoming(data.incoming || []);
      setSent(data.sent || []);
      setLoading(false);
    } catch (e) { console.error(e); setLoading(false); }
  };

  useEffect(() => { fetchDashboard(); }, []); // eslint-disable-line

  const handleAction = async (id, action) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/applications/${id}/status`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (res.ok) fetchDashboard();
    } catch { alert('Error changing status.'); }
  };

  const handleWithdraw = async (proposalId) => {
    if (!window.confirm('Withdraw your application?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/applications/withdraw/${proposalId}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchDashboard();
    } catch { alert('Error withdrawing.'); }
  };

  const handleKick = async (proposalId, applicantId) => {
    if (!window.confirm('Remove this participant from your team?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/proposals/${proposalId}/members/${applicantId}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchDashboard();
    } catch { alert('Error removing participant.'); }
  };

  const fetchContacts = async (proposalId) => {
    if (contactsMap[proposalId]) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/proposals/${proposalId}/accepted-contacts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setContactsMap(prev => ({ ...prev, [proposalId]: Array.isArray(data) ? data : [] }));
    } catch { alert('Error fetching contacts.'); }
  };

  if (loading) return (
    <div className="loading-state"><div className="spinner" /><span>Loading dashboard…</span></div>
  );

  return (
    <div>
      <div className="page-title">
        <div>
          <h1>Application Dashboard</h1>
          <p>Track incoming applications and your sent requests in one place</p>
        </div>
      </div>

      <div className="grid-2" style={{ gap: '2rem' }}>
        {/* ── Incoming Applications ── */}
        <div>
          <div className="section-divider">
            <h2>Incoming <span className="badge badge-gray" style={{ fontSize: '0.7rem', marginLeft: '0.25rem' }}>{incoming.length}</span></h2>
          </div>

          {incoming.length === 0 && (
            <div className="card empty-state">
              <span className="empty-icon"></span>
              <h3>No incoming applications</h3>
              <p style={{ fontSize: '0.82rem' }}>Applications to your proposals will appear here.</p>
            </div>
          )}

          {incoming.map(app => (
            <div key={app.id} className="card animate-in">
              <div className="flex-between" style={{ marginBottom: '0.6rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div className="avatar avatar-sm">{app.applicantName?.charAt(0)}</div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>{app.applicantName}</p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <Clock size={11} style={{ marginRight: '0.2rem' }} />{new Date(app.appliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <StatusBadge status={app.status} />
              </div>

              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 0.75rem' }}>
                For: <strong style={{ color: 'var(--text-main)' }}>{app.proposalTitle}</strong>
              </p>

              {app.resume_text && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <button
                    onClick={() => toggleResume(app.id)}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '0.78rem', padding: '0.3rem 0.6rem', gap: '0.3rem' }}
                  >
                    <FileText size={12} />
                    {expandedResumes[app.id] ? 'Hide' : 'View'} Resume
                    {expandedResumes[app.id] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                  {expandedResumes[app.id] && (
                    <div style={{
                      marginTop: '0.5rem', padding: '0.85rem', background: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-sm)', whiteSpace: 'pre-wrap',
                      fontSize: '0.82rem', lineHeight: 1.65, color: 'var(--text-muted)',
                      border: '1px solid var(--border)', maxHeight: '200px', overflowY: 'auto'
                    }}>
                      {app.resume_text}
                    </div>
                  )}
                </div>
              )}

              {app.status === 'pending' && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => handleAction(app.id, 'accepted')} className="btn btn-secondary btn-sm">
                    <CheckCircle size={13} /> Accept
                  </button>
                  <button onClick={() => handleAction(app.id, 'rejected')} className="btn btn-danger btn-sm">
                    <XCircle size={13} /> Reject
                  </button>
                </div>
              )}

              {app.status === 'accepted' && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button onClick={() => handleKick(app.proposalId, app.applicantId)} className="btn btn-danger btn-sm">
                    <UserMinus size={13} /> Remove
                  </button>
                  <button onClick={() => fetchContacts(app.proposalId)} className="btn btn-outline btn-sm">
                    <UsersRound size={13} /> Team Contacts
                  </button>
                </div>
              )}

              {app.status === 'accepted' && contactsMap[app.proposalId] && (
                <div style={{
                  marginTop: '0.75rem', padding: '0.85rem',
                  background: 'var(--primary-light)', borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(6,95,70,0.2)'
                }}>
                  <p style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>
                    Team Members
                  </p>
                  {contactsMap[app.proposalId].map(c => (
                    <div key={c.user_id} style={{ fontSize: '0.82rem', color: 'var(--text-main)', marginTop: '0.35rem' }}>
                      <strong>{c.name}</strong> —  {c.email}{c.phone ? ` ·  ${c.phone}` : ''}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── Sent Applications ── */}
        <div>
          <div className="section-divider">
            <h2>Sent <span className="badge badge-gray" style={{ fontSize: '0.7rem', marginLeft: '0.25rem' }}>{sent.length}</span></h2>
          </div>

          {sent.length === 0 && (
            <div className="card empty-state">
              <span className="empty-icon"></span>
              <h3>No sent applications</h3>
              <p style={{ fontSize: '0.82rem' }}>Browse proposals and apply to get started.</p>
            </div>
          )}

          {sent.map(app => (
            <div key={app.id} className="card animate-in">
              <div className="flex-between" style={{ marginBottom: '0.35rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700 }}>{app.proposalTitle}</h3>
                <StatusBadge status={app.status} />
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Clock size={11} /> Applied on {new Date(app.appliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>

              {app.status === 'accepted' && (
                <div>
                  <button onClick={() => fetchContacts(app.proposalId)} className="btn btn-outline btn-sm">
                    <UsersRound size={13} /> View Team
                  </button>
                  {contactsMap[app.proposalId] && (
                    <div style={{
                      marginTop: '0.75rem', padding: '0.85rem',
                      background: 'var(--primary-light)', borderRadius: 'var(--radius-sm)',
                      border: '1px solid rgba(6,95,70,0.2)', fontSize: '0.82rem'
                    }}>
                      <p style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: '0.4rem' }}>Your Team</p>
                      {contactsMap[app.proposalId].map(c => (
                        <div key={c.user_id} style={{ color: 'var(--text-main)', marginTop: '0.3rem' }}>
                          <strong>{c.name}</strong> —  {c.email}{c.phone ? ` ·  ${c.phone}` : ''}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {app.status === 'pending' && (
                <button onClick={() => handleWithdraw(app.proposalId)} className="btn btn-outline btn-sm">
                  <XCircle size={13} /> Withdraw
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
