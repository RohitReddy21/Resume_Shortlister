import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate masked PDF resume with company contact details
 */
export async function generateMaskedPDF(resumeData, companyContact) {
    return new Promise((resolve, reject) => {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileName = `masked_resume_${resumeData.name.replace(/\s+/g, '_')}_${timestamp}.pdf`;
            const filePath = path.join(__dirname, '..', 'exports', fileName);

            // Create PDF document
            const doc = new PDFDocument({
                size: 'A4',
                margins: { top: 50, bottom: 50, left: 50, right: 50 }
            });

            // Pipe to file
            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // Header
            doc.fontSize(24)
                .font('Helvetica-Bold')
                .fillColor('#2563eb')
                .text(resumeData.name || 'Candidate Name', { align: 'center' });

            doc.moveDown(0.5);

            // Contact Information (Masked with company details)
            doc.fontSize(10)
                .font('Helvetica')
                .fillColor('#666666')
                .text(`Email: ${companyContact.email}`, { align: 'center' });

            doc.text(`Phone: ${companyContact.phone}`, { align: 'center' });

            if (resumeData.place) {
                doc.text(`Location: ${resumeData.place}`, { align: 'center' });
            }

            doc.moveDown(1);
            doc.strokeColor('#e5e7eb')
                .lineWidth(1)
                .moveTo(50, doc.y)
                .lineTo(545, doc.y)
                .stroke();
            doc.moveDown(1);

            // Professional Summary
            if (resumeData.experience) {
                doc.fontSize(14)
                    .font('Helvetica-Bold')
                    .fillColor('#1f2937')
                    .text('EXPERIENCE');

                doc.moveDown(0.3);
                doc.fontSize(11)
                    .font('Helvetica')
                    .fillColor('#374151')
                    .text(resumeData.experience);

                doc.moveDown(1);
            }

            // Skills Section
            if (resumeData.skills) {
                doc.fontSize(14)
                    .font('Helvetica-Bold')
                    .fillColor('#1f2937')
                    .text('SKILLS');

                doc.moveDown(0.3);

                const skills = resumeData.skills.split(',').map(s => s.trim());
                const skillsPerRow = 3;

                for (let i = 0; i < skills.length; i += skillsPerRow) {
                    const rowSkills = skills.slice(i, i + skillsPerRow);
                    doc.fontSize(10)
                        .font('Helvetica')
                        .fillColor('#4b5563');

                    rowSkills.forEach((skill, index) => {
                        if (index === 0) {
                            doc.text(`• ${skill}`, 50, doc.y, { continued: true, width: 150 });
                        } else {
                            doc.text(`• ${skill}`, { continued: index < rowSkills.length - 1, width: 150 });
                        }
                    });
                    doc.text(''); // New line
                }

                doc.moveDown(1);
            }

            // Compensation Details
            doc.fontSize(14)
                .font('Helvetica-Bold')
                .fillColor('#1f2937')
                .text('COMPENSATION & AVAILABILITY');

            doc.moveDown(0.3);

            if (resumeData.currentCTC) {
                doc.fontSize(11)
                    .font('Helvetica')
                    .fillColor('#374151')
                    .text(`Current CTC: ${resumeData.currentCTC}`);
            }

            if (resumeData.expectedPay) {
                doc.fontSize(11)
                    .font('Helvetica')
                    .fillColor('#374151')
                    .text(`Expected Salary: ${resumeData.expectedPay}`);
            }

            if (resumeData.availabilityToJoin) {
                doc.fontSize(11)
                    .font('Helvetica')
                    .fillColor('#374151')
                    .text(`Notice Period: ${resumeData.availabilityToJoin}`);
            }

            doc.moveDown(2);

            // Footer
            doc.fontSize(8)
                .font('Helvetica-Oblique')
                .fillColor('#9ca3af')
                .text('This is a masked resume. Contact details have been replaced with company information.',
                    50, doc.page.height - 70,
                    { align: 'center', width: 495 });

            // Finalize PDF
            doc.end();

            stream.on('finish', () => {
                resolve(filePath);
            });

            stream.on('error', (error) => {
                reject(error);
            });

        } catch (error) {
            reject(error);
        }
    });
}
