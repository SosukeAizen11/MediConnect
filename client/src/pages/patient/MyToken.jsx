import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyToken } from '../../api/token.api';
import {
    Ticket,
    Building2,
    Clock,
    Users,
    Loader2,
    ArrowLeft,
    RefreshCw,
    Info,
} from 'lucide-react';

function MyToken() {
    const navigate = useNavigate();
    const [tokenData, setTokenData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchTokenStatus = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const response = await getMyToken();
            setTokenData(response);
        } catch (err) {
            console.error('Failed to fetch token status:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchTokenStatus();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <button
                    onClick={() => navigate('/patient/dashboard')}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium mb-3"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </button>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">My Token Status</h1>
                        <p className="text-gray-600 mt-1">
                            Track your position in the queue
                        </p>
                    </div>
                    <button
                        onClick={() => fetchTokenStatus(true)}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            {tokenData?.hasActiveToken ? (
                <>
                    {/* Token Card */}
                    <div className="bg-linear-to-br from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-200 shadow-sm">
                        {/* Clinic Info */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-orange-600" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-gray-800">
                                    {tokenData.data.clinicName}
                                </h2>
                                <p className="text-sm text-gray-500">
                                    {tokenData.data.clinicAddress}
                                </p>
                            </div>
                        </div>

                        {/* Token Display */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-white rounded-xl p-6 border border-orange-200 text-center">
                                <p className="text-sm text-gray-500 mb-2">Your Token</p>
                                <div className="flex items-center justify-center gap-2">
                                    <Ticket className="w-8 h-8 text-orange-600" />
                                    <span className="text-5xl font-bold text-orange-600">
                                        #{tokenData.data.tokenNumber}
                                    </span>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl p-6 border border-orange-200 text-center">
                                <p className="text-sm text-gray-500 mb-2">Current Token</p>
                                <div className="flex items-center justify-center">
                                    <span className="text-5xl font-bold text-gray-800">
                                        #{tokenData.data.currentToken || '-'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex justify-center mb-6">
                            <span
                                className={`px-6 py-2 rounded-full text-sm font-semibold ${tokenData.data.status === 'CALLED'
                                    ? 'bg-green-100 text-green-700 animate-pulse'
                                    : 'bg-orange-100 text-orange-700'
                                    }`}
                            >
                                {tokenData.data.status === 'CALLED'
                                    ? '🎉 Your Turn! Please proceed to the counter'
                                    : '⏳ Waiting in Queue'}
                            </span>
                        </div>

                        {/* Queue Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white rounded-lg p-4 border border-orange-200 flex items-center gap-3">
                                <Users className="w-5 h-5 text-orange-600" />
                                <div>
                                    <p className="text-sm text-gray-500">Patients Ahead</p>
                                    <p className="font-semibold text-gray-800">
                                        {tokenData.data.tokensAhead}
                                    </p>
                                </div>
                            </div>
                            <div className="bg-white rounded-lg p-4 border border-orange-200 flex items-center gap-3">
                                <Clock className="w-5 h-5 text-orange-600" />
                                <div>
                                    <p className="text-sm text-gray-500">Estimated Wait</p>
                                    <p className="font-semibold text-gray-800">
                                        {tokenData.data.estimatedWait}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Info Note */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-700">
                            You'll be notified when your turn approaches. Please stay nearby and be ready
                            when your token number is called.
                        </p>
                    </div>
                </>
            ) : (
                /* Empty State */
                <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Ticket className="w-10 h-10 text-gray-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">
                        No Active Token
                    </h2>
                    <p className="text-gray-600 mb-6">
                        You are not currently in any token queue. Visit a token-based clinic to join a queue.
                    </p>
                    <button
                        onClick={() => navigate('/patient/clinics')}
                        className="px-6 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors"
                    >
                        Browse Clinics
                    </button>
                </div>
            )}
        </div>
    );
}

export default MyToken;
