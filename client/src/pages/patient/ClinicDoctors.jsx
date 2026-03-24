import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDoctorsByClinic } from '../../api/doctor.api';
import { getClinicById } from '../../api/clinic.api';
import { ArrowLeft, User, Stethoscope, Clock, Building2, CalendarPlus, Ticket, Info } from 'lucide-react';
import AIReceptionistModal from '../../components/AIReceptionistModal';

function ClinicDoctors() {
    const { clinicId } = useParams();
    const navigate = useNavigate();
    const [doctors, setDoctors] = useState([]);
    const [clinic, setClinic] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [aiOpen, setAiOpen] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [doctorsResponse, clinicResponse] = await Promise.all([
                    getDoctorsByClinic(clinicId),
                    getClinicById(clinicId),
                ]);
                setDoctors(doctorsResponse.data || []);
                setClinic(clinicResponse.data || null);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [clinicId]);

    const isTokenClinic = clinic?.clinicType === 'TOKEN';

    const openAIReceptionist = (doctor) => {
        setSelectedDoctor(doctor);
        setAiOpen(true);
    };

    const SkeletonCard = () => (
        <div className="bg-white rounded-xl p-5 border border-gray-200 animate-pulse">
            <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-10 bg-gray-200 rounded w-full mt-4"></div>
        </div>
    );

    return (
        <>
        <div className="space-y-6">
            {/* Page Header */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <button
                    onClick={() => navigate('/patient/clinics')}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium mb-3"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Clinics
                </button>
                <h1 className="text-2xl font-bold text-gray-800">
                    {clinic?.name || 'Doctors Available'}
                </h1>
                <p className="text-gray-600 mt-1">
                    {isTokenClinic
                        ? 'Join the token queue to see a doctor'
                        : 'Select a doctor to book an appointment'}
                </p>
            </div>

            {/* Token Clinic Notice */}
            {!loading && isTokenClinic && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
                    <Info className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-orange-800">Token-Based Walk-in Clinic</p>
                        <p className="text-sm text-orange-700 mt-1">
                            This clinic follows a token-based walk-in system. Join the queue to get your turn.
                        </p>
                    </div>
                </div>
            )}

            {/* Doctors Grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
            ) : error ? (
                <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm text-center">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User className="w-8 h-8 text-red-400" />
                    </div>
                    <p className="text-gray-800 font-medium">Something went wrong</p>
                    <p className="text-gray-500 text-sm mt-1">{error}</p>
                    <button
                        onClick={() => navigate('/patient/clinics')}
                        className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Back to Clinics
                    </button>
                </div>
            ) : doctors.length === 0 ? (
                <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Stethoscope className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-800 font-medium">No doctors available for this clinic yet</p>
                    <p className="text-gray-500 text-sm mt-1">Check back later or browse other clinics</p>
                    <button
                        onClick={() => navigate('/patient/clinics')}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Browse Other Clinics
                    </button>
                </div>
            ) : (
                <>
                    {/* Token Clinic: Show single Join Queue button */}
                    {isTokenClinic && (
                        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div>
                                    <h2 className="font-semibold text-gray-800">Ready to see a doctor?</h2>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Join the queue and get your token number
                                    </p>
                                </div>
                                <button
                                    onClick={() => navigate(`/patient/join-token/${clinicId}`)}
                                    className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors"
                                >
                                    <Ticket className="w-5 h-5" />
                                    Join Token Queue
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Doctors List */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {doctors.map((doctor) => (
                            <div
                                key={doctor._id}
                                className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                            >
                                {/* Doctor Header */}
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center">
                                        <User className="w-7 h-7 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-800">
                                            Dr. {doctor.user?.name || 'Unknown'}
                                        </h3>
                                        <p className="text-sm text-gray-500">{doctor.user?.email}</p>
                                    </div>
                                </div>

                                {/* Doctor Details */}
                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Stethoscope className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-700">{doctor.specialization}</span>
                                    </div>
                                    {doctor.experienceYears && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Clock className="w-4 h-4 text-gray-400" />
                                            <span className="text-gray-700">
                                                {doctor.experienceYears} years experience
                                            </span>
                                        </div>
                                    )}
                                    {doctor.clinic?.name && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Building2 className="w-4 h-4 text-gray-400" />
                                            <span className="text-gray-700">{doctor.clinic.name}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Action Button */}
                                {isTokenClinic ? (
                                    <button
                                        onClick={() => navigate(`/patient/join-token/${clinicId}`)}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors"
                                    >
                                        <Ticket className="w-4 h-4" />
                                        Join Token Queue
                                    </button>
                                ) : (
                                    <div className="flex flex-col">
                                        <button
                                            onClick={() => navigate(`/patient/book/${clinicId}/${doctor._id}`)}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                                        >
                                            <CalendarPlus className="w-4 h-4" />
                                            Book Appointment
                                        </button>
                                        <button
                                            onClick={() => openAIReceptionist(doctor)}
                                            variant="outline"
                                            className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            🎤 Talk to AI Receptionist
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>

            <AIReceptionistModal
                isOpen={aiOpen}
                doctor={selectedDoctor}
                onClose={() => setAiOpen(false)}
            />
        </>
    );
}

export default ClinicDoctors;
