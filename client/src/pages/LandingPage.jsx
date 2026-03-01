import { useEffect } from 'react';
import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import HowItWorks from '../components/landing/HowItWorks';
import ClinicsSection from '../components/landing/ClinicsSection';
import Testimonials from '../components/landing/Testimonials';
import Footer from '../components/landing/Footer';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const LandingPage = () => {
    // Enable smooth scrolling for anchor links on this page
    useEffect(() => {
        document.documentElement.style.scrollBehavior = 'smooth';
        return () => {
            document.documentElement.style.scrollBehavior = 'auto';
        };
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-200">
            <Navbar />

            <main>
                <Hero />
                <Features />
                <HowItWorks />
                <ClinicsSection />
                <Testimonials />

                {/* Final CTA Section */}
                <section className="bg-blue-600 py-24 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
                    <div className="absolute top-0 left-0 w-full h-full bg-linear-to-b from-blue-600/50 to-indigo-700/50 mix-blend-overlay"></div>

                    <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                        <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-8">
                            Ready to Transform Your <br className="hidden md:block" /> Healthcare Experience?
                        </h2>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link to="/register" className="w-full sm:w-auto px-8 py-4 bg-white text-blue-600 font-bold rounded-xl shadow-lg hover:shadow-xl hover:bg-slate-50 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 group">
                                Get Started Now
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default LandingPage;
