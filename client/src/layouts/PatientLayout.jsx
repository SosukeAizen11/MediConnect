import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import {
    LayoutDashboard,
    Building2,
    CalendarCheck,
    FileText,
    Bell,
    Ticket,
    UserCircle,
    Newspaper,
    LogOut,
    Menu,
    X,
} from 'lucide-react';
import { useState } from 'react';

function PatientLayout() {
    const { logout } = useAuthContext();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const navItems = [
        { path: '/patient/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/patient/feed', label: 'Doctor Feed', icon: Newspaper },
        { path: '/patient/clinics', label: 'Clinics', icon: Building2 },
        { path: '/patient/appointments', label: 'Appointments', icon: CalendarCheck },
        { path: '/patient/token', label: 'My Token', icon: Ticket },
        { path: '/patient/records', label: 'Medical Records', icon: FileText },
        { path: '/patient/notifications', label: 'Notifications', icon: Bell },
        { path: '/patient/profile', label: 'Profile', icon: UserCircle },
    ];

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
                {/* Logo & Close Button (Mobile) */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100 shrink-0">
                    <Link
                        to="/"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-xl font-black text-blue-600 tracking-tight hover:opacity-80 transition-opacity cursor-pointer group"
                        title="Go to Home"
                    >
                        Medi<span className="text-blue-500 group-hover:text-blue-400 transition-colors">Connect</span>
                    </Link>
                    <button
                        className="md:hidden text-gray-500 hover:text-gray-800 transition-colors p-1"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsMobileMenuOpen(false)}
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

            <div className="flex-1 flex flex-col overflow-hidden w-full">
                {/* Top Header */}
                <header className="h-16 bg-white border-b border-gray-100 shadow-sm flex items-center justify-between px-4 sm:px-6 z-10">
                    <div className="flex items-center gap-4">
                        <button
                            className="md:hidden text-gray-600 hover:text-blue-600 transition-colors p-1"
                            onClick={() => setIsMobileMenuOpen(true)}
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <h2 className="text-lg font-bold text-gray-800">Patient Portal</h2>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                    >
                        Logout
                    </button>
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto w-full">
                    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-500">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}

export default PatientLayout;
