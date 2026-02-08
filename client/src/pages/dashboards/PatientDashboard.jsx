import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyToken } from '../../api/token.api';
import {
    CalendarCheck,
    Clock,
    FileText,
    Bell,
    Building2,
    Plus,
    Upload,
    Ticket,
    Users,
    AlertCircle,
    Loader2,
} from 'lucide-react';

function PatientDashboard() {
    const navigate = useNavigate();
    const [tokenData, setTokenData] = useState(null);
    const [tokenLoading, setTokenLoading] = useState(true);

    useEffect(() => {
        const fetchTokenStatus = async () => {
            try {
                const response = await getMyToken();
                setTokenData(response);
            } catch (err) {
                console.error('Failed to fetch token status:', err);
            } finally {
                setTokenLoading(false);
            }
        };

        fetchTokenStatus();
    }, []);

    // Placeholder data - ready for API integration
    const kpiData = {
        totalAppointments: 0,
        upcomingAppointments: 0,
        medicalRecords: 0,
        notifications: 0,
    };

    const upcomingAppointments = [];

    const kpiCards = [
        {
            label: 'Total Appointments',
            value: kpiData.totalAppointments,
            icon: CalendarCheck,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
        },
        {
            label: 'Upcoming',
            value: kpiData.upcomingAppointments,
            icon: Clock,
            color: 'text-green-600',
            bg: 'bg-green-50',
        },
        {
            label: 'Medical Records',
            value: kpiData.medicalRecords,
            icon: FileText,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
        },
        {
            label: 'Notifications',
            value: kpiData.notifications,
            icon: Bell,
            color: 'text-orange-600',
            bg: 'bg-orange-50',
        },
    ];

    const quickActions = [
        {
            label: 'Browse Clinics',
            icon: Building2,
            path: '/patient/clinics',
            color: 'bg-blue-600 hover:bg-blue-700',
        },
        {
            label: 'Book Appointment',
            icon: Plus,
            path: '/patient/clinics',
            color: 'bg-green-600 hover:bg-green-700',
        },
        {
            label: 'Upload Report',
            icon: Upload,
            path: '/patient/records',
            color: 'bg-purple-600 hover:bg-purple-700',
        },
    ];

    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h1 className="text-2xl font-bold text-gray-800">Welcome back</h1>
                <p className="text-gray-600 mt-1">
                    Manage your appointments, reports, and health insights
                </p>
            </div>

            {/* My Token Status Card */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Ticket className="w-5 h-5 text-orange-600" />
                        <h2 className="text-lg font-semibold text-gray-800">My Token Status</h2>
                    </div>
                    <button
                        onClick={() => navigate('/patient/token')}
                        className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                    >
                        View Details
                    </button>
                </div>

                {tokenLoading ? (
                    <div className="flex items-center justify-center py-6">
                        <Loader2 className="w-6 h-6 text-orange-600 animate-spin" />
                    </div>
                ) : tokenData?.hasActiveToken ? (
                    <div className="space-y-4">
                        {/* Clinic Info */}
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            <span>{tokenData.data.clinicName}</span>
                        </div>

                        {/* Token Numbers */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white rounded-lg p-4 border border-orange-200">
                                <p className="text-sm text-gray-500 mb-1">Your Token</p>
                                <p className="text-3xl font-bold text-orange-600">
                                    #{tokenData.data.tokenNumber}
                                </p>
                            </div>
                            <div className="bg-white rounded-lg p-4 border border-orange-200">
                                <p className="text-sm text-gray-500 mb-1">Current Token</p>
                                <p className="text-3xl font-bold text-gray-800">
                                    #{tokenData.data.currentToken || '-'}
                                </p>
                            </div>
                        </div>

                        {/* Status Info */}
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600">
                                    {tokenData.data.tokensAhead} patient(s) ahead
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600">
                                    ~{tokenData.data.estimatedWait}
                                </span>
                            </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-2">
                            <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${tokenData.data.status === 'CALLED'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-orange-100 text-orange-700'
                                    }`}
                            >
                                {tokenData.data.status === 'CALLED' ? 'Your Turn!' : 'Waiting'}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-6">
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Ticket className="w-6 h-6 text-orange-400" />
                        </div>
                        <p className="text-gray-600 font-medium">You are not currently in a token queue</p>
                        <p className="text-gray-500 text-sm mt-1">Join a token-based clinic to get started</p>
                        <button
                            onClick={() => navigate('/patient/clinics')}
                            className="mt-4 px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors"
                        >
                            Browse Clinics
                        </button>
                    </div>
                )}
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpiCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={card.label}
                            className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">{card.label}</p>
                                    <p className="text-3xl font-bold text-gray-800 mt-1">{card.value}</p>
                                </div>
                                <div className={`p-3 rounded-lg ${card.bg}`}>
                                    <Icon className={`w-6 h-6 ${card.color}`} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
                <div className="flex flex-wrap gap-3">
                    {quickActions.map((action) => {
                        const Icon = action.icon;
                        return (
                            <button
                                key={action.label}
                                onClick={() => navigate(action.path)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-medium transition-colors ${action.color}`}
                            >
                                <Icon className="w-4 h-4" />
                                {action.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Upcoming Appointments */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">Upcoming Appointments</h2>
                    <button
                        onClick={() => navigate('/patient/appointments')}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                        View All
                    </button>
                </div>

                {upcomingAppointments.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        <CalendarCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No upcoming appointments</p>
                        <p className="text-gray-400 text-sm mt-1">Book an appointment to get started</p>
                        <button
                            onClick={() => navigate('/patient/clinics')}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Browse Clinics
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {upcomingAppointments.map((apt, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                            >
                                <div>
                                    <p className="font-medium text-gray-800">{apt.doctorName}</p>
                                    <p className="text-sm text-gray-500">{apt.clinicName}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium text-gray-800">{apt.date}</p>
                                    <p className="text-sm text-gray-500">{apt.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default PatientDashboard;
