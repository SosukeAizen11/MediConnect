import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getDoctorAppointments,
    updateAppointmentStatus,
} from '../../api/appointment.api';
import {
    CalendarCheck,
    Phone,
    User,
    Clock,
    CheckCircle2,
    XCircle,
    PlayCircle,
    Loader2,
    AlertCircle,
    ListOrdered,
} from 'lucide-react';

const STATUS_CONFIG = {
    BOOKED: {
        label: 'Booked',
        classes: 'bg-blue-50 text-blue-700 border-blue-200',
        dot: 'bg-blue-500',
    },
    COMPLETED: {
        label: 'Completed',
        classes: 'bg-green-50 text-green-700 border-green-200',
        dot: 'bg-green-500',
    },
    CANCELLED: {
        label: 'Cancelled',
        classes: 'bg-red-50 text-red-700 border-red-200',
        dot: 'bg-red-500',
    },
};

function AppointmentQueue() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);
    const [toast, setToast] = useState(null);
    const navigate = useNavigate();

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

    // Auto-dismiss toast
    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 3000);
        return () => clearTimeout(timer);
    }, [toast]);

    const handleStatusUpdate = async (id, status) => {
        setUpdatingId(id);
        try {
            await updateAppointmentStatus(id, status);
            setAppointments((prev) =>
                prev.map((apt) => (apt._id === id ? { ...apt, status } : apt))
            );
            setToast({
                type: 'success',
                message: `Appointment marked as ${status.toLowerCase()}`,
            });
        } catch (err) {
            setToast({
                type: 'error',
                message: err.response?.data?.message || 'Failed to update status',
            });
        } finally {
            setUpdatingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Toast */}
            {toast && (
                <div
                    className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-lg shadow-lg border text-sm font-medium transition-all duration-300 ${toast.type === 'success'
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

            {/* Page Header */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200">
                        <ListOrdered className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            Appointments Queue
                        </h1>
                        <p className="text-gray-500 text-sm mt-0.5">
                            Manage upcoming patient appointments
                        </p>
                    </div>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-center gap-3 text-red-700">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            {/* Empty State */}
            {!error && appointments.length === 0 && (
                <div className="bg-white rounded-xl p-12 border border-gray-200 shadow-sm text-center">
                    <CalendarCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 font-semibold text-lg">
                        No appointments scheduled
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                        Appointments will appear here once patients book with you
                    </p>
                </div>
            )}

            {/* Appointment Cards */}
            <div className="space-y-4">
                {appointments.map((apt) => {
                    const statusConfig = STATUS_CONFIG[apt.status] || STATUS_CONFIG.BOOKED;
                    const isUpdating = updatingId === apt._id;

                    return (
                        <div
                            key={apt._id}
                            className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
                        >
                            <div className="p-5">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    {/* Patient Info */}
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center">
                                                <User className="w-5 h-5 text-emerald-600" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800">
                                                    {apt.patient?.name || 'Unknown Patient'}
                                                </p>
                                                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                                                    <Phone className="w-3.5 h-3.5" />
                                                    <span>
                                                        {apt.patient?.phone || 'No phone'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Date, Time & Status */}
                                    <div className="flex items-center gap-4 sm:gap-6">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                                <CalendarCheck className="w-4 h-4 text-gray-400" />
                                                <span className="font-medium">{apt.date}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                                <Clock className="w-4 h-4 text-gray-400" />
                                                <span className="font-medium">{apt.time}</span>
                                            </div>
                                        </div>

                                        {/* Status Badge */}
                                        <span
                                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig.classes}`}
                                        >
                                            <span
                                                className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}
                                            />
                                            {statusConfig.label}
                                        </span>
                                    </div>
                                </div>

                                {/* Clinic info */}
                                {apt.clinic && (
                                    <p className="text-xs text-gray-400 mt-3 ml-13">
                                        {apt.clinic.name}
                                        {apt.clinic.address ? ` · ${apt.clinic.address}` : ''}
                                    </p>
                                )}

                                {/* Action Buttons — only show for BOOKED appointments */}
                                {apt.status === 'BOOKED' && (
                                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                                        <button
                                            disabled={isUpdating}
                                            onClick={() =>
                                                navigate(`/doctor/appointment-consult/${apt._id}`)
                                            }
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <PlayCircle className="w-4 h-4" />
                                            Start Consultation
                                        </button>
                                        <button
                                            disabled={isUpdating}
                                            onClick={() =>
                                                handleStatusUpdate(apt._id, 'COMPLETED')
                                            }
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isUpdating ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <CheckCircle2 className="w-4 h-4" />
                                            )}
                                            Mark as Completed
                                        </button>
                                        <button
                                            disabled={isUpdating}
                                            onClick={() =>
                                                handleStatusUpdate(apt._id, 'CANCELLED')
                                            }
                                            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isUpdating ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <XCircle className="w-4 h-4" />
                                            )}
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default AppointmentQueue;
