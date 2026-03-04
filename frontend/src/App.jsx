import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import './App.css';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const role = localStorage.getItem('user_role');
    const token = localStorage.getItem('access_token');

    if (!token || !role) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(role)) {
        return <Navigate to="/login" replace />; // or an unauthorized page
    }

    return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route 
            path="/patient-dashboard" 
            element={
                <ProtectedRoute allowedRoles={['PATIENT']}>
                    <PatientDashboard />
                </ProtectedRoute>
            } 
        />
        <Route 
            path="/doctor-dashboard" 
            element={
                <ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}>
                    <DoctorDashboard />
                </ProtectedRoute>
            } 
        />
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
