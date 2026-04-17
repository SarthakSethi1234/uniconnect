import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Search, Filter, FileText, ChevronDown, ChevronUp, Star } from 'lucide-react';

export default function SearchPage() {
  const { token } = useContext(AuthContext);
  const [students, setStudents] = useState([]);
  const [majors, setMajors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMajor, setSelectedMajor] = useState('');
  const [expandedResumes, setExpandedResumes] = useState({});

  const toggleResume = (id) => {
    setExpandedResumes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const fetchStudents = async (major = '') => {
    setLoading(true);
    try {
      const url = major
        ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/search?major=${encodeURIComponent(major)}`
        : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/search`;
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      setStudents(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/majors`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setMajors(Array.isArray(d) ? d : []))
      .catch(console.error);
    fetchStudents();
  }, []); // eslint-disable-line

  const handleMajorChange = (e) => {
    setSelectedMajor(e.target.value);
    fetchStudents(e.target.value);
  };

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.skills && s.skills.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Color palette for student avatars
  const avatarColors = ['#7C3AED', '#059669', '#D97706', '#E11D48', '#3B82F6', '#EC4899', '#14B8A6'];

  return (
    <div>
      <div className="page-title">
        <div>
          <h1>Student Directory</h1>
          <p>Browse peers, discover skills, and find the right collaborators</p>
        </div>
      </div>

      {/* ── Search & Filter Bar ── */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
          <input
            type="text"
            placeholder="Search by name or skill…"
            className="form-control"
            style={{ paddingLeft: '2.35rem' }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={{ position: 'relative', minWidth: '200px' }}>
          <Filter size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)', pointerEvents: 'none' }} />
          <select
            className="form-control"
            style={{ paddingLeft: '2.35rem' }}
            value={selectedMajor}
            onChange={handleMajorChange}
          >
            <option value="">All Programmes</option>
            {majors.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="badge badge-gray" style={{ alignSelf: 'center', fontSize: '0.8rem', padding: '0.4em 0.9em' }}>
          {filtered.length} student{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {loading && (
        <div className="loading-state"><div className="spinner" /><span>Loading students…</span></div>
      )}

      <div className="grid-2">
        {!loading && filtered.length === 0 && (
          <div className="card empty-state" style={{ gridColumn: '1 / -1' }}>
            <span className="empty-icon"></span>
            <h3>No students found</h3>
            <p style={{ fontSize: '0.82rem' }}>Try a different search term or filter.</p>
          </div>
        )}

        {filtered.map((student, idx) => (
          <div key={student.id} className="card animate-in" style={{ animationDelay: `${idx * 0.035}s` }}>
            {/* Header */}
            <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
              <div
                className="avatar avatar-md"
                style={{ background: `linear-gradient(135deg, ${avatarColors[idx % avatarColors.length]}, ${avatarColors[(idx + 2) % avatarColors.length]})` }}
              >
                {student.name?.charAt(0)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.1rem' }}>{student.name}</h3>
                <p style={{ margin: '0 0 0.35rem', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 500 }}>
                  {student.major || 'Undeclared'}{student.grad_year ? ` · ${student.grad_year}` : ''}
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span><Star size={11} style={{ marginRight: '0.2rem' }} />{student.influence_score || 0} rep</span>
                  <span> {student.collaborations_count || 0} collabs</span>
                </div>
              </div>
            </div>

            {student.bio && (
              <p style={{ fontSize: '0.85rem', margin: '0 0 0.75rem', lineHeight: 1.6, color: 'var(--text-muted)' }}>
                {student.bio}
              </p>
            )}

            {/* Skills */}
            {student.skills ? (
              <div style={{ marginBottom: '0.75rem' }}>
                {student.skills.split(',').slice(0, 6).map((s, i) => (
                  <span key={i} className="badge">{s.trim()}</span>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', margin: '0 0 0.75rem' }}>No skills listed</p>
            )}

            {/* Resume Toggle */}
            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem' }}>
              {student.resume_text ? (
                <>
                  <button
                    onClick={() => toggleResume(student.id)}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '0.78rem', padding: '0.3rem 0.5rem' }}
                  >
                    <FileText size={12} />
                    {expandedResumes[student.id] ? 'Hide' : 'View'} Resume
                    {expandedResumes[student.id] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                  {expandedResumes[student.id] && (
                    <div style={{
                      marginTop: '0.6rem', padding: '0.85rem',
                      background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)',
                      whiteSpace: 'pre-wrap', fontSize: '0.8rem', lineHeight: 1.65,
                      color: 'var(--text-muted)', border: '1px solid var(--border)',
                      maxHeight: '180px', overflowY: 'auto'
                    }}>
                      {student.resume_text}
                    </div>
                  )}
                </>
              ) : (
                <span style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>No resume available</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
