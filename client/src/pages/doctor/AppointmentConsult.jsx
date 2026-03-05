import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAppointmentDetails, completeConsultation } from '../../api/appointment.api';
import { getPatientReports } from '../../api/report.api';
import {
    User,
    Phone,
    Mail,
    MapPin,
    Calendar,
    Clock,
    Heart,
    FileText,
    ClipboardList,
    Pill,
    StickyNote,
    CheckCircle2,
    AlertCircle,
    Loader2,
    ArrowLeft,
    History,
    ShieldAlert,
    CalendarCheck,
} from 'lucide-react';

function AppointmentConsult() {
    const { appointmentId } = useParams();
    const navigate = useNavigate();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);
    const [patientReports, setPatientReports] = useState([]);

    const [formData, setFormData] = useState({
        diagnosis: '',
        prescription: '',
        consultationNotes: '',
    });

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await getAppointmentDetails(appointmentId);
                setData(res.data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load appointment details');
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [appointmentId]);

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 3000);
        return () => clearTimeout(timer);
    }, [toast]);

    useEffect(() => {
        const fetchReports = async () => {
            if (data?.appointment?.patient?._id) {
                try {
                    const res = await getPatientReports(data.appointment.patient._id);
                    setPatientReports(res.reports || []);
                } catch (err) {
                    console.error('Failed to fetch patient reports', err);
                }
            }
        };
        fetchReports();
    }, [data?.appointment?.patient?._id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.diagnosis.trim()) {
            setToast({ type: 'error', message: 'Diagnosis is required' });
            return;
        }

        setSaving(true);
        try {
            await completeConsultation(appointmentId, formData);
            setToast({ type: 'success', message: 'Consultation completed successfully' });
            setTimeout(() => navigate(`/doctor/prescription/${appointmentId}`), 1000);
        } catch (err) {
            setToast({
                type: 'error',
                message: err.response?.data?.message || 'Failed to complete consultation',
            });
        } finally {
            setSaving(false);
        }
    };

    const calculateAge = (dob) => {
        if (!dob) return 'N/A';
        const diff = Date.now() - new Date(dob).getTime();
        return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-3xl mx-auto">
                <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-center gap-3 text-red-700">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            </div>
        );
    }

    const appointment = data?.appointment;
    const patient = appointment?.patient;
    const pastAppointments = data?.pastAppointments || [];
    const isCompleted = appointment?.status === 'COMPLETED';

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
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
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm transition-all duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/doctor/appointments')}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
                            <CalendarCheck className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">
                                Appointment Consultation
                            </h1>
                            <p className="text-gray-500 text-sm mt-0.5">
                                {appointment?.date} · {appointment?.time}
                                {appointment?.clinic && (
                                    <span className="ml-1 text-emerald-600 font-medium">
                                        · {appointment.clinic.name}
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                    <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${isCompleted
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                    >
                        <span
                            className={`w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-green-500' : 'bg-blue-500 animate-pulse'
                                }`}
                        />
                        {isCompleted ? 'Completed' : appointment?.status || 'In Progress'}
                    </span>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Left Column — Patient Info (2/5) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Patient Details Card */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Patient Information
                            </h2>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center">
                                    <User className="w-7 h-7 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-gray-800">
                                        {patient?.name || 'Unknown'}
                                    </p>
                                    <div className="flex items-center gap-3 text-sm text-gray-500">
                                        {patient?.gender && <span>{patient.gender}</span>}
                                        {patient?.dateOfBirth && (
                                            <span>· {calculateAge(patient.dateOfBirth)} yrs</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                <div className="flex items-center gap-3 text-sm">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-700">
                                        {patient?.phone || 'No phone'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-700">
                                        {patient?.email || 'No email'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <MapPin className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-700">
                                        {patient?.address || 'No address'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <ShieldAlert className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-700">
                                        Emergency: {patient?.emergencyContact || 'Not provided'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Past Visits */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <History className="w-4 h-4" />
                                Past Visits ({pastAppointments.length})
                            </h2>
                        </div>
                        {pastAppointments.length === 0 ? (
                            <div className="p-6 text-center">
                                <FileText className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                                <p className="text-gray-400 text-sm">No previous visits</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                                {pastAppointments.map((past) => (
                                    <div key={past._id} className="px-6 py-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                <span className="text-gray-700 font-medium">
                                                    {past.date}
                                                </span>
                                                <Clock className="w-3.5 h-3.5 text-gray-400 ml-1" />
                                                <span className="text-gray-500">
                                                    {past.time}
                                                </span>
                                            </div>
                                            <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium border border-green-200">
                                                Done
                                            </span>
                                        </div>
                                        {past.diagnosis && (
                                            <p className="text-xs text-gray-500 mt-1 truncate">
                                                Dx: {past.diagnosis}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Patient Reports */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Patient Reports ({patientReports.length})
                            </h2>
                        </div>
                        {patientReports.length === 0 ? (
                            <div className="p-6 text-center">
                                <FileText className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                                <p className="text-gray-400 text-sm">No reports uploaded by patient.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                                {patientReports.map((report) => (
                                    <div key={report._id} className="px-6 py-3">
                                        <div className="flex items-center justify-between">
                                            <div className="min-w-0 pr-4">
                                                <p className="text-sm font-medium text-gray-800 truncate" title={report.title}>
                                                    {report.title}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    Uploaded: {new Date(report.uploadedAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => window.open(report.fileUrl, '_blank')}
                                                className="shrink-0 text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg font-medium border border-emerald-200 hover:bg-emerald-100 transition-colors"
                                            >
                                                View
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column — Consultation Form (3/5) */}
                <div className="lg:col-span-3">
                    {isCompleted ? (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                            <div className="px-6 py-4 bg-green-50 border-b border-green-100">
                                <h2 className="text-sm font-bold text-green-700 uppercase tracking-wider flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Consultation Completed
                                </h2>
                            </div>
                            <div className="p-6 space-y-6">
                                <div>
                                    <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                                        Diagnosis
                                    </label>
                                    <p className="mt-2 text-gray-800 bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm font-medium">
                                        {appointment.diagnosis || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                                        Prescription
                                    </label>
                                    <p className="mt-2 text-gray-800 bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm whitespace-pre-wrap font-medium">
                                        {appointment.prescription || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                                        Notes
                                    </label>
                                    <p className="mt-2 text-gray-800 bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm whitespace-pre-wrap font-medium">
                                        {appointment.consultationNotes || 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <form
                            onSubmit={handleSubmit}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                        >
                            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                    <ClipboardList className="w-4 h-4" />
                                    Consultation Form
                                </h2>
                            </div>
                            <div className="p-6 space-y-5">
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                        <Heart className="w-4 h-4 text-red-400" />
                                        Diagnosis <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        name="diagnosis"
                                        value={formData.diagnosis}
                                        onChange={handleChange}
                                        rows={4}
                                        placeholder="Enter diagnosis..."
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                        <Pill className="w-4 h-4 text-blue-400" />
                                        Prescription
                                    </label>
                                    <textarea
                                        name="prescription"
                                        value={formData.prescription}
                                        onChange={handleChange}
                                        rows={4}
                                        placeholder="Enter medications and dosage..."
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                        <StickyNote className="w-4 h-4 text-amber-400" />
                                        Additional Notes
                                    </label>
                                    <textarea
                                        name="consultationNotes"
                                        value={formData.consultationNotes}
                                        onChange={handleChange}
                                        rows={3}
                                        placeholder="Follow-up instructions, observations..."
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors resize-none"
                                    />
                                </div>
                            </div>

                            <div className="px-6 py-5 bg-gray-50 border-t border-gray-100 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 hover:-translate-y-0.5 active:scale-95 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    {saving ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <CheckCircle2 className="w-5 h-5" />
                                    )}
                                    Complete Consultation
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AppointmentConsult;
