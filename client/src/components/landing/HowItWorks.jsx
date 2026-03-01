const HowItWorks = () => {
    const steps = [
        {
            number: "01",
            title: "Register & Choose Clinic",
            description: "Create an account in seconds and find verified clinics near you matching your healthcare needs.",
            color: "text-blue-600",
            bg: "bg-blue-50"
        },
        {
            number: "02",
            title: "Get Token or Book",
            description: "Join the live virtual queue (token system) or book a scheduled appointment slot seamlessly.",
            color: "text-indigo-600",
            bg: "bg-indigo-50"
        },
        {
            number: "03",
            title: "Track Live & Consult",
            description: "Watch the token numbers move in real-time. Arrive just in time for your personal consultation.",
            color: "text-emerald-600",
            bg: "bg-emerald-50"
        }
    ];

    return (
        <section id="how-it-works" className="py-24 bg-slate-50 border-y border-slate-100 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <h2 className="text-blue-600 font-bold tracking-wide uppercase text-sm mb-3">Simple Workflow</h2>
                    <h3 className="text-3xl md:text-4xl font-black text-slate-900 mb-6">How MediConnect Works</h3>
                    <p className="text-lg text-slate-600">
                        Three simple steps to transform your clinic visits from hours of waiting to arriving exactly on time.
                    </p>
                </div>

                <div className="relative">
                    {/* Horizontal connector line (desktop only) */}
                    <div className="hidden lg:block absolute top-12 left-[10%] right-[10%] h-0.5 bg-linear-to-r from-blue-200 via-indigo-200 to-emerald-200 -z-10"></div>

                    <div className="grid lg:grid-cols-3 gap-12 lg:gap-8">
                        {steps.map((step, index) => (
                            <div key={index} className="relative flex flex-col items-center text-center group">
                                <div className={`w-24 h-24 rounded-full flex items-center justify-center ${step.bg} border-4 border-white shadow-xl shadow-slate-200/50 mb-8 transition-transform group-hover:scale-110 duration-300`}>
                                    <span className={`text-3xl font-black ${step.color}`}>{step.number}</span>
                                </div>
                                <h4 className="text-2xl font-bold text-slate-900 mb-4">{step.title}</h4>
                                <p className="text-slate-600 leading-relaxed max-w-sm">
                                    {step.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
