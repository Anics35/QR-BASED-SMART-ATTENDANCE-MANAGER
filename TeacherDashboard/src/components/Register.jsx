import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminSecret, setAdminSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Validation
      if (!formData.email.endsWith('@tezu.ac.in')) {
        throw new Error("Please use your official @tezu.ac.in email");
      }

      const payload = {
        ...formData,
        role: isAdmin ? 'admin' : 'teacher',
        adminSecret: isAdmin ? adminSecret : undefined
      };

      // 2. Register API
      const { data } = await api.post('/auth/register', payload);

      // 3. Auto Login
      localStorage.setItem('teacherToken', data.token);
      localStorage.setItem('teacherName', data.user.name);
      localStorage.setItem('userRole', data.user.role);

      // 4. Redirect
      if (data.user.role === 'admin') {
        navigate('/admin-dashboard');
      } else {
        navigate('/courses');
      }

    } catch (err) {
      setError(err.response?.data?.message || err.message || "Registration Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>{isAdmin ? 'Admin Registration' : 'Faculty Registration'}</h2>
        <p style={styles.subtitle}>Create your account to get started</p>
        
        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.row}>
            <input 
                placeholder="Full Name" 
                required style={styles.input}
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
          
          <div style={styles.row}>
            <input 
                type="email" 
                placeholder="Email (@tezu.ac.in)" 
                required style={styles.input}
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div style={styles.row}>
            <input 
                placeholder="Department (e.g. CSE)" 
                required style={styles.input}
                value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
            />
          </div>

          {/* ADMIN TOGGLE */}
          <div style={styles.checkboxContainer}>
            <label style={styles.checkboxLabel}>
                <input 
                    type="checkbox" 
                    checked={isAdmin} 
                    onChange={(e) => setIsAdmin(e.target.checked)}
                    style={{marginRight: '8px'}}
                />
                Register as Administrator
            </label>
          </div>

          {/* SECRET KEY (Only if Admin) */}
          {isAdmin && (
            <div style={styles.row}>
                <input 
                    type="password" 
                    placeholder="Enter Admin Secret Key" 
                    required style={{...styles.input, borderColor: '#ef4444'}}
                    value={adminSecret}
                    onChange={(e) => setAdminSecret(e.target.value)}
                />
            </div>
          )}
          
          <button type="submit" style={isAdmin ? styles.adminBtn : styles.btn} disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div style={styles.footer}>
          Already have an account? <Link to="/" style={styles.link}>Login</Link>
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
    maxWidth: '400px' 
  },
  title: { margin: '0 0 5px 0', color: '#1f2937', fontSize: '22px', fontWeight: '700', textAlign: 'center' },
  subtitle: { margin: '0 0 30px 0', color: '#6b7280', fontSize: '14px', textAlign: 'center' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  row: { display: 'flex', flexDirection: 'column' },
  input: { 
    padding: '12px', 
    borderRadius: '8px', 
    border: '1px solid #d1d5db', 
    fontSize: '14px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box'
  },
  btn: { 
    padding: '12px', 
    background: '#1a73e8', 
    color: 'white', 
    border: 'none', 
    borderRadius: '8px', 
    cursor: 'pointer', 
    fontWeight: '600',
    marginTop: '10px'
  },
  adminBtn: {
    padding: '12px', 
    background: '#dc2626', 
    color: 'white', 
    border: 'none', 
    borderRadius: '8px', 
    cursor: 'pointer', 
    fontWeight: '600',
    marginTop: '10px'
  },
  checkboxContainer: { margin: '5px 0' },
  checkboxLabel: { fontSize: '14px', color: '#374151', display: 'flex', alignItems: 'center', cursor: 'pointer' },
  error: { 
    backgroundColor: '#fef2f2', 
    color: '#dc2626', 
    padding: '10px', 
    borderRadius: '6px', 
    marginBottom: '20px', 
    fontSize: '13px',
    textAlign: 'center',
    border: '1px solid #fecaca'
  },
  footer: { marginTop: '20px', fontSize: '14px', textAlign: 'center', color: '#6b7280' },
  link: { color: '#1a73e8', fontWeight: '600', textDecoration: 'none', marginLeft: '5px' }
};

export default Register;