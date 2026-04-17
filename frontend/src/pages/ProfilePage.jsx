import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Star, Users, Edit3, Save, X, BookOpen, Phone, Mail } from 'lucide-react';

export default function ProfilePage() {
  const { token } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [courses, setCourses] = useState([]);
  const [resumeText, setResumeText] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchCourses = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/courses`);
      setCourses(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setProfile(data);
      setResumeText(data.resume_text || '');
      setForm({
        name: data.name || '',
        bio: data.bio || '',
        major: data.major || '',
        grad_year: data.grad_year || '',
        phone: data.phone || '',
        profile_photo_url: data.profile_photo_url || '',
        skills: data.skills || ''
      });
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchProfile(); fetchCourses(); }, []); // eslint-disable-line

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/profile`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) { await fetchProfile(); setEditMode(false); }
      else alert('Error: ' + (data.error || 'Unknown'));
    } catch { alert('Failed to save profile.'); }
    setSaving(false);
  };

  const handleSaveResume = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/resume`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume_text: resumeText })
      });
      const data = await res.json();
      if (data.success) alert('Resume saved!');
    } catch { alert('Error saving resume.'); }
  };

  if (!profile) return (
    <div className="loading-state"><div className="spinner" /><span>Loading profile…</span></div>
  );

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto' }}>
      {/* ── Profile Hero Card ── */}
      <div className="card animate-in" style={{ padding: '0', overflow: 'hidden', marginBottom: '1.25rem', border: '1px solid var(--border)' }}>
        
        <div style={{ padding: '2.5rem 2rem 2rem', position: 'relative' }}>
          {/* Avatar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div className="avatar avatar-xl" style={{ border: '1px solid var(--border-light)' }}>
              {profile.name?.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={() => setEditMode(!editMode)}
              className={`btn ${editMode ? 'btn-outline' : 'btn-primary'} btn-sm`}
              style={{ marginBottom: '4px' }}
            >
              {editMode ? <><X size={14} /> Cancel</> : <><Edit3 size={14} /> Edit Profile</>}
            </button>
          </div>

          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.2rem' }}>{profile.name}</h1>
          <p style={{ margin: '0 0 0.75rem', fontWeight: 500, color: 'var(--primary)', fontSize: '0.9rem' }}>
            {profile.major || 'Undeclared'}{profile.grad_year ? ` · Class of ${profile.grad_year}` : ''}
          </p>

          {profile.bio && (
            <p style={{ margin: '0 0 1rem', fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.65 }}>{profile.bio}</p>
          )}

          {/* Contact Row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Mail size={13} /> {profile.email}
            </span>
            {profile.phone && (
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Phone size={13} /> {profile.phone}
              </span>
            )}
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
            <div style={{
              flex: 1, minWidth: '140px', background: 'var(--bg-main)',
              borderRadius: 'var(--radius-md)', padding: '1.25rem',
              display: 'flex', flexDirection: 'column', gap: '0.5rem',
              border: '1px solid var(--border-light)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
                <Star size={16} />
                <span style={{ fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Influence</span>
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1 }}>
                {profile.influence_score || 0}
              </div>
            </div>

            <div style={{
              flex: 1, minWidth: '140px', background: 'var(--bg-main)',
              borderRadius: 'var(--radius-md)', padding: '1.25rem',
              display: 'flex', flexDirection: 'column', gap: '0.5rem',
              border: '1px solid var(--border-light)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
                <Users size={16} />
                <span style={{ fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Collaborations</span>
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1 }}>
                {profile.collaborations_count || 0}
              </div>
            </div>
          </div>

          {/* Skills */}
          {profile.skills && !editMode && (
            <div style={{ marginTop: '1.25rem' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Skills</p>
              {profile.skills.split(',').map((s, i) => (
                <span key={i} className="badge">{s.trim()}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Edit Form ── */}
      {editMode && (
        <div className="card animate-in">
          <h2 style={{ marginBottom: '1.25rem', fontSize: '1rem' }}>Edit Profile</h2>
          <form onSubmit={handleSaveProfile}>
            <div className="grid-2">
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input type="tel" className="form-control" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="10-digit mobile" />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label>Major / Programme</label>
                <select className="form-control" value={form.major} onChange={e => setForm({ ...form, major: e.target.value })} required>
                  <option value="" disabled>Select Course</option>
                  {courses.map(c => <option key={c.id} value={c.course_name}>{c.course_name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Graduation Year</label>
                <input type="number" className="form-control" value={form.grad_year} onChange={e => setForm({ ...form, grad_year: e.target.value })} min="2000" max="2050" />
              </div>
            </div>
            <div className="form-group">
              <label>Bio</label>
              <textarea rows="3" className="form-control" value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Tell your peers about yourself…" />
            </div>
            <div className="form-group">
              <label>Skills <span className="text-muted text-xs">(comma-separated)</span></label>
              <input type="text" className="form-control" value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} placeholder="e.g. Python, React, SQL" />
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : <><Save size={15} /> Save Profile</>}
            </button>
          </form>
        </div>
      )}

      {/* ── Resume Section ── */}
      <div className="card">
        <div className="flex-between mb-2">
          <h2 style={{ fontSize: '1rem' }}>
            <BookOpen size={16} style={{ color: 'var(--primary)', marginRight: '0.4rem' }} />
            Resume
          </h2>
        </div>
        <form onSubmit={handleSaveResume}>
          <textarea
            rows="9"
            className="form-control"
            placeholder="Paste your resume here — education, experience, projects, achievements…"
            value={resumeText}
            onChange={e => setResumeText(e.target.value)}
          />
          <button type="submit" className="btn btn-secondary btn-sm mt-2">
            <Save size={14} /> Save Resume
          </button>
        </form>
      </div>
    </div>
  );
}
