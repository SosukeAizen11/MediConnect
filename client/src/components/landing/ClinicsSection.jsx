import { Link } from 'react-router-dom';
import { CheckCircle2, Building2 } from 'lucide-react';

const ClinicsSection = () => {
    return (
        <section id="for-clinics" className="py-24 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-16 items-center">

                    {/* Left: Content */}
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-sm font-semibold tracking-wide mb-8 border border-indigo-100">
                            <Building2 className="w-4 h-4" /> For Healthcare Providers
                        </div>

                        <h2 className="text-4xl lg:text-5xl font-black text-slate-900 leading-tight mb-6">
                            Streamline your clinic. <br />
                            <span className="text-blue-600">Delight your patients.</span>
                        </h2>

                        <p className="text-lg text-slate-600 mb-10 leading-relaxed">
                            Upgrade your waiting room experience. Our platform gives you full control over your appointment schedules, live token queues, and patient health records.
                        </p>

                        <div className="space-y-4 mb-10">
                            {[
                                "Real-time queue management & TV Display Mode",
                                "Comprehensive Doctor Dashboard & Analytics",
                                "Complete Digital Transformation of medical records",
                                "Reduce patient no-shows and waiting room congestion"
                            ].map((item, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                                    <p className="text-slate-700 font-medium">{item}</p>
                                </div>
                            ))}
                        </div>

                        <Link to="/register" className="inline-block px-8 py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/20 transition-all">
                            Register Your Clinic Today
                        </Link>
                    </div>

                    {/* Right: Modern Dashboard Mockup */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-600/5 rotate-3 rounded-3xl z-0"></div>
                        <div className="absolute inset-0 bg-indigo-600/5 -rotate-3 rounded-3xl z-0 transform scale-105"></div>
                        <div className="relative z-10 bg-white border border-slate-100 rounded-2xl shadow-2xl p-6">
                            {/* Fake App Header */}
                            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                                <div className="w-32 h-4 bg-slate-200 rounded-md"></div>
                                <div className="flex gap-2">
                                    <div className="w-8 h-8 rounded-full bg-blue-100"></div>
                                </div>
                            </div>

                            {/* Fake Dashboard Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                    <div className="w-8 h-8 bg-blue-200 rounded-lg mb-4"></div>
                                    <div className="w-16 h-4 bg-blue-200 rounded mb-2"></div>
                                    <div className="w-24 h-6 bg-blue-600 rounded"></div>
                                </div>
                                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                    <div className="w-8 h-8 bg-indigo-200 rounded-lg mb-4"></div>
                                    <div className="w-20 h-4 bg-indigo-200 rounded mb-2"></div>
                                    <div className="w-16 h-6 bg-indigo-600 rounded"></div>
                                </div>
                            </div>

                            {/* Fake List */}
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-200"></div>
                                            <div>
                                                <div className="w-24 h-3 bg-slate-300 rounded mb-2"></div>
                                                <div className="w-16 h-2 bg-slate-200 rounded"></div>
                                            </div>
                                        </div>
                                        <div className="w-16 h-6 rounded-full bg-emerald-100"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default ClinicsSection;
