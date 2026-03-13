import mongoose from 'mongoose';
import https from 'https';
import tesseract from 'tesseract.js';
import Report from '../models/report.model.js';
import AIInsight from '../models/AIInsight.model.js';
import { sendToGroq } from '../utils/groqClient.js';

// Helper to securely fetch a file into memory via HTTPS
const fetchFileToBuffer = (url) => {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);

        const req = https.get(parsedUrl, (res) => {
            if (res.statusCode < 200 || res.statusCode >= 300) {
                return reject(new Error(`Failed to fetch file. Status code: ${res.statusCode}`));
            }

            const chunks = [];
            let totalLength = 0;
            const MAX_SIZE = 10 * 1024 * 1024; // 10MB

            res.on('data', (chunk) => {
                totalLength += chunk.length;
                if (totalLength > MAX_SIZE) {
                    req.destroy();
                    return reject(new Error("File exceeds the maximum allowed size of 10MB"));
                }
                chunks.push(chunk);
            });

            res.on('end', () => resolve(Buffer.concat(chunks)));
        });

        req.on('error', (err) => reject(new Error(`Network error: ${err.message}`)));

        req.setTimeout(15000, () => {
            req.destroy();
            reject(new Error("Request timeout while fetching report file"));
        });
    });
};

export const analyzeReport = async (req, res, next) => {
    try {
        const { reportId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(reportId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid report ID format"
            });
        }

        const report = await Report.findById(reportId);

        if (!report) {
            return res.status(404).json({
                success: false,
                message: "Report not found"
            });
        }

        if (report.patient.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "You do not have permission to analyze this report"
            });
        }

        if (!report.fileUrl) {
            return res.status(400).json({
                success: false,
                message: "Report does not have a valid file URL"
            });
        }

        // Check cache: return existing insight if already analyzed
        const existingInsight = await AIInsight.findOne({ report: report._id });
        if (existingInsight) {
            return res.status(200).json({
                message: 'AI analysis retrieved',
                aiResult: existingInsight
            });
        }

        // Securely download file into memory buffer
        const buffer = await fetchFileToBuffer(report.fileUrl);

        let extractedText = '';

        if (report.fileType.toLowerCase().includes('pdf')) {
            const pdfModule = await import('pdf-parse');
            // pdf-parse v2 requires class instantiation
            const pdfParse = async (buf) => {
                const parser = new pdfModule.PDFParse({ data: buf });
                const res = await parser.getText();
                await parser.destroy();
                return res;
            };
            const pdfData = await pdfParse(buffer);
            extractedText = pdfData.text;
        } else if (report.fileType.toLowerCase().includes('image')) {
            const { data } = await tesseract.recognize(buffer, 'eng');
            extractedText = data.text;
        } else {
            return res.status(400).json({
                success: false,
                message: "Unsupported file type for AI analysis"
            });
        }

        // Clean extracted text: Replace multiple spaces/newlines with single space, trim
        extractedText = extractedText.replace(/\s+/g, ' ').trim();

        // Limit text length to safe max (first 10,000 characters)
        if (extractedText.length > 10000) {
            extractedText = extractedText.substring(0, 10000);
        }

        const prompt = `
Explain the following medical report in simple language for a patient.

Medical Report:
${extractedText}

Provide response in this structure:

Summary:
Key Findings:
Possible Conditions (not diagnosis):
Suggested Next Steps:
Disclaimer: This explanation is AI-generated and not a medical diagnosis.
`;

        const aiResponse = await sendToGroq(prompt);

        // Parse the raw AI text into structured sections
        const parseSection = (text, sectionName, nextSections) => {
            const pattern = new RegExp(
                `${sectionName}[^:]*:\\s*([\\s\\S]*?)(?=${nextSections.map(s => s + '[^:]*:').join('|')}|$)`,
                'i'
            );
            const match = text.match(pattern);
            return match ? match[1].trim() : '';
        };

        const parseBulletList = (text) => {
            if (!text) return [];
            return text
                .split(/\n/)
                .map(line => line.replace(/^[-*•\d.]+\s*/, '').trim())
                .filter(line => line.length > 0);
        };

        const summaryText = parseSection(aiResponse, 'Summary', ['Key Findings', 'Possible Conditions', 'Suggested Next Steps', 'Disclaimer']);
        const keyFindingsText = parseSection(aiResponse, 'Key Findings', ['Possible Conditions', 'Suggested Next Steps', 'Disclaimer']);
        const possibleConditionsText = parseSection(aiResponse, 'Possible Conditions', ['Suggested Next Steps', 'Disclaimer']);
        const suggestedNextStepsText = parseSection(aiResponse, 'Suggested Next Steps', ['Disclaimer']);

        const insight = await AIInsight.create({
            report: report._id,
            patient: req.user.id,
            aiSummary: summaryText,
            keyFindings: parseBulletList(keyFindingsText),
            possibleConditions: parseBulletList(possibleConditionsText),
            suggestedNextSteps: parseBulletList(suggestedNextStepsText),
        });

        res.status(200).json({
            message: 'AI analysis generated',
            aiResult: insight
        });
    } catch (error) {
        // Distinguish fetch/size errors versus general exceptions
        if (error.message.includes("Groq") || error.message.includes("Failed to get AI analysis")) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
        if (error.message.includes("exceeds the maximum allowed size") || error.message.includes("Network error") || error.message.includes("timeout") || error.message.includes("Failed to fetch")) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        next(error);
    }
};
