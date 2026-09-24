import { Navigate, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getDoctorProfile } from '../api/doctor.api';

function ApprovedDoctorRoute() {
    const [doctor, setDoctor] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDoctorProfile = async () => {
            try {
                const response = await getDoctorProfile();
                setDoctor(response.data);
            } catch (error) {
                console.error('Failed to load doctor profile:', error);
            } finally {
                setLoading(false);
            }
        };

        loadDoctorProfile();
    }, []);

    if (loading) {
        return <p>Loading...</p>;
    }

    if (!doctor) {
        return <Navigate to="/doctor/dashboard" replace />;
    }

    if (!doctor.clinic || !doctor.clinic.isApproved) {
        return <Navigate to="/doctor/dashboard" replace />;
    }

    return <Outlet />;
}

export default ApprovedDoctorRoute;