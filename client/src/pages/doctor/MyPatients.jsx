import { useState, useEffect } from 'react';
import { getMyPatients } from '../../api/doctor.api';
import {
    Users,
    User,
    Phone,
    Calendar,
    Loader2,
    AlertCircle,
    Search,
} from 'lucide-react';

function MyPatients() {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchPatients = async () => {
            try {
                const res = await getMyPatients();
                setPatients(res.data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load patients');
            } finally {
                setLoading(false);
            }
        };
        fetchPatients();
    }, []);

    const filtered = patients.filter(
        (p) =>
            p.fullName?.toLowerCase().includes(search.toLowerCase()) ||
            p.phone?.includes(search)
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Page Header */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200">
                            <Users className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">
                                My Patients
                            </h1>
                            <p className="text-gray-500 text-sm mt-0.5">
                                Patients you have consulted
                                <span className="ml-1 text-emerald-600 font-medium">
                                    · {patients.length} total
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* Search */}
                    {patients.length > 0 && (
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by name or phone..."
                                className="pl-10 pr-4 py-2 w-full sm:w-64 rounded-lg border border-gray-300 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-center gap-3 text-red-700">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            {/* Empty State */}
            {!error && patients.length === 0 && (
                <div className="bg-white rounded-xl p-12 border border-gray-200 shadow-sm text-center">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 font-semibold text-lg">
                        You haven't consulted any patients yet
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                        Patients will appear here after you complete consultations
                    </p>
                </div>
            )}

            {/* No search results */}
            {!error && patients.length > 0 && filtered.length === 0 && (
                <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm text-center">
                    <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">
                        No patients match "{search}"
                    </p>
                </div>
            )}

            {/* Patient Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((patient) => (
                    <div
                        key={patient.patientId}
                        className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 p-5"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center">
                                <User className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="font-bold text-gray-800 truncate">
                                    {patient.fullName}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                                <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                                <span className="text-gray-600">
                                    {patient.phone || 'No phone'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                                <span className="text-gray-600">
                                    Last visit: {patient.lastVisitDate || 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default MyPatients;
