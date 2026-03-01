import { useState, useEffect, useCallback } from 'react';
import { getAllClinics, toggleClinicStatus, deleteClinic } from '../../api/admin.api';
import {
    Building2,
    MapPin,
    CheckCircle2,
    XCircle,
    Loader2,
    AlertCircle,
    Trash2,
    Power
} from 'lucide-react';

function AllClinics() {
    const [clinics, setClinics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);
    const [processingId, setProcessingId] = useState(null);

    const fetchClinics = useCallback(async () => {
        try {
            setError(null);
            const res = await getAllClinics();
            setClinics(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load clinics');
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

    const handleToggle = async (id, name, currentStatus) => {
        setProcessingId(`toggle-${id}`);
        try {
            const res = await toggleClinicStatus(id);
            setClinics((prev) =>
                prev.map((c) =>
                    c._id === id ? { ...c, isActive: res.data.isActive } : c
                )
            );
            setToast({
                type: 'success',
                message: `Clinic "${name}" is now ${res.data.isActive ? 'active' : 'inactive'}`
            });
        } catch (err) {
            setToast({ type: 'error', message: err.response?.data?.message || 'Failed to toggle status' });
        } finally {
            setProcessingId(null);
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Are you sure you want to permanently delete "${name}"?`)) return;

        setProcessingId(`delete-${id}`);
        try {
            await deleteClinic(id);
            setClinics((prev) => prev.filter((c) => c._id !== id));
            setToast({ type: 'success', message: `Clinic "${name}" deleted successfully` });
        } catch (err) {
            setToast({ type: 'error', message: err.response?.data?.message || 'Failed to delete clinic' });
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
        <div className="space-y-6 max-w-6xl mx-auto">
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
                        <Building2 className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">All Clinics</h1>
                        <p className="text-gray-500 text-sm mt-0.5">
                            Manage registered clinics
                            <span className="ml-1 text-indigo-600 font-medium">
                                · {clinics.length} total
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
                    <Building2 className="w-16 h-16 text-indigo-200 mx-auto mb-4" />
                    <p className="text-gray-600 font-semibold text-lg">
                        No clinics found.
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                        There are no registered clinics in the system yet.
                    </p>
                </div>
            )}

            {/* Table */}
            {!error && clinics.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden text-sm">
                    <div className="overflow-x-auto hide-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600">
                                    <th className="px-6 py-4 font-semibold shrink-0">Clinic Info</th>
                                    <th className="px-6 py-4 font-semibold">Address</th>
                                    <th className="px-6 py-4 font-semibold text-center">Approved</th>
                                    <th className="px-6 py-4 font-semibold text-center">Active</th>
                                    <th className="px-6 py-4 font-semibold">Registered</th>
                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {clinics.map((clinic) => (
                                    <tr key={clinic._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3 min-w-[200px]">
                                                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0 border border-indigo-100">
                                                    <Building2 className="w-5 h-5 text-indigo-600" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-800">{clinic.name}</p>
                                                    <p className="text-[11px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full inline-block mt-1 uppercase">
                                                        {clinic.clinicType}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-start gap-2 text-gray-600 min-w-[200px]">
                                                <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                                                <span className="line-clamp-2">{clinic.address}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {clinic.isApproved ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                                    <AlertCircle className="w-3.5 h-3.5" /> Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {clinic.isActive ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                                    <XCircle className="w-3.5 h-3.5" /> Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 min-w-[120px]">
                                            {new Date(clinic.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleToggle(clinic._id, clinic.name, clinic.isActive)}
                                                    disabled={processingId === `toggle-${clinic._id}`}
                                                    title={clinic.isActive ? "Disable Clinic" : "Enable Clinic"}
                                                    className={`p-2 rounded-lg transition-colors border ${clinic.isActive
                                                        ? 'text-amber-600 hover:bg-amber-50 border-transparent hover:border-amber-200'
                                                        : 'text-green-600 hover:bg-green-50 border-transparent hover:border-green-200'
                                                        } disabled:opacity-50`}
                                                >
                                                    {processingId === `toggle-${clinic._id}` ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Power className="w-4 h-4" />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(clinic._id, clinic.name)}
                                                    disabled={processingId === `delete-${clinic._id}`}
                                                    title="Delete Clinic"
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200 disabled:opacity-50"
                                                >
                                                    {processingId === `delete-${clinic._id}` ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AllClinics;
