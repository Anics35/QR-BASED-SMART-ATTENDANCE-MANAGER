import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api';

const SessionDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // Get courseId from state if available, we will also try to derive it later
  const { sessionId, sessionDate, courseName, courseId } = location.state || {};

  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Bulk Attendance State
  const [showModal, setShowModal] = useState(false);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);

  // Fetch Data
  useEffect(() => {
    if (!sessionId) return navigate('/courses');
    fetchAttendees();
  }, [sessionId, navigate]);

  const fetchAttendees = async () => {
    try {
      const { data } = await api.get(`/session/${sessionId}/attendees`);
      setAttendees(data);
    } catch (error) {
      alert("Failed to load session details");
    } finally {
      setLoading(false);
    }
  };

  // --- BULK MANUAL ATTENDANCE LOGIC ---

  const openBulkModal = async () => {
    // 1. Determine Course ID (Fallback to first attendee's courseId if not in navigation state)
    const targetCourseId = courseId || (attendees.length > 0 ? attendees[0].courseId : null);

    if (!targetCourseId) {
      alert("Cannot verify Course ID. Please ensure students are enrolled or navigate from the Course page.");
      return;
    }

    try {
      // 2. Fetch Enrolled Students
      const { data } = await api.get(`/course/${targetCourseId}/students`);
      
      // 3. Filter out students ALREADY present in this session
      const presentStudentIds = attendees.map(a => a.studentId?._id);
      const absentStudents = data.students.filter(
        student => !presentStudentIds.includes(student._id)
      );

      setEnrolledStudents(absentStudents);
      setShowModal(true);
    } catch (error) {
      console.error("Fetch Error:", error);
      alert("Failed to fetch student list. " + (error.response?.data?.message || ""));
    }
  };

  const toggleStudent = (id) => {
    if (selectedStudents.includes(id)) {
      setSelectedStudents(selectedStudents.filter(sId => sId !== id));
    } else {
      setSelectedStudents([...selectedStudents, id]);
    }
  };

  const handleBulkSubmit = async () => {
    if (selectedStudents.length === 0) return;

    try {
      await api.post('/attendance/bulk-manual', {
        sessionId: sessionId,
        studentIds: selectedStudents
      });

      alert("Success! Students marked present.");
      setShowModal(false);
      setSelectedStudents([]);
      fetchAttendees(); // Refresh list
    } catch (error) {
      alert(error.response?.data?.message || "Failed to add students");
    }
  };

  // Date Formatting
  const dateObj = new Date(sessionDate);
  const dateStr = dateObj.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.titleGroup}>
            <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>
            <div>
              <h1 style={styles.pageTitle}>Session Detail</h1>
              <div style={styles.breadcrumb}>{courseName} • {dateStr}</div>
            </div>
          </div>
          <div style={styles.headerActions}>
            <button style={styles.printBtn} onClick={() => window.print()}>
              🖨️ Print Record
            </button>
          </div>
        </div>
      </header>

      <div style={styles.main}>
        
        {/* Info Cards */}
        <div style={styles.statsGrid}>
          {/* Time Card */}
          <div style={styles.statCard}>
            <div style={{...styles.statIcon, background:'#f0f9ff', color:'#0284c7'}}>🕒</div>
            <div>
              <div style={styles.statLabel}>Session Time</div>
              <div style={styles.statValue}>{timeStr}</div>
            </div>
          </div>

          {/* Count Card */}
          <div style={styles.statCard}>
            <div style={{...styles.statIcon, background:'#f0fdf4', color:'#16a34a'}}>👥</div>
            <div>
              <div style={styles.statLabel}>Total Present</div>
              <div style={styles.statValue}>{attendees.length}</div>
            </div>
          </div>

          {/* Action Card - UPDATED BUTTON */}
          <div style={{...styles.statCard, border:'1px dashed #2563eb', background:'#eff6ff', justifyContent:'center'}}>
             <button style={styles.addBtn} onClick={openBulkModal}>
                + Bulk Mark Students
             </button>
          </div>
        </div>

        {/* Table Section */}
        <div style={styles.tableCard}>
          <div style={styles.tableHeader}>
            <h3 style={styles.tableTitle}>Attendance Register</h3>
            <span style={styles.tableSubtitle}>Verified Check-ins</span>
          </div>

          {loading ? (
            <div style={styles.loadingState}>
              <div style={styles.spinner}></div>
              <p>Fetching records...</p>
            </div>
          ) : attendees.length === 0 ? (
            <div style={styles.emptyState}>No students marked attendance for this session.</div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Roll No</th>
                    <th style={styles.th}>Student Profile</th>
                    <th style={styles.th}>Check-in Time</th>
                    <th style={styles.th}>Device ID</th>
                    <th style={styles.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendees.map((record) => (
                    <tr key={record._id} style={styles.tr}>
                      <td style={styles.td}>
                        <span style={styles.rollBadge}>{record.studentId?.rollNumber || "N/A"}</span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.studentName}>{record.studentId?.name || "Unknown"}</div>
                        <div style={styles.subText}>{record.studentId?.email}</div>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.timeBadge}>
                          {new Date(record.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.mono}>
                          {(record.deviceValidation?.deviceId === "MANUAL_OVERRIDE" || 
                            record.deviceValidation?.deviceId === "MANUAL_BULK")
                            ? "Manual Entry" 
                            : record.deviceValidation?.deviceId?.slice(0, 12) + "..."
                          }
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.statusBadge}>Present</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* BULK ATTENDANCE MODAL */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={{margin:0, color:'#111827'}}>Mark Absent Students</h3>
              <button onClick={() => setShowModal(false)} style={styles.closeBtn}>×</button>
            </div>
            
            <div style={styles.checklist}>
              {enrolledStudents.length === 0 ? (
                <div style={styles.emptyModal}>
                  <p>All students are present! 🎉</p>
                </div>
              ) : (
                enrolledStudents.map(student => (
                  <label key={student._id} style={styles.checkItem}>
                    <input 
                      type="checkbox" 
                      checked={selectedStudents.includes(student._id)}
                      onChange={() => toggleStudent(student._id)}
                      style={styles.checkbox}
                    />
                    <div>
                      <div style={styles.checkName}>{student.name}</div>
                      <div style={styles.checkRoll}>{student.rollNumber}</div>
                    </div>
                  </label>
                ))
              )}
            </div>

            <div style={styles.modalFooter}>
              <div style={{fontSize:'13px', color:'#666', fontWeight:'500'}}>
                {selectedStudents.length} selected
              </div>
              <button 
                style={selectedStudents.length === 0 ? styles.primaryBtnDisabled : styles.primaryBtn} 
                onClick={handleBulkSubmit}
                disabled={selectedStudents.length === 0}
              >
                Mark Present
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- PROFESSIONAL STYLES ---
const styles = {
  page: { minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: "'Inter', sans-serif", color: '#1f2937' },
  header: { backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 10 },
  headerContent: { maxWidth: '1280px', margin: '0 auto', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  titleGroup: { display: 'flex', alignItems: 'center', gap: '1.5rem' },
  backBtn: { background: 'transparent', border: '1px solid #d1d5db', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', color: '#6b7280', fontWeight: '600', transition: 'all 0.2s' },
  pageTitle: { fontSize: '1.25rem', fontWeight: '700', margin: 0, color: '#111827' },
  breadcrumb: { fontSize: '0.875rem', color: '#6b7280', marginTop: '4px' },
  printBtn: { background: '#fff', border: '1px solid #d1d5db', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', color: '#374151' },
  
  main: { maxWidth: '1280px', margin: '0 auto', padding: '2rem' },
  
  // Stats
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' },
  statCard: { background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid #f3f4f6' },
  statIcon: { width: '3rem', height: '3rem', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.5rem' },
  statLabel: { fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' },
  statValue: { fontSize: '1.5rem', fontWeight: '700', color: '#111827' },
  addBtn: { width: '100%', height: '100%', background: 'transparent', border: 'none', color: '#2563eb', fontWeight: '600', fontSize: '1rem', cursor: 'pointer' },

  // Table
  tableCard: { background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb', overflow: 'hidden' },
  tableHeader: { padding: '1.5rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  tableTitle: { fontSize: '1.125rem', fontWeight: '600', margin: 0 },
  tableSubtitle: { fontSize: '0.875rem', color: '#6b7280' },
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  th: { padding: '1rem 1.5rem', background: '#f9fafb', color: '#6b7280', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600', borderBottom: '1px solid #e5e7eb' },
  tr: { borderBottom: '1px solid #f3f4f6', transition: 'background 0.1s' },
  td: { padding: '1rem 1.5rem', verticalAlign: 'middle', fontSize: '0.875rem', color: '#374151' },
  
  // Badges & Text
  rollBadge: { background: '#eff6ff', color: '#1d4ed8', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600' },
  studentName: { fontWeight: '600', color: '#111827' },
  subText: { fontSize: '0.75rem', color: '#6b7280' },
  timeBadge: { background: '#f0fdf4', color: '#15803d', padding: '2px 8px', borderRadius: '6px', fontSize: '0.875rem', display:'inline-block', fontWeight:'500' },
  mono: { fontFamily: 'monospace', background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', color: '#6b7280' },
  statusBadge: { background: '#ecfdf5', color: '#059669', padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '600', border: '1px solid #a7f3d0' },
  
  // Loading
  loadingState: { padding: '3rem', textAlign: 'center', color: '#6b7280' },
  spinner: { width: '24px', height: '24px', border: '3px solid #e5e7eb', borderTop: '3px solid #2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' },
  emptyState: { padding: '4rem', textAlign: 'center', color: '#9ca3af', fontStyle: 'italic' },

  // --- MODAL STYLES ---
  modalOverlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    backdropFilter: 'blur(2px)',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    zIndex: 1000
  },
  modalContent: {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '16px',
    width: '420px',
    maxHeight: '80vh',
    display: 'flex', flexDirection: 'column',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
  },
  modalHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '16px', borderBottom: '1px solid #f3f4f6', paddingBottom: '16px'
  },
  closeBtn: {
    background: '#f3f4f6', border: 'none', fontSize: '20px', 
    width: '32px', height: '32px', borderRadius: '50%',
    cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  checklist: {
    overflowY: 'auto', flex: 1, paddingRight: '8px',
    maxHeight: '400px'
  },
  checkItem: {
    display: 'flex', alignItems: 'center', gap: '16px',
    padding: '12px', borderBottom: '1px solid #f9fafb', cursor: 'pointer',
    borderRadius: '8px', transition: 'background 0.2s',
    ':hover': { background: '#f9fafb' }
  },
  checkbox: {
    width: '18px', height: '18px', cursor: 'pointer', accentColor: '#2563eb'
  },
  checkName: { fontWeight: '600', color: '#1f2937', fontSize: '15px' },
  checkRoll: { fontSize: '13px', color: '#6b7280' },
  modalFooter: {
    marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f3f4f6',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
  },
  emptyModal: {
    textAlign: 'center', padding: '30px', color: '#6b7280', fontStyle: 'italic'
  },
  primaryBtn: {
    flex: 1,
    padding: '12px',
    background: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '14px',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    transition: 'all 0.2s',
  },
  primaryBtnDisabled: {
    flex: 1,
    padding: '12px',
    background: '#93c5fd',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'not-allowed',
    fontSize: '14px',
  },
};

export default SessionDetail;