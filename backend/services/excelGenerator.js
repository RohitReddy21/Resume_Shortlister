import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate Excel file from resume data
 */
export async function generateExcel(resumes) {
    try {
        // Prepare data for Excel
        const excelData = resumes.map(resume => ({
            'Applicant Name': resume.name || '',
            'Email': resume.email || '',
            'Contact': resume.contact || '',
            'Place': resume.place || '',
            'Skills': resume.skills || '',
            'Experience': resume.experience || '',
            'Current CTC': resume.currentCTC || '',
            'Expected Pay': resume.expectedPay || '',
            'Availability to Join': resume.availabilityToJoin || ''
        }));

        // Create workbook and worksheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(excelData);

        // Set column widths
        const columnWidths = [
            { wch: 20 },  // Applicant Name
            { wch: 30 },  // Email
            { wch: 15 },  // Contact
            { wch: 20 },  // Place
            { wch: 40 },  // Skills
            { wch: 15 },  // Experience
            { wch: 15 },  // Current CTC
            { wch: 15 },  // Expected Pay
            { wch: 20 }   // Availability to Join
        ];
        worksheet['!cols'] = columnWidths;

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Resumes');

        // Generate file path
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `resumes_${timestamp}.xlsx`;
        const filePath = path.join(__dirname, '..', 'exports', fileName);

        // Write file
        XLSX.writeFile(workbook, filePath);

        return filePath;
    } catch (error) {
        console.error('Error generating Excel:', error);
        throw error;
    }
}
