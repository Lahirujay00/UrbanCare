import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';

// Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import LoadingSpinner from './components/ui/LoadingSpinner';

// Pages
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyEmail from './pages/auth/VerifyEmail';

// Patient Pages
import PatientDashboard from './pages/patient/PatientDashboardEnhanced';
import Profile from './pages/patient/Profile';
import ProfileEditor from './pages/patient/ProfileEditor';

// Doctor Pages
import DoctorDashboard from './pages/doctor/DoctorDashboardEnhanced';
import PatientRecordsRouter from './pages/doctor/PatientRecordsRouter';
import Appointments from './pages/doctor/Appointments';
import AvailabilityManagement from './pages/doctor/AvailabilityManagement';
import DoctorProfileEditor from './pages/doctor/ProfileEditor';

// Staff Pages
import StaffDashboard from './pages/staff/DashboardFull';
import PatientVerification from './pages/staff/PatientVerification';

// Manager Pages
import ManagerDashboard from './pages/manager/DashboardFull';
import Reports from './pages/manager/Reports';
import UserManagement from './pages/manager/UserManagement';

// Receptionist Pages
import ReceptionistDashboard from './pages/receptionist/ReceptionistDashboard';

// Shared Pages
import AppointmentDetails from './pages/AppointmentDetails';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (user) {
    // Redirect based on user role
    const roleRoutes = {
      patient: '/dashboard',
      doctor: '/doctor/dashboard',
      staff: '/staff/dashboard',
      manager: '/manager/dashboard',
      receptionist: '/receptionist/dashboard'
    };
    return <Navigate to={roleRoutes[user.role] || '/dashboard'} replace />;
  }

  return children;
};

// Layout Component
const Layout = ({ children }) => (
  <div className="min-h-screen bg-gray-50 flex flex-col">
    <Navbar />
    <main className="flex-grow container mx-auto px-4 py-8">
      {children}
    </main>
    <Footer />
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={
                <Layout>
                  <Home />
                </Layout>
              } />
              
              <Route path="/about" element={
                <Layout>
                  <About />
                </Layout>
              } />
              
              <Route path="/contact" element={
                <Layout>
                  <Contact />
                </Layout>
              } />
              
              <Route path="/login" element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } />
              
              <Route path="/register" element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } />
              
              <Route path="/forgot-password" element={
                <PublicRoute>
                  <ForgotPassword />
                </PublicRoute>
              } />
              
              <Route path="/reset-password/:token" element={
                <PublicRoute>
                  <ResetPassword />
                </PublicRoute>
              } />
              
              <Route path="/verify-email/:token" element={
                <VerifyEmail />
              } />

              {/* Patient Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <Layout>
                    <PatientDashboard />
                  </Layout>
                </ProtectedRoute>
              } />
              
              {/* Legacy routes - redirect to dashboard with tab parameter */}
              <Route path="/appointments/book" element={
                <Navigate to="/dashboard?tab=book-appointment" replace />
              } />
              
              <Route path="/book-appointment" element={
                <Navigate to="/dashboard?tab=book-appointment" replace />
              } />
              
              <Route path="/records" element={
                <Navigate to="/dashboard?tab=documents" replace />
              } />
              
              <Route path="/medical-records" element={
                <Navigate to="/dashboard?tab=documents" replace />
              } />
              
              <Route path="/digital-health-card" element={
                <Navigate to="/dashboard?tab=health-card" replace />
              } />
              
              <Route path="/profile" element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <Layout>
                    <Profile />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/profile/edit" element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <Layout>
                    <ProfileEditor />
                  </Layout>
                </ProtectedRoute>
              } />

              {/* Shared Routes */}
              <Route path="/appointments/:id" element={
                <ProtectedRoute allowedRoles={['patient', 'doctor', 'staff', 'manager']}>
                  <Layout>
                    <AppointmentDetails />
                  </Layout>
                </ProtectedRoute>
              } />

              {/* Doctor Routes */}
              <Route path="/doctor/dashboard" element={
                <ProtectedRoute allowedRoles={['doctor']}>
                  <Layout>
                    <DoctorDashboard />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/doctor/appointments" element={
                <ProtectedRoute allowedRoles={['doctor']}>
                  <Layout>
                    <Appointments />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/doctor/patient-records" element={
                <ProtectedRoute allowedRoles={['doctor']}>
                  <Layout>
                    <PatientRecordsRouter />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/doctor/availability" element={
                <ProtectedRoute allowedRoles={['doctor']}>
                  <Layout>
                    <AvailabilityManagement />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/doctor/profile/edit" element={
                <ProtectedRoute allowedRoles={['doctor']}>
                  <Layout>
                    <DoctorProfileEditor />
                  </Layout>
                </ProtectedRoute>
              } />

              {/* Staff Routes */}
              <Route path="/staff/dashboard" element={
                <ProtectedRoute allowedRoles={['staff']}>
                  <Layout>
                    <StaffDashboard />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/staff/patient-verification" element={
                <ProtectedRoute allowedRoles={['staff']}>
                  <Layout>
                    <PatientVerification />
                  </Layout>
                </ProtectedRoute>
              } />

              {/* Manager Routes */}
              <Route path="/manager/dashboard" element={
                <ProtectedRoute allowedRoles={['manager']}>
                  <Layout>
                    <ManagerDashboard />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/manager/reports" element={
                <ProtectedRoute allowedRoles={['manager']}>
                  <Layout>
                    <Reports />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/manager/users" element={
                <ProtectedRoute allowedRoles={['manager']}>
                  <Layout>
                    <UserManagement />
                  </Layout>
                </ProtectedRoute>
              } />

              {/* Receptionist Routes */}
              <Route path="/receptionist/dashboard" element={
                <ProtectedRoute allowedRoles={['receptionist']}>
                  <Layout>
                    <ReceptionistDashboard />
                  </Layout>
                </ProtectedRoute>
              } />

              {/* Error Routes */}
              <Route path="/unauthorized" element={
                <Layout>
                  <div className="text-center py-16">
                    <h1 className="text-3xl font-bold text-red-600 mb-4">Unauthorized</h1>
                    <p className="text-gray-600">You don't have permission to access this page.</p>
                  </div>
                </Layout>
              } />
              
              <Route path="*" element={
                <Layout>
                  <div className="text-center py-16">
                    <h1 className="text-3xl font-bold text-gray-800 mb-4">404 - Page Not Found</h1>
                    <p className="text-gray-600">The page you're looking for doesn't exist.</p>
                  </div>
                </Layout>
              } />
            </Routes>

            {/* Global Toast Notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#10B981',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 5000,
                  iconTheme: {
                    primary: '#EF4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;