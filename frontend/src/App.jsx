import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { PublicDashboard } from './pages/PublicDashboard';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Dashboard } from './pages/Dashboard';
import { MyComplaints } from './pages/MyComplaints';
import { SubmitComplaint } from './pages/SubmitComplaint';
import { HotspotDashboard } from './pages/HotspotDashboard';
import { Login } from './pages/Login';
import { AdminLogin } from './pages/AdminLogin';
import { CMLogin } from './pages/CMLogin';
import { Register } from './pages/Register';
import { SetupProfile } from './pages/SetupProfile';
import { Profile } from './pages/Profile';
import { CMDashboard } from './pages/CMDashboard';
import { AuthProvider } from './context/AuthContext';
import { LocalComplaintsProvider } from './context/LocalComplaintsContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { AdminDashboard } from './components/local/AdminDashboard';
import { About } from './pages/About';
import { Services } from './pages/Services';
import { HowItWorks } from './pages/HowItWorks';
import { FAQs } from './pages/FAQs';
import { Contact } from './pages/Contact';
import { HelpSupport } from './pages/HelpSupport';

function App() {
  return (
    <AuthProvider>
      <LocalComplaintsProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Services />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/faqs" element={<FAQs />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/public-dashboard" element={<PublicDashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/cm-login" element={<CMLogin />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected Routes by Role */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/hotspot-dashboard" element={<HotspotDashboard />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['cm']} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/cm-dashboard" element={<CMDashboard />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['citizen']} />}>
              <Route path="/setup-profile" element={<SetupProfile />} />
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/complaints" element={<MyComplaints />} />
                <Route path="/submit" element={<SubmitComplaint />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/help" element={<HelpSupport />} />
              </Route>
            </Route>
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </LocalComplaintsProvider>
    </AuthProvider>
  );
}

export default App;
