import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './routes/ProtectedRoute'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import DashboardLayout from './layouts/DashboardLayout'
import DashboardHome from './pages/dashboard/DashboardHome'
import ProfilePage from './pages/dashboard/ProfilePage'
import AdminUsersPage from './pages/dashboard/AdminUsersPage'
import AdminVerificationPage from './pages/dashboard/AdminVerificationPage'
import StudentVerificationPage from './pages/dashboard/StudentVerificationPage'
import InternshipsPage from './pages/dashboard/InternshipsPage'
import InternshipDetailPage from './pages/dashboard/InternshipDetailPage'
import PostInternshipPage from './pages/dashboard/PostInternshipPage'
import PartnersPage from './pages/dashboard/PartnersPage'
import InvitationsPage from './pages/dashboard/InvitationsPage'
import ApplicationsPage from './pages/dashboard/ApplicationsPage'
import PlacementsPage from './pages/dashboard/PlacementsPage'
import TasksPage from './pages/dashboard/TasksPage'
import AssessmentsPage from './pages/dashboard/AssessmentsPage'
import ReportsPage from './pages/dashboard/ReportsPage'
import AuditPage from './pages/dashboard/AuditPage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ── Public ── */}
          <Route
            path="/"
            element={
              <>
                <Navbar />
                <LandingPage />
                <Footer />
              </>
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* ── Authenticated workspace ── */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardHome />} />
            <Route path="/dashboard/profile" element={<ProfilePage />} />
            <Route path="/dashboard/users" element={<AdminUsersPage />} />
            <Route path="/dashboard/verification" element={<AdminVerificationPage />} />
            <Route path="/dashboard/students" element={<StudentVerificationPage />} />
            <Route path="/dashboard/internships" element={<InternshipsPage />} />
            <Route path="/dashboard/internships/:id" element={<InternshipDetailPage />} />
            <Route path="/dashboard/post-internship" element={<PostInternshipPage />} />
            <Route path="/dashboard/post-internship/:id" element={<PostInternshipPage />} />
            <Route path="/dashboard/partners" element={<PartnersPage />} />
            <Route path="/dashboard/invitations" element={<InvitationsPage />} />
            <Route path="/dashboard/applications" element={<ApplicationsPage />} />
            <Route path="/dashboard/placements" element={<PlacementsPage />} />
            <Route path="/dashboard/tasks" element={<TasksPage />} />
            <Route path="/dashboard/assessments" element={<AssessmentsPage />} />
            <Route path="/dashboard/reports" element={<ReportsPage />} />
            <Route path="/dashboard/audit" element={<AuditPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
