import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { joinTokenQueue } from '../../api/token.api';
import { getClinicById } from '../../api/clinic.api';
import {
    Ticket,
    ArrowLeft,
    Building2,
    Clock,
    CheckCircle,
    Loader2,
    AlertCircle,
    Users,
} from 'lucide-react';

function JoinTokenQueue() {
    const { clinicId } = useParams();
    const navigate = useNavigate();

    const [clinic, setClinic] = useState(null);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchClinic = async () => {
            try {
                const response = await getClinicById(clinicId);
                setClinic(response.data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch clinic');
            } finally {
                setLoading(false);
            }
        };

        fetchClinic();
    }, [clinicId]);

    const handleJoinQueue = async () => {
        setJoining(true);
        setError('');

        try {
            const response = await joinTokenQueue(clinicId);
            setSuccess(response);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to join queue');
        } finally {
            setJoining(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (success) {
        return (
            <div className="space-y-6">
                <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm text-center">
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Token Assigned!</h2>

                    <div className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-orange-50 rounded-2xl my-6">
                        <Ticket className="w-8 h-8 text-orange-600" />
                        <span className="text-4xl font-bold text-orange-600">
                            #{success.tokenNumber}
                        </span>
                    </div>

                    <div className="space-y-3 text-gray-600 mb-6">
                        <div className="flex items-center justify-center gap-2">
                            <Building2 className="w-5 h-5 text-gray-400" />
                            <span>{clinic?.name}</span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                            <Users className="w-5 h-5 text-gray-400" />
                            <span>{success.tokensAhead} patient(s) ahead of you</span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                            <Clock className="w-5 h-5 text-gray-400" />
                            <span>Estimated wait: {success.estimatedWait}</span>
                        </div>
                    </div>

                    <p className="text-sm text-gray-500 mb-6">
                        You'll be notified when your turn approaches
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            onClick={() => navigate('/patient/dashboard')}
                            className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Go to Dashboard
                        </button>
                        <button
                            onClick={() => navigate('/patient/clinics')}
                            className="px-6 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Browse Clinics
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <button
                    onClick={() => navigate(`/patient/clinics/${clinicId}`)}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium mb-3"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Clinic
                </button>
                <h1 className="text-2xl font-bold text-gray-800">Join Token Queue</h1>
                <p className="text-gray-600 mt-1">
                    Get your token number for today's visit
                </p>
            </div>

            {/* Clinic Info Card */}
            {clinic && (
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-orange-50 rounded-xl flex items-center justify-center">
                            <Building2 className="w-7 h-7 text-orange-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-800">{clinic.name}</h3>
                            <p className="text-sm text-gray-500">{clinic.address}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Join Queue Card */}
            <div className="bg-linear-to-br from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-200 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <Ticket className="w-6 h-6 text-orange-600" />
                    <h2 className="text-lg font-semibold text-gray-800">Token Queue</h2>
                </div>

                <p className="text-gray-600 mb-6">
                    You will be assigned a token number. You'll be notified when your turn approaches.
                </p>

                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                <button
                    onClick={handleJoinQueue}
                    disabled={joining}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                    {joining ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Joining Queue...
                        </>
                    ) : (
                        <>
                            <Ticket className="w-5 h-5" />
                            Confirm & Join Queue
                        </>
                    )}
                </button>
            </div>

            {/* Info Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-700">
                    <strong>How it works:</strong> Once you join the queue, you'll receive a token number.
                    Wait for your turn to be called. You can track your position from your dashboard.
                </p>
            </div>
        </div>
    );
}

export default JoinTokenQueue;
