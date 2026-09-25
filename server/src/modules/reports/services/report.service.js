import Report from '../models/report.model.js';

export const getPatientReportCount = async (patientId) => {
    if (!patientId) {
        return 0;
    }

    return Report.countDocuments({ patient: patientId });
};

export const getReportForPatient = async (reportId, patientId) => {
    if (!reportId || !patientId) {
        return null;
    }

    return Report.findOne({ _id: reportId, patient: patientId }).lean();
};
