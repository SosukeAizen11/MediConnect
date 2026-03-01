import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { Building2, MapPin, Clock, Stethoscope, Loader2, AlertCircle } from 'lucide-react';

function RegisterClinic() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        clinicType: 'APPOINTMENT',
        workingHours: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await apiClient.post('/clinics', formData);
            setSuccess(true);
            setTimeout(() => {
                navigate('/doctor/dashboard');
                window.location.reload();
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to register clinic');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="max-w-2xl mx-auto mt-12 bg-white rounded-xl shadow-sm border border-green-200 p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Building2 className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Clinic Submitted!</h2>
                <p className="text-gray-600">
                    Your clinic has been submitted and is awaiting admin approval.
                    You will be redirected to the dashboard shortly.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 rounded-lg border border-indigo-200">
                        <Building2 className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Register Your Clinic</h1>
                        <p className="text-gray-500 text-sm mt-0.5">Submit your clinic for admin approval</p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <form onSubmit={handleSubmit} className="p-6 space-y-5">

                    {/* Clinic Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Clinic Name <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Building2 className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent sm:text-sm"
                                placeholder="Enter clinic name"
                            />
                        </div>
                    </div>

                    {/* Address */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Address <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                                <MapPin className="h-5 w-5 text-gray-400" />
                            </div>
                            <textarea
                                required
                                rows={3}
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent sm:text-sm"
                                placeholder="Full clinic address"
                            />
                        </div>
                    </div>

                    {/* Clinic Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Clinic Type <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Stethoscope className="h-5 w-5 text-gray-400" />
                            </div>
                            <select
                                required
                                value={formData.clinicType}
                                onChange={(e) => setFormData({ ...formData, clinicType: e.target.value })}
                                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent sm:text-sm bg-white"
                            >
                                <option value="APPOINTMENT">Time-based Appointments</option>
                                <option value="TOKEN">Token-based Queue</option>
                            </select>
                        </div>
                    </div>

                    {/* Working Hours */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Working Hours <span className="text-gray-400 font-normal">(Optional)</span></label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Clock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                value={formData.workingHours}
                                onChange={(e) => setFormData({ ...formData, workingHours: e.target.value })}
                                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent sm:text-sm"
                                placeholder="e.g. Mon-Fri 09:00 AM - 05:00 PM"
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                'Submit for Approval'
                            )}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}

export default RegisterClinic;
