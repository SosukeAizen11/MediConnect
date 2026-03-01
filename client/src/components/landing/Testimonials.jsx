import { Star } from 'lucide-react';

const Testimonials = () => {
    const reviews = [
        {
            name: "Sarah Jenkins",
            role: "Patient",
            text: "The live token tracking is a lifesaver. I checked the screen from my phone and arrived exactly when my number was called. Zero waiting room anxiety!",
            avatar: "bg-blue-100 text-blue-700"
        },
        {
            name: "Dr. Marcus Chen",
            role: "Cardiologist",
            text: "MediConnect transformed our clinic overnight. The patients are happier, my front desk is less stressed, and the digital medical records are flawless.",
            avatar: "bg-emerald-100 text-emerald-700"
        },
        {
            name: "Emily Rodriguez",
            role: "Mother of 3",
            text: "Booking pediatric appointments used to take hours of calling. Now I just find the clinic, hit book, and manage prescriptions all in one place.",
            avatar: "bg-indigo-100 text-indigo-700"
        }
    ];

    return (
        <section id="testimonials" className="py-24 bg-slate-900 text-white relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 max-w-2xl w-full h-full bg-linear-to-l from-blue-900/50 to-transparent mix-blend-overlay"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-blue-400 font-bold tracking-wide uppercase text-sm mb-3">Trusted by Thousands</h2>
                    <h3 className="text-3xl md:text-4xl font-black mb-6">Don't just take our word for it</h3>
                </div>

                <div className="flex md:grid md:grid-cols-3 gap-6 overflow-x-auto snap-x snap-mandatory pb-8 md:pb-0 hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                    {reviews.map((review, index) => (
                        <div key={index} className="w-[85vw] md:w-auto shrink-0 snap-center bg-slate-800/80 backdrop-blur-sm p-8 rounded-2xl border border-slate-700 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-slate-600">
                            <div className="flex items-center gap-1 mb-6">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star key={star} className="w-5 h-5 fill-amber-400 text-amber-400" />
                                ))}
                            </div>
                            <p className="text-slate-300 text-lg leading-relaxed mb-8 italic">
                                "{review.text}"
                            </p>
                            <div className="flex items-center gap-4">
                                <div className={`shrink-0 w-12 h-12 rounded-full ${review.avatar} flex items-center justify-center font-bold text-xl`}>
                                    {review.name.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-white max-w-[200px] truncate">{review.name}</h4>
                                    <p className="text-sm text-slate-400">{review.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Testimonials;
