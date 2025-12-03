import React from 'react';
import { useNavigate } from 'react-router-dom';

const Reports = () => {
  const navigate = useNavigate();
  
  // Mock Report Data (SRS 3.5)
  const reportData = [
    { id: 1, name: "Anirban Saha", roll: "CSB22035", attendance: "85%", status: "Good" },
    { id: 2, name: "Dimpal Gogoi", roll: "CSB22015", attendance: "92%", status: "Excellent" },
    { id: 3, name: "Rahul Roy", roll: "CSB22040", attendance: "60%", status: "Warning" },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Attendance Reports</h2>
        <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>Back to Dashboard</button>
      </div>

      <div style={styles.content}>
        <div style={styles.card}>
          <div style={styles.toolbar}>
            <select style={styles.select}><option>Select Course</option><option>CS101</option></select>
            <select style={styles.select}><option>Select Month</option><option>October</option></select>
            <button style={styles.exportBtn} onClick={() => alert("Downloading PDF...")}>Export PDF</button>
          </div>

          <table style={styles.table}>
            <thead>
              <tr style={{background:'#2f7fd5ff'}}>
                <th style={styles.th}>Student Name</th>
                <th style={styles.th}>Roll No</th>
                <th style={styles.th}>Attendance %</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map(row => (
                <tr key={row.id} style={{borderBottom:'1px solid #eee'}}>
                  <td style={styles.td}>{row.name}</td>
                  <td style={styles.td}>{row.roll}</td>
                  <td style={styles.td}>
                    <div style={{
                      background: parseInt(row.attendance) > 75 ? '#e6f4ea' : '#fce8e6',
                      color: parseInt(row.attendance) > 75 ? 'green' : 'red',
                      padding: '4px 8px', borderRadius: '4px', display:'inline-block'
                    }}>
                      {row.attendance}
                    </div>
                  </td>
                  <td style={styles.td}>{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const styles = {
  // 1. Force Full Width and Reset Margins
  container: { 
    minHeight: '100vh', 
    width: '100vw',               // Forces full width of browser
    background: '#f0f0f0ff', 
    fontFamily: 'sans-serif',
    margin: 0,
    padding: 0,
    boxSizing: 'border-box',      // Ensures padding doesn't break layout
    display: 'flex',              // Helps with layout structure
    flexDirection: 'column'
  },

  header: { 
    background: '#3755eaff', 
    padding: '1rem 2rem', 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    borderBottom: '1px solid #ddd' 
  },

  backBtn: { padding: '8px 16px', cursor: 'pointer' },

  // 2. Center the Card in the middle of the screen
  content: { 
    padding: '2rem',
    flex: 1,                      // Takes up remaining vertical space
    display: 'flex',              // Enables Flexbox
    justifyContent: 'center',     // Centers horizontally (Left/Right)
    alignItems: 'flex-start'      // Aligns to top (so it doesn't float in middle of vertical space)
  },

  // 3. Control Card Width
  card: { 
    background: 'grey', 
    padding: '2rem', 
    borderRadius: '8px', 
    boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
    width: '100%',                // Takes full available width...
    maxWidth: '1000px'            // ...but stops at 1000px so it stays in the middle
  },

  toolbar: { display: 'flex', gap: '10px', marginBottom: '20px' },
  select: { padding: '8px', borderRadius: '4px', border: '1px solid #ccc' },
  exportBtn: { marginLeft: 'auto', background: '#1a73e8', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor:'pointer' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px', borderBottom: '2px solid #eee' },
  td: { padding: '12px' }
};

export default Reports;