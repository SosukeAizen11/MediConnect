import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDoctorTokenQueue, advanceToken } from '../../api/token.api';
import {
    Hash,
    User,
    Phone,
    Clock,
    SkipForward,
    PlayCircle,
    Loader2,
    CheckCircle2,
    AlertCircle,
    AlertTriangle,
    Users,
    ClipboardList,
} from 'lucide-react';

function TokenQueue() {
    const [queueData, setQueueData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [advancing, setAdvancing] = useState(false);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);
    const navigate = useNavigate();

    const fetchQueue = useCallback(async () => {
        try {
            setError(null);
            const res = await getDoctorTokenQueue();
            setQueueData(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load token queue');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchQueue();
    }, [fetchQueue]);

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 3000);
        return () => clearTimeout(timer);
    }, [toast]);

    const handleAdvance = async () => {
        setAdvancing(true);
        try {
            const res = await advanceToken();
            setQueueData(res.data);
            setToast({
                type: 'success',
                message: res.message || 'Advanced to next patient',
            });
        } catch (err) {
            setToast({
                type: 'error',
                message: err.response?.data?.message || 'Failed to advance token',
            });
        } finally {
            setAdvancing(false);
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

            {/* Page Header */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200">
                            <Hash className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">
                                Token Queue Management
                            </h1>
                            <p className="text-gray-500 text-sm mt-0.5">
                                Manage walk-in patients
                                {queueData?.clinicName && (
                                    <span className="ml-1 text-emerald-600 font-medium">
                                        · {queueData.clinicName}
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                    {queueData && (
                        <div className="hidden sm:flex items-center gap-4 text-sm">
                            <div className="bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg text-green-700 font-semibold">
                                ✓ {queueData.completedCount} Done
                            </div>
                            <div className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg text-amber-700 font-semibold">
                                ⏳ {queueData.waitingCount} Waiting
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-3 text-red-700">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold">{error}</p>
                        <p className="text-xs text-red-500 mt-1">
                            Make sure your profile is linked to a token-based clinic.
                        </p>
                    </div>
                </div>
            )}

            {!error && queueData && (
                <>
                    {/* Currently Serving */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-200">
                            <h2 className="text-sm font-semibold text-emerald-800 uppercase tracking-wider">
                                Currently Serving
                            </h2>
                        </div>

                        {queueData.currentToken ? (
                            <div className="p-6">
                                <div className="flex items-center gap-6">
                                    {/* Large Token Number */}
                                    <div className="w-24 h-24 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                                        <div className="text-center">
                                            <p className="text-xs text-emerald-200 font-medium">
                                                TOKEN
                                            </p>
                                            <p className="text-4xl font-black text-white leading-none">
                                                {queueData.currentToken.tokenNumber}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Patient Details */}
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-gray-400" />
                                            <p className="text-lg font-bold text-gray-800">
                                                {queueData.currentToken.patient?.name || 'Unknown'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-gray-400" />
                                            <p className="text-sm text-gray-500">
                                                {queueData.currentToken.patient?.phone || 'No phone'}
                                            </p>
                                        </div>
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                            Being Served
                                        </span>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col gap-2">
                                        <button
                                            onClick={() =>
                                                navigate(`/doctor/token-consult/${queueData.currentToken._id}`)
                                            }
                                            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                                        >
                                            <ClipboardList className="w-4 h-4" />
                                            Start Consultation
                                        </button>
                                        <button
                                            onClick={handleAdvance}
                                            disabled={advancing}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                        >
                                            {advancing ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <SkipForward className="w-4 h-4" />
                                            )}
                                            Next Patient
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 text-center">
                                <div className="w-16 h-16 bg-gray-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                                    <User className="w-8 h-8 text-gray-300" />
                                </div>
                                <p className="text-gray-500 font-medium">
                                    No patient currently being served
                                </p>
                                {queueData.waitingCount > 0 && (
                                    <button
                                        onClick={handleAdvance}
                                        disabled={advancing}
                                        className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                    >
                                        {advancing ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <PlayCircle className="w-5 h-5" />
                                        )}
                                        Start First Token
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Waiting List */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Waiting List
                            </h2>
                            <span className="text-xs bg-white border border-gray-200 px-2.5 py-1 rounded-full text-gray-500 font-semibold">
                                {queueData.waitingCount} patient{queueData.waitingCount !== 1 ? 's' : ''}
                            </span>
                        </div>

                        {queueData.waitingTokens.length === 0 ? (
                            <div className="p-8 text-center">
                                <CheckCircle2 className="w-12 h-12 text-green-300 mx-auto mb-3" />
                                <p className="text-gray-500 font-medium">
                                    No patients waiting
                                </p>
                                <p className="text-gray-400 text-sm mt-1">
                                    The queue is empty for today
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {queueData.waitingTokens.map((token, index) => (
                                    <div
                                        key={token._id}
                                        className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
                                    >
                                        {/* Position */}
                                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-sm font-bold text-gray-500">
                                            {index + 1}
                                        </div>

                                        {/* Token Number */}
                                        <div className="w-14 h-14 bg-amber-50 border-2 border-amber-200 rounded-xl flex items-center justify-center">
                                            <div className="text-center">
                                                <p className="text-[10px] text-amber-500 font-medium leading-none">
                                                    TKN
                                                </p>
                                                <p className="text-xl font-black text-amber-700 leading-none mt-0.5">
                                                    {token.tokenNumber}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Patient Info */}
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-800">
                                                {token.patient?.name || 'Unknown Patient'}
                                            </p>
                                            <div className="flex items-center gap-3 mt-0.5">
                                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                                    <Phone className="w-3 h-3" />
                                                    {token.patient?.phone || 'No phone'}
                                                </span>
                                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(token.createdAt).toLocaleTimeString([], {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Status Badge */}
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                            Waiting
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

export default TokenQueue;
