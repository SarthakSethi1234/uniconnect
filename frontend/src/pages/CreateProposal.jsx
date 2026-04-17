import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Send, Lightbulb, Users, Calendar, Wrench } from 'lucide-react';

export default function CreateProposal() {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '', description: '', requiredSkills: '', maxMembers: 2, deadline: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (field) => (e) => setFormData({ ...formData, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/proposals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (data.success) {
        navigate('/');
      } else {
        setError(data.error || 'Could not create proposal. Please try again.');
      }
    } catch (err) {
      setError('Network error. Is the backend running?');
    }
    setIsSubmitting(false);
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div className="page-title">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Lightbulb size={22} style={{ color: 'var(--primary)' }} /> New Team Proposal
          </h1>
          <p>Describe your project and find the right collaborators</p>
        </div>
      </div>

      <div className="card animate-in">
        {error && <div className="alert alert-error mb-2">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="cp-title">Proposal Title</label>
            <input
              id="cp-title"
              type="text"
              className="form-control"
              placeholder="e.g. ML Model for Student Engagement Prediction"
              required
              value={formData.title}
              onChange={set('title')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="cp-desc">Description</label>
            <textarea
              id="cp-desc"
              className="form-control"
              rows="5"
              placeholder="What is this project about? What will the team build? What's the goal?…"
              required
              value={formData.description}
              onChange={set('description')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="cp-skills">
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Wrench size={13} /> Required Skills
                <span className="text-xs text-muted">(comma-separated)</span>
              </span>
            </label>
            <input
              id="cp-skills"
              type="text"
              className="form-control"
              placeholder="e.g. Python, React, Machine Learning, SQL"
              value={formData.requiredSkills}
              onChange={set('requiredSkills')}
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label htmlFor="cp-members">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Users size={13} /> Max Team Size
                </span>
              </label>
              <input
                id="cp-members"
                type="number"
                className="form-control"
                min="1"
                max="10"
                required
                value={formData.maxMembers}
                onChange={e => setFormData({ ...formData, maxMembers: parseInt(e.target.value) })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="cp-deadline">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Calendar size={13} /> Application Deadline
                </span>
              </label>
              <input
                id="cp-deadline"
                type="date"
                className="form-control"
                required
                value={formData.deadline}
                onChange={set('deadline')}
              />
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
            <button type="submit" className="btn btn-primary btn-full" disabled={isSubmitting}>
              {isSubmitting ? 'Publishing…' : <><Send size={16} /> Publish Proposal</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
