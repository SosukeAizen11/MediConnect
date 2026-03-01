import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import PatientDashboard from './dashboards/PatientDashboard';
import DoctorDashboard from './dashboards/DoctorDashboard';
import AdminDashboard from './dashboards/AdminDashboard';

function Dashboard() {
    const { user, logout } = useAuthContext();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const renderDashboard = () => {
        switch (user?.role) {
            case 'PATIENT':
                return <PatientDashboard />;
            case 'DOCTOR':
                return <DoctorDashboard />;
            case 'ADMIN':
                return <AdminDashboard />;
            default:
                return <p>Unknown role</p>;
        }
    };

    return (
        <div>
            <div>
                <span>Welcome, {user?.role}</span>
                <button onClick={handleLogout}>Logout</button>
            </div>
            {renderDashboard()}
        </div>
    );
}

export default Dashboard;
