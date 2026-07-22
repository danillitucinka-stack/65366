import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import useStore from '../store';
import { connectSocket } from '../socket';
import { apiPost, apiGet } from '../api';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setUser = useStore((s) => s.setUser);
  const setToken = useStore((s) => s.setToken);
  const setServers = useStore((s) => s.setServers);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await apiPost('/api/login', { email, password });
      if (data.token) {
        setToken(data.token);
        setUser(data.user);
        connectSocket();
        // Load servers
        const servers = await apiGet('/api/servers');
        if (Array.isArray(servers)) setServers(servers);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch {
      setError('Connection error');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1>Welcome back!</h1>
        <p className="subtitle">We're so excited to see you again!</p>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
        <p className="auth-link">
          Need an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
