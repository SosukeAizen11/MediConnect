import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAppointmentDetails } from '../../api/appointment.api';
import {
    Printer,
    Download,
    ArrowLeft,
    CheckCircle2,
    AlertCircle,
    Loader2,
} from 'lucide-react';

function PrescriptionPreview() {
    const { appointmentId } = useParams();
    const navigate = useNavigate();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-3xl mx-auto mt-10">
                <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-center gap-3 text-red-700">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            </div>
        );
    }

    const appointment = data?.appointment;
    const patient = appointment?.patient;
    const isCompleted = appointment?.status === 'COMPLETED';

    if (!isCompleted) {
        return (
            <div className="max-w-3xl mx-auto mt-10">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-center gap-3 text-amber-700">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-medium">Prescription is only available for completed consultations.</p>
                </div>
                <button
                    onClick={() => navigate('/doctor/appointments')}
                    className="mt-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors px-4 py-2"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto pb-16 pt-4 px-4 sm:px-6">

            {/* Top Action Bar (hidden on print) */}
            <div className="print:hidden flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                <button
                    onClick={() => navigate('/doctor/appointments')}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors py-2"
                >
                    <ArrowLeft className="w-4 h-4" /> Dashboard
                </button>

                <div className="flex items-center gap-3">
                    {appointment.prescriptionUrl && (
                        <button
                            onClick={() => window.open(appointment.prescriptionUrl, '_blank')}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-emerald-700 text-sm font-semibold rounded-lg border border-emerald-200 hover:bg-emerald-50 transition-colors shadow-sm"
                        >
                            <Download className="w-4 h-4" />
                            Download PDF
                        </button>
                    )}
                    <button
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg border border-transparent hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                        <Printer className="w-4 h-4" />
                        Print Prescription
                    </button>
                </div>
            </div>

            {/* The Prescription Paper */}
            <div className="bg-white mx-auto shadow-md rounded-lg overflow-hidden border border-gray-200 print:shadow-none print:border-none print:m-0 print:p-0">

                {/* Header Section */}
                <div className="px-8 py-8 border-b border-gray-200 bg-emerald-50 print:bg-white print:border-black/20">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight print:text-black">
                                MediConnect
                            </h1>
                            <p className="text-sm font-medium text-emerald-600/80 uppercase tracking-widest mt-1 print:text-gray-500">
                                Digital Prescription
                            </p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-lg font-bold text-gray-800 print:text-black">
                                Dr. {data?.appointment?.doctor?.user?.name || 'Doctor'}
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                {data?.appointment?.clinic?.name || 'MediConnect Clinic'}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                                {data?.appointment?.clinic?.address || ''}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Patient Details Row */}
                <div className="px-8 py-5 border-b border-gray-100 bg-gray-50/50 print:bg-white print:border-black/10 flex flex-wrap gap-y-4 justify-between items-center text-sm">
                    <div>
                        <span className="text-gray-500 font-medium uppercase tracking-wider text-xs block mb-1">Patient</span>
                        <span className="font-bold text-gray-800 text-base">{patient?.name || 'Unknown Patient'}</span>
                    </div>
                    {patient?.dateOfBirth && (
                        <div>
                            <span className="text-gray-500 font-medium uppercase tracking-wider text-xs block mb-1">Age</span>
                            <span className="font-semibold text-gray-800">
                                {Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} yrs
                            </span>
                        </div>
                    )}
                    {patient?.gender && (
                        <div>
                            <span className="text-gray-500 font-medium uppercase tracking-wider text-xs block mb-1">Gender</span>
                            <span className="font-semibold text-gray-800">{patient.gender}</span>
                        </div>
                    )}
                    <div className="text-right">
                        <span className="text-gray-500 font-medium uppercase tracking-wider text-xs block mb-1">Date</span>
                        <span className="font-bold text-gray-800 text-base">{appointment.date}</span>
                    </div>
                </div>

                {/* Consultation Details */}
                <div className="px-8 py-8 space-y-8 min-h-[400px]">

                    {/* Diagnosis */}
                    <div>
                        <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-3 flex items-center gap-2 print:text-gray-500">
                            Diagnosis
                        </h3>
                        <p className="text-gray-800 text-sm leading-relaxed font-medium">
                            {appointment.diagnosis}
                        </p>
                    </div>

                    {/* Prescription */}
                    <div>
                        <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-3 flex items-center gap-2 print:text-gray-500">
                            Rx (Prescription)
                        </h3>
                        <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                            {appointment.prescription || 'No medications prescribed.'}
                        </p>
                    </div>

                    {/* Additional Notes */}
                    {appointment.consultationNotes && (
                        <div>
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                Additional Notes
                            </h3>
                            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                                {appointment.consultationNotes}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 text-center print:bg-white print:border-black/10 mt-auto">
                    <p className="text-xs text-gray-400 font-medium flex items-center justify-center gap-1.5 print:text-gray-300">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Electronically generated prescription. No signature required.
                    </p>
                </div>
            </div>

            {/* Print Styles Injection */}
            <style>{`
                @media print {
                    body {
                        background-color: white !important;
                        print-color-adjust: exact;
                        -webkit-print-color-adjust: exact;
                    }
                    @page { margin: 0; }
                }
            `}</style>
        </div>
    );
}

export default PrescriptionPreview;
