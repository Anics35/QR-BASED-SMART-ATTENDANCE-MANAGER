import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api';

const StudentDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Data passed from the previous screen
  const { studentId, studentName, rollNumber, courseId, courseName } = location.state || {};

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Statistics
  const totalSessions = history.length;
  const attendedCount = history.filter(h => h.status === 'present').length;
  const percentage = totalSessions > 0 ? ((attendedCount / totalSessions) * 100).toFixed(1) : 0;

  useEffect(() => {
    if (!studentId || !courseId) return navigate('/courses');

    const fetchHistory = async () => {
      try {
        const { data } = await api.get(`/attendance/history/${courseId}/${studentId}`);
        setHistory(data.history);
      } catch (error) {
        alert("Failed to load history");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [studentId, courseId, navigate]);

  // Handle Device Reset
  const handleDeviceReset = async () => {
    if (!window.confirm(`⚠️ Security Warning\n\nAre you sure you want to unbind ${studentName}'s device?\n\nThey will be able to log in from a NEW phone immediately.`)) {
      return;
    }

    try {
      await api.post('/auth/reset-device', { studentId });
      alert("✅ Device Unbound Successfully.\nThe student can now register a new device.");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to reset device");
    }
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.titleGroup}>
            <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>
            <div>
              <h1 style={styles.pageTitle}>{studentName}</h1>
              <div style={styles.breadcrumb}>{courseName} • {rollNumber}</div>
            </div>
          </div>
          <button style={styles.printBtn} onClick={() => window.print()}>
            🖨️ Export PDF
          </button>
        </div>
      </header>

      <div style={styles.main}>
        {/* Info Grid */}
        <div style={styles.statsGrid}>
          
          {/* Card 1: Percentage */}
          <div style={styles.statCard}>
            <div style={{...styles.statIcon, background: percentage >= 75 ? '#f0fdf4' : '#fef2f2', color: percentage >= 75 ? '#16a34a' : '#dc2626'}}>
              {percentage >= 75 ? '📈' : '📉'}
            </div>
            <div>
              <div style={styles.statLabel}>Attendance Rate</div>
              <div style={{...styles.statValue, color: percentage >= 75 ? '#16a34a' : '#dc2626'}}>
                {percentage}%
              </div>
            </div>
          </div>

          {/* Card 2: Counts */}
          <div style={styles.statCard}>
            <div style={{...styles.statIcon, background:'#eff6ff', color:'#2563eb'}}>✅</div>
            <div>
              <div style={styles.statLabel}>Classes Attended</div>
              <div style={styles.statValue}>{attendedCount} <span style={{fontSize:'1rem', color:'#9ca3af', fontWeight:'500'}}>/ {totalSessions}</span></div>
            </div>
          </div>

          {/* Card 3: Device Actions */}
          <div style={{...styles.statCard, border:'1px solid #fecaca', background:'#fff1f2'}}>
            <div style={{...styles.statIcon, background:'#fee2e2', color:'#dc2626'}}>📱</div>
            <div style={{flex:1}}>
              <div style={styles.statLabel}>Device Security</div>
              <button style={styles.dangerBtn} onClick={handleDeviceReset}>
                🔓 Unbind Device
              </button>
            </div>
          </div>
        </div>

        {/* Timeline Table */}
        <div style={styles.tableCard}>
          <div style={styles.tableHeader}>
            <h3 style={styles.tableTitle}>Attendance Timeline</h3>
            <span style={styles.tableSubtitle}>Detailed Session History</span>
          </div>

          {loading ? (
            <div style={styles.loadingState}>
              <div style={styles.spinner}></div>
              <p>Loading history...</p>
            </div>
          ) : history.length === 0 ? (
            <div style={styles.emptyState}>No sessions found for this course.</div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Session Time</th>
                    <th style={styles.th}>Marked At</th>
                    <th style={styles.th}>Method / Device</th>
                    <th style={styles.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => {
                    const isPresent = item.status === 'present';
                    const isManual = item.device === 'MANUAL_OVERRIDE';
                    
                    return (
                      <tr key={item.sessionId} style={styles.tr}>
                        <td style={styles.td}>
                          <strong>{new Date(item.date).toLocaleDateString()}</strong>
                          <div style={styles.subText}>
                            {new Date(item.date).toLocaleDateString(undefined, {weekday:'long'})}
                          </div>
                        </td>
                        <td style={styles.td}>
                          {new Date(item.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                        </td>
                        <td style={styles.td}>
                          {isPresent ? new Date(item.markedAt).toLocaleTimeString() : '-'}
                        </td>
                        <td style={styles.td}>
                          {isPresent ? (
                            isManual ? (
                              <span style={styles.manualBadge}>Teacher Override</span>
                            ) : (
                              <span style={styles.mono}>{item.device?.slice(0, 12)}...</span>
                            )
                          ) : (
                            <span style={{color:'#9ca3af'}}>-</span>
                          )}
                        </td>
                        <td style={styles.td}>
                          {isPresent ? (
                            <span style={styles.presentBadge}>Present</span>
                          ) : (
                            <span style={styles.absentBadge}>Absent</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- PROFESSIONAL STYLES ---
const styles = {
  page: { minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: "'Inter', sans-serif", color: '#1f2937' },
  header: { backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 10 },
  headerContent: { maxWidth: '1000px', margin: '0 auto', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  titleGroup: { display: 'flex', alignItems: 'center', gap: '1.5rem' },
  backBtn: { background: 'transparent', border: '1px solid #d1d5db', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', color: '#6b7280', fontWeight: '600' },
  pageTitle: { fontSize: '1.25rem', fontWeight: '700', margin: 0, color: '#111827' },
  breadcrumb: { fontSize: '0.875rem', color: '#6b7280', marginTop: '4px' },
  printBtn: { background: '#fff', border: '1px solid #d1d5db', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', color: '#374151' },
  
  main: { maxWidth: '1000px', margin: '0 auto', padding: '2rem' },
  
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' },
  statCard: { background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid #f3f4f6' },
  statIcon: { width: '3rem', height: '3rem', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.5rem' },
  statLabel: { fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' },
  statValue: { fontSize: '1.5rem', fontWeight: '700', color: '#111827' },
  
  dangerBtn: { padding: '6px 12px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem', marginTop:'4px' },

  tableCard: { background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb', overflow: 'hidden' },
  tableHeader: { padding: '1.5rem', borderBottom: '1px solid #e5e7eb' },
  tableTitle: { fontSize: '1.125rem', fontWeight: '600', margin: 0 },
  tableSubtitle: { fontSize: '0.875rem', color: '#6b7280' },
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  th: { padding: '1rem 1.5rem', background: '#f9fafb', color: '#6b7280', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600', borderBottom: '1px solid #e5e7eb' },
  tr: { borderBottom: '1px solid #f3f4f6', transition: 'background 0.1s' },
  td: { padding: '1rem 1.5rem', verticalAlign: 'middle', fontSize: '0.875rem', color: '#374151' },
  
  subText: { fontSize: '0.75rem', color: '#6b7280' },
  mono: { fontFamily: 'monospace', background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', color: '#6b7280' },
  
  presentBadge: { background: '#ecfdf5', color: '#059669', padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '600', border: '1px solid #a7f3d0' },
  absentBadge: { background: '#fef2f2', color: '#dc2626', padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '600', border: '1px solid #fecaca' },
  manualBadge: { background: '#fff7ed', color: '#ea580c', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', border: '1px solid #fed7aa' },

  loadingState: { padding: '3rem', textAlign: 'center', color: '#6b7280' },
  spinner: { width: '24px', height: '24px', border: '3px solid #e5e7eb', borderTop: '3px solid #2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' },
  emptyState: { padding: '4rem', textAlign: 'center', color: '#9ca3af', fontStyle: 'italic' }
};

export default StudentDetail;