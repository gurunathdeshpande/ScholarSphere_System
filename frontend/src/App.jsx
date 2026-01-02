import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Search from './pages/Search';
import './App.css';

import FacultyDetails from './pages/FacultyDetails';
import FacultyDashboard from './pages/FacultyDashboard';
import FacultyCollaborationDashboard from './pages/FacultyCollaborationDashboard';
import Forum from './pages/Forum';
import ForumTopic from './pages/ForumTopic';
import Analytics from './pages/Analytics';
import StudentCollaborationDashboard from './pages/StudentCollaborationDashboard';
import RequestVerification from './pages/RequestVerification';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="blob"></div>
        <div className="blob blob-2"></div>
        <Navbar />
        <div className="app-content container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/request-verification" element={<RequestVerification />} />
            <Route path="/search" element={<Search />} />
            <Route path="/faculty/:id" element={<FacultyDetails />} />
            <Route path="/forum" element={<Forum />} />
            <Route path="/forum/topic/:id" element={<ForumTopic />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route
              path="/student/collaboration"
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentCollaborationDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requiredRole="faculty">
                  <FacultyDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/collaboration"
              element={
                <ProtectedRoute requiredRole="faculty">
                  <FacultyCollaborationDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
