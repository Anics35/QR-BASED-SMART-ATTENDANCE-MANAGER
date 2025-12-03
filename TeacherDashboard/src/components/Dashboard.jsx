import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api';

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // 1. Get Course Info
  const { courseId, courseName, teacherName } = location.state || {}; 

  // State
  const [session, setSession] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timer, setTimer] = useState(30);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Storage Key for Persistence
  const STORAGE_KEY = `activeSession_${courseId}`;
  const creationAttempted = useRef(false);

  // Redirect if accessed directly
  useEffect(() => {
    if (!courseId) {
      navigate('/courses');
    }
  }, [courseId, navigate]);

  // 2. Initialize Session (Restore or Create)
  useEffect(() => {
    if (!courseId) return;

    const initializeSession = async () => {
      // A. Restore from Storage
      const savedSession = localStorage.getItem(STORAGE_KEY);
      if (savedSession) {
        setSession(JSON.parse(savedSession));
        setLoading(false);
        return;
      }

      // B. Create New
      if (creationAttempted.current) return;
      creationAttempted.current = true;

      try {
        const { data } = await api.post('/session/create', {
          courseId: courseId, 
          latitude: 26.7017843, 
          longitude: 92.833871, 
          radius: 200, 
          duration: 60
        });
        
        const newSession = { 
          id: data.sessionId, 
          token: data.qrToken, 
          expiresAt: data.expiresAt 
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
        setSession(newSession);
        setLoading(false);
      } catch (error) {
        alert("Failed to start session.");
        navigate('/courses');
      }
    };

    initializeSession();
  }, [courseId, navigate]);

  // 3. Dynamic QR Refresh
  useEffect(() => {
    if (!session) return;

    const refreshInterval = setInterval(async () => {
      try {
        setIsRefreshing(true);
        const { data } = await api.post(`/session/${session.id}/refresh`);
        
        const updatedSession = { ...session, token: data.qrToken };
        setSession(updatedSession);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSession));
        
        setTimer(30);
        setTimeout(() => setIsRefreshing(false), 500); 
      } catch (err) {
        console.error("QR Refresh failed", err);
      }
    }, 30000); 

    const countdown = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 30));
    }, 1000);

    return () => { clearInterval(refreshInterval); clearInterval(countdown); };
  }, [session]);

  // 4. Live Attendee Polling & Fetch Helper
  const fetchAttendees = async () => {
    if (!session) return;
    try {
      const { data } = await api.get(`/session/${session.id}/attendees`);
      setAttendees(data);
    } catch (err) {
      console.error("Polling failed", err);
    }
  };

  useEffect(() => {
    if (!session) return;
    fetchAttendees(); 
    const pollInterval = setInterval(fetchAttendees, 5000);
    return () => clearInterval(pollInterval);
  }, [session]);

  // 5. Handlers
  const handleEndClass = () => {
    if (window.confirm("Are you sure you want to end this class?")) {
      localStorage.removeItem(STORAGE_KEY);
      navigate('/courses');
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get(`/report/course/${courseId}/export`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${courseName}_Attendance.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      alert("Export failed.");
    }
  };

  // --- NEW: MANUAL ADD FUNCTION ---
  const handleManualAdd = async () => {
    const email = prompt("Enter Student Email (e.g. student@tezu.ac.in):");
    if (!email) return;

    try {
      await api.post('/attendance/manual', {
        sessionId: session.id,
        email: email
      });
      alert("Success! Student added.");
      fetchAttendees(); // Update list immediately
    } catch (error) {
      alert(error.response?.data?.message || "Failed to add student. Check email.");
    }
  };

  if (!courseId) return null;

  const qrData = session ? JSON.stringify({ 
    sessionId: session.id, 
    qrToken: session.token 
  }) : "Loading...";

  return (
    <div style={styles.page}>
      <nav style={styles.navbar}>
        <div style={styles.navBrand}>
          <div style={styles.logoIcon}>🎓</div>
          <div>
            <h1 style={styles.navTitle}>Smart Attendance</h1>
            <div style={styles.navSubtitle}>{courseName} • {teacherName}</div>
          </div>
        </div>
        <button onClick={handleEndClass} style={styles.endBtn}>End Session</button>
      </nav>

      <main style={styles.mainContent}>
        <div style={styles.gridContainer}>
          
          {/* LEFT: QR CARD */}
          <div style={styles.qrSection}>
            <div style={styles.card}>
              <div style={styles.cardHeaderCenter}>
                <h2 style={styles.cardTitle}>Scan to Mark</h2>
                <div style={styles.timerBadge}>
                  Refreshing in <span style={{fontWeight:'700', width:'24px', textAlign:'center'}}>{timer}s</span>
                </div>
              </div>

              <div style={styles.qrContainer}>
                <div style={{
                  ...styles.qrFrame,
                  opacity: isRefreshing ? 0.5 : 1,
                  transform: isRefreshing ? 'scale(0.98)' : 'scale(1)'
                }}>
                  {loading ? (
                    <div style={styles.loadingState}>Initializing...</div>
                  ) : (
                    <QRCodeSVG value={qrData} size={260} level={"H"} includeMargin={true} />
                  )}
                </div>
                <div style={styles.scanInstruction}>
                  Ask students to scan using the <strong>Smart Attendance App</strong>
                </div>
              </div>
              
              {session && (
                <div style={styles.sessionId}>
                  Session ID: <span style={styles.mono}>{session.id.substring(0, 8)}...</span>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: ATTENDEE LIST */}
          <div style={styles.listSection}>
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <h2 style={styles.cardTitle}>Live Attendees</h2>
                  <div style={styles.liveIndicator}>
                    <span style={styles.dot}></span> Live Updates
                  </div>
                </div>
                {/* NEW BUTTON LOCATION */}
                <button style={styles.manualBtn} onClick={handleManualAdd}>
                  + Add Student
                </button>
              </div>

              <div style={styles.listArea}>
                {attendees.length === 0 ? (
                  <div style={styles.emptyState}>
                    <div style={{fontSize:'40px', marginBottom:'10px'}}>⏳</div>
                    <p>Waiting for students...</p>
                  </div>
                ) : (
                  <div style={styles.scrollList}>
                    {attendees.map((record) => (
                      <div key={record._id} style={styles.listItem}>
                        <div style={styles.avatar}>
                          {record.studentId?.name?.charAt(0) || "S"}
                        </div>
                        <div style={styles.studentInfo}>
                          <div style={styles.studentName}>{record.studentId?.name || "Unknown"}</div>
                          <div style={styles.studentRoll}>{record.studentId?.rollNumber}</div>
                        </div>
                        <div style={styles.statusCol}>
                           <div style={styles.timeTag}>
                             {new Date(record.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                           </div>
                           {record.deviceValidation?.deviceId === "MANUAL_OVERRIDE" && (
                               <span style={styles.manualTag}>Manual</span>
                           )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={styles.actionFooter}>
                <button style={styles.secondaryBtn} onClick={handleExport}>
                  Download CSV
                </button>
                <button 
                  style={styles.primaryBtn}
                  onClick={() => navigate('/report', { state: { courseId, courseName } })}
                >
                  View Full Report →
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

// --- PROFESSIONAL STYLES ---
const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f8f9fa',
    color: '#1f2937',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  navbar: {
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
    padding: '0.75rem 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 50,
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
  },
  navBrand: { display: 'flex', alignItems: 'center', gap: '12px' },
  logoIcon: { fontSize: '24px', background: '#eff6ff', padding: '8px', borderRadius: '8px' },
  navTitle: { fontSize: '18px', fontWeight: '700', margin: 0, color: '#111827' },
  navSubtitle: { fontSize: '13px', color: '#6b7280', marginTop: '2px', fontWeight: '500' },
  endBtn: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    border: '1px solid #fecaca',
    padding: '8px 16px',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s',
  },
  mainContent: {
    padding: '2rem',
    maxWidth: '1280px',
    margin: '0 auto',
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: '24px',
    alignItems: 'start',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    border: '1px solid #f3f4f6',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: '550px',
  },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  cardHeaderCenter: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' },
  cardTitle: { fontSize: '18px', fontWeight: '700', margin: 0, color: '#111827' },
  
  // Manual Button
  manualBtn: {
    padding: '6px 12px',
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    border: '1px dashed #2563eb',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },

  // QR Specifics
  timerBadge: {
    marginTop: '8px',
    background: '#fff1f2',
    color: '#e11d48',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '500',
    display: 'flex',
    gap: '4px'
  },
  qrContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '20px'
  },
  qrFrame: {
    padding: '24px',
    background: 'white',
    borderRadius: '20px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb',
    transition: 'all 0.3s ease'
  },
  scanInstruction: { color: '#6b7280', fontSize: '14px', textAlign: 'center' },
  sessionId: { marginTop: 'auto', fontSize: '12px', color: '#9ca3af', textAlign: 'center', paddingTop: '20px' },
  mono: { fontFamily: 'monospace', background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' },

  // List Specifics
  liveIndicator: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#10b981', fontWeight: '600', marginTop: '4px' },
  dot: { width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 0 2px #d1fae5' },
  
  listArea: { flex: 1, position: 'relative', minHeight: '300px' },
  scrollList: { height: '100%', maxHeight: '400px', overflowY: 'auto', paddingRight: '4px' },
  emptyState: { height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#9ca3af', fontStyle: 'italic' },
  
  listItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px',
    marginBottom: '8px',
    borderRadius: '10px',
    background: '#f9fafb',
    border: '1px solid #f3f4f6',
    transition: 'transform 0.1s',
  },
  avatar: {
    width: '40px', height: '40px',
    background: '#2563eb', color: 'white',
    borderRadius: '10px',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    fontWeight: '700', fontSize: '16px',
    marginRight: '12px'
  },
  studentInfo: { flex: 1 },
  studentName: { fontWeight: '600', fontSize: '14px', color: '#1f2937' },
  studentRoll: { fontSize: '12px', color: '#6b7280', marginTop: '2px' },
  statusCol: { textAlign: 'right' },
  timeTag: { fontSize: '12px', color: '#059669', background: '#d1fae5', padding: '2px 8px', borderRadius: '4px', fontWeight: '500' },
  manualTag: { fontSize: '10px', color: '#ea580c', background: '#ffedd5', padding: '2px 6px', borderRadius: '4px', fontWeight: '600', marginTop: '4px', display: 'inline-block' },

  actionFooter: {
    marginTop: '20px',
    display: 'flex',
    gap: '12px',
    paddingTop: '20px',
    borderTop: '1px solid #e5e7eb'
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
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
  },
  secondaryBtn: {
    flex: 1,
    padding: '12px',
    background: 'white',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '14px'
  }
};

export default Dashboard;