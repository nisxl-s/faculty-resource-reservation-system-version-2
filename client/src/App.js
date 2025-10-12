import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Lazy load components for code splitting
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const Admin = lazy(() => import('./pages/admin'));
const User = lazy(() => import('./pages/user'));
const BookingHistory = lazy(() => import('./pages/bookinghistory'));
const Notify = lazy(() => import('./pages/notify'));
const Legal = lazy(() => import('./pages/Legal'));
const UserManagement = lazy(() => import('./pages/user_management'));
const Profile = lazy(() => import('./pages/Profile'));

// Student pages
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const BrowseResources = lazy(() => import('./pages/BrowseResources'));
const BookResource = lazy(() => import('./pages/BookResource'));
const MyReservations = lazy(() => import('./pages/MyReservations'));
const StudentProfile = lazy(() => import('./pages/StudentProfile'));
const Help = lazy(() => import('./pages/Help'));
const Feedback = lazy(() => import('./pages/Feedback'));

// Loading component
const LoadingSpinner = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'rgba(0, 0, 0, 0.9)'
  }}>
    <div style={{
      border: '4px solid rgba(250, 234, 9, 0.3)',
      borderTop: '4px solid #faea09',
      borderRadius: '50%',
      width: '50px',
      height: '50px',
      animation: 'spin 1s linear infinite'
    }}></div>
  </div>
);

function App(){
  const appStyle = {
    minHeight: '100vh',
    backgroundImage: 'url(/bg-image.jpeg)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed'
  };

  return (
    <div style={appStyle}>
      <BrowserRouter>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<HomePage/>} />
            <Route path="/login" element={<LoginPage/>} />
            <Route path="/register" element={<RegisterPage/>} />
            <Route path="/admin" element={<Admin/>} />
            <Route path="/user" element={<User/>} />
            <Route path="/booking-history" element={<BookingHistory/>} />
            <Route path="/notify" element={<Notify/>} />
            <Route path="/legal" element={<Legal/>} />
            <Route path="/user-management" element={<UserManagement/>} />
            <Route path="/profile" element={<Profile/>} />
            
            {/* Student routes */}
            <Route path="/student" element={<StudentDashboard/>} />
            <Route path="/browse-resources" element={<BrowseResources/>} />
            <Route path="/book-resource" element={<BookResource/>} />
            <Route path="/book-resource/:resourceId" element={<BookResource/>} />
            <Route path="/my-reservations" element={<MyReservations/>} />
            <Route path="/student-profile" element={<StudentProfile/>} />
            <Route path="/help" element={<Help/>} />
            <Route path="/feedback" element={<Feedback/>} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </div>
  );
}

export default App;
