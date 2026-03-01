import { useState, useEffect, useCallback } from 'react';
import { getPendingClinics, approveClinic, rejectClinic } from '../../api/admin.api';
import {
    ClipboardCheck,
    Building2,
    MapPin,
    Calendar,
    CheckCircle2,
    XCircle,
    Loader2,
    AlertCircle,
    User,
    Check,
    X,
} from 'lucide-react';

function ClinicApprovals() {
    const [clinics, setClinics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);
    const [processingId, setProcessingId] = useState(null);

    const fetchClinics = useCallback(async () => {
        try {
            setError(null);
            const res = await getPendingClinics();
            setClinics(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load pending clinics');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchClinics();
    }, [fetchClinics]);

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 3000);
        return () => clearTimeout(timer);
    }, [toast]);

    const handleApprove = async (id, name) => {
        setProcessingId(id);
        try {
            await approveClinic(id);
            setClinics((prev) => prev.filter((c) => c._id !== id));
            setToast({ type: 'success', message: `Clinic "${name}" approved successfully` });
        } catch (err) {
            setToast({ type: 'error', message: err.response?.data?.message || 'Failed to approve clinic' });
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id, name) => {
        if (!window.confirm(`Are you sure you want to reject and delete "${name}"?`)) return;

        setProcessingId(id);
        try {
            await rejectClinic(id);
            setClinics((prev) => prev.filter((c) => c._id !== id));
            setToast({ type: 'success', message: `Clinic "${name}" rejected successfully` });
        } catch (err) {
            setToast({ type: 'error', message: err.response?.data?.message || 'Failed to reject clinic' });
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
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
                    <div className="p-2.5 bg-indigo-50 rounded-lg border border-indigo-200">
                        <ClipboardCheck className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Clinic Approvals</h1>
                        <p className="text-gray-500 text-sm mt-0.5">
                            Review newly registered clinics
                            <span className="ml-1 text-indigo-600 font-medium">
                                · {clinics.length} pending
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
            {!error && clinics.length === 0 && (
                <div className="bg-white rounded-xl p-12 border border-gray-200 shadow-sm text-center">
                    <CheckCircle2 className="w-16 h-16 text-indigo-200 mx-auto mb-4" />
                    <p className="text-gray-600 font-semibold text-lg">
                        No pending clinic approvals.
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                        All set! There are no new clinics awaiting your review.
                    </p>
                </div>
            )}

            {/* Clinics List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {clinics.map((clinic) => (
                    <div
                        key={clinic._id}
                        className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
                    >
                        <div className="p-5 flex-1 space-y-4">
                            {/* Clinic Info */}
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3 min-w-0">
                                    <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0 border border-indigo-100">
                                        <Building2 className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-lg font-bold text-gray-800 truncate">
                                            {clinic.name}
                                        </h3>
                                        <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-semibold rounded-full border border-gray-200">
                                            {clinic.clinicType}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="space-y-2.5">
                                <div className="flex items-start gap-2 text-sm text-gray-600">
                                    <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                                    <span className="line-clamp-2">{clinic.address}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                                    <span>
                                        Registered on {new Date(clinic.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                {clinic.doctor && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <User className="w-4 h-4 text-gray-400 shrink-0" />
                                        <span className="truncate">
                                            Dr. {clinic.doctor.name} ({clinic.doctor.email})
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-3">
                            <button
                                onClick={() => handleReject(clinic._id, clinic.name)}
                                disabled={processingId === clinic._id}
                                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors disabled:opacity-50"
                            >
                                {processingId === clinic._id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <X className="w-4 h-4" />
                                )}
                                Reject
                            </button>
                            <button
                                onClick={() => handleApprove(clinic._id, clinic.name)}
                                disabled={processingId === clinic._id}
                                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                            >
                                {processingId === clinic._id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Check className="w-4 h-4" />
                                )}
                                Approve
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ClinicApprovals;
