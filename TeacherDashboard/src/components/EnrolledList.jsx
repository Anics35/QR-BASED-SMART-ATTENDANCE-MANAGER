import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api';

const EnrolledList = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { courseId, courseName } = location.state || {};

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseId) return navigate('/courses');

    const fetchStudents = async () => {
      try {
        const { data } = await api.get(`/course/${courseId}/students`);
        setStudents(data.students);
      } catch (error) {
        alert("Failed to load student list");
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [courseId, navigate]);

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.titleGroup}>
            <button onClick={() => navigate('/courses')} style={styles.backBtn}>← Back</button>
            <div>
              <h1 style={styles.pageTitle}>Enrolled Students</h1>
              <div style={styles.breadcrumb}>{courseName}</div>
            </div>
          </div>
          <div style={styles.badge}>
            {students.length} Students
          </div>
        </div>
      </header>

      <div style={styles.main}>
        <div style={styles.card}>
          {loading ? (
            <div style={styles.loading}>Loading class list...</div>
          ) : students.length === 0 ? (
            <div style={styles.empty}>
              <p>No students have joined this course yet.</p>
              <p style={{fontSize:'14px', color:'#666'}}>Share the Course Code with them!</p>
            </div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Roll Number</th>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student._id} style={styles.tr}>
                      <td style={styles.td}>
                        <span style={styles.rollTag}>{student.rollNumber}</span>
                      </td>
                      <td style={styles.td}>
                        <strong>{student.name}</strong>
                      </td>
                      {/* FIXED LINE BELOW: Merged styles properly */}
                      <td style={{...styles.td, color:'#666'}}>{student.email}</td>
                      <td style={styles.td}>
                        <span style={styles.activeTag}>Enrolled</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Styles
const styles = {
  page: { minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: "'Inter', sans-serif" },
  header: { backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb' },
  headerContent: { maxWidth: '1000px', margin: '0 auto', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  titleGroup: { display: 'flex', alignItems: 'center', gap: '1.5rem' },
  backBtn: { background: 'transparent', border: '1px solid #d1d5db', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', color: '#6b7280', fontWeight: '600' },
  pageTitle: { fontSize: '1.25rem', fontWeight: '700', margin: 0, color: '#111827' },
  breadcrumb: { fontSize: '0.875rem', color: '#6b7280' },
  badge: { background: '#eff6ff', color: '#2563eb', padding: '0.5rem 1rem', borderRadius: '20px', fontWeight: 'bold' },
  
  main: { maxWidth: '1000px', margin: '0 auto', padding: '2rem' },
  card: { background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflow: 'hidden', minHeight: '400px' },
  
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  th: { padding: '1rem 1.5rem', background: '#f9fafb', color: '#6b7280', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '600', borderBottom: '1px solid #e5e7eb' },
  tr: { borderBottom: '1px solid #f3f4f6' },
  td: { padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#374151' },
  
  rollTag: { background: '#f3f4f6', padding: '4px 8px', borderRadius: '6px', fontWeight: '600', fontSize: '0.8rem' },
  activeTag: { color: '#16a34a', background: '#dcfce7', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600' },
  
  loading: { padding: '3rem', textAlign: 'center', color: '#666' },
  empty: { padding: '4rem', textAlign: 'center', color: '#999', fontStyle: 'italic' }
};

export default EnrolledList;