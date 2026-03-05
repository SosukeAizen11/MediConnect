import { useState, useEffect, useCallback } from 'react';
import {
    getMyAvailability,
    createAvailability,
    updateAvailability,
} from '../../api/availability.api';
import {
    getMyLeaves,
    createLeave,
    deleteLeave,
} from '../../api/leave.api';
import {
    Clock,
    Save,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Calendar,
    Timer,
    CalendarOff,
    Trash2,
    Plus,
} from 'lucide-react';

const DAYS = [
    { label: 'Monday', value: 1 },
    { label: 'Tuesday', value: 2 },
    { label: 'Wednesday', value: 3 },
    { label: 'Thursday', value: 4 },
    { label: 'Friday', value: 5 },
    { label: 'Saturday', value: 6 },
    { label: 'Sunday', value: 0 },
];

const DEFAULT_FORM = { startTime: '09:00', endTime: '17:00', slotDuration: 15 };

function Availability() {
    const [availabilities, setAvailabilities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [savingDay, setSavingDay] = useState(null);

    // Leave state
    const [leaves, setLeaves] = useState([]);
    const [loadingLeaves, setLoadingLeaves] = useState(false);
    const [savingLeave, setSavingLeave] = useState(false);
    const [leaveForm, setLeaveForm] = useState({ date: '', reason: '' });

    // Local form state per day
    const [forms, setForms] = useState(() => {
        const init = {};
        DAYS.forEach((d) => {
            init[d.value] = { ...DEFAULT_FORM };
        });
        return init;
    });

    const fetchAvailability = useCallback(async () => {
        try {
            const res = await getMyAvailability();
            const data = res.data || [];
            setAvailabilities(data);

            // Populate forms with existing data
            const updatedForms = { ...forms };
            data.forEach((av) => {
                updatedForms[av.dayOfWeek] = {
                    startTime: av.startTime,
                    endTime: av.endTime,
                    slotDuration: av.slotDuration,
                    _id: av._id,
                };
            });
            setForms(updatedForms);
        } catch {
            // silently fail, forms remain with defaults
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchLeaves = useCallback(async () => {
        try {
            setLoadingLeaves(true);
            const res = await getMyLeaves();
            setLeaves(res.data || []);
        } catch {
            // silently fail
        } finally {
            setLoadingLeaves(false);
        }
    }, []);

    useEffect(() => {
        fetchAvailability();
        fetchLeaves();
    }, [fetchAvailability, fetchLeaves]);

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 3000);
        return () => clearTimeout(timer);
    }, [toast]);

    const handleChange = (dayValue, field, value) => {
        setForms((prev) => ({
            ...prev,
            [dayValue]: {
                ...prev[dayValue],
                [field]: value,
            },
        }));
    };

    const handleSave = async (dayValue) => {
        const form = forms[dayValue];

        if (form.startTime >= form.endTime) {
            setToast({ type: 'error', message: 'End time must be after start time' });
            return;
        }

        setSavingDay(dayValue);
        try {
            if (form._id) {
                // Update existing
                await updateAvailability(form._id, {
                    startTime: form.startTime,
                    endTime: form.endTime,
                    slotDuration: Number(form.slotDuration),
                });
            } else {
                // Create new
                await createAvailability({
                    dayOfWeek: dayValue,
                    startTime: form.startTime,
                    endTime: form.endTime,
                    slotDuration: Number(form.slotDuration),
                });
            }
            setToast({ type: 'success', message: 'Availability saved' });
            await fetchAvailability();
        } catch (err) {
            setToast({
                type: 'error',
                message: err.response?.data?.message || 'Failed to save availability',
            });
        } finally {
            setSavingDay(null);
        }
    };

    const handleSaveLeave = async (e) => {
        e.preventDefault();
        if (!leaveForm.date) {
            setToast({ type: 'error', message: 'Date is required' });
            return;
        }

        setSavingLeave(true);
        try {
            await createLeave(leaveForm);
            setToast({ type: 'success', message: 'Leave added successfully' });
            setLeaveForm({ date: '', reason: '' });
            await fetchLeaves();
        } catch (err) {
            setToast({
                type: 'error',
                message: err.response?.data?.message || 'Failed to add leave',
            });
        } finally {
            setSavingLeave(false);
        }
    };

    const handleDeleteLeave = async (id) => {
        try {
            await deleteLeave(id);
            setToast({ type: 'success', message: 'Leave deleted' });
            await fetchLeaves();
        } catch (err) {
            setToast({
                type: 'error',
                message: err.response?.data?.message || 'Failed to delete leave',
            });
        }
    };

    const existingIds = new Set(availabilities.map((a) => a.dayOfWeek));

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
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
                    <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-200">
                        <Calendar className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Availability Settings</h1>
                        <p className="text-gray-500 text-sm mt-0.5">
                            Set your working hours for each day of the week
                        </p>
                    </div>
                </div>
            </div>

            {/* Day Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {DAYS.map((day) => {
                    const form = forms[day.value];
                    const isConfigured = existingIds.has(day.value);
                    const isSaving = savingDay === day.value;

                    return (
                        <div
                            key={day.value}
                            className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-shadow hover:shadow-md ${isConfigured
                                ? 'border-green-200'
                                : 'border-gray-200'
                                }`}
                        >
                            {/* Day Header */}
                            <div
                                className={`px-5 py-3 border-b ${isConfigured
                                    ? 'bg-green-50 border-green-200'
                                    : 'bg-gray-50 border-gray-200'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-gray-800">{day.label}</h3>
                                    {isConfigured && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full border border-green-200">
                                            <CheckCircle2 className="w-3 h-3" />
                                            Configured
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Inputs */}
                            <div className="p-5 space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1.5">
                                            <Clock className="w-3 h-3 inline mr-1" />
                                            Start Time
                                        </label>
                                        <input
                                            type="time"
                                            value={form.startTime}
                                            onChange={(e) =>
                                                handleChange(day.value, 'startTime', e.target.value)
                                            }
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1.5">
                                            <Clock className="w-3 h-3 inline mr-1" />
                                            End Time
                                        </label>
                                        <input
                                            type="time"
                                            value={form.endTime}
                                            onChange={(e) =>
                                                handleChange(day.value, 'endTime', e.target.value)
                                            }
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                                        <Timer className="w-3 h-3 inline mr-1" />
                                        Slot Duration (minutes)
                                    </label>
                                    <input
                                        type="number"
                                        min={5}
                                        max={120}
                                        value={form.slotDuration}
                                        onChange={(e) =>
                                            handleChange(day.value, 'slotDuration', e.target.value)
                                        }
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <button
                                    onClick={() => handleSave(day.value)}
                                    disabled={isSaving}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            {isConfigured ? 'Update' : 'Save'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Blocked Dates Section */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mt-8">
                <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-50 rounded-lg border border-red-100">
                            <CalendarOff className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">Blocked Dates (Leave)</h2>
                            <p className="text-sm text-gray-500">
                                Add dates when you are on leave or unavailable
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    {/* Add Leave Form */}
                    <form onSubmit={handleSaveLeave} className="flex flex-col md:flex-row gap-4 items-end mb-8 bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <div className="flex-1 w-full relative">
                            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                                Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                required
                                min={new Date().toISOString().split('T')[0]}
                                value={leaveForm.date}
                                onChange={(e) => setLeaveForm({ ...leaveForm, date: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                            />
                        </div>
                        <div className="flex-1 w-full relative">
                            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                                Reason (Optional)
                            </label>
                            <input
                                type="text"
                                placeholder="E.g., Conference, Sick Leave"
                                value={leaveForm.reason}
                                onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={savingLeave}
                            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
                        >
                            {savingLeave ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Plus className="w-4 h-4" />
                            )}
                            Add Leave
                        </button>
                    </form>

                    {/* Leaves List */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">
                            Upcoming Leaves ({leaves.length})
                        </h3>
                        {loadingLeaves ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
                            </div>
                        ) : leaves.length === 0 ? (
                            <div className="py-8 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                <CalendarOff className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                                <p className="text-sm font-medium">No leaves scheduled</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {leaves.map((leave) => (
                                    <div
                                        key={leave._id}
                                        className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col items-center justify-center w-12 h-12 bg-red-50 text-red-700 rounded-lg border border-red-100">
                                                <span className="text-sm font-black leading-none">
                                                    {new Date(leave.date).getDate()}
                                                </span>
                                                <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5">
                                                    {new Date(leave.date).toLocaleString('default', { month: 'short' })}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">
                                                    {new Date(leave.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-0.5 font-medium">
                                                    {leave.reason ? `Reason: ${leave.reason}` : 'No reason provided'}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteLeave(leave._id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                            title="Delete leave"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Availability;
