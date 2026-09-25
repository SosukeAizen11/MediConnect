import Report from '../../../models/report.model.js';

export const getPatientReportCount = async (patientId) => {
    if (!patientId) {
        return 0;
    }

    return Report.countDocuments({ patient: patientId });
};
