import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { v4 as uuidv4 } from 'uuid';
import { useLocation, useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const teacherName = location.state?.teacherName || "Guest Teacher";
  
  const [sessionId, setSessionId] = useState("INITIAL");
  const [timer, setTimer] = useState(15);
  const [attendees, setAttendees] = useState([]);

  // Session & Timer Logic
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionId(uuidv4());
      setTimer(15);
    }, 15000);

    const countdown = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 15));
    }, 1000);

    return () => { clearInterval(interval); clearInterval(countdown); };
  }, []);

  // Simulate student scanning (For Demo)
  const simulateScan = () => {
    const names = ["Anirban Saha", "Dimpal Gogoi", "Rahul Roy", "Priya Das"];
    const randomName = names[Math.floor(Math.random() * names.length)];
    const newStudent = {
      id: Date.now(),
      name: randomName,
      roll: "CSB220" + Math.floor(Math.random() * 99),
      time: new Date().toLocaleTimeString()
    };
    setAttendees(prev => [newStudent, ...prev]);
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h3>Smart Attendance - {teacherName}</h3>
        <button onClick={() => navigate('/')} style={styles.logoutBtn}>End Session</button>
      </header>

      <div style={styles.grid}>
        {/* LEFT COLUMN: QR Code */}
        <div style={styles.qrColumn}>
          <div style={styles.card}>
            <h2>Session Active</h2>
            <p>
              Code expires in:{" "}
              <span style={{ color: 'red', fontWeight: 'bold' }}>{timer}s</span>
            </p>
            <div style={{
              background: 'white',
              padding: '15px',
              border: '1px solid #ddd',
              display: 'inline-block',
              marginTop: '20px'
            }}>
              <QRCodeSVG value={sessionId} size={220} />
            </div>
            <div style={styles.debug}>Session ID: {sessionId.slice(0, 8)}...</div>
            <button onClick={simulateScan} style={styles.demoBtn}>
              (Demo) Simulate Student Scan
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Live List */}
        <div style={styles.listColumn}>
          <div style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Live Attendees</h2>
              <span style={styles.badge}>{attendees.length} Present</span>
            </div>
            
            <div style={styles.listContainer}>
              {attendees.length === 0 ? (
                <p style={{ color: '#888', fontStyle: 'italic' }}>Waiting for scans...</p>
              ) : (
                attendees.map(student => (
                  <div key={student.id} style={styles.listItem}>
                    <div>
                      <strong>{student.name}</strong>
                      <div style={{ fontSize: '12px', color: '#666' }}>{student.roll}</div>
                    </div>
                    <div style={{ fontSize: '12px', color: 'green' }}>
                      Verified {student.time}
                    </div>
                  </div>
                ))
              )}
            </div>
            <button style={styles.exportBtn} onClick={() => alert("Downloaded CSV!")}>
              Export Attendance Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: 'sans-serif' },
  header: { backgroundColor: '#1a73e8', color: 'white', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', padding: '8px 15px', cursor: 'pointer', borderRadius: '4px' },
  grid: {
    display: 'flex', // Flexbox for two columns
    flexDirection: 'row',
    gap: '2rem',
    padding: '2rem',
    maxWidth: '1200px',
    margin: '0 auto',
    alignItems: 'stretch'
  },
  qrColumn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  listColumn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column'
  },
  card: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    height: '100%',
    display: 'flex',
    flexDirection: 'column'
  },
  debug: { marginTop: '10px', fontSize: '12px', color: '#999', fontFamily: 'monospace' },
  demoBtn: { marginTop: '20px', padding: '10px', background: '#eee', border: 'none', cursor: 'pointer', width: '100%' },
  listContainer: { marginTop: '20px', maxHeight: '400px', overflowY: 'auto', borderTop: '1px solid #eee' },
  listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid #f0f0f0' },
  badge: { background: '#e6f4ea', color: '#137333', padding: '5px 10px', borderRadius: '15px', fontSize: '14px', fontWeight: 'bold' },
  exportBtn: { marginTop: '20px', width: '100%', padding: '12px', backgroundColor: '#1a73e8', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }
};

export default Dashboard;
