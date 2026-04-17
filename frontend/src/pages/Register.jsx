import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', bio: '', major: '', grad_year: '', role: 'student'
  });
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/courses`)
      .then(res => res.json())
      .then(data => setCourses(data))
      .catch(e => console.error('Failed to load courses:', e));
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (data.success) {
        navigate('/login');
      } else {
        setError(data.error || 'Registration failed. Please check your details.');
      }
    } catch (err) {
      setError('Could not reach the server. Please try again.');
    }
    setLoading(false);
  };

  const set = (field) => (e) => setFormData({ ...formData, [field]: e.target.value });

  return (
    <div className="auth-wrapper">
      <div className="auth-card animate-in" style={{ maxWidth: '500px' }}>
        <div className="auth-logo">
          <h1>UniConnect</h1>
          <p>Join your campus collaboration network</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label htmlFor="reg-name">Full Name</label>
            <input id="reg-name" type="text" className="form-control" placeholder="e.g. Priya Sharma" onChange={set('name')} required />
          </div>
          <div className="form-group">
            <label htmlFor="reg-email">University Email</label>
            <input id="reg-email" type="email" className="form-control" placeholder="you@snu.edu.in" onChange={set('email')} required />
          </div>
          <div className="form-group">
            <label htmlFor="reg-password">Password</label>
            <input id="reg-password" type="password" className="form-control" placeholder="At least 8 characters" onChange={set('password')} required />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label htmlFor="reg-major">Major / Programme</label>
              <select id="reg-major" className="form-control" onChange={set('major')} required value={formData.major}>
                <option value="" disabled>Select Course</option>
                {courses.map(c => <option key={c.id} value={c.course_name}>{c.course_name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="reg-year">Graduation Year</label>
              <input id="reg-year" type="number" className="form-control" placeholder="2027" onChange={e => setFormData({...formData, grad_year: parseInt(e.target.value)})} required min="2000" max="2050" />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="reg-bio">Short Bio <span className="text-muted text-xs">(optional)</span></label>
            <textarea id="reg-bio" className="form-control" placeholder="Tell your peers a little about yourself…" onChange={set('bio')} style={{ minHeight: '80px' }} />
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Creating account…' : <><UserPlus size={16} /> Create Account</>}
          </button>
        </form>

        <div style={{ borderTop: '1px solid var(--border)', marginTop: '1.5rem', paddingTop: '1.25rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.875rem' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ fontWeight: 600, color: 'var(--primary)' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
