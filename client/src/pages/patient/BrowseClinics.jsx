import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApprovedClinics } from '../../api/clinic.api';
import { Building2, MapPin, Search, Users } from 'lucide-react';

function BrowseClinics() {
    const [clinics, setClinics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchClinics = async () => {
            try {
                const response = await getApprovedClinics();
                setClinics(response.data || []);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch clinics');
            } finally {
                setLoading(false);
            }
        };

        fetchClinics();
    }, []);

    const filteredClinics = useMemo(() => {
        return clinics.filter((clinic) => {
            const matchesSearch = clinic.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesType = typeFilter === 'ALL' || clinic.clinicType === typeFilter;
            return matchesSearch && matchesType;
        });
    }, [clinics, searchQuery, typeFilter]);

    const SkeletonCard = () => (
        <div className="bg-white rounded-xl p-5 border border-gray-200 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h1 className="text-2xl font-bold text-gray-800">Browse Clinics</h1>
                <p className="text-gray-600 mt-1">
                    Choose a clinic to book an appointment or view doctors
                </p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search clinics by name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Type Filter */}
                    <div className="flex gap-2">
                        {[
                            { value: 'ALL', label: 'All' },
                            { value: 'APPOINTMENT', label: 'Appointment' },
                            { value: 'TOKEN', label: 'Token' },
                        ].map((filter) => (
                            <button
                                key={filter.value}
                                onClick={() => setTypeFilter(filter.value)}
                                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${typeFilter === filter.value
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Clinics Grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
            ) : error ? (
                <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm text-center">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Building2 className="w-8 h-8 text-red-400" />
                    </div>
                    <p className="text-gray-800 font-medium">Something went wrong</p>
                    <p className="text-gray-500 text-sm mt-1">{error}</p>
                </div>
            ) : filteredClinics.length === 0 ? (
                <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Building2 className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-800 font-medium">No clinics available right now</p>
                    <p className="text-gray-500 text-sm mt-1">
                        {searchQuery || typeFilter !== 'ALL'
                            ? 'Try adjusting your filters'
                            : 'Check back later for approved clinics'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredClinics.map((clinic) => (
                        <div
                            key={clinic._id}
                            className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                        >
                            {/* Clinic Header */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                                        <Building2 className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <h3 className="font-semibold text-gray-800">{clinic.name}</h3>
                                </div>
                            </div>

                            {/* Address */}
                            <div className="flex items-start gap-2 text-sm text-gray-500 mb-3">
                                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>{clinic.address}</span>
                            </div>

                            {/* Type Badge and Helper Text */}
                            <div className="mb-4">
                                <span
                                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${clinic.clinicType === 'APPOINTMENT'
                                        ? 'bg-green-50 text-green-700'
                                        : 'bg-orange-50 text-orange-700'
                                        }`}
                                >
                                    {clinic.clinicType === 'APPOINTMENT' ? 'Appointment-based' : 'Token-based'}
                                </span>
                                <p className="text-xs text-gray-500 mt-1.5">
                                    {clinic.clinicType === 'APPOINTMENT'
                                        ? 'Appointment Booking Available'
                                        : 'Token System – Walk-in Clinic'}
                                </p>
                            </div>

                            {/* Action Button */}
                            <button
                                onClick={() => navigate(`/patient/clinics/${clinic._id}`)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Users className="w-4 h-4" />
                                View Doctors
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default BrowseClinics;
