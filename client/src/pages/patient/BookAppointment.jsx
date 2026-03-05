import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookAppointment } from '../../api/appointment.api';
import { getSlots } from '../../api/slot.api';
import {
    ArrowLeft,
    User,
    Stethoscope,
    Building2,
    Calendar,
    Clock,
    FileText,
    CheckCircle,
    AlertCircle,
    Loader2,
} from 'lucide-react';

function BookAppointment() {
    const { clinicId, doctorId } = useParams();
    const navigate = useNavigate();

    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const [error, setError] = useState('');

    const [slots, setSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [slotsError, setSlotsError] = useState('');

    const fetchSlots = async () => {
        if (!date) return;

        setLoadingSlots(true);
        setSlotsError('');
        setTime(''); // Reset selected time when date changes

        try {
            const response = await getSlots(doctorId, date);

            if (response.message === "Doctor on leave") {
                setSlotsError("Doctor is not available on this date. Please select another date.");
                setSlots([]);
                return;
            }

            // API might return slots array directly or { success: true, slots: [] }
            if (response.slots) {
                setSlots(response.slots);
            } else if (response.data && response.data.slots) {
                setSlots(response.data.slots);
            } else if (Array.isArray(response)) {
                setSlots(response);
            }
        } catch (err) {
            setSlotsError(err.response?.data?.message || 'Failed to fetch slots');
            setSlots([]);
        } finally {
            setLoadingSlots(false);
        }
    };

    useEffect(() => {
        fetchSlots();
    }, [date, doctorId]);

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 3000);
        return () => clearTimeout(timer);
    }, [toast]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await bookAppointment({
                doctorId,
                date,
                time,
            });
            setToast({ type: 'success', message: 'Appointment booked successfully' });

            // Refresh slots to block out the one just booked
            await fetchSlots();

            // Navigate away
            setTimeout(() => {
                navigate('/patient/appointments');
            }, 1000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to book appointment');
        } finally {
            setLoading(false);
        }
    };

    // Get minimum date (today)
    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="space-y-6">
            {/* Toast rendering exactly like other files in codebase */}
            {toast && (
                <div
                    className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-lg shadow-lg border text-sm font-medium ${toast.type === 'success'
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : 'bg-red-50 border-red-200 text-red-700'
                        }`}
                >
                    {toast.type === 'success' ? (
                        <CheckCircle className="w-5 h-5" />
                    ) : (
                        <AlertCircle className="w-5 h-5" />
                    )}
                    {toast.message}
                </div>
            )}

            {/* Page Header */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <button
                    onClick={() => navigate(`/patient/clinics/${clinicId}`)}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium mb-3"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Doctors
                </button>
                <h1 className="text-2xl font-bold text-gray-800">Book Appointment</h1>
                <p className="text-gray-600 mt-1">
                    Confirm details and select a time
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Doctor Summary Card */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm sticky top-6">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                            Appointment Summary
                        </h3>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                                    <User className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-800">Selected Doctor</p>
                                    <p className="text-sm text-gray-500">Confirmed on booking</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 text-sm">
                                <Stethoscope className="w-5 h-5 text-gray-400" />
                                <span className="text-gray-700">General Consultation</span>
                            </div>

                            <div className="flex items-center gap-3 text-sm">
                                <Building2 className="w-5 h-5 text-gray-400" />
                                <span className="text-gray-700">Selected Clinic</span>
                            </div>

                            {date && (
                                <div className="flex items-center gap-3 text-sm">
                                    <Calendar className="w-5 h-5 text-green-500" />
                                    <span className="text-gray-700 font-medium">{date}</span>
                                </div>
                            )}

                            {time && (
                                <div className="flex items-center gap-3 text-sm">
                                    <Clock className="w-5 h-5 text-green-500" />
                                    <span className="text-gray-700 font-medium">{time}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Booking Form */}
                <div className="lg:col-span-2">
                    <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-800 mb-6">Select Date & Time</h3>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}

                        <div className="space-y-5">
                            {/* Date Field */}
                            <div>
                                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                                    Appointment Date <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="date"
                                        id="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        min={today}
                                        required
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Time Field / Slots Grid */}
                            {date && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Appointment Time <span className="text-red-500">*</span>
                                    </label>

                                    {loadingSlots ? (
                                        <div className="py-8 flex flex-col items-center justify-center text-gray-500">
                                            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
                                            <p className="text-sm">Loading available slots...</p>
                                        </div>
                                    ) : slotsError ? (
                                        <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
                                            {slotsError}
                                        </div>
                                    ) : slots.length === 0 ? (
                                        <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
                                            <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                            <p className="text-sm text-gray-600">No slots available for this date.</p>
                                            <p className="text-xs text-gray-500 mt-1">Please try selecting another date.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                            {slots.map((slot, index) => {
                                                const slotTime = typeof slot === 'object' ? slot.time : slot;
                                                const isAvailable = typeof slot === 'object' ? slot.available !== false : true;
                                                const isSelected = time === slotTime;

                                                return (
                                                    <button
                                                        key={index}
                                                        type="button"
                                                        disabled={!isAvailable}
                                                        onClick={() => setTime(slotTime)}
                                                        className={`py-2 px-3 text-sm font-medium rounded-lg border transition-all duration-200 ${!isAvailable
                                                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                                            : isSelected
                                                                ? 'bg-green-600 text-white border-green-600 shadow-md transform scale-105'
                                                                : 'bg-white text-gray-700 border-green-200 hover:border-green-500 hover:bg-green-50'
                                                            }`}
                                                    >
                                                        {slotTime}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Notes Field */}
                            <div>
                                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                                    Additional Notes <span className="text-gray-400">(Optional)</span>
                                </label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                    <textarea
                                        id="notes"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={3}
                                        placeholder="Any specific concerns or requests..."
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        {time && (
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <button
                                    type="submit"
                                    disabled={loading || !date || !time}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Booking...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-5 h-5" />
                                            Book Appointment
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}

export default BookAppointment;
