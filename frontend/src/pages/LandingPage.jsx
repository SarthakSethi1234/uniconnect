import React from 'react';
import { Link } from 'react-router-dom';

const features = [
  {
    icon: '',
    title: 'Smart Proposal Feed',
    desc: 'Browse live team proposals from peers. Filter by skills, deadline, or team size — find exactly the project that fits you.',
  },
  {
    icon: '',
    title: 'Team Formation Engine',
    desc: "Creators accept or reject applicants, managing team capacity dynamically. Accept someone and they're instantly added to your team roster.",
  },
  {
    icon: '',
    title: 'Influence & Reputation',
    desc: 'Every successful collaboration earns you Influence Points. Your reputation grows with every project you complete.',
  },
  {
    icon: '',
    title: 'Peer Discovery',
    desc: 'Search the full student directory by major, skill, or graduation year. View resumes, bios, and collaboration histories.',
  },
  {
    icon: '',
    title: 'Application Dashboard',
    desc: 'Track every application you send and receive in one place. See statuses in real time, withdraw, or manage your team.',
  },
  {
    icon: '',
    title: 'Admin Moderation',
    desc: 'Dedicated admin panel for reviewing flagged proposals, managing users, and keeping the community trustworthy.',
  },
];

const steps = [
  { num: '01', title: 'Create your profile', desc: 'Sign up with your university email. Add your skills, bio, and upload your resume to stand out.' },
  { num: '02', title: 'Post or browse proposals', desc: 'Have an idea? Post a team proposal. Looking to join? Browse open projects and apply in one click.' },
  { num: '03', title: 'Build your team', desc: 'Review applicants, check their resumes, and accept the best fits. Your team is formed instantly.' },
  { num: '04', title: 'Collaborate & grow', desc: 'Work together, complete projects, and earn reputation points that follow you across campus.' },
];

export default function LandingPage() {
  return (
    <div className="landing">

      {/* ── Public Navbar ── */}
      <header className="landing-nav">
        <nav className="landing-nav-inner">
          <a href="/" className="landing-brand">UniConnect</a>
          <div className="landing-nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#about">About</a>
          </div>
          <div className="landing-nav-actions">
            <Link to="/login" className="landing-nav-login">Sign In</Link>
            <Link to="/register" className="landing-nav-signup">Get Started</Link>
          </div>
        </nav>
      </header>

      {/* ── Hero ── */}
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div className="landing-eyebrow">Exclusively for SNU Students</div>
          <h1 className="landing-hero-title">
            Your campus.<br />
            Your collaborators.<br />
            <span className="landing-gradient-text">Your next big project.</span>
          </h1>
          <p className="landing-hero-sub">
            UniConnect is the academic collaboration network built for students at Shiv Nadar University. Post project ideas, form smart teams, and build your reputation — all in one place.
          </p>
          <div className="landing-hero-cta">
            <Link to="/register" className="landing-btn-primary">Create Free Account</Link>
            <Link to="/login" className="landing-btn-ghost">Sign in →</Link>
          </div>
          <p className="landing-hero-note"></p>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="landing-section" id="features">
        <div className="landing-section-inner">
          <p className="landing-overline">Platform Features</p>
          <h2 className="landing-section-title">Everything you need to<br />collaborate at university</h2>
          <p className="landing-section-sub">Designed from the ground up for students — not generic project tools, but a purpose-built system for academic teamwork.</p>
          <div className="features-grid">
            {features.map((f, i) => (
              <div className="feature-card" key={i}>
                <div className="feature-icon">{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="landing-section landing-section-alt" id="how-it-works">
        <div className="landing-section-inner">
          <p className="landing-overline">How It Works</p>
          <h2 className="landing-section-title">From idea to team<br />in four steps</h2>
          <div className="steps-grid">
            {steps.map((s, i) => (
              <div className="step-card" key={i}>
                <div className="step-num">{s.num}</div>
                <h3 className="step-title">{s.title}</h3>
                <p className="step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── About ── */}
      <section className="landing-section" id="about">
        <div className="landing-section-inner landing-about">
          <div className="about-text">
            <p className="landing-overline">About UniConnect</p>
            <h2 className="landing-section-title">Built by students,<br />for students.</h2>
            <p className="about-body">
              UniConnect was built as a dedicated academic collaboration platform for the Shiv Nadar University community. Rather than using generic tools like LinkedIn or WhatsApp groups, UniConnect provides a structured, transparent, and reputation-driven environment specifically tailored for university-level teamwork.
            </p>
            <p className="about-body">
            </p>
          </div>
          <div className="about-card">
            <div className="about-card-inner">
              <div className="about-badge">Academic Social Network</div>
              <h3>A better way to form teams</h3>
              <ul className="about-list">
                <li>✓ SNU email verification</li>
                <li>✓ Transparent application process</li>
                <li>✓ Reputation system that rewards collaboration</li>
                <li>✓ Admin moderation for a safe environment</li>
                <li>✓ Resume sharing within teams</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="landing-cta-section">
        <div className="landing-cta-inner">
          <h2 className="landing-cta-title">Ready to find your team?</h2>
          <p className="landing-cta-sub">Join hundreds of SNU students already collaborating on projects, hackathons, and research.</p>
          <Link to="/register" className="landing-btn-primary landing-btn-large">Create Your Account — It's Free</Link>
          <p className="landing-hero-note" style={{ marginTop: '1rem' }}>Requires @snu.edu.in email</p>
        </div>
      </section>

    </div>
  );
}
