import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

const Hero = () => {
    return (
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-slate-50 fade-in-section">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3">
                <div className="w-[800px] h-[800px] rounded-full bg-blue-100/50 blur-3xl mix-blend-multiply"></div>
            </div>
            <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3">
                <div className="w-[600px] h-[600px] rounded-full bg-indigo-100/50 blur-3xl mix-blend-multiply"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
                    {/* Left Column: Copy */}
                    <div className="text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-semibold tracking-wide mb-6 border border-blue-100">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            v2.0 Queue System Now Live
                        </div>

                        <h1 className="text-5xl lg:text-6xl font-black text-slate-900 leading-tight mb-6 tracking-tight">
                            Smart Healthcare <br className="hidden lg:block" />
                            <span className="text-blue-600 relative">
                                Queue & Consultation
                                {/* Squiggle underline SVG */}
                                <svg className="absolute w-full h-3 -bottom-1 left-0 text-blue-200" viewBox="0 0 100 10" preserveAspectRatio="none">
                                    <path d="M0 5 Q 25 0, 50 5 T 100 5" stroke="currentColor" strokeWidth="4" fill="transparent" />
                                </svg>
                            </span> <br className="hidden lg:block" />
                            Platform
                        </h1>

                        <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                            Book appointments, track tokens live on your phone, and connect with top doctors seamlessly. Say goodbye to crowded waiting rooms.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                            <Link to="/register" className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/20 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group">
                                Get Started Free
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link to="/login" className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 font-bold rounded-xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center">
                                Patient & Doctor Login
                            </Link>
                        </div>

                        {/* Quick Trust Points */}
                        <div className="mt-10 flex flex-wrap justify-center lg:justify-start gap-4 text-sm text-slate-500 font-medium">
                            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Live Token Alerts</span>
                            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Secure Records</span>
                            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> TV Display Ready</span>
                        </div>
                    </div>

                    {/* Right Column: Hero Illustration / UI Mockup */}
                    <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
                        {/* Decorative floating blurred blob */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-linear-to-tr from-blue-300 to-emerald-200 blur-3xl opacity-30 rounded-full z-0"></div>

                        <div className="relative z-10 bg-white p-2 rounded-2xl shadow-2xl shadow-slate-200/50 border border-slate-100 transform rotate-1 hover:rotate-0 transition-transform duration-500">
                            <div className="bg-slate-100 rounded-xl overflow-hidden aspect-4/3 flex flex-col">
                                {/* Fake Browser Bar */}
                                <div className="h-8 bg-slate-200 flex items-center px-4 gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                                </div>
                                {/* Mock UI Content */}
                                <div className="flex-1 p-6 relative bg-slate-50 flex items-center justify-center">
                                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #94a3b8 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>

                                    {/* Mock Live Display Screen Inside */}
                                    <div className="bg-slate-900 w-full max-w-sm rounded-xl p-6 shadow-xl relative z-10 animate-bounce-slow">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="text-white font-bold opacity-80">City Hospital</div>
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                                <span className="text-red-400 text-xs font-bold tracking-wider">LIVE</span>
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Token Number</p>
                                            <h2 className="text-7xl font-black text-white leading-none mb-1">24</h2>
                                            <p className="text-indigo-400 font-medium">Now Serving</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Floating Small Card */}
                        <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl shadow-slate-200/50 border border-slate-100 flex items-center gap-4 z-20 animate-float">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-bold text-lg">AI</span>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-800">Health Insights</p>
                                <p className="text-xs text-slate-500">Smart analysis active</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
