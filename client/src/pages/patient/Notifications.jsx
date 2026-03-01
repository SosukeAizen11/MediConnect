import { useState } from 'react';
import {
    Bell,
    CalendarCheck,
    CheckCircle,
    Clock,
    Info,
    Brain,
    Settings,
} from 'lucide-react';

function Notifications() {
    // Mock notification data - ready for API integration
    const [notifications] = useState([
        {
            id: 1,
            type: 'appointment_reminder',
            title: 'Upcoming Appointment Reminder',
            message: 'You have an appointment with Dr. Smith tomorrow at 10:00 AM',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            read: false,
        },
        {
            id: 2,
            type: 'appointment_booked',
            title: 'Appointment Confirmed',
            message: 'Your appointment has been successfully booked at City Health Clinic',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            read: false,
        },
        {
            id: 3,
            type: 'ai_insights',
            title: 'AI Health Insights Ready',
            message: 'Your medical report analysis is complete. View your insights now.',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            read: true,
        },
        {
            id: 4,
            type: 'system',
            title: 'Welcome to MediConnect',
            message: 'Thank you for joining! Complete your profile to get personalized health recommendations.',
            timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            read: true,
        },
    ]);

    const getIcon = (type) => {
        switch (type) {
            case 'appointment_reminder':
                return { icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50' };
            case 'appointment_booked':
                return { icon: CalendarCheck, color: 'text-green-500', bg: 'bg-green-50' };
            case 'ai_insights':
                return { icon: Brain, color: 'text-purple-500', bg: 'bg-purple-50' };
            case 'system':
                return { icon: Settings, color: 'text-blue-500', bg: 'bg-blue-50' };
            default:
                return { icon: Info, color: 'text-gray-500', bg: 'bg-gray-50' };
        }
    };

    const formatTimeAgo = (timestamp) => {
        const now = new Date();
        const date = new Date(timestamp);
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const unreadCount = notifications.filter((n) => !n.read).length;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
                        <p className="text-gray-600 mt-1">
                            Stay updated with your appointments and health updates
                        </p>
                    </div>
                    {unreadCount > 0 && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                            {unreadCount} unread
                        </span>
                    )}
                </div>
            </div>

            {/* Notifications List */}
            {notifications.length === 0 ? (
                <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Bell className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-800 font-medium">You have no notifications right now</p>
                    <p className="text-gray-500 text-sm mt-1">
                        We'll notify you when there's something important
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {notifications.map((notification) => {
                        const { icon: Icon, color, bg } = getIcon(notification.type);
                        return (
                            <div
                                key={notification.id}
                                className={`bg-white rounded-xl p-5 border shadow-sm cursor-pointer hover:shadow-md transition-shadow ${notification.read
                                    ? 'border-gray-200'
                                    : 'border-blue-200 bg-blue-50/30'
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    {/* Icon */}
                                    <div className={`w-10 h-10 ${bg} rounded-full flex items-center justify-center shrink-0`}>
                                        <Icon className={`w-5 h-5 ${color}`} />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className={`font-medium ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
                                                {notification.title}
                                            </h3>
                                            {!notification.read && (
                                                <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-2"></span>
                                            )}
                                        </div>
                                        <p className={`text-sm mt-1 ${notification.read ? 'text-gray-500' : 'text-gray-600'}`}>
                                            {notification.message}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                                            <span className="text-xs text-gray-400">
                                                {formatTimeAgo(notification.timestamp)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Footer Note */}
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                <CheckCircle className="w-4 h-4" />
                <span>You're all caught up!</span>
            </div>
        </div>
    );
}

export default Notifications;
