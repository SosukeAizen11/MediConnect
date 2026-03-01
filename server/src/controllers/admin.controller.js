import Clinic from '../models/clinic.model.js';
import Doctor from '../models/doctor.model.js';

// Get pending clinics (not approved)
export const getPendingClinics = async (req, res) => {
    try {
        const clinics = await Clinic.find({ isApproved: false }).sort({ createdAt: -1 });

        // Get linked doctors for each clinic
        const clinicData = await Promise.all(
            clinics.map(async (clinic) => {
                const doctor = await Doctor.findOne({ clinic: clinic._id }).populate(
                    'user',
                    'name email'
                );
                return {
                    _id: clinic._id,
                    name: clinic.name,
                    address: clinic.address,
                    clinicType: clinic.clinicType,
                    createdAt: clinic.createdAt,
                    doctor: doctor?.user
                        ? { name: doctor.user.name, email: doctor.user.email }
                        : null,
                };
            })
        );

        res.json({
            success: true,
            count: clinicData.length,
            data: clinicData,
        });
    } catch (error) {
        console.error('Get pending clinics error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Approve a clinic
export const approveClinic = async (req, res) => {
    try {
        const clinic = await Clinic.findById(req.params.id);
        if (!clinic) {
            return res.status(404).json({ message: 'Clinic not found' });
        }

        clinic.isApproved = true;
        await clinic.save();

        res.json({
            success: true,
            message: `Clinic "${clinic.name}" approved successfully`,
            data: clinic,
        });
    } catch (error) {
        console.error('Approve clinic error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Reject or Delete a clinic
export const deleteClinic = async (req, res) => {
    try {
        const clinic = await Clinic.findById(req.params.id);
        if (!clinic) {
            return res.status(404).json({ message: 'Clinic not found' });
        }

        await Clinic.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: `Clinic "${clinic.name}" rejected and removed`,
        });
    } catch (error) {
        console.error('Delete clinic error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all clinics
export const getAllClinics = async (req, res) => {
    try {
        const clinics = await Clinic.find().sort({ createdAt: -1 });

        const clinicData = await Promise.all(
            clinics.map(async (clinic) => {
                const doctor = await Doctor.findOne({ clinic: clinic._id }).populate(
                    'user',
                    'name email'
                );
                return {
                    _id: clinic._id,
                    name: clinic.name,
                    address: clinic.address,
                    clinicType: clinic.clinicType,
                    isApproved: clinic.isApproved,
                    isActive: clinic.isActive,
                    createdAt: clinic.createdAt,
                    doctor: doctor?.user
                        ? { name: doctor.user.name, email: doctor.user.email }
                        : null,
                };
            })
        );

        res.json({
            success: true,
            count: clinicData.length,
            data: clinicData,
        });
    } catch (error) {
        console.error('Get all clinics error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Toggle clinic active status
export const toggleClinicStatus = async (req, res) => {
    try {
        const clinic = await Clinic.findById(req.params.id);
        if (!clinic) {
            return res.status(404).json({ message: 'Clinic not found' });
        }

        clinic.isActive = !clinic.isActive;
        await clinic.save();

        res.json({
            success: true,
            message: `Clinic "${clinic.name}" is now ${clinic.isActive ? 'active' : 'inactive'}`,
            data: clinic,
        });
    } catch (error) {
        console.error('Toggle clinic status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
