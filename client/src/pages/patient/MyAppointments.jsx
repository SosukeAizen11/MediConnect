import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPatientAppointments } from '../../api/appointment.api';
import {
    CalendarCheck,
    User,
    Building2,
    Clock,
    Calendar,
    AlertCircle,
    Download,
    FileText,
} from 'lucide-react';

function MyAppointments() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                const response = await getPatientAppointments();
                // Sort by date (upcoming first)
                const sorted = (response.data || []).sort(
                    (a, b) => new Date(a.date) - new Date(b.date)
                );
                setAppointments(sorted);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch appointments');
            } finally {
                setLoading(false);
            }
        };

        fetchAppointments();
    }, []);

    const getStatusBadge = (status) => {
        const styles = {
            BOOKED: 'bg-blue-50 text-blue-700 border-blue-200',
            COMPLETED: 'bg-green-50 text-green-700 border-green-200',
            CANCELLED: 'bg-red-50 text-red-700 border-red-200',
        };
        return styles[status] || 'bg-gray-50 text-gray-700 border-gray-200';
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const SkeletonCard = () => (
        <div className="bg-white rounded-xl p-5 border border-gray-200 animate-pulse">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div>
                        <div className="h-5 bg-gray-200 rounded w-40 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                    </div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
            </div>
            <div className="flex gap-4">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h1 className="text-2xl font-bold text-gray-800">My Appointments</h1>
                <p className="text-gray-600 mt-1">
                    View and manage your upcoming and past appointments
                </p>
            </div>

            {/* Appointments List */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
            ) : error ? (
                <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm text-center">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-400" />
                    </div>
                    <p className="text-gray-800 font-medium">Something went wrong</p>
                    <p className="text-gray-500 text-sm mt-1">{error}</p>
                </div>
            ) : appointments.length === 0 ? (
                <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CalendarCheck className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-800 font-medium">You have no appointments yet</p>
                    <p className="text-gray-500 text-sm mt-1">
                        Book an appointment with a doctor to get started
                    </p>
                    <button
                        onClick={() => navigate('/patient/clinics')}
                        className="mt-4 px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Book an Appointment
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {appointments.map((appointment) => (
                        <div
                            key={appointment._id}
                            className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                {/* Doctor Info */}
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center shrink-0">
                                        <User className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-800">
                                            Dr. {appointment.doctor?.user?.name || 'Unknown Doctor'}
                                        </h3>
                                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                            <Building2 className="w-4 h-4" />
                                            <span>{appointment.clinic?.name || 'Unknown Clinic'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <span
                                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(
                                        appointment.status
                                    )}`}
                                >
                                    {appointment.status}
                                </span>
                            </div>

                            {/* Date and Time */}
                            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-100">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <span>{formatDate(appointment.date)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Clock className="w-4 h-4 text-gray-400" />
                                    <span>{appointment.time}</span>
                                </div>
                            </div>

                            {/* Prescription Download Section */}
                            {appointment.status === 'COMPLETED' && (
                                <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                                    {appointment.prescriptionUrl ? (
                                        <button
                                            onClick={() => window.open(appointment.prescriptionUrl, '_blank')}
                                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-lg hover:bg-emerald-100 transition-colors border border-emerald-200"
                                        >
                                            <Download className="w-4 h-4" />
                                            Download Prescription
                                        </button>
                                    ) : (
                                        <div className="w-full sm:w-auto inline-flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-500 text-sm font-medium rounded-lg border border-gray-200">
                                            <FileText className="w-4 h-4" />
                                            Prescription not available yet
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default MyAppointments;
