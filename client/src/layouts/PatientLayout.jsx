import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import {
    LayoutDashboard,
    Building2,
    CalendarCheck,
    FileText,
    Brain,
    Bell,
    Ticket,
    UserCircle,
    Newspaper,
    LogOut,
} from 'lucide-react';

function PatientLayout() {
    const { logout } = useAuthContext();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { path: '/patient/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/patient/feed', label: 'Doctor Feed', icon: Newspaper },
        { path: '/patient/clinics', label: 'Clinics', icon: Building2 },
        { path: '/patient/appointments', label: 'Appointments', icon: CalendarCheck },
        { path: '/patient/token', label: 'My Token', icon: Ticket },
        { path: '/patient/records', label: 'Medical Records', icon: FileText },
        { path: '/patient/ai-insights', label: 'AI Health Insights', icon: Brain },
        { path: '/patient/notifications', label: 'Notifications', icon: Bell },
        { path: '/patient/profile', label: 'Profile', icon: UserCircle },
    ];

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
                {/* Logo */}
                <div className="h-16 flex items-center px-6 border-b border-gray-200">
                    <h1 className="text-xl font-bold text-blue-600">MediConnect</h1>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                                        ? 'bg-blue-50 text-blue-600'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`
                                }
                            >
                                <Icon className="w-5 h-5" />
                                {item.label}
                            </NavLink>
                        );
                    })}
                </nav>

                {/* Logout */}
                <div className="p-4 border-t border-gray-200">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Header */}
                <header className="h-16 bg-white border-b border-gray-200 shadow-sm flex items-center justify-between px-6">
                    <h2 className="text-lg font-semibold text-gray-800">Patient Portal</h2>
                    <button
                        onClick={handleLogout}
                        className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                    >
                        Logout
                    </button>
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default PatientLayout;
