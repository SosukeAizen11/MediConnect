import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import PatientLayout from '../layouts/PatientLayout';
import Home from '../pages/Home';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import NotFound from '../pages/NotFound';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuthContext } from '../context/AuthContext';
import BrowseClinics from '../pages/patient/BrowseClinics';
import ClinicDoctors from '../pages/patient/ClinicDoctors';
import BookAppointment from '../pages/patient/BookAppointment';
import MyAppointments from '../pages/patient/MyAppointments';
import MedicalRecords from '../pages/patient/MedicalRecords';
import AIHealthInsights from '../pages/patient/AIHealthInsights';
import Notifications from '../pages/patient/Notifications';
import JoinTokenQueue from '../pages/patient/JoinTokenQueue';
import MyToken from '../pages/patient/MyToken';
import Profile from '../pages/patient/Profile';
import DoctorFeed from '../pages/patient/DoctorFeed';
import PatientDashboard from '../pages/dashboards/PatientDashboard';
import DoctorDashboard from '../pages/dashboards/DoctorDashboard';
import AdminDashboard from '../pages/dashboards/AdminDashboard';

const getRedirectPath = (role) => {
    switch (role) {
        case 'PATIENT':
            return '/patient/dashboard';
        case 'DOCTOR':
            return '/doctor/dashboard';
        case 'ADMIN':
            return '/admin/dashboard';
        default:
            return '/login';
    }
};

function AppRoutes() {
    const { token, user } = useAuthContext();

    return (
        <Routes>
            {/* Public Routes */}
            <Route
                path="/"
                element={
                    token && user ? (
                        <Navigate to={getRedirectPath(user.role)} replace />
                    ) : (
                        <Home />
                    )
                }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Patient Routes with PatientLayout */}
            <Route
                element={<ProtectedRoute allowedRoles={['PATIENT']} />}
            >
                <Route element={<PatientLayout />}>
                    <Route path="/patient/dashboard" element={<PatientDashboard />} />
                    <Route path="/patient/clinics" element={<BrowseClinics />} />
                    <Route path="/patient/clinics/:clinicId" element={<ClinicDoctors />} />
                    <Route path="/patient/book/:clinicId/:doctorId" element={<BookAppointment />} />
                    <Route path="/patient/appointments" element={<MyAppointments />} />
                    <Route path="/patient/records" element={<MedicalRecords />} />
                    <Route path="/patient/ai-insights" element={<AIHealthInsights />} />
                    <Route path="/patient/notifications" element={<Notifications />} />
                    <Route path="/patient/join-token/:clinicId" element={<JoinTokenQueue />} />
                    <Route path="/patient/token" element={<MyToken />} />
                    <Route path="/patient/profile" element={<Profile />} />
                    <Route path="/patient/feed" element={<DoctorFeed />} />
                </Route>
            </Route>

            {/* Doctor Routes */}
            <Route element={<MainLayout />}>
                <Route
                    element={<ProtectedRoute allowedRoles={['DOCTOR']} />}
                >
                    <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
                </Route>
            </Route>

            {/* Admin Routes */}
            <Route element={<MainLayout />}>
                <Route
                    element={<ProtectedRoute allowedRoles={['ADMIN']} />}
                >
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                </Route>
            </Route>

            {/* 404 */}
            <Route element={<MainLayout />}>
                <Route path="*" element={<NotFound />} />
            </Route>
        </Routes>
    );
}

export default AppRoutes;
