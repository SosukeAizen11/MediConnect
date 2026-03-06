import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import { getDashboardStats } from '../../api/doctor.api';
import { getDoctorAppointments } from '../../api/appointment.api';
import {
    CalendarCheck,
    Clock,
    Ticket,
    FileText,
    ListOrdered,
    PenSquare,
    TrendingUp,
    Activity,
} from 'lucide-react';

function DoctorDashboard() {
    const navigate = useNavigate();
    const { user } = useAuthContext();

    const [kpiData, setKpiData] = useState({
        todayAppointments: 0,
        pendingAppointments: 0,
        activeTokens: 0,
        totalPosts: 0,
    });
    const [upcomingAppointments, setUpcomingAppointments] = useState([]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await getDashboardStats();
                if (res.success) {
                    setKpiData({
                        totalPosts: res.totalPosts || 0,
                        todayAppointments: res.todayAppointments || 0,
                        pendingAppointments: res.pendingAppointments || 0,
                        activeTokens: res.activeTokens || 0,
                    });
                }

                // Fetch upcoming appointments
                const aptRes = await getDoctorAppointments();
                if (aptRes.success && aptRes.data) {
                    // Filter for future/today valid appointments
                    const todayStr = new Date().toISOString().split('T')[0];
                    const validApts = aptRes.data
                        .filter(apt => ['BOOKED', 'CONFIRMED'].includes(apt.status) && apt.date >= todayStr)
                        .slice(0, 5)
                        .map(apt => ({
                            patientName: apt.patient?.name || 'Unknown Patient',
                            reason: apt.diagnosis || 'Consultation',
                            date: apt.date,
                            time: apt.time
                        }));
                    setUpcomingAppointments(validApts);
                }
            } catch (err) {
                console.error("Failed to load dashboard data", err);
            }
        };

        fetchStats();
    }, []);

    const kpiCards = [
        {
            label: "Today's Appointments",
            value: kpiData.todayAppointments,
            icon: CalendarCheck,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            border: 'border-emerald-200',
            trend: '+0 from yesterday',
        },
        {
            label: 'Pending Appointments',
            value: kpiData.pendingAppointments,
            icon: Clock,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            border: 'border-amber-200',
            trend: 'Awaiting confirmation',
        },
        {
            label: 'Active Tokens',
            value: kpiData.activeTokens,
            icon: Ticket,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            trend: 'In queue right now',
        },
        {
            label: 'Total Posts',
            value: kpiData.totalPosts,
            icon: FileText,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            border: 'border-purple-200',
            trend: 'Published articles',
        },
    ];

    const quickActions = [
        {
            label: 'View Queue',
            description: 'Check your appointment queue',
            icon: ListOrdered,
            path: '/doctor/queue',
            color: 'bg-emerald-600 hover:bg-emerald-700',
        },
        {
            label: 'Create Post',
            description: 'Share health tips with patients',
            icon: PenSquare,
            path: '/doctor/create-post',
            color: 'bg-blue-600 hover:bg-blue-700',
        },
    ];

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Welcome Section */}
            <div className="bg-linear-to-r from-emerald-600 to-teal-600 rounded-xl p-6 shadow-lg text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">
                            Welcome back, Dr. {user?.name || 'Doctor'}
                        </h1>
                        <p className="mt-1 text-emerald-100">
                            Here's your clinical overview for today
                        </p>
                    </div>
                    <div className="hidden md:flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                        <Activity className="w-5 h-5 text-emerald-200" />
                        <span className="text-sm font-medium text-emerald-50">
                            {new Date().toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </span>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpiCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={card.label}
                            className={`bg-white rounded-xl p-5 border ${card.border} shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">
                                        {card.label}
                                    </p>
                                    <p className="text-3xl font-bold text-gray-800 mt-1">
                                        {card.value}
                                    </p>
                                </div>
                                <div
                                    className={`p-3 rounded-lg ${card.bg} group-hover:scale-110 transition-transform duration-200`}
                                >
                                    <Icon className={`w-6 h-6 ${card.color}`} />
                                </div>
                            </div>
                            <div className="mt-3 flex items-center gap-1.5">
                                <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
                                <p className="text-xs text-gray-400">{card.trend}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Main Grid — Appointments + Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Upcoming Appointments */}
                <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">
                                Upcoming Appointments
                            </h2>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Your scheduled consultations
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/doctor/queue')}
                            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                        >
                            View All
                        </button>
                    </div>

                    {upcomingAppointments.length === 0 ? (
                        <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                            <CalendarCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">
                                No upcoming appointments
                            </p>
                            <p className="text-gray-400 text-sm mt-1">
                                Appointments will appear here once patients book with you
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {upcomingAppointments.map((apt, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-emerald-200 transition-colors"
                                >
                                    <div>
                                        <p className="font-medium text-gray-800">
                                            {apt.patientName}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {apt.reason}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-gray-800">
                                            {apt.date}
                                        </p>
                                        <p className="text-sm text-gray-500">{apt.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">
                        Quick Actions
                    </h2>
                    <div className="space-y-3">
                        {quickActions.map((action) => {
                            const Icon = action.icon;
                            return (
                                <button
                                    key={action.label}
                                    onClick={() => navigate(action.path)}
                                    className={`flex items-center gap-3 w-full px-4 py-4 rounded-lg text-white text-sm font-medium transition-all duration-200 hover:shadow-md ${action.color}`}
                                >
                                    <div className="p-2 bg-white/15 rounded-lg">
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-semibold">{action.label}</p>
                                        <p className="text-xs text-white/70">
                                            {action.description}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Today Summary Mini Card */}
                    <div className="mt-6 p-4 bg-linear-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">
                            Today's Summary
                        </h3>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">Consultations</span>
                                <span className="font-medium text-gray-800">{kpiData.todayAppointments}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">Patients Seen</span>
                                <span className="font-medium text-gray-800">-</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">Tokens Processed</span>
                                <span className="font-medium text-gray-800">-</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DoctorDashboard;
