import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

// You need to create/import these if you separated them, 
// but for a single file solution, I will include the sub-components here.
// Ideally, UserManagement should be in its own file, but this works perfectly too.

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [view, setView] = useState('overview'); // 'overview' | 'users' | 'courses'
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [statsRes, usersRes, coursesRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/courses')
      ]);
      
      setStats(statsRes.data);
      setUsers(usersRes.data.users);
      setCourses(coursesRes.data.courses);
      setLoading(false);
    } catch (error) {
      console.error(error);
      alert("Access Denied: Admins only.");
      navigate('/');
    }
  };

  const handleDeleteUser = async (id) => {
    if(!window.confirm("Are you sure you want to permanently delete this user?")) return;
    try {
      await api.delete(`/admin/users/${id}`);
      alert("User deleted");
      fetchAllData(); // Refresh
    } catch (e) { alert("Delete failed"); }
  };

  // --- RENDER HELPERS ---

  const renderOverview = () => (
    <div style={styles.grid}>
      <StatCard 
        title="Total Students" 
        value={stats?.studentCount} 
        icon="🎓" 
        color="#dbeafe" 
        textColor="#1e40af" 
      />
      <StatCard 
        title="Faculty Members" 
        value={stats?.teacherCount} 
        icon="👨‍🏫" 
        color="#f3e8ff" 
        textColor="#6b21a8" 
      />
      <StatCard 
        title="Active Courses" 
        value={stats?.courseCount} 
        icon="📚" 
        color="#dcfce7" 
        textColor="#166534" 
      />
      <StatCard 
        title="Total Sessions" 
        value={stats?.sessionCount} 
        icon="⏱️" 
        color="#ffedd5" 
        textColor="#9a3412" 
      />
    </div>
  );

  const renderUsers = () => (
    <div style={styles.tableCard}>
      <div style={styles.tableHeader}>
        <h3 style={styles.sectionTitle}>User Directory</h3>
        <span style={styles.subtitle}>{users.length} Registered Users</span>
      </div>
      
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>User Profile</th>
              <th style={styles.th}>Role</th>
              <th style={styles.th}>Department</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id} style={styles.tr}>
                <td style={styles.td}>
                  <div style={styles.profileCell}>
                    <div style={{
                        ...styles.avatar, 
                        background: user.role==='student'?'#3b82f6':'#8b5cf6'
                    }}>
                        {user.name.charAt(0)}
                    </div>
                    <div>
                        <div 
                            style={styles.clickableName}
                            onClick={() => navigate('/user-detail', { state: { user } })}
                        >
                            {user.name}
                        </div>
                        <div style={styles.email}>{user.email}</div>
                    </div>
                  </div>
                </td>
                <td style={styles.td}>
                  <span style={user.role==='student' ? styles.studentBadge : styles.teacherBadge}>
                      {user.role.toUpperCase()}
                  </span>
                </td>
                <td style={styles.td}>{user.department || '-'}</td>
                <td style={styles.td}>
                    {user.role === 'student' && (
                        user.deviceId 
                        ? <span style={styles.activeTag}>Device Bound</span> 
                        : <span style={styles.warnTag}>No Device</span>
                    )}
                     {user.role === 'teacher' && <span style={styles.activeTag}>Active</span>}
                </td>
                <td style={styles.td}>
                  <button style={styles.deleteBtn} onClick={() => handleDeleteUser(user._id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCourses = () => (
    <div style={styles.tableCard}>
      <div style={styles.tableHeader}>
        <h3 style={styles.sectionTitle}>Course Management</h3>
        <span style={styles.subtitle}>{courses.length} Active Classes</span>
      </div>
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Code</th>
              <th style={styles.th}>Course Name</th>
              <th style={styles.th}>Instructor</th>
              <th style={styles.th}>Enrollment</th>
              <th style={styles.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {courses.map(c => (
              <tr key={c._id} style={styles.tr}>
                <td style={styles.td}>
                    <span style={styles.codeBadge}>{c.courseCode}</span>
                </td>
                <td style={styles.td}>
                    <strong>{c.courseName}</strong>
                    <div style={styles.email}>{c.department}</div>
                </td>
                <td style={styles.td}>{c.teacherName}</td>
                <td style={styles.td}>
                    <span style={styles.countBadge}>👥 {c.studentCount}</span>
                </td>
                <td style={styles.td}>
                  <button 
                      style={styles.viewBtn}
                      onClick={() => navigate('/report', { state: { courseId: c._id, courseName: c.courseName } })}
                  >
                      View Report
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div style={styles.layout}>
      {/* SIDEBAR */}
      <aside style={styles.sidebar}>
        <div style={styles.brand}>
            <div style={styles.logoIcon}>🛡️</div>
            <div>Admin Panel</div>
        </div>
        
        <nav style={styles.nav}>
          <NavItem 
            label="Dashboard Overview" 
            active={view === 'overview'} 
            onClick={() => setView('overview')} 
            icon="📊"
          />
          <NavItem 
            label="User Management" 
            active={view === 'users'} 
            onClick={() => setView('users')} 
            icon="👥"
          />
          <NavItem 
            label="Course Directory" 
            active={view === 'courses'} 
            onClick={() => setView('courses')} 
            icon="📚"
          />
        </nav>

        <button style={styles.logoutBtn} onClick={() => navigate('/')}>
            Logout
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main style={styles.main}>
        <header style={styles.header}>
          <div>
             <h2 style={styles.pageTitle}>
                {view === 'overview' ? 'System Overview' : view === 'users' ? 'Manage Users' : 'All Courses'}
             </h2>
             <div style={styles.breadcrumb}>Welcome back, Administrator</div>
          </div>
          <div style={styles.adminBadge}>Super Admin</div>
        </header>

        <div style={styles.content}>
            {loading ? (
                <div style={styles.loading}>Loading data...</div>
            ) : (
                <>
                    {view === 'overview' && stats && renderOverview()}
                    {view === 'users' && renderUsers()}
                    {view === 'courses' && renderCourses()}
                </>
            )}
        </div>
      </main>
    </div>
  );
};

// --- SUB COMPONENTS ---

const NavItem = ({ label, active, onClick, icon }) => (
  <button 
    style={active ? styles.activeNavItem : styles.navItem} 
    onClick={onClick}
  >
    <span style={{marginRight:'10px'}}>{icon}</span>
    {label}
  </button>
);

const StatCard = ({ title, value, icon, color, textColor }) => (
    <div style={{...styles.card, borderLeft: `4px solid ${textColor}`}}>
        <div style={{...styles.iconBox, backgroundColor: color}}>{icon}</div>
        <div>
            <div style={{...styles.statValue, color: textColor}}>{value}</div>
            <div style={styles.statLabel}>{title}</div>
        </div>
    </div>
);

// --- STYLES ---
const styles = {
  layout: { display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: "'Inter', sans-serif" },
  
  // Sidebar
  sidebar: { width: '260px', backgroundColor: '#0f172a', color: 'white', padding: '24px', display: 'flex', flexDirection: 'column', flexShrink: 0 },
  brand: { display: 'flex', alignItems: 'center', gap: '12px', fontSize: '18px', fontWeight: 'bold', marginBottom: '40px', paddingLeft: '10px', color:'#f1f5f9' },
  logoIcon: { fontSize: '24px' },
  nav: { display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 },
  navItem: { 
    textAlign: 'left', padding: '12px 16px', background: 'transparent', color: '#94a3b8', border: 'none', 
    borderRadius: '8px', cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s', display:'flex', alignItems:'center'
  },
  activeNavItem: { 
    textAlign: 'left', padding: '12px 16px', background: '#334155', color: 'white', border: 'none', 
    borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', display:'flex', alignItems:'center'
  },
  logoutBtn: { 
    marginTop: 'auto', padding: '12px', background: '#ef4444', color: 'white', border: 'none', 
    borderRadius: '8px', cursor: 'pointer', fontWeight: '600', transition:'background 0.2s'
  },
  
  // Main Area
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' },
  header: { 
    backgroundColor: 'white', padding: '20px 40px', borderBottom: '1px solid #e2e8f0', 
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', position:'sticky', top:0, zIndex:10
  },
  pageTitle: { margin: 0, fontSize: '24px', color: '#1e293b' },
  breadcrumb: { color: '#64748b', fontSize: '14px', marginTop:'4px' },
  adminBadge: { background: '#f1f5f9', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', color: '#475569', border:'1px solid #e2e8f0' },
  
  content: { padding: '40px' },
  loading: { textAlign:'center', color:'#64748b', marginTop:'50px' },

  // Overview Grid
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' },
  card: { 
    backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', 
    display: 'flex', alignItems: 'center', gap: '16px' 
  },
  iconBox: { width: '50px', height: '50px', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px' },
  statValue: { fontSize: '28px', fontWeight: 'bold' },
  statLabel: { color: '#64748b', fontSize: '14px', fontWeight: '500' },

  // Tables
  tableCard: { background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden', border: '1px solid #e2e8f0' },
  tableHeader: { padding: '20px', borderBottom: '1px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'center' },
  sectionTitle: { margin: 0, fontSize: '16px', fontWeight:'600', color:'#1e293b' },
  subtitle: { fontSize: '13px', color: '#64748b' },
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  th: { padding: '16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '12px', textTransform: 'uppercase', color: '#64748b', fontWeight: '600' },
  tr: { borderBottom: '1px solid #f1f5f9', transition: 'background 0.1s', ':hover': { background: '#f8fafc' } },
  td: { padding: '16px', verticalAlign: 'middle', fontSize: '14px', color: '#334155' },

  // User Cells
  profileCell: { display: 'flex', alignItems: 'center', gap: '12px' },
  avatar: { width: '36px', height: '36px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: 'bold', fontSize:'14px' },
  clickableName: { fontWeight: '600', color: '#0f172a', cursor: 'pointer', marginBottom: '2px', ':hover': { textDecoration: 'underline' } },
  email: { fontSize: '12px', color: '#64748b' },

  // Badges
  studentBadge: { background: '#eff6ff', color: '#2563eb', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' },
  teacherBadge: { background: '#f5f3ff', color: '#7c3aed', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' },
  activeTag: { color: '#166534', background: '#dcfce7', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' },
  warnTag: { color: '#b45309', background: '#fef3c7', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' },
  codeBadge: { fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontWeight:'600' },
  countBadge: { background: '#f3f4f6', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight:'500' },

  // Actions
  deleteBtn: { background: '#fee2e2', color: '#ef4444', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', transition:'background 0.2s' },
  viewBtn: { background: 'white', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '500', color:'#334155' }
};

export default AdminDashboard;