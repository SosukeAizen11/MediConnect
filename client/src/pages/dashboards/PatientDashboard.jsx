import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyToken } from '../../api/token.api';
import { getDashboardStats } from '../../api/patient.api';
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

    const [kpiData, setKpiData] = useState({
        totalAppointments: 0,
        upcomingAppointments: 0,
        medicalRecords: 0,
        notifications: 0,
    });
    const [upcomingAppointments, setUpcomingAppointments] = useState([]);

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

        const fetchDashboardData = async () => {
            try {
                const res = await getDashboardStats();
                if (res.success) {
                    setKpiData(res.kpiData);
                    setUpcomingAppointments(res.upcomingAppointments || []);
                }
            } catch (err) {
                console.error('Failed to fetch dashboard stats:', err);
            }
        };

        fetchTokenStatus();
        fetchDashboardData();
    }, []);



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
        <div className="space-y-6 md:space-y-8 pb-10">
            {/* Welcome Section */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm">
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Welcome back</h1>
                <p className="text-gray-500 mt-2 text-sm sm:text-base">
                    Manage your appointments, reports, and health insights safely.
                </p>
            </div>

            {/* My Token Status Card */}
            <div className="bg-linear-to-br from-orange-50 to-amber-50 rounded-2xl p-6 sm:p-8 border border-orange-200 shadow-md hover:shadow-lg transition-all duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <Ticket className="w-6 h-6 text-orange-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 tracking-tight">My Token Status</h2>
                    </div>
                    <button
                        onClick={() => navigate('/patient/token')}
                        className="text-sm text-orange-600 hover:text-orange-700 font-bold border-2 border-orange-200 hover:border-orange-300 bg-white px-4 py-2 rounded-xl transition-all w-full sm:w-auto"
                    >
                        View Full Screen
                    </button>
                </div>

                {tokenLoading ? (
                    <div className="flex items-center justify-center py-10">
                        <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
                    </div>
                ) : tokenData?.hasActiveToken ? (
                    <div className="space-y-6">
                        {/* Clinic Info */}
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 bg-white/50 w-fit px-4 py-2 rounded-lg border border-orange-100">
                            <Building2 className="w-4 h-4 text-orange-500" />
                            <span>{tokenData.data.clinicName}</span>
                        </div>

                        {/* Token Numbers */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center sm:text-left">
                            <div className="bg-white rounded-2xl p-6 border border-orange-200 shadow-sm hover:shadow-md transition-shadow hover:-translate-y-1 duration-300 flex flex-col items-center sm:items-start">
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Your Token</p>
                                <p className="text-5xl font-black text-orange-600 tracking-tighter">
                                    #{tokenData.data.tokenNumber}
                                </p>
                            </div>
                            <div className="bg-white rounded-2xl p-6 border border-orange-200 shadow-sm flex flex-col items-center sm:items-start">
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Now Serving</p>
                                <p className="text-5xl font-black text-gray-800 tracking-tighter">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {kpiCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={card.label}
                            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">{card.label}</p>
                                    <p className="text-4xl font-black text-gray-900 mt-2">{card.value}</p>
                                </div>
                                <div className={`p-4 rounded-xl ${card.bg}`}>
                                    <Icon className={`w-7 h-7 ${card.color}`} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-6 tracking-tight">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {quickActions.map((action) => {
                        const Icon = action.icon;
                        return (
                            <button
                                key={action.label}
                                onClick={() => navigate(action.path)}
                                className={`flex items-center justify-center gap-2 px-4 py-4 rounded-xl text-white text-sm font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 active:scale-95 ${action.color}`}
                            >
                                <Icon className="w-5 h-5" />
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
