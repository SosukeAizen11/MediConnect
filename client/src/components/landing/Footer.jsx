import { Link } from 'react-router-dom';
import { Activity } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-slate-950 text-slate-400 pt-16 pb-8 border-t border-slate-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    {/* Brand */}
                    <div className="md:col-span-1">
                        <Link to="/" className="flex items-center gap-2 mb-4">
                            <div className="bg-blue-600 p-1.5 rounded-lg">
                                <Activity className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xl font-black tracking-tight text-white">
                                Medi<span className="text-blue-500">Connect</span>
                            </span>
                        </Link>
                        <p className="text-sm leading-relaxed mb-6">
                            Transforming healthcare access with smart queues, transparent scheduling, and secure digital records.
                        </p>
                    </div>

                    {/* Links */}
                    <div>
                        <h4 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Patients</h4>
                        <ul className="space-y-3 text-sm">
                            <li><a href="#" className="hover:text-blue-400 transition-colors">Find a Clinic</a></li>
                            <li><a href="#" className="hover:text-blue-400 transition-colors">Book Appointments</a></li>
                            <li><a href="#" className="hover:text-blue-400 transition-colors">Live Token Tracking</a></li>
                            <li><a href="#" className="hover:text-blue-400 transition-colors">Health Insights</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Doctors</h4>
                        <ul className="space-y-3 text-sm">
                            <li><a href="#" className="hover:text-blue-400 transition-colors">Register Clinic</a></li>
                            <li><a href="#" className="hover:text-blue-400 transition-colors">Dashboard Overview</a></li>
                            <li><a href="#" className="hover:text-blue-400 transition-colors">Queue Management</a></li>
                            <li><a href="#" className="hover:text-blue-400 transition-colors">Digital Prescriptions</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Company</h4>
                        <ul className="space-y-3 text-sm">
                            <li><a href="#" className="hover:text-blue-400 transition-colors">About Us</a></li>
                            <li><a href="#" className="hover:text-blue-400 transition-colors">Contact Support</a></li>
                            <li><a href="#" className="hover:text-blue-400 transition-colors">Privacy Policy</a></li>
                            <li><a href="#" className="hover:text-blue-400 transition-colors">Terms of Service</a></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-sm border-l-2 border-blue-600 pl-3">
                        © {new Date().getFullYear()} MediConnect. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6 text-sm">
                        <span>Built for modern healthcare</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
