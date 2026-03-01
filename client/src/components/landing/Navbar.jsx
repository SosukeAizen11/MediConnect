import { Link } from 'react-router-dom';
import { Activity, Menu, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const { user, token, logout } = useAuthContext();
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setProfileDropdownOpen(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            window.removeEventListener('scroll', handleScroll);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const getDashboardRoute = () => {
        if (!user) return '/login';
        switch (user.role) {
            case 'PATIENT': return '/patient/dashboard';
            case 'DOCTOR': return '/doctor/dashboard';
            case 'ADMIN': return '/admin/dashboard';
            default: return '/login';
        }
    };

    const getProfileRoute = () => {
        if (!user) return '/login';
        switch (user.role) {
            case 'PATIENT': return '/patient/profile';
            case 'DOCTOR': return '/doctor/profile';
            case 'ADMIN': return '/admin/dashboard';
            default: return '/login';
        }
    };

    const handleLogout = () => {
        logout();
        setProfileDropdownOpen(false);
        setMobileMenuOpen(false);
        navigate('/');
    };

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md py-3' : 'bg-transparent py-5'
            }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="bg-blue-600 p-2 rounded-lg group-hover:scale-105 transition-transform">
                            <Activity className="h-6 w-6 text-white" />
                        </div>
                        <span className={`text-2xl font-black tracking-tight ${isScrolled ? 'text-slate-900' : 'text-slate-800'
                            }`}>
                            Medi<span className="text-blue-600">Connect</span>
                        </span>
                    </Link>

                    {/* Desktop Links */}
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">Features</a>
                        <a href="#how-it-works" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">How It Works</a>
                        <a href="#for-clinics" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">For Clinics</a>
                        <a href="#testimonials" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">Testimonials</a>
                    </div>

                    {/* Auth Buttons / User Menu */}
                    <div className="hidden md:flex items-center gap-4">
                        {user && token ? (
                            <>
                                <Link to={getDashboardRoute()} className="text-blue-600 font-semibold hover:text-blue-700 px-4 py-2 hover:bg-blue-50 rounded-lg transition-all">
                                    Dashboard
                                </Link>
                                <div className="relative" ref={dropdownRef}>
                                    <button
                                        onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                                        className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center hover:ring-2 ring-indigo-300 transition-all border border-indigo-200"
                                    >
                                        <span className="text-sm font-bold text-indigo-700">
                                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                        </span>
                                    </button>

                                    {/* Dropdown Menu */}
                                    {profileDropdownOpen && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 animate-in slide-in-from-top-2 z-50">
                                            <div className="px-4 py-2 border-b border-slate-100 mb-2">
                                                <p className="text-sm font-semibold text-slate-800 truncate">{user.name}</p>
                                                <p className="text-xs text-slate-500 capitalize">{user.role.toLowerCase()}</p>
                                            </div>
                                            {user.role !== 'ADMIN' && (
                                                <Link
                                                    to={getProfileRoute()}
                                                    onClick={() => setProfileDropdownOpen(false)}
                                                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                                                >
                                                    Profile Settings
                                                </Link>
                                            )}
                                            <button
                                                onClick={handleLogout}
                                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                            >
                                                Logout
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="text-blue-600 font-semibold hover:text-blue-700 px-4 py-2 hover:bg-blue-50 rounded-lg transition-all">
                                    Login
                                </Link>
                                <Link to="/register" className="bg-blue-600 text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20 transition-all active:scale-95">
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Toggle */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="text-slate-600 hover:text-blue-600 focus:outline-none"
                        >
                            {mobileMenuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-xl border-t border-slate-100 flex flex-col p-4 space-y-4 animate-in slide-in-from-top-2">
                    <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-slate-700 font-medium px-4 py-2 hover:bg-slate-50 rounded-lg">Features</a>
                    <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-slate-700 font-medium px-4 py-2 hover:bg-slate-50 rounded-lg">How It Works</a>
                    <a href="#for-clinics" onClick={() => setMobileMenuOpen(false)} className="text-slate-700 font-medium px-4 py-2 hover:bg-slate-50 rounded-lg">For Clinics</a>
                    <hr className="border-slate-100" />

                    {user && token ? (
                        <>
                            <div className="px-4 border-b border-slate-100 pb-2 mb-2">
                                <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                                <p className="text-xs text-slate-500 capitalize">{user.role.toLowerCase()}</p>
                            </div>
                            <Link to={getDashboardRoute()} onClick={() => setMobileMenuOpen(false)} className="text-center text-blue-600 font-semibold border-2 border-blue-600 py-3 rounded-lg mx-2 hover:bg-blue-50">Go to Dashboard</Link>
                            {user.role !== 'ADMIN' && (
                                <Link to={getProfileRoute()} onClick={() => setMobileMenuOpen(false)} className="text-center text-slate-700 font-medium py-3 rounded-lg mx-2 border border-slate-200 hover:bg-slate-50">Profile Settings</Link>
                            )}
                            <button onClick={handleLogout} className="text-center text-red-600 font-semibold py-3 rounded-lg mx-2 border border-red-200 hover:bg-red-50">Logout</button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="text-center text-blue-600 font-semibold border-2 border-blue-600 py-3 rounded-lg mx-2">Login</Link>
                            <Link to="/register" className="text-center bg-blue-600 text-white font-semibold py-3 rounded-lg mx-2">Get Started</Link>
                        </>
                    )}
                </div>
            )}
        </nav>
    );
};

export default Navbar;
