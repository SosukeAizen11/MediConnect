import { useState, useEffect } from 'react';
import {
    getDoctorProfile,
    updateDoctorProfile,
} from '../../api/doctor.api';
import { getApprovedClinics } from '../../api/clinic.api';
import {
    UserCircle,
    Stethoscope,
    Building2,
    Briefcase,
    Save,
    Loader2,
    CheckCircle2,
    AlertCircle,
    AlertTriangle,
} from 'lucide-react';

function DoctorProfile() {
    const [profile, setProfile] = useState(null);
    const [clinics, setClinics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        clinic: '',
        specialization: '',
        experienceYears: 0,
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [profileRes, clinicsRes] = await Promise.all([
                    getDoctorProfile().catch(() => null),
                    getApprovedClinics(),
                ]);

                if (profileRes?.data) {
                    setProfile(profileRes.data);
                    setFormData({
                        clinic: profileRes.data.clinic?._id || '',
                        specialization: profileRes.data.specialization || '',
                        experienceYears: profileRes.data.experienceYears || 0,
                    });
                }

                setClinics(clinicsRes?.data || []);
            } catch (err) {
                console.error('Failed to load profile data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Auto-dismiss toast
    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 3000);
        return () => clearTimeout(timer);
    }, [toast]);

    const isProfileIncomplete = !formData.clinic || !formData.specialization;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'experienceYears' ? Number(value) : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.clinic || !formData.specialization) {
            setToast({
                type: 'error',
                message: 'Please select a clinic and enter your specialization',
            });
            return;
        }

        setSaving(true);
        try {
            const res = await updateDoctorProfile(formData);
            setProfile(res.data);
            setToast({
                type: 'success',
                message: 'Profile updated successfully',
            });
        } catch (err) {
            setToast({
                type: 'error',
                message: err.response?.data?.message || 'Failed to update profile',
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
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

            {/* Page Header */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200">
                        <UserCircle className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            Doctor Profile
                        </h1>
                        <p className="text-gray-500 text-sm mt-0.5">
                            Manage your professional profile
                        </p>
                    </div>
                </div>
            </div>

            {/* Profile Incomplete Warning */}
            {isProfileIncomplete && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-amber-800 font-semibold text-sm">
                            Complete your profile to start receiving appointments
                        </p>
                        <p className="text-amber-600 text-sm mt-1">
                            Please select your clinic and add your specialization below.
                        </p>
                    </div>
                </div>
            )}

            {/* Profile Form */}
            <form
                onSubmit={handleSubmit}
                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
            >
                <div className="p-6 space-y-5">
                    {/* Clinic Selection */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            Clinic <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="clinic"
                            value={formData.clinic}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                        >
                            <option value="">Select a clinic</option>
                            {clinics.map((c) => (
                                <option key={c._id} value={c._id}>
                                    {c.name} — {c.address}
                                </option>
                            ))}
                        </select>
                        {clinics.length === 0 && (
                            <p className="text-xs text-gray-400 mt-1.5">
                                No approved clinics available. Contact admin to approve a clinic first.
                            </p>
                        )}
                    </div>

                    {/* Specialization */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                            <Stethoscope className="w-4 h-4 text-gray-400" />
                            Specialization <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="specialization"
                            value={formData.specialization}
                            onChange={handleChange}
                            placeholder="e.g., General Medicine, Cardiology, Dermatology"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                        />
                    </div>

                    {/* Experience */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                            <Briefcase className="w-4 h-4 text-gray-400" />
                            Years of Experience
                        </label>
                        <input
                            type="number"
                            name="experienceYears"
                            value={formData.experienceYears}
                            onChange={handleChange}
                            min="0"
                            max="60"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                        />
                    </div>
                </div>

                {/* Save Button */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        Save Profile
                    </button>
                </div>
            </form>

            {/* Current Profile Info */}
            {profile && profile.clinic && (
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                        Current Profile
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <p className="text-xs text-gray-400 mb-1">Clinic</p>
                            <p className="text-sm font-semibold text-gray-800">
                                {profile.clinic?.name || 'Not set'}
                            </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <p className="text-xs text-gray-400 mb-1">Specialization</p>
                            <p className="text-sm font-semibold text-gray-800">
                                {profile.specialization || 'Not set'}
                            </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <p className="text-xs text-gray-400 mb-1">Experience</p>
                            <p className="text-sm font-semibold text-gray-800">
                                {profile.experienceYears || 0} years
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DoctorProfile;
