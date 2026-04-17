import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { Home, Users, Search, PlusCircle, LayoutDashboard, ShieldAlert, LogOut, Archive } from 'lucide-react';

// Pages
import LandingPage from './pages/LandingPage';
import ProfilePage from './pages/ProfilePage';
import SearchPage from './pages/SearchPage';
import ProposalFeed from './pages/ProposalFeed';
import CreateProposal from './pages/CreateProposal';
import ApplicationDashboard from './pages/ApplicationDashboard';
import AdminPanel from './pages/AdminPanel';
import Login from './pages/Login';
import Register from './pages/Register';
import MyProposals from './pages/MyProposals';

// Context
import { AuthProvider, AuthContext } from './context/AuthContext';

function PrivateRoute({ children, adminOnly = false }) {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/" />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/feed" />;
  return children;
}

function NavLink({ to, title, children }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      title={title}
      style={isActive ? {
        background: 'var(--primary-light)',
        color: 'var(--primary)',
        borderRadius: 'var(--radius-sm)',
      } : {}}
    >
      {children}
    </Link>
  );
}

function AppNavigation() {
  const { user, logout } = useContext(AuthContext);
  if (!user) return null;

  return (
    <nav className="navbar">
      <Link to={user.role === 'admin' ? '/admin' : '/feed'} className="nav-brand">UniConnect</Link>
      <div className="nav-links">
        {user.role === 'student' && (
          <>
            <NavLink to="/feed" title="Proposal Feed"><Home size={19} /></NavLink>
            <NavLink to="/search" title="Search Students"><Search size={19} /></NavLink>
            <NavLink to="/proposals/new" title="Create Proposal"><PlusCircle size={19} /></NavLink>
            <NavLink to="/dashboard" title="Dashboard"><LayoutDashboard size={19} /></NavLink>
            <NavLink to="/my-proposals" title="My Proposals"><Archive size={19} /></NavLink>
            <NavLink to="/profile" title="My Profile"><Users size={19} /></NavLink>
          </>
        )}
        {user.role === 'admin' && (
          <NavLink to="/admin" title="Admin Panel"><ShieldAlert size={19} /></NavLink>
        )}
        <button onClick={logout} title="Logout" className="nav-logout-btn">
          <LogOut size={19} />
        </button>
      </div>
    </nav>
  );
}

function RootRoute() {
  const { user } = useContext(AuthContext);
  if (!user) return <LandingPage />;
  if (user.role === 'admin') return <Navigate to="/admin" />;
  return <Navigate to="/feed" />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppNavigation />
        <Routes>
          {/* Public landing (no container wrapper — full-width) */}
          <Route path="/" element={<RootRoute />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Authenticated app routes */}
          <Route path="/feed" element={<PrivateRoute><main className="app-container"><ProposalFeed /></main></PrivateRoute>} />
          <Route path="/search" element={<PrivateRoute><main className="app-container"><SearchPage /></main></PrivateRoute>} />
          <Route path="/proposals/new" element={<PrivateRoute><main className="app-container"><CreateProposal /></main></PrivateRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><main className="app-container"><ApplicationDashboard /></main></PrivateRoute>} />
          <Route path="/my-proposals" element={<PrivateRoute><main className="app-container"><MyProposals /></main></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><main className="app-container"><ProfilePage /></main></PrivateRoute>} />
          <Route path="/admin" element={<PrivateRoute adminOnly={true}><main className="app-container"><AdminPanel /></main></PrivateRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
