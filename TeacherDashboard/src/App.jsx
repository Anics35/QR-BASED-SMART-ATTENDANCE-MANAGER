import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Public Pages
import Login from './components/Login';
import Register from './components/Register';

// Teacher Pages
import Courses from './components/Courses';
import Dashboard from './components/Dashboard';
import CourseReport from './components/CourseReport';
import EnrolledList from './components/EnrolledList';
import SessionDetail from './components/SessionDetail';
import StudentDetail from './components/StudentDetail';

// Admin Pages
import AdminDashboard from './components/AdminDashboard';
import UserManagement from './components/UserManagement'; // <--- ADDED THIS
import UserDetail from './components/UserDetail'; // For Admin to see profile

function App() {
  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Teacher / Faculty Routes */}
        <Route path="/courses" element={<Courses />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/report" element={<CourseReport />} />
        <Route path="/students" element={<EnrolledList />} />
        <Route path="/session-detail" element={<SessionDetail />} />
        <Route path="/student-detail" element={<StudentDetail />} />

        {/* Admin Routes */}
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/user-management" element={<UserManagement />} /> {/* <--- ADDED THIS */}
        <Route path="/user-detail" element={<UserDetail />} />
      </Routes>
    </Router>
  );
}

export default App;