import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const UserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('teacher'); // Default to Faculty view
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data.users);
      setLoading(false);
    } catch (e) { 
      console.error(e);
      setLoading(false);
    }
  };

  // Filter users based on the active tab
  const teachers = users.filter(u => u.role === 'teacher');
  const students = users.filter(u => u.role === 'student');

  const handleDelete = async (id, name) => {
    if(!window.confirm(`Are you sure you want to delete ${name}? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/users/${id}`);
      fetchUsers(); // Refresh
    } catch (e) { alert("Failed to delete user"); }
  };

  return (
    <div style={styles.container}>
        {/* Tab Navigation */}
        <div style={styles.tabsContainer}>
            <button 
                style={activeTab === 'teacher' ? styles.activeTab : styles.tab} 
                onClick={() => setActiveTab('teacher')}
            >
                👨‍🏫 Faculty Directory ({teachers.length})
            </button>
            <button 
                style={activeTab === 'student' ? styles.activeTab : styles.tab} 
                onClick={() => setActiveTab('student')}
            >
                🎓 Student Registry ({students.length})
            </button>
        </div>

        {/* Content Area */}
        <div style={styles.tableCard}>
            {loading ? (
                <div style={styles.loading}>Loading users...</div>
            ) : (
                <>
                    {/* TEACHER TABLE */}
                    {activeTab === 'teacher' && (
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Faculty Name</th>
                                    <th style={styles.th}>Department</th>
                                    <th style={styles.th}>Email</th>
                                    <th style={styles.th}>Status</th>
                                    <th style={styles.th}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {teachers.map(teacher => (
                                    <tr key={teacher._id} style={styles.tr}>
                                        <td style={styles.td}>
                                            <div style={styles.profileCell}>
                                                <div style={styles.teacherAvatar}>{teacher.name.charAt(0)}</div>
                                                <div 
                                                    style={styles.clickableName}
                                                    onClick={() => navigate('/user-detail', { state: { user: teacher } })}
                                                    title="View Teacher Details"
                                                >
                                                    {teacher.name}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={styles.td}>{teacher.department || 'N/A'}</td>
                                        <td style={styles.td}>{teacher.email}</td>
                                        <td style={styles.td}><span style={styles.activeTag}>Active</span></td>
                                        <td style={styles.td}>
                                            <button style={styles.deleteBtn} onClick={() => handleDelete(teacher._id, teacher.name)}>
                                                Remove
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {teachers.length === 0 && <tr><td colSpan="5" style={styles.empty}>No faculty members found.</td></tr>}
                            </tbody>
                        </table>
                    )}

                    {/* STUDENT TABLE */}
                    {activeTab === 'student' && (
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Student Name</th>
                                    <th style={styles.th}>Roll Number</th>
                                    <th style={styles.th}>Department</th>
                                    <th style={styles.th}>Device Status</th>
                                    <th style={styles.th}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map(student => (
                                    <tr key={student._id} style={styles.tr}>
                                        <td style={styles.td}>
                                            <div style={styles.profileCell}>
                                                <div style={styles.studentAvatar}>{student.name.charAt(0)}</div>
                                                <div 
                                                    style={styles.clickableName}
                                                    onClick={() => navigate('/user-detail', { state: { user: student } })}
                                                    title="View Student Details"
                                                >
                                                    {student.name}
                                                </div>
                                                <div style={styles.emailSmall}>{student.email}</div>
                                            </div>
                                        </td>
                                        <td style={styles.td}>
                                            <span style={styles.rollBadge}>{student.rollNumber || 'N/A'}</span>
                                        </td>
                                        <td style={styles.td}>{student.department || 'N/A'}</td>
                                        <td style={styles.td}>
                                            {student.deviceId 
                                                ? <span style={styles.boundTag}>📱 Bound</span> 
                                                : <span style={styles.unboundTag}>⚠️ Unbound</span>
                                            }
                                        </td>
                                        <td style={styles.td}>
                                            <button style={styles.deleteBtn} onClick={() => handleDelete(student._id, student.name)}>
                                                Remove
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {students.length === 0 && <tr><td colSpan="5" style={styles.empty}>No students registered.</td></tr>}
                            </tbody>
                        </table>
                    )}
                </>
            )}
        </div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '24px' },
  
  // Tabs
  tabsContainer: { display: 'flex', gap: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '1px' },
  tab: {
    padding: '12px 24px',
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    color: '#64748b',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '500',
    transition: 'all 0.2s'
  },
  activeTab: {
    padding: '12px 24px',
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid #2563eb',
    color: '#2563eb',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '700'
  },

  // Table Card
  tableCard: { background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden', border: '1px solid #e2e8f0' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  th: { padding: '16px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '12px', textTransform: 'uppercase', color: '#475569', fontWeight: '600' },
  tr: { borderBottom: '1px solid #f1f5f9', transition: 'background 0.1s', ':hover': { background: '#f8fafc' } },
  td: { padding: '16px 24px', verticalAlign: 'middle', fontSize: '14px', color: '#334155' },
  empty: { padding: '40px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' },
  loading: { padding: '40px', textAlign: 'center', color: '#64748b' },

  // Profile Styles
  profileCell: { display: 'flex', alignItems: 'center', gap: '12px' },
  teacherAvatar: { width: '36px', height: '36px', borderRadius: '8px', background: '#f3e8ff', color: '#7e22ce', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' },
  studentAvatar: { width: '36px', height: '36px', borderRadius: '50%', background: '#dbeafe', color: '#1d4ed8', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' },
  clickableName: { fontWeight: '600', color: '#0f172a', cursor: 'pointer', ':hover': { textDecoration: 'underline', color: '#2563eb' } },
  emailSmall: { fontSize: '12px', color: '#64748b', marginTop: '2px' },

  // Badges
  activeTag: { background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  boundTag: { background: '#e0f2fe', color: '#0284c7', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' },
  unboundTag: { background: '#fef3c7', color: '#b45309', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' },
  rollBadge: { background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '12px', fontWeight: '600', color: '#475569' },

  // Buttons
  deleteBtn: { background: '#fff', border: '1px solid #cbd5e1', color: '#ef4444', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', transition: 'all 0.2s', ':hover': { background: '#fef2f2', borderColor: '#fca5a5' } }
};

export default UserManagement;