import { Link } from 'react-router-dom';
import { Activity, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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

                    {/* Auth Buttons */}
                    <div className="hidden md:flex items-center gap-4">
                        <Link to="/login" className="text-blue-600 font-semibold hover:text-blue-700 px-4 py-2 hover:bg-blue-50 rounded-lg transition-all">
                            Login
                        </Link>
                        <Link to="/register" className="bg-blue-600 text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20 transition-all active:scale-95">
                            Get Started
                        </Link>
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
                    <Link to="/login" className="text-center text-blue-600 font-semibold border-2 border-blue-600 py-3 rounded-lg mx-2">Login</Link>
                    <Link to="/register" className="text-center bg-blue-600 text-white font-semibold py-3 rounded-lg mx-2">Get Started</Link>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
