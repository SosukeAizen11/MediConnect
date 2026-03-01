import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import {
    LayoutDashboard,
    ClipboardCheck,
    Building2,
    Users,
    BarChart3,
    LogOut,
    Shield,
    Menu,
    X,
} from 'lucide-react';
import { useState } from 'react';

function AdminLayout() {
    const { logout, user } = useAuthContext();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const navItems = [
        { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/admin/approvals', label: 'Clinic Approvals', icon: ClipboardCheck },
        { path: '/admin/clinics', label: 'All Clinics', icon: Building2 },
        { path: '/admin/users', label: 'Users', icon: Users },
    ];

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-20 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-200 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                    }`}
            >
                {/* Logo */}
                <div className="h-16 flex items-center gap-3 px-5 border-b border-gray-200 shrink-0">
                    <div className="p-1.5 bg-indigo-600 rounded-lg">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <Link
                        to="/"
                        onClick={() => setSidebarOpen(false)}
                        className="hover:opacity-80 transition-opacity"
                        title="Go to Home"
                    >
                        <p className="text-sm font-bold text-gray-800">MediConnect</p>
                        <p className="text-[11px] text-indigo-600 font-medium -mt-0.5">
                            Admin Panel
                        </p>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => setSidebarOpen(false)}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800 border border-transparent'
                                }`
                            }
                        >
                            <item.icon className="w-[18px] h-[18px]" />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                {/* User Section */}
                <div className="p-3 border-t border-gray-200 shrink-0">
                    <div className="flex items-center gap-3 px-3 py-2 mb-2">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-indigo-600">
                                {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                            </span>
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-800 truncate">
                                {user?.name || 'Admin'}
                            </p>
                            <p className="text-[11px] text-gray-400">Administrator</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors border border-transparent hover:border-red-200"
                    >
                        <LogOut className="w-[18px] h-[18px]" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Header */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <div className="hidden lg:block">
                        <p className="text-sm text-gray-500">Welcome back,</p>
                        <p className="text-sm font-semibold text-gray-800">
                            {user?.name || 'Admin'}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            Admin
                        </span>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto w-full bg-gray-50">
                    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-500">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}

export default AdminLayout;
