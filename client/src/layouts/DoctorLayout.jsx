import { Outlet, NavLink, useNavigate, useLocation, Navigate, Link } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import {
    LayoutDashboard,
    ListOrdered,
    Hash,
    Users,
    PenSquare,
    Newspaper,
    UserCircle,
    LogOut,
    Stethoscope,
    Menu,
    X,
    Building2,
    Loader2,
    AlertCircle,
    CalendarCheck,
    Clock,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { getDoctorProfile } from '../api/doctor.api';

function DoctorLayout() {
    const { logout, user } = useAuthContext();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const location = useLocation();

    useEffect(() => {
        let mounted = true;
        const fetchProfile = async () => {
            try {
                const res = await getDoctorProfile();
                if (mounted) setProfile(res.data);
            } catch (error) {
                console.error('Failed to load doctor profile:', error);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        fetchProfile();
        return () => { mounted = false; };
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            </div>
        );
    }

    const hasClinic = !!profile?.clinic;
    const isApproved = profile?.clinic?.isApproved;

    // Safety logic: Redirect to register if no clinic exists
    if (!hasClinic && location.pathname !== '/doctor/register-clinic' && location.pathname !== '/doctor/profile') {
        return <Navigate to="/doctor/register-clinic" replace />;
    }

    // Determine navItems based on clinic approval status
    let navItems = [];
    if (!hasClinic) {
        navItems = [
            { path: '/doctor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { path: '/doctor/register-clinic', label: 'Register Clinic', icon: Building2 },
            { path: '/doctor/profile', label: 'Profile', icon: UserCircle },
        ];
    } else if (!isApproved) {
        navItems = [
            { path: '/doctor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { path: '/doctor/profile', label: 'Profile', icon: UserCircle },
        ];
    } else {
        navItems = [
            { path: '/doctor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { path: '/doctor/appointments', label: 'Appointments', icon: CalendarCheck },
            { path: '/doctor/availability', label: 'Availability', icon: Clock },
            { path: '/doctor/queue', label: 'Appointments Queue', icon: ListOrdered },
            { path: '/doctor/token-queue', label: 'Token Queue', icon: Hash },
            { path: '/doctor/patients', label: 'My Patients', icon: Users },
            { path: '/doctor/create-post', label: 'Create Post', icon: PenSquare },
            { path: '/doctor/posts', label: 'My Posts', icon: Newspaper },
            { path: '/doctor/profile', label: 'Profile', icon: UserCircle },
        ];
    }

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 flex flex-col
                    transform transition-transform duration-200 ease-in-out
                    lg:relative lg:translate-x-0
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
            >
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
                    <Link
                        to="/"
                        onClick={() => setSidebarOpen(false)}
                        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                        title="Go to Home"
                    >
                        <Stethoscope className="w-6 h-6 text-emerald-600" />
                        <h1 className="text-xl font-bold text-emerald-600">MediConnect</h1>
                    </Link>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Doctor Badge */}
                <div className="px-6 py-3 border-b border-gray-100">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Doctor Panel
                    </span>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => setSidebarOpen(false)}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
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
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
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
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden text-gray-600 hover:text-gray-900"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <h2 className="text-lg font-semibold text-gray-800">Doctor Portal</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500 hidden sm:inline">
                            Dr. {user?.name || 'Doctor'}
                        </span>
                        <button
                            onClick={handleLogout}
                            className="text-sm text-gray-600 hover:text-gray-900 font-medium hidden sm:inline"
                        >
                            Logout
                        </button>
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto w-full">
                    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-500">
                        {hasClinic && !isApproved && (
                            <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3 text-amber-700 shadow-sm transition-all">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <p className="text-sm font-medium">Your clinic is pending admin approval. You will gain full access to the portal once approved.</p>
                            </div>
                        )}
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}

export default DoctorLayout;
