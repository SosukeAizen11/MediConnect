import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookAppointment } from '../../api/appointment.api';
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
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const timeSlots = [
        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '12:00', '14:00', '14:30', '15:00', '15:30', '16:00',
        '16:30', '17:00', '17:30', '18:00',
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await bookAppointment({
                doctor: doctorId,
                clinic: clinicId,
                date,
                time,
            });
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to book appointment');
        } finally {
            setLoading(false);
        }
    };

    // Get minimum date (today)
    const today = new Date().toISOString().split('T')[0];

    if (success) {
        return (
            <div className="space-y-6">
                <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm text-center">
                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Appointment Booked Successfully!</h2>
                    <p className="text-gray-600 mb-6">
                        Your appointment has been confirmed. You can view it in your appointments list.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            onClick={() => navigate('/patient/appointments')}
                            className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            View My Appointments
                        </button>
                        <button
                            onClick={() => navigate('/patient/dashboard')}
                            className="px-6 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Back to Dashboard
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
                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
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

                            {/* Time Field */}
                            <div>
                                <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
                                    Appointment Time <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <select
                                        id="time"
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                        required
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                                    >
                                        <option value="">Select a time slot</option>
                                        {timeSlots.map((slot) => (
                                            <option key={slot} value={slot}>
                                                {slot}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

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
                                        Confirm Appointment
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default BookAppointment;
