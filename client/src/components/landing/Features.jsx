import { Hash, MonitorPlay, BrainCircuit, FileHeart, MessagesSquare } from 'lucide-react';

const Features = () => {
    const features = [
        {
            icon: <Hash className="w-6 h-6 text-blue-600" />,
            title: "Smart Token System",
            description: "Join the queue from home and track your position in real-time. No more waiting crowded lobbies.",
            bgColor: "bg-blue-50"
        },
        {
            icon: <MonitorPlay className="w-6 h-6 text-indigo-600" />,
            title: "Live Display TV UI",
            description: "Dedicated public casting screens for clinic waiting rooms to broadcast token numbers instantly.",
            bgColor: "bg-indigo-50"
        },
        {
            icon: <BrainCircuit className="w-6 h-6 text-emerald-600" />,
            title: "AI Health Insights",
            description: "Advanced AI analysis securely reviews your medical data to offer personalized health recommendations.",
            bgColor: "bg-emerald-50"
        },
        {
            icon: <FileHeart className="w-6 h-6 text-rose-600" />,
            title: "Secure Medical Records",
            description: "Centralized, encrypted repository for all your prescriptions, diagnoses, and past consultations.",
            bgColor: "bg-rose-50"
        },
        {
            icon: <MessagesSquare className="w-6 h-6 text-amber-600" />,
            title: "Doctor Content Feed",
            description: "Stay informed with preventative care posts and articles published directly by verified doctors.",
            bgColor: "bg-amber-50"
        }
    ];

    return (
        <section id="features" className="py-24 bg-white relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-blue-600 font-bold tracking-wide uppercase text-sm mb-3">Enterprise Features</h2>
                    <h3 className="text-3xl md:text-4xl font-black text-slate-900 mb-6">Built for Modern Healthcare</h3>
                    <p className="text-lg text-slate-600">
                        Everything you need to manage patient flow, consultations, and health profiles in one unified cloud platform.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                        >
                            <div className={`w-14 h-14 ${feature.bgColor} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                {feature.icon}
                            </div>
                            <h4 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h4>
                            <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                        </div>
                    ))}

                    {/* Placeholder Card to make grid even if needed or CTA card */}
                    <div className="bg-linear-to-br from-blue-600 to-indigo-700 p-8 rounded-2xl shadow-lg flex flex-col items-start justify-between relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-700">
                            <Hash className="w-32 h-32 text-white" />
                        </div>
                        <div className="relative z-10 w-full mb-8">
                            <h4 className="text-2xl font-bold text-white mb-2">Ready to Upgrade?</h4>
                            <p className="text-blue-100">Join thousands of clinics optimizing their workflows today.</p>
                        </div>
                        <button className="relative z-10 bg-white text-blue-600 font-bold py-3 px-6 rounded-xl w-full hover:bg-slate-50 transition-colors">
                            Explore All Features
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Features;
