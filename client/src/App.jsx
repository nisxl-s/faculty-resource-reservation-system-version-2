import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import FloatingHelpButton from './components/FloatingHelpButton';
import Grainient from './components/Grainient';
import LoadingScreen from './components/LoadingScreen';
import {LoadingProvider,usePendingLoads} from './components/LoadingState';
import ErrorScreen from './components/ErrorScreen';
import { useBootstrap } from './hooks/useBootstrap';
import { getJSON } from './utils/getJSON';
import API_BASE_URL from './config/api';

import { ToastProvider } from './components/common/Toast';
import { ConfirmProvider } from './components/common/Modal';

// Core & Public pages (directly imported for instant, flicker-free transitions)
import HomePage from './pages/HomePage';
import Footer from './components/footer/Footer';
import RouteScrollReset from './components/RouteScrollReset';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Legal from './pages/Legal';

// Admin pages (directly imported for instant, flicker-free transitions)
import Admin from './pages/admin';
import User from './pages/user';
import BookingHistory from './pages/bookinghistory';
import Notify from './pages/notify';
import UserManagement from './pages/user_management';
import ResourceManagement from './pages/ResourceManagement';
import Profile from './pages/Profile';

// Student pages (directly imported for instant, flicker-free transitions)
import StudentDashboard from './pages/StudentDashboard';
import BrowseResources from './pages/BrowseResources';
import BookResource from './pages/BookResource';
import MyReservations from './pages/MyReservations';
import StudentProfile from './pages/StudentProfile';
import Help from './pages/Help';
import NotFound from './pages/NotFound';
import Feedback from './pages/Feedback';

// Bootstrap tasks - run in parallel while the loading screen is shown.
// A best-effort health check keeps public pages available when the API is offline.
const BOOTSTRAP_TASKS = [
  { name: 'health', run: () => getJSON(`${API_BASE_URL}/health`).catch(() => null) },
];

function AppContent() {
  const pendingLoads=usePendingLoads();
  const { isLoading, progress, error } = useBootstrap(BOOTSTRAP_TASKS);

  // Show error screen only on non-auth errors (auth errors are handled per-page)
  if (error && !error.message?.includes('401') && !error.message?.includes('403')) {
    return <ErrorScreen error={error} />;
  }

  return (
    <div className="app-root" style={{ position: 'relative', minHeight: '100vh', width: '100%' }}>
      {/* Only show the animation when actual loading exceeds the short delay. */}
      <LoadingScreen isLoading={isLoading || pendingLoads > 0} progress={pendingLoads > 0 ? undefined : progress} delay={500} />

      {/* Background Animated Gradient */}
      <div
        className="app-grainient-bg"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 0,
          pointerEvents: 'none',
          overflow: 'hidden'
        }}
      >
        <Grainient
          color1="#000b1f"
          color2="#274fff"
          color3="#00a8ff"
          timeSpeed={0.25}
          colorBalance={0}
          warpStrength={1}
          warpFrequency={5}
          warpSpeed={2}
          warpAmplitude={50}
          blendAngle={0}
          blendSoftness={0.05}
          rotationAmount={500}
          noiseScale={2}
          grainAmount={0.1}
          grainScale={2}
          grainAnimated={false}
          contrast={1.5}
          gamma={1}
          saturation={1}
          centerX={0}
          centerY={0}
          zoom={0.9}
        />
      </div>

      <div
        className="app-main-content"
        style={{
          position: 'relative',
          zIndex: 1
        }}
      >
        <BrowserRouter>
          <RouteScrollReset />
          <ToastProvider>
            <ConfirmProvider>
              <Suspense fallback={null}>
                <Routes>
                  <Route path="/review-reservations" element={<Navigate to="/booking-history" replace />} />
                  <Route path="/support-review" element={<Navigate to="/help?panel=review" replace />} />
                  <Route path="/support" element={<Navigate to="/help?panel=requests" replace />} />
                  <Route path="/" element={<HomePage/>} />
                  <Route path="/login" element={<LoginPage/>} />
                  <Route path="/register" element={<RegisterPage/>} />
                  <Route path="/forgot-password" element={<ForgotPassword/>} />
                  <Route path="/reset-password" element={<ResetPassword/>} />
                  <Route path="/admin" element={<Admin/>} />
                  <Route path="/dashboard" element={<StudentDashboard/>} />
                  <Route path="/user" element={<User/>} />
                  <Route path="/booking-history" element={<BookingHistory/>} />
                  <Route path="/notify" element={<Notify/>} />
                  <Route path="/legal" element={<Legal/>} />
                  <Route path="/user-management" element={<UserManagement/>} />
                  <Route path="/user_management" element={<UserManagement/>} />
                  <Route path="/resource-management" element={<ResourceManagement/>} />
                  <Route path="/profile" element={<Profile/>} />

                  {/* Student routes */}
                  <Route path="/student" element={<StudentDashboard/>} />
                  <Route path="/browse-resources" element={<BrowseResources/>} />
                  <Route path="/resources" element={<BrowseResources/>} />
                  <Route path="/book-resource" element={<BookResource/>} />
                  <Route path="/booking" element={<BookingHistory/>} />
                  <Route path="/reports" element={<BookingHistory/>} />
                  <Route path="/book-resource/:resourceId" element={<BookResource/>} />
                  <Route path="/my-reservations" element={<MyReservations/>} />
                  <Route path="/mybooking" element={<MyReservations/>} />
                  <Route path="/student-profile" element={<StudentProfile/>} />
                  <Route path="/help" element={<Help/>} />
                  <Route path="/feedback" element={<Feedback/>} />
                  <Route path="*" element={<NotFound/>} />
                </Routes>
                <Footer />
                <FloatingHelpButton />
              </Suspense>
            </ConfirmProvider>
          </ToastProvider>
        </BrowserRouter>
      </div>
    </div>
  );
}

export default function App(){return <LoadingProvider><AppContent /></LoadingProvider>;}
