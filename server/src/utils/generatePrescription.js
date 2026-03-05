import PDFDocument from 'pdfkit';

export const generatePrescriptionPDF = ({
    patientName,
    doctorName,
    diagnosis,
    prescription,
    notes,
    date,
}) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const buffers = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(buffers);
                resolve(pdfBuffer);
            });

            // Header
            doc.fontSize(24)
                .fillColor('#059669') // Emerald 600
                .text('MediConnect', { align: 'center' });

            doc.fontSize(12)
                .fillColor('#6B7280') // Gray 500
                .text('Digital Prescription', { align: 'center' })
                .moveDown(2);

            // Line separator
            doc.moveTo(50, 115)
                .lineTo(550, 115)
                .strokeColor('#E5E7EB')
                .stroke();
            doc.moveDown(2);

            // Info Section
            const leftColX = 50;
            const rightColX = 350;
            let currentY = doc.y;

            // Details
            doc.fontSize(10).fillColor('#9CA3AF').text('PATIENT', leftColX, currentY);
            doc.fontSize(12).fillColor('#1F2937').text(patientName || 'Unknown', leftColX, currentY + 15);

            doc.fontSize(10).fillColor('#9CA3AF').text('DOCTOR', rightColX, currentY);
            doc.fontSize(12).fillColor('#1F2937').text(doctorName || 'Unknown', rightColX, currentY + 15);

            currentY += 45;

            doc.fontSize(10).fillColor('#9CA3AF').text('DATE', leftColX, currentY);
            doc.fontSize(12).fillColor('#1F2937').text(date || new Date().toLocaleDateString(), leftColX, currentY + 15);

            doc.moveDown(3);

            // Consultation Details
            const startConsultY = doc.y;

            // Diagnosis
            doc.fontSize(10).fillColor('#059669').text('DIAGNOSIS', 50, startConsultY);
            doc.fontSize(12).fillColor('#1F2937').text(diagnosis || 'N/A', 50, startConsultY + 15, { width: 500 });

            doc.moveDown(2);

            // Prescription
            doc.fontSize(10).fillColor('#3B82F6').text('PRESCRIPTION', 50, doc.y);
            doc.fontSize(12).fillColor('#1F2937').text(prescription || 'No medications prescribed', 50, doc.y + 15, { width: 500 });

            doc.moveDown(2);

            // Notes
            if (notes) {
                doc.fontSize(10).fillColor('#D97706').text('ADDITIONAL NOTES', 50, doc.y);
                doc.fontSize(12).fillColor('#1F2937').text(notes, 50, doc.y + 15, { width: 500 });
            }

            // Footer
            doc.fontSize(10)
                .fillColor('#9CA3AF')
                .text('Generated electronically by MediConnect', 50, 700, { align: 'center', margin: 50 });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};
