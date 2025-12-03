import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Call Backend
      const { data } = await api.post('/auth/dev-login', { email });
      
      // 2. Save Credentials
      localStorage.setItem('teacherToken', data.token);
      localStorage.setItem('teacherName', data.user.name);
      localStorage.setItem('userRole', data.user.role);

      // 3. Intelligent Redirect based on Role
      if (data.user.role === 'admin') {
        navigate('/admin-dashboard');
      } else if (data.user.role === 'teacher') {
        navigate('/courses');
      } else {
        setError("Access Denied: This portal is for Faculty only.");
        localStorage.clear();
      }
      
    } catch (err) {
      console.error("Login failed:", err);
      setError(err.response?.data?.message || "Login failed. Please check your email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logoIcon}>🎓</div>
        <h2 style={styles.title}>Faculty Portal</h2>
        <p style={styles.subtitle}>Smart Attendance Manager</p>
        
        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              placeholder="e.g. teacher@tezu.ac.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              required
            />
          </div>
          
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Verifying...' : 'Sign In'}
          </button>
        </form>
        
        <div style={styles.footer}>
          <p>New Faculty Member?</p>
          <Link to="/register" style={styles.link}>Create Account</Link>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: '100vh', 
    backgroundColor: '#f0f4f8',
    fontFamily: "'Inter', sans-serif"
  },
  card: { 
    padding: '40px', 
    backgroundColor: 'white', 
    borderRadius: '16px', 
    boxShadow: '0 10px 25px rgba(0,0,0,0.05)', 
    width: '100%', 
    maxWidth: '400px',
    textAlign: 'center'
  },
  logoIcon: {
    fontSize: '40px',
    marginBottom: '10px',
    display: 'block'
  },
  title: {
    margin: '0 0 5px 0',
    color: '#1a73e8',
    fontSize: '24px',
    fontWeight: '700'
  },
  subtitle: {
    margin: '0 0 30px 0',
    color: '#5f6368',
    fontSize: '14px'
  },
  form: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '20px',
    textAlign: 'left'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#374151',
    textTransform: 'uppercase'
  },
  input: { 
    padding: '12px', 
    fontSize: '15px', 
    borderRadius: '8px', 
    border: '1px solid #d1d5db',
    outline: 'none',
    transition: 'border 0.2s',
    width: '100%',
    boxSizing: 'border-box'
  },
  button: { 
    padding: '12px', 
    backgroundColor: '#1a73e8', 
    color: 'white', 
    border: 'none', 
    borderRadius: '8px', 
    cursor: 'pointer', 
    fontSize: '16px', 
    fontWeight: '600',
    marginTop: '10px',
    transition: 'background 0.2s'
  },
  error: { 
    backgroundColor: '#fef2f2', 
    color: '#dc2626', 
    padding: '12px', 
    borderRadius: '8px', 
    marginBottom: '20px', 
    fontSize: '14px',
    border: '1px solid #fecaca'
  },
  footer: {
    marginTop: '30px',
    paddingTop: '20px',
    borderTop: '1px solid #f3f4f6',
    fontSize: '14px',
    color: '#6b7280'
  },
  link: {
    color: '#1a73e8',
    fontWeight: '600',
    textDecoration: 'none',
    marginLeft: '5px'
  }
};

export default Login;