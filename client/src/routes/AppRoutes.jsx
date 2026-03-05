import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import PatientLayout from '../layouts/PatientLayout';
import DoctorLayout from '../layouts/DoctorLayout';
import AdminLayout from '../layouts/AdminLayout';
import LandingPage from '../pages/LandingPage';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import NotFound from '../pages/NotFound';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuthContext } from '../context/AuthContext';
import TokenDisplay from '../pages/public/TokenDisplay';
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
import Feed from '../pages/patient/Feed';
import PatientDashboard from '../pages/dashboards/PatientDashboard';
import DoctorDashboard from '../pages/doctor/DoctorDashboard';
import AppointmentQueue from '../pages/doctor/AppointmentQueue';
import DoctorProfile from '../pages/doctor/DoctorProfile';
import TokenQueue from '../pages/doctor/TokenQueue';
import Consultation from '../pages/doctor/Consultation';
import TokenConsultation from '../pages/doctor/TokenConsultation';
import MyPatients from '../pages/doctor/MyPatients';
import CreatePost from '../pages/doctor/CreatePost';
import MyPosts from '../pages/doctor/MyPosts';
import RegisterClinic from '../pages/doctor/RegisterClinic';
import DoctorAppointments from '../pages/doctor/Appointments';
import DoctorAvailability from '../pages/doctor/Availability';
import AppointmentConsult from '../pages/doctor/AppointmentConsult';
import PrescriptionPreview from '../pages/doctor/PrescriptionPreview';
import AdminDashboard from '../pages/dashboards/AdminDashboard';
import ClinicApprovals from '../pages/admin/ClinicApprovals';
import AllClinics from '../pages/admin/AllClinics';
import Users from '../pages/admin/Users';
import ReportViewer from '../pages/common/ReportViewer';

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
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Public TV Token Display */}
            <Route path="/display/:clinicId" element={<TokenDisplay />} />

            {/* General App Viewer Route */}
            <Route path="/report-viewer" element={<ReportViewer />} />

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
                    <Route path="/patient/feed" element={<Feed />} />
                </Route>
            </Route>

            {/* Doctor Routes with DoctorLayout */}
            <Route
                element={<ProtectedRoute allowedRoles={['DOCTOR']} />}
            >
                <Route element={<DoctorLayout />}>
                    <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
                    <Route path="/doctor/register-clinic" element={<RegisterClinic />} />
                    <Route path="/doctor/queue" element={<AppointmentQueue />} />
                    <Route path="/doctor/token-queue" element={<TokenQueue />} />
                    <Route path="/doctor/consult/:appointmentId" element={<Consultation />} />
                    <Route path="/doctor/token-consult/:tokenId" element={<TokenConsultation />} />
                    <Route path="/doctor/patients" element={<MyPatients />} />
                    <Route path="/doctor/create-post" element={<CreatePost />} />
                    <Route path="/doctor/posts" element={<MyPosts />} />
                    <Route path="/doctor/profile" element={<DoctorProfile />} />
                    <Route path="/doctor/appointments" element={<DoctorAppointments />} />
                    <Route path="/doctor/availability" element={<DoctorAvailability />} />
                    <Route path="/doctor/appointment-consult/:appointmentId" element={<AppointmentConsult />} />
                    <Route path="/doctor/prescription/:appointmentId" element={<PrescriptionPreview />} />
                </Route>
            </Route>

            {/* Admin Routes with AdminLayout */}
            <Route
                element={<ProtectedRoute allowedRoles={['ADMIN']} />}
            >
                <Route element={<AdminLayout />}>
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                    <Route path="/admin/approvals" element={<ClinicApprovals />} />
                    <Route path="/admin/clinics" element={<AllClinics />} />
                    <Route path="/admin/users" element={<Users />} />
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
