import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api';

const UserDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Initialize with passed state, but we will fetch fresh data + stats
  const [user, setUser] = useState(location.state?.user || null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch Stats on Mount
  useEffect(() => {
    if (!user?._id) return;
    
    const fetchStats = async () => {
      try {
        const { data } = await api.get(`/admin/users/${user._id}/stats`);
        setUser(data.user); // Update user info with freshest data
        setStats(data.stats);
      } catch (error) {
        console.error("Failed to load stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user?._id]);

  if (!user) return null;

  const isStudent = user.role === 'student';

  // Handle Unbind Logic
  const handleResetDevice = async () => {
    if(!window.confirm("Are you sure you want to unbind this device?")) return;
    try {
      await api.post('/auth/reset-device', { studentId: user._id });
      setUser({ ...user, deviceId: null }); // Optimistic update
      alert("✅ Device ID cleared successfully.");
    } catch (e) { 
      alert("Failed to unbind device."); 
    }
  };

  // NEW: Handle Navigation to Report
  const handleCourseClick = (courseId, courseName) => {
    navigate('/report', { state: { courseId, courseName } });
  };

  return (
    <div style={styles.page}>
        <div style={styles.card}>
            {/* Header / Nav */}
            <div style={styles.navRow}>
                <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back to Admin</button>
                <div style={styles.idBadge}>ID: {user._id.slice(-6)}</div>
            </div>
            
            {/* Profile Header */}
            <div style={styles.header}>
                <div style={{...styles.avatar, background: isStudent ? '#dbeafe' : '#f3e8ff', color: isStudent ? '#1d4ed8' : '#7e22ce', borderRadius: isStudent ? '50%' : '12px'}}>
                    {user.name.charAt(0)}
                </div>
                <div>
                    <h2 style={{margin:0}}>{user.name}</h2>
                    <div style={styles.meta}>{user.email}</div>
                    <span style={isStudent ? styles.roleBadgeStudent : styles.roleBadgeTeacher}>
                        {user.role.toUpperCase()}
                    </span>
                </div>
            </div>

            <div style={styles.scrollContent}>
                {/* 1. Basic Profile Info */}
                <div style={styles.section}>
                    <h3 style={styles.subHeader}>Profile Information</h3>
                    <div style={styles.grid}>
                        <DetailItem label="Department" value={user.department || "N/A"} />
                        <DetailItem label="Joined Date" value={new Date(user.createdAt).toLocaleDateString()} />
                        {isStudent && (
                            <>
                                <DetailItem label="Roll Number" value={user.rollNumber} />
                                <DetailItem label="Semester" value={user.semester} />
                            </>
                        )}
                    </div>
                </div>

                {/* 2. STATS SECTION (Dynamic based on Role) */}
                {loading ? (
                    <div style={styles.loading}>Loading statistics...</div>
                ) : stats && (
                    <div style={styles.section}>
                        <h3 style={styles.subHeader}>
                            {isStudent ? 'Academic Performance' : 'Teaching Record'}
                        </h3>
                        
                        {/* STUDENT STATS VIEW */}
                        {isStudent && (
                            <>
                                <div style={styles.statSummary}>
                                    <div style={styles.statBox}>
                                        <div style={styles.statNum}>{stats.overallPercentage}%</div>
                                        <div style={styles.statLabel}>Overall Attendance</div>
                                    </div>
                                    <div style={styles.statBox}>
                                        <div style={styles.statNum}>{stats.attendedClasses} / {stats.totalClasses}</div>
                                        <div style={styles.statLabel}>Classes Attended</div>
                                    </div>
                                </div>

                                <table style={styles.table}>
                                    <thead>
                                        <tr>
                                            <th style={styles.th}>Subject</th>
                                            <th style={styles.th}>Attended</th>
                                            <th style={styles.th}>Total</th>
                                            <th style={styles.th}>%</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.subjectWise.length === 0 ? (
                                            <tr><td colSpan="4" style={styles.tdCenter}>No courses enrolled</td></tr>
                                        ) : (
                                            stats.subjectWise.map((sub) => (
                                                <tr key={sub.courseId} style={styles.tr}>
                                                    <td style={styles.td}>
                                                        {/* CLICKABLE COURSE NAME */}
                                                        <div 
                                                            onClick={() => handleCourseClick(sub.courseId, sub.courseName)}
                                                            style={styles.clickableCourse}
                                                            title="View Course Report"
                                                        >
                                                            <div style={{fontWeight:'600'}}>{sub.courseCode}</div>
                                                            <div style={{fontSize:'11px'}}>{sub.courseName}</div>
                                                        </div>
                                                    </td>
                                                    <td style={styles.td}>{sub.attendedClasses}</td>
                                                    <td style={styles.td}>{sub.totalClasses}</td>
                                                    <td style={styles.td}>
                                                        <span style={{
                                                            ...styles.percBadge, 
                                                            background: parseFloat(sub.percentage) < 75 ? '#fee2e2' : '#dcfce7',
                                                            color: parseFloat(sub.percentage) < 75 ? '#991b1b' : '#166534'
                                                        }}>
                                                            {sub.percentage}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </>
                        )}

                        {/* TEACHER STATS VIEW */}
                        {!isStudent && (
                            <>
                                <div style={styles.statSummary}>
                                    <div style={styles.statBox}>
                                        <div style={styles.statNum}>{stats.totalSessionsHosted}</div>
                                        <div style={styles.statLabel}>Total Sessions Held</div>
                                    </div>
                                    <div style={styles.statBox}>
                                        <div style={styles.statNum}>{stats.courseCount}</div>
                                        <div style={styles.statLabel}>Active Courses</div>
                                    </div>
                                </div>

                                <table style={styles.table}>
                                    <thead>
                                        <tr>
                                            <th style={styles.th}>Course Name</th>
                                            <th style={styles.th}>Code</th>
                                            <th style={styles.th}>Students</th>
                                            <th style={styles.th}>Sessions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.subjectWise.length === 0 ? (
                                            <tr><td colSpan="4" style={styles.tdCenter}>No courses assigned</td></tr>
                                        ) : (
                                            stats.subjectWise.map((sub) => (
                                                <tr key={sub.courseId} style={styles.tr}>
                                                    <td style={styles.td}>
                                                        {/* CLICKABLE COURSE NAME */}
                                                        <div 
                                                            onClick={() => handleCourseClick(sub.courseId, sub.courseName)}
                                                            style={styles.clickableCourseText}
                                                            title="View Course Report"
                                                        >
                                                            {sub.courseName}
                                                        </div>
                                                    </td>
                                                    <td style={styles.td}>
                                                        <span style={styles.codeBadge}>{sub.courseCode}</span>
                                                    </td>
                                                    <td style={styles.td}>{sub.studentCount}</td>
                                                    <td style={styles.td}>
                                                        <span style={styles.sessionBadge}>{sub.totalSessions}</span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </>
                        )}
                    </div>
                )}

                {/* 3. SECURITY ACTIONS */}
                {isStudent && (
                    <div style={styles.actions}>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px'}}>
                            <h3 style={{...styles.subHeader, margin:0, color:'#9a3412'}}>Device Security</h3>
                            <span style={{fontSize:'12px', fontWeight:'600', color: user.deviceId ? '#dc2626' : '#16a34a'}}>
                                {user.deviceId ? 'Bound 🔒' : 'Unbound 🔓'}
                            </span>
                        </div>
                        
                        {user.deviceId ? (
                            <>
                                <button style={styles.resetBtn} onClick={handleResetDevice}>
                                    🔓 Unbind Device ID
                                </button>
                                <p style={styles.hint}>Allows student to log in on a new phone.</p>
                            </>
                        ) : (
                            <div style={styles.successMessage}>
                                ✅ Device is Unbound. Student can register a new device.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

const DetailItem = ({ label, value }) => (
    <div style={styles.item}>
        <div style={styles.label}>{label}</div>
        <div style={styles.value}>{value}</div>
    </div>
);

// --- STYLES ---
const styles = {
    page: { minHeight: '100vh', background: '#f8fafc', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '40px 20px', fontFamily: "'Inter', sans-serif" },
    card: { width: '100%', maxWidth: '650px', background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
    
    navRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '24px' },
    backBtn: { background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight:'600', padding: 0, fontSize:'14px' },
    idBadge: { fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace' },
    
    header: { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px', borderBottom: '1px solid #e2e8f0', paddingBottom: '24px' },
    avatar: { width: '64px', height: '64px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px', fontWeight: 'bold' },
    meta: { color: '#64748b', fontSize: '14px', margin: '2px 0 8px 0' },
    
    roleBadgeStudent: { background: '#eff6ff', color: '#2563eb', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' },
    roleBadgeTeacher: { background: '#f5f3ff', color: '#7c3aed', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' },

    section: { marginBottom: '32px' },
    subHeader: { margin: '0 0 16px 0', fontSize: '13px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 24px' },
    item: { display: 'flex', flexDirection: 'column', gap: '4px' },
    label: { fontSize: '12px', color: '#64748b', fontWeight: '500' },
    value: { fontSize: '15px', fontWeight: '600', color: '#1e293b' },

    // Stats Styles
    statSummary: { display: 'flex', gap: '16px', marginBottom: '20px' },
    statBox: { flex: 1, background: '#f8fafc', padding: '16px', borderRadius: '12px', textAlign: 'center', border: '1px solid #e2e8f0' },
    statNum: { fontSize: '20px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' },
    statLabel: { fontSize: '12px', color: '#64748b', fontWeight: '500' },

    // Table Styles
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
    th: { textAlign: 'left', padding: '12px 8px', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '12px', fontWeight: '600' },
    tr: { borderBottom: '1px solid #f1f5f9' },
    td: { padding: '12px 8px', color: '#334155' },
    tdCenter: { padding: '20px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' },
    
    // NEW CLICKABLE STYLES
    clickableCourse: { cursor: 'pointer', color: '#2563eb', transition: 'color 0.2s', ':hover': { textDecoration: 'underline' } },
    clickableCourseText: { cursor: 'pointer', color: '#2563eb', fontWeight:'600', ':hover': { textDecoration: 'underline' } },

    percBadge: { padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' },
    codeBadge: { fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize:'12px', color:'#475569' },
    sessionBadge: { background: '#fff7ed', color:'#c2410c', padding:'2px 8px', borderRadius:'12px', fontWeight:'600', fontSize:'12px' },

    // Actions
    actions: { background: '#fff7ed', padding: '24px', borderRadius: '12px', border: '1px solid #ffedd5' },
    resetBtn: { background: '#f97316', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', width: '100%', boxShadow: '0 2px 4px rgba(249, 115, 22, 0.2)' },
    hint: { fontSize: '12px', color: '#9a3412', marginTop: '12px', textAlign: 'center' },
    successMessage: { textAlign: 'center', color: '#166534', background: '#dcfce7', padding: '12px', borderRadius: '8px', fontWeight: '600', fontSize: '13px', border: '1px solid #bbf7d0' },
    
    loading: { textAlign: 'center', padding: '40px', color: '#94a3b8' }
};

export default UserDetail;