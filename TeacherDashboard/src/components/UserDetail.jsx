import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api';

const UserDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = location.state || {};

  if (!user) return null;

  const isStudent = user.role === 'student';

  const handleResetDevice = async () => {
    try {
      await api.post('/auth/reset-device', { studentId: user._id });
      alert("Device ID cleared.");
    } catch (e) { alert("Failed"); }
  };

  return (
    <div style={styles.page}>
        <div style={styles.card}>
            <div style={styles.navRow}>
                <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>
                <div style={styles.idBadge}>ID: {user._id.slice(-6)}</div>
            </div>
            
            <div style={styles.header}>
                <div style={{...styles.avatar, borderRadius: isStudent ? '50%' : '12px', background: isStudent ? '#dbeafe' : '#f3e8ff', color: isStudent ? '#1d4ed8' : '#7e22ce'}}>
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

            <div style={styles.section}>
                <h3 style={styles.subHeader}>Profile Information</h3>
                <div style={styles.grid}>
                    <DetailItem label="Department" value={user.department || "N/A"} />
                    <DetailItem label="Joined Date" value={new Date(user.createdAt).toLocaleDateString()} />
                    
                    {isStudent && (
                        <>
                            <DetailItem label="Roll Number" value={user.rollNumber} />
                            <DetailItem label="Current Semester" value={user.semester} />
                            <DetailItem label="Device Status" value={user.deviceId ? "Bound" : "Unbound"} highlight={!user.deviceId} />
                        </>
                    )}
                </div>
            </div>

            {isStudent && (
                <div style={styles.actions}>
                    <h3 style={styles.subHeader}>Security Actions</h3>
                    <button style={styles.resetBtn} onClick={handleResetDevice}>
                        🔓 Unbind Device ID
                    </button>
                    <p style={styles.hint}>Allows student to log in on a new phone.</p>
                </div>
            )}
        </div>
    </div>
  );
};

const DetailItem = ({ label, value, highlight }) => (
    <div style={styles.item}>
        <div style={styles.label}>{label}</div>
        <div style={{...styles.value, color: highlight ? '#dc2626' : '#0f172a'}}>{value}</div>
    </div>
);

const styles = {
    page: { height: '100vh', background: '#f1f5f9', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: "'Inter', sans-serif" },
    card: { width: '100%', maxWidth: '600px', background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)' },
    navRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '24px' },
    backBtn: { background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight:'600', padding: 0 },
    idBadge: { fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace' },
    
    header: { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px', borderBottom: '1px solid #e2e8f0', paddingBottom: '24px' },
    avatar: { width: '72px', height: '72px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '28px', fontWeight: 'bold' },
    meta: { color: '#64748b', fontSize: '14px', margin: '2px 0 8px 0' },
    roleBadgeStudent: { background: '#eff6ff', color: '#2563eb', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em' },
    roleBadgeTeacher: { background: '#f5f3ff', color: '#7c3aed', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em' },

    section: { marginBottom: '32px' },
    subHeader: { margin: '0 0 16px 0', fontSize: '14px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },
    item: { display: 'flex', flexDirection: 'column', gap: '4px' },
    label: { fontSize: '13px', color: '#64748b', fontWeight: '500' },
    value: { fontSize: '16px', fontWeight: '600' },

    actions: { background: '#fff7ed', padding: '20px', borderRadius: '12px', border: '1px solid #ffedd5' },
    resetBtn: { background: '#f97316', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', width: '100%', boxShadow: '0 2px 4px rgba(249, 115, 22, 0.2)' },
    hint: { fontSize: '12px', color: '#9a3412', marginTop: '8px', textAlign: 'center' }
};

export default UserDetail;