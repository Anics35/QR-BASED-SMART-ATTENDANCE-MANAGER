import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Courses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    courseName: '',
    courseCode: '',
    department: '',
    semester: 'Autumn',
    year: new Date().getFullYear(),
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data } = await api.get('/course/teacher');
      setCourses(data.courses || []);
    } catch (error) {
      console.error("Failed to load courses", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/course/${editingId}`, formData);
        alert("Course Updated Successfully!");
      } else {
        await api.post('/course/create', {
          ...formData,
          location: { room: "Default", coordinates: { latitude: 0, longitude: 0 } } 
        });
        alert("Course Created Successfully!");
      }
      resetForm();
      fetchCourses();
    } catch (error) {
      alert(error.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("⚠️ Danger: Deleting this course will erase ALL attendance records associated with it.\n\nAre you sure?")) return;
    
    try {
      await api.delete(`/course/${id}`);
      fetchCourses();
    } catch (error) {
      alert("Delete failed");
    }
  };

  const handleEdit = (course) => {
    setEditingId(course._id);
    setFormData({
      courseName: course.courseName,
      courseCode: course.courseCode,
      department: course.department,
      semester: course.semester,
      year: course.year
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      courseName: '',
      courseCode: '',
      department: '',
      semester: 'Autumn',
      year: new Date().getFullYear(),
    });
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>My Courses</h1>
          <div style={styles.actions}>
            <button onClick={() => { resetForm(); setShowForm(!showForm); }} style={styles.addBtn}>
              {showForm ? 'Cancel' : '+ New Course'}
            </button>
            <button onClick={() => navigate('/')} style={styles.logoutBtn}>Logout</button>
          </div>
        </div>
      </header>

      <div style={styles.main}>
        {/* COURSE FORM (Shown conditionally) */}
        {showForm && (
          <div style={styles.formContainer}>
            <div style={styles.formCard}>
              <h2 style={styles.formTitle}>{editingId ? 'Edit Course' : 'Create New Course'}</h2>
              <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.row}>
                  <div style={styles.field}>
                    <label style={styles.label}>Course Name</label>
                    <input 
                      placeholder="e.g. Operating Systems" 
                      value={formData.courseName}
                      required style={styles.input}
                      onChange={(e) => setFormData({...formData, courseName: e.target.value})}
                    />
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>Course Code</label>
                    <input 
                      placeholder="e.g. CSB401" 
                      value={formData.courseCode}
                      required style={styles.input}
                      onChange={(e) => setFormData({...formData, courseCode: e.target.value})}
                    />
                  </div>
                </div>
                <div style={styles.row}>
                  <div style={styles.field}>
                    <label style={styles.label}>Department</label>
                    <input 
                      placeholder="e.g. CSE" 
                      value={formData.department}
                      required style={styles.input}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                    />
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>Semester</label>
                    <select 
                      style={styles.input}
                      value={formData.semester}
                      onChange={(e) => setFormData({...formData, semester: e.target.value})}
                    >
                      <option value="Autumn">Autumn</option>
                      <option value="Spring">Spring</option>
                    </select>
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>Year</label>
                    <input 
                      type="number"
                      value={formData.year}
                      style={styles.input}
                      onChange={(e) => setFormData({...formData, year: e.target.value})}
                    />
                  </div>
                </div>
                <button type="submit" style={styles.submitBtn}>
                  {editingId ? 'Update Course' : 'Create Course'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* COURSE GRID */}
        <div style={styles.grid}>
          {courses.map(course => (
            <div key={course._id} style={styles.card}>
              <div style={styles.cardTop}>
                <span style={styles.codeBadge}>{course.courseCode}</span>
                <div style={styles.cardActions}>
                  <button onClick={() => handleEdit(course)} style={styles.iconBtn} title="Edit">✏️</button>
                  <button onClick={() => handleDelete(course._id)} style={{...styles.iconBtn, color:'#ef4444'}} title="Delete">🗑️</button>
                </div>
              </div>
              
              <h3 style={styles.courseTitle}>{course.courseName}</h3>
              <p style={styles.courseMeta}>
                {course.department} • {course.semester} {course.year}
              </p>
              
              <div style={styles.buttonGroup}>
                {/* PRIMARY: START CLASS */}
                <button 
                  style={styles.startBtn}
                  onClick={() => navigate('/dashboard', { state: { courseId: course._id, courseName: course.courseName } })}
                >
                  ▶ Start Class
                </button>

                {/* SECONDARY: REPORTS & STUDENTS */}
                <div style={styles.secondaryGroup}>
                    <button 
                      style={styles.secondaryBtn}
                      onClick={() => navigate('/report', { state: { courseId: course._id, courseName: course.courseName } })}
                    >
                      📊 Reports
                    </button>
                    <button 
                      style={styles.secondaryBtn}
                      onClick={() => navigate('/students', { state: { courseId: course._id, courseName: course.courseName } })}
                    >
                      👥 Students
                    </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {courses.length === 0 && !showForm && (
            <div style={styles.emptyState}>
                <div style={{fontSize:'40px', marginBottom:'10px'}}>📚</div>
                <p>You haven't created any courses yet.</p>
                <p style={{fontSize:'14px', color:'#9ca3af'}}>Click "+ New Course" to get started.</p>
            </div>
        )}
      </div>
    </div>
  );
};

// --- PROFESSIONAL STYLES ---
const styles = {
  page: { minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: "'Inter', sans-serif", color:'#1f2937' },
  header: { backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb', position:'sticky', top:0, zIndex:10 },
  headerContent: { maxWidth: '1280px', margin: '0 auto', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: '1.25rem', fontWeight: '700', color: '#111827', margin: 0 },
  actions: { display:'flex', gap:'1rem' },
  
  addBtn: { background: '#2563eb', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: '600', fontSize:'0.875rem' },
  logoutBtn: { background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', padding: '0.5rem 1rem', borderRadius: '0.375rem', cursor: 'pointer', fontSize:'0.875rem', fontWeight:'500' },

  main: { padding: '2rem', maxWidth: '1280px', margin: '0 auto' },

  // Form
  formContainer: { marginBottom: '2rem' },
  formCard: { background: 'white', padding: '2rem', borderRadius: '0.75rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border:'1px solid #e5e7eb' },
  formTitle: { marginTop: 0, marginBottom: '1.5rem', fontSize: '1.125rem', fontWeight: '600' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  row: { display: 'flex', gap: '1.5rem', flexWrap:'wrap' },
  field: { flex: 1, minWidth: '200px' },
  label: { display:'block', fontSize:'0.875rem', fontWeight:'500', color:'#4b5563', marginBottom:'0.25rem' },
  input: { width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', fontSize: '0.875rem' },
  submitBtn: { marginTop:'1rem', padding: '0.75rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: '600' },

  // Grid
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' },
  
  // Card
  card: { background: 'white', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', transition: 'transform 0.1s', ':hover': { transform: 'translateY(-2px)' } },
  cardTop: { display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' },
  codeBadge: { background: '#eff6ff', color: '#2563eb', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '600' },
  cardActions: { display: 'flex', gap: '0.5rem' },
  iconBtn: { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem', padding:'0' },
  
  courseTitle: { fontSize: '1.125rem', fontWeight: '700', margin: '0 0 0.25rem 0', color:'#111827' },
  courseMeta: { fontSize: '0.875rem', color: '#6b7280', margin: '0 0 1.5rem 0' },

  buttonGroup: { marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  startBtn: { width: '100%', padding: '0.75rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: '600', fontSize:'0.875rem' },
  
  secondaryGroup: { display: 'flex', gap: '0.75rem' },
  secondaryBtn: { flex: 1, padding: '0.625rem', background: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: '500', fontSize:'0.875rem' },

  emptyState: { textAlign: 'center', padding: '4rem', color: '#6b7280', background:'white', borderRadius:'0.75rem', border:'1px dashed #d1d5db' }
};

export default Courses;