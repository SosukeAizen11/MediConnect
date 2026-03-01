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
} from 'lucide-react';

function AdminDashboard() {
    // Placeholder data
    const kpiCards = [
        {
            label: 'Total Users',
            value: '1,247',
            change: '+12%',
            trend: 'up',
            icon: Users,
            color: 'blue',
        },
        {
            label: 'Total Clinics',
            value: '38',
            change: '+3',
            trend: 'up',
            icon: Building2,
            color: 'emerald',
        },
        {
            label: 'Pending Approvals',
            value: '5',
            change: 'Needs review',
            trend: 'neutral',
            icon: ClipboardCheck,
            color: 'amber',
        },
        {
            label: 'Total Appointments',
            value: '3,892',
            change: '+8%',
            trend: 'up',
            icon: CalendarCheck,
            color: 'purple',
        },
        {
            label: 'Active Tokens',
            value: '24',
            change: 'Today',
            trend: 'neutral',
            icon: Hash,
            color: 'indigo',
        },
    ];

    const recentUsers = [
        { name: 'Rahul Sharma', role: 'PATIENT', date: '2026-03-01' },
        { name: 'Dr. Priya Patel', role: 'DOCTOR', date: '2026-02-28' },
        { name: 'Ankit Verma', role: 'PATIENT', date: '2026-02-28' },
        { name: 'Dr. Suresh Kumar', role: 'DOCTOR', date: '2026-02-27' },
        { name: 'Meena Joshi', role: 'PATIENT', date: '2026-02-27' },
    ];

    const recentClinics = [
        { name: 'City Health Clinic', type: 'TOKEN', status: 'APPROVED', date: '2026-03-01' },
        { name: 'Sunrise Medical Center', type: 'APPOINTMENT', status: 'PENDING', date: '2026-02-28' },
        { name: 'Green Valley Hospital', type: 'TOKEN', status: 'APPROVED', date: '2026-02-27' },
        { name: 'Apollo Care', type: 'APPOINTMENT', status: 'PENDING', date: '2026-02-26' },
    ];

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

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
                <p className="text-gray-500 text-sm mt-0.5">
                    System overview and management
                </p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
                                    <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                                        <TrendingUp className="w-3.5 h-3.5" />
                                        {card.change}
                                    </span>
                                )}
                                {card.trend === 'down' && (
                                    <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                                        <TrendingDown className="w-3.5 h-3.5" />
                                        {card.change}
                                    </span>
                                )}
                                {card.trend === 'neutral' && (
                                    <span className="text-xs text-gray-400 font-medium">
                                        {card.change}
                                    </span>
                                )}
                            </div>
                            <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{card.label}</p>
                        </div>
                    );
                })}
            </div>

            {/* Recent Activity Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Users */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                            <UserPlus className="w-4 h-4" />
                            Recently Registered Users
                        </h2>
                        <span className="text-xs bg-white border border-gray-200 px-2.5 py-1 rounded-full text-gray-500 font-semibold">
                            {recentUsers.length}
                        </span>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {recentUsers.map((user, i) => (
                            <div
                                key={i}
                                className="px-6 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
                                        <span className="text-xs font-bold text-gray-500">
                                            {user.name.charAt(0)}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">
                                            {user.name}
                                        </p>
                                        <span
                                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${roleBadge(
                                                user.role
                                            )}`}
                                        >
                                            {user.role}
                                        </span>
                                    </div>
                                </div>
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {user.date}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Clinics */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            Recently Created Clinics
                        </h2>
                        <span className="text-xs bg-white border border-gray-200 px-2.5 py-1 rounded-full text-gray-500 font-semibold">
                            {recentClinics.length}
                        </span>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {recentClinics.map((clinic, i) => (
                            <div
                                key={i}
                                className="px-6 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center justify-center">
                                        <Building2 className="w-4 h-4 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">
                                            {clinic.name}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] text-gray-400 font-medium">
                                                {clinic.type}
                                            </span>
                                            <span
                                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusBadge(
                                                    clinic.status
                                                )}`}
                                            >
                                                {clinic.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {clinic.date}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;
