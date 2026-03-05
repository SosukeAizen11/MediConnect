import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDoctorAppointments, patchAppointmentStatus } from '../../api/appointment.api';
import {
    Calendar,
    Clock,
    User,
    Mail,
    CheckCircle2,
    XCircle,
    Loader2,
    AlertCircle,
    FileText,
    PlayCircle,
} from 'lucide-react';

const STATUS_COLORS = {
    CONFIRMED: 'bg-blue-50 text-blue-700 border-blue-200',
    COMPLETED: 'bg-green-50 text-green-700 border-green-200',
    CANCELLED: 'bg-red-50 text-red-700 border-red-200',
    BOOKED: 'bg-yellow-50 text-yellow-700 border-yellow-200',
};

function Appointments() {
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);
    const [processingId, setProcessingId] = useState(null);

    const fetchAppointments = useCallback(async () => {
        try {
            setError(null);
            const res = await getDoctorAppointments();
            setAppointments(res.appointments || res.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load appointments');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 3000);
        return () => clearTimeout(timer);
    }, [toast]);

    const handleStatusUpdate = async (id, status) => {
        setProcessingId(id);
        try {
            await patchAppointmentStatus(id, status);
            setToast({
                type: 'success',
                message: `Appointment ${status.toLowerCase()} successfully`,
            });
            await fetchAppointments();
        } catch (err) {
            setToast({
                type: 'error',
                message: err.response?.data?.message || `Failed to update appointment`,
            });
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Toast */}
            {toast && (
                <div
                    className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-lg shadow-lg border text-sm font-medium ${toast.type === 'success'
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : 'bg-red-50 border-red-200 text-red-700'
                        }`}
                >
                    {toast.type === 'success' ? (
                        <CheckCircle2 className="w-5 h-5" />
                    ) : (
                        <AlertCircle className="w-5 h-5" />
                    )}
                    {toast.message}
                </div>
            )}

            {/* Header */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-200">
                        <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">My Appointments</h1>
                        <p className="text-gray-500 text-sm mt-0.5">
                            Manage your patient appointments
                            <span className="ml-1 text-blue-600 font-medium">
                                · {appointments.length} total
                            </span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-center gap-3 text-red-700">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            {/* Empty State */}
            {!error && appointments.length === 0 && (
                <div className="bg-white rounded-xl p-12 border border-gray-200 shadow-sm text-center">
                    <Calendar className="w-16 h-16 text-blue-200 mx-auto mb-4" />
                    <p className="text-gray-600 font-semibold text-lg">No appointments yet.</p>
                    <p className="text-gray-400 text-sm mt-1">
                        Appointments booked by patients will appear here.
                    </p>
                </div>
            )}

            {/* Appointments List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {appointments.map((appt) => (
                    <div
                        key={appt._id}
                        className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
                    >
                        <div className="p-5 flex-1 space-y-4">
                            {/* Patient Info */}
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center shrink-0 border border-blue-100">
                                    <User className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-base font-bold text-gray-800 truncate">
                                        {appt.patient?.name || 'Patient'}
                                    </h3>
                                    <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
                                        <Mail className="w-3.5 h-3.5" />
                                        <span className="truncate">{appt.patient?.email || '—'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Appointment Details */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                                    <span>{appt.date}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                                    <span>{appt.time}</span>
                                </div>
                                <div>
                                    <span
                                        className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full border ${STATUS_COLORS[appt.status] || 'bg-gray-50 text-gray-600 border-gray-200'
                                            }`}
                                    >
                                        {appt.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Actions — only show for CONFIRMED appointments */}
                        {appt.status === 'CONFIRMED' && (
                            <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-3">
                                <button
                                    onClick={() => navigate(`/doctor/appointment-consult/${appt._id}`)}
                                    disabled={processingId === appt._id}
                                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                                >
                                    <PlayCircle className="w-4 h-4" />
                                    Start Consultation
                                </button>
                                <button
                                    onClick={() => handleStatusUpdate(appt._id, 'CANCELLED')}
                                    disabled={processingId === appt._id}
                                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors disabled:opacity-50"
                                >
                                    {processingId === appt._id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <XCircle className="w-4 h-4" />
                                    )}
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Appointments;
