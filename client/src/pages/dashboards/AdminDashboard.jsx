import { useState, useEffect } from 'react';
import { getSystemAnalytics } from '../../api/admin.api';
import {
    Users,
    Building2,
    ClipboardCheck,
    CalendarCheck,
    Hash,
    TrendingUp,
    TrendingDown,
    Clock,
    UserPlus,
    Plus,
    Activity,
    MessageSquare,
    Loader2,
    AlertCircle
} from 'lucide-react';

function AdminDashboard() {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await getSystemAnalytics();
                setAnalytics(res.data);
            } catch (err) {
                setError('Failed to load system analytics');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    const kpiCards = analytics ? [
        {
            label: 'Total Users',
            value: analytics.users.total.toLocaleString(),
            change: `${analytics.users.active} Active`,
            trend: 'up',
            icon: Users,
            color: 'blue',
        },
        {
            label: 'Total Clinics',
            value: analytics.clinics.total.toLocaleString(),
            change: `${analytics.clinics.active} Active`,
            trend: 'up',
            icon: Building2,
            color: 'emerald',
        },
        {
            label: 'Total Appointments',
            value: analytics.appointments.total.toLocaleString(),
            change: `${analytics.appointments.pending} Pending`,
            trend: 'up',
            icon: CalendarCheck,
            color: 'purple',
        },
        {
            label: 'Active Tokens',
            value: analytics.tokens.active.toLocaleString(),
            change: `Total: ${analytics.tokens.total}`,
            trend: 'neutral',
            icon: Hash,
            color: 'indigo',
        },
    ] : [];

    const colorMap = {
        blue: {
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            icon: 'text-blue-600',
            iconBg: 'bg-blue-100',
        },
        emerald: {
            bg: 'bg-emerald-50',
            border: 'border-emerald-200',
            icon: 'text-emerald-600',
            iconBg: 'bg-emerald-100',
        },
        amber: {
            bg: 'bg-amber-50',
            border: 'border-amber-200',
            icon: 'text-amber-600',
            iconBg: 'bg-amber-100',
        },
        purple: {
            bg: 'bg-purple-50',
            border: 'border-purple-200',
            icon: 'text-purple-600',
            iconBg: 'bg-purple-100',
        },
        indigo: {
            bg: 'bg-indigo-50',
            border: 'border-indigo-200',
            icon: 'text-indigo-600',
            iconBg: 'bg-indigo-100',
        },
    };

    const roleBadge = (role) => {
        if (role === 'DOCTOR')
            return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        if (role === 'ADMIN')
            return 'bg-indigo-50 text-indigo-700 border-indigo-200';
        return 'bg-blue-50 text-blue-700 border-blue-200';
    };

    const statusBadge = (status) => {
        if (status === 'APPROVED')
            return 'bg-green-50 text-green-700 border-green-200';
        return 'bg-amber-50 text-amber-700 border-amber-200';
    };

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-7xl mx-auto mt-6">
                <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-3 border border-red-200">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="font-medium">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
                <p className="text-gray-500 text-sm mt-0.5">
                    System overview and real-time analytics
                </p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpiCards.map((card) => {
                    const c = colorMap[card.color];
                    return (
                        <div
                            key={card.label}
                            className={`bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div
                                    className={`w-10 h-10 ${c.iconBg} rounded-lg flex items-center justify-center`}
                                >
                                    <card.icon className={`w-5 h-5 ${c.icon}`} />
                                </div>
                                {card.trend === 'up' && (
                                    <span className="flex items-center gap-1 text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">
                                        <TrendingUp className="w-3.5 h-3.5" />
                                        {card.change}
                                    </span>
                                )}
                                {card.trend === 'neutral' && (
                                    <span className="text-xs text-gray-500 font-medium bg-gray-50 px-2 py-1 rounded-full border border-gray-200">
                                        {card.change}
                                    </span>
                                )}
                            </div>
                            <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                            <p className="text-xs text-gray-400 mt-1 uppercase tracking-wide font-semibold">{card.label}</p>
                        </div>
                    );
                })}
            </div>

            {/* Secondary Metrics & Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Visual Breakdowns */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Users className="w-5 h-5 text-indigo-600" />
                            User Demographics
                        </h2>

                        <div className="space-y-5">
                            {/* Patients Bar */}
                            <div>
                                <div className="flex justify-between text-sm mb-1.5">
                                    <span className="font-medium text-gray-700">Patients</span>
                                    <span className="text-gray-500">{analytics.users.patients.toLocaleString()}</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2.5">
                                    <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${(analytics.users.patients / analytics.users.total) * 100}%` }}></div>
                                </div>
                            </div>

                            {/* Doctors Bar */}
                            <div>
                                <div className="flex justify-between text-sm mb-1.5">
                                    <span className="font-medium text-gray-700">Doctors</span>
                                    <span className="text-gray-500">{analytics.users.doctors.toLocaleString()}</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2.5">
                                    <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: `${(analytics.users.doctors / analytics.users.total) * 100}%` }}></div>
                                </div>
                            </div>

                            {/* Admins Bar */}
                            <div>
                                <div className="flex justify-between text-sm mb-1.5">
                                    <span className="font-medium text-gray-700">Administrators</span>
                                    <span className="text-gray-500">{analytics.users.admins.toLocaleString()}</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2.5">
                                    <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: `${(analytics.users.admins / analytics.users.total) * 100}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-indigo-600" />
                                Clinic Distribution
                            </h2>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                                <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wide mb-1">Token Based</p>
                                <div className="flex items-end gap-2">
                                    <p className="text-3xl font-bold text-gray-900">{analytics.clinics.byType.token}</p>
                                    <p className="text-sm text-gray-500 mb-1">clinics</p>
                                </div>
                            </div>
                            <div className="bg-fuchsia-50/50 p-4 rounded-xl border border-fuchsia-100">
                                <p className="text-xs text-fuchsia-600 font-semibold uppercase tracking-wide mb-1">Appointment Based</p>
                                <div className="flex items-end gap-2">
                                    <p className="text-3xl font-bold text-gray-900">{analytics.clinics.byType.appointment}</p>
                                    <p className="text-sm text-gray-500 mb-1">clinics</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Operations Actions / Metrics */}
                <div className="space-y-4">
                    {/* Pending Approvals Widget */}
                    <div className="bg-amber-50 rounded-xl border border-amber-200 p-5 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <ClipboardCheck className="w-24 h-24 text-amber-600" />
                        </div>
                        <div className="relative z-10">
                            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
                                <ClipboardCheck className="w-5 h-5 text-amber-600" />
                            </div>
                            <h3 className="text-amber-900 font-bold text-lg mb-1">Pending Clinic Approvals</h3>
                            <div className="flex items-end gap-2 mb-4">
                                <p className="text-4xl font-black text-amber-600">{analytics.clinics.pending}</p>
                                <p className="text-amber-800 font-medium mb-1">clinics</p>
                            </div>
                            <a href="/admin/approvals" className="inline-flex items-center justify-center w-full bg-white text-amber-700 font-semibold py-2 px-4 rounded-lg shadow-sm border border-amber-200 hover:bg-amber-50 transition-colors">
                                Review Approvals
                            </a>
                        </div>
                    </div>

                    {/* Stats Summary Panel */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-gray-400" />
                                Operations Summary
                            </h3>
                        </div>
                        <div className="divide-y divide-gray-100">
                            <div className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">Completed Consultations</p>
                                    <p className="text-xs text-gray-500">Total lifetime platform consults</p>
                                </div>
                                <span className="text-lg font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
                                    {(analytics.appointments.completed + analytics.tokens.completed).toLocaleString()}
                                </span>
                            </div>
                            <div className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">Total Doctor Posts</p>
                                    <p className="text-xs text-gray-500">Shared in health feed</p>
                                </div>
                                <span className="text-base font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-lg">
                                    {analytics.posts.total.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default AdminDashboard;
