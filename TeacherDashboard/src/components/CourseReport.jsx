import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api';

const CourseReport = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { courseId, courseName } = location.state || {};

  // State
  const [activeTab, setActiveTab] = useState('students'); // 'students' | 'sessions'
  const [report, setReport] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Stats
  const totalStudents = report.length;
  const avgAttendance = totalStudents > 0 
    ? (report.reduce((sum, s) => sum + parseFloat(s.percentage), 0) / totalStudents).toFixed(1) 
    : 0;
  const totalSessionsHeld = sessions.length;

  // Initial Data Fetch
  useEffect(() => {
    if (!courseId) return navigate('/courses');

    const fetchData = async () => {
      setLoading(true);
      try {
        // Parallel Fetch for speed
        const [reportRes, sessionRes] = await Promise.all([
          api.get(`/report/course/${courseId}`),
          api.get(`/session/course/${courseId}`)
        ]);
        
        setReport(reportRes.data.report);
        setSessions(sessionRes.data.sessions);
      } catch (error) {
        console.error("Data load failed", error);
        alert("Failed to load course data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId, navigate]);

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.titleGroup}>
            <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>
            <div>
              <h1 style={styles.pageTitle}>Course Report</h1>
              <div style={styles.breadcrumb}>{courseName}</div>
            </div>
          </div>
          <div style={styles.headerActions}>
            <button style={styles.printBtn} onClick={() => window.print()}>
              🖨️ Print
            </button>
          </div>
        </div>
      </header>

      <div style={styles.main}>
        {/* Statistics Cards */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={{...styles.statIcon, background:'#eff6ff', color:'#2563eb'}}>👥</div>
            <div>
              <div style={styles.statLabel}>Total Students</div>
              <div style={styles.statValue}>{totalStudents}</div>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={{...styles.statIcon, background:'#f0fdf4', color:'#16a34a'}}>📊</div>
            <div>
              <div style={styles.statLabel}>Avg. Attendance</div>
              <div style={{...styles.statValue, color: avgAttendance >= 75 ? '#16a34a' : '#ea580c'}}>
                {avgAttendance}%
              </div>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={{...styles.statIcon, background:'#f5f3ff', color:'#7c3aed'}}>📅</div>
            <div>
              <div style={styles.statLabel}>Classes Held</div>
              <div style={styles.statValue}>{totalSessionsHeld}</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={styles.tabContainer}>
          <button 
            style={activeTab === 'students' ? styles.activeTab : styles.tab}
            onClick={() => setActiveTab('students')}
          >
            Student Performance
          </button>
          <button 
            style={activeTab === 'sessions' ? styles.activeTab : styles.tab}
            onClick={() => setActiveTab('sessions')}
          >
            Class History
          </button>
        </div>

        {/* Content Area */}
        <div style={styles.contentCard}>
          {loading ? (
            <div style={styles.loadingState}>
              <div style={styles.spinner}></div>
              <p>Loading data...</p>
            </div>
          ) : (
            <>
              {/* --- VIEW 1: STUDENTS --- */}
              {activeTab === 'students' && (
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Roll No.</th>
                        <th style={styles.th}>Student</th>
                        <th style={styles.th}>Attendance</th>
                        <th style={styles.th}>Progress</th>
                        <th style={styles.th}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.map((student) => {
                        const percent = parseFloat(student.percentage);
                        const statusColor = percent >= 75 ? '#16a34a' : percent >= 60 ? '#ca8a04' : '#dc2626';
                        return (
                          <tr key={student.studentId} style={styles.tr}>
                            <td style={styles.td}>
                              <span style={styles.rollBadge}>{student.rollNumber}</span>
                            </td>
                            <td style={styles.td}>
                              <div 
                                style={styles.clickableName}
                                onClick={() => navigate('/student-detail', { 
                                    state: { 
                                        studentId: student.studentId, 
                                        studentName: student.name, 
                                        rollNumber: student.rollNumber,
                                        courseId, courseName 
                                    } 
                                })}
                              >
                                {student.name}
                              </div>
                              <div style={styles.subText}>{student.email}</div>
                            </td>
                            <td style={styles.td}>
                              <span style={{fontWeight:'600'}}>{student.attended}</span>
                              <span style={{color:'#9ca3af'}}> / {student.totalSessions}</span>
                            </td>
                            <td style={styles.td}>
                              <div style={styles.progressBg}>
                                <div style={{...styles.progressFill, width: `${percent}%`, background: statusColor}} />
                              </div>
                              <div style={styles.percentText}>{student.percentage}%</div>
                            </td>
                            <td style={styles.td}>
                              <span style={{...styles.statusBadge, color: statusColor, borderColor: statusColor}}>
                                {percent >= 75 ? 'Good' : 'Low'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {report.length === 0 && <tr><td colSpan="5" style={styles.emptyTd}>No students found.</td></tr>}
                    </tbody>
                  </table>
                </div>
              )}

              {/* --- VIEW 2: SESSIONS --- */}
              {activeTab === 'sessions' && (
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Date</th>
                        <th style={styles.th}>Time</th>
                        <th style={styles.th}>Present Count</th>
                        <th style={styles.th}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.map((sess) => (
                        <tr key={sess._id} style={styles.tr}>
                          <td style={styles.td}>
                            <strong>{new Date(sess.sessionDate).toLocaleDateString()}</strong>
                            <div style={styles.subText}>
                              {new Date(sess.sessionDate).toLocaleDateString(undefined, {weekday:'long'})}
                            </div>
                          </td>
                          <td style={styles.td}>
                            {new Date(sess.sessionDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </td>
                          <td style={styles.td}>
                            <div style={styles.attendeeTag}>
                              👥 {sess.attendeeCount} Students
                            </div>
                          </td>
                          <td style={styles.td}>
                            <button 
                              style={styles.viewBtn}
                              onClick={() => navigate('/session-detail', {
                                state: { 
                                    sessionId: sess._id, 
                                    sessionDate: sess.sessionDate,
                                    courseName 
                                }
                              })}
                            >
                              View List →
                            </button>
                          </td>
                        </tr>
                      ))}
                      {sessions.length === 0 && <tr><td colSpan="4" style={styles.emptyTd}>No sessions held yet.</td></tr>}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// --- STYLES ---
const styles = {
  page: { minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: "'Inter', sans-serif", color: '#1f2937' },
  header: { backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 10 },
  headerContent: { maxWidth: '1280px', margin: '0 auto', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  titleGroup: { display: 'flex', alignItems: 'center', gap: '1.5rem' },
  backBtn: { background: 'transparent', border: '1px solid #d1d5db', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', color: '#6b7280', fontWeight: '600' },
  pageTitle: { fontSize: '1.25rem', fontWeight: '700', margin: 0 },
  breadcrumb: { fontSize: '0.875rem', color: '#6b7280' },
  printBtn: { background: '#fff', border: '1px solid #d1d5db', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' },
  
  main: { maxWidth: '1280px', margin: '0 auto', padding: '2rem' },
  
  // Stats
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' },
  statCard: { background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '1rem' },
  statIcon: { width: '3rem', height: '3rem', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.5rem' },
  statLabel: { fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' },
  statValue: { fontSize: '1.5rem', fontWeight: '700' },

  // Tabs
  tabContainer: { display: 'flex', gap: '2rem', borderBottom: '1px solid #e5e7eb', marginBottom: '1.5rem' },
  tab: { padding: '0.75rem 0', background: 'transparent', border: 'none', borderBottom: '2px solid transparent', color: '#6b7280', cursor: 'pointer', fontSize: '1rem', fontWeight: '500' },
  activeTab: { padding: '0.75rem 0', background: 'transparent', border: 'none', borderBottom: '2px solid #2563eb', color: '#2563eb', cursor: 'pointer', fontSize: '1rem', fontWeight: '600' },

  // Table Card
  contentCard: { background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflow: 'hidden', minHeight: '400px' },
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  th: { padding: '1rem 1.5rem', background: '#f9fafb', color: '#6b7280', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' },
  tr: { borderBottom: '1px solid #f3f4f6' },
  td: { padding: '1rem 1.5rem', verticalAlign: 'middle', fontSize: '0.875rem' },
  
  // Specific Elements
  rollBadge: { background: '#eff6ff', color: '#1d4ed8', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600' },
  clickableName: { fontWeight: '600', color: '#111827', cursor: 'pointer', marginBottom: '2px', textDecoration: 'none' },
  subText: { fontSize: '0.75rem', color: '#6b7280' },
  progressBg: { width: '100px', height: '6px', background: '#e5e7eb', borderRadius: '3px', marginBottom: '4px' },
  progressFill: { height: '100%', borderRadius: '3px' },
  percentText: { fontSize: '0.75rem', fontWeight: '600' },
  statusBadge: { padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600', border: '1px solid', backgroundColor: 'white' },
  
  attendeeTag: { background: '#f0f9ff', color: '#0369a1', padding: '4px 10px', borderRadius: '6px', fontWeight: '500', display: 'inline-block' },
  viewBtn: { padding: '6px 12px', background: 'white', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600', color: '#374151' },
  
  loadingState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', color: '#6b7280' },
  spinner: { width: '30px', height: '30px', border: '3px solid #e5e7eb', borderTop: '3px solid #2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '1rem' },
  emptyTd: { padding: '3rem', textAlign: 'center', color: '#9ca3af', fontStyle: 'italic' }
};

export default CourseReport;