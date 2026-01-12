import fs from 'fs/promises';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

/**
 * Parse resume file and extract structured data
 */
export async function parseResume(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    let text = '';

    try {
        if (ext === '.pdf') {
            const dataBuffer = await fs.readFile(filePath);
            const data = await pdfParse(dataBuffer);
            text = data.text;
        } else if (ext === '.doc' || ext === '.docx') {
            const result = await mammoth.extractRawText({ path: filePath });
            text = result.value;
        } else {
            throw new Error('Unsupported file format');
        }

        // Extract information from text
        const extractedData = extractResumeData(text);
        return extractedData;
    } catch (error) {
        console.error('Error parsing resume:', error);
        throw error;
    }
}

/**
 * Extract structured data from resume text using regex patterns
 */
function extractResumeData(text) {
    // Clean up text
    const cleanText = text.replace(/\s+/g, ' ').trim();

    return {
        name: extractName(cleanText),
        email: extractEmail(cleanText),
        contact: extractPhone(cleanText),
        place: extractLocation(cleanText),
        skills: extractSkills(cleanText),
        experience: extractExperience(cleanText)
    };
}

/**
 * Extract name - typically first line or near top
 */
function extractName(text) {
    // Try to find name patterns
    const lines = text.split(/\n+/).filter(line => line.trim().length > 0);

    // First non-empty line is often the name
    if (lines.length > 0) {
        const firstLine = lines[0].trim();
        // Check if it looks like a name (2-4 words, capitalized, no special chars)
        if (/^[A-Z][a-z]+(\s+[A-Z][a-z]+){1,3}$/.test(firstLine)) {
            return firstLine;
        }
    }

    // Try to find "Name:" pattern
    const nameMatch = text.match(/(?:Name|NAME)\s*:?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/i);
    if (nameMatch) {
        return nameMatch[1].trim();
    }

    // Return first capitalized words
    const capitalizedMatch = text.match(/\b([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/);
    return capitalizedMatch ? capitalizedMatch[1].trim() : 'Not Found';
}

/**
 * Extract email address
 */
function extractEmail(text) {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const match = text.match(emailRegex);
    return match ? match[0] : '';
}

/**
 * Extract phone number
 */
function extractPhone(text) {
    // Indian phone patterns
    const phonePatterns = [
        /(?:\+91|91)?[\s-]?[6-9]\d{9}/,  // Indian mobile
        /\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/,  // US format
        /\d{10}/  // 10 digit number
    ];

    for (const pattern of phonePatterns) {
        const match = text.match(pattern);
        if (match) {
            return match[0].replace(/[\s-()]/g, '');
        }
    }

    return '';
}

/**
 * Extract location/place
 */
function extractLocation(text) {
    // Common location patterns
    const locationPatterns = [
        /(?:Location|Address|City|Place)\s*:?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:,\s*[A-Z][a-z]+)*)/i,
        /\b(Mumbai|Delhi|Bangalore|Bengaluru|Hyderabad|Chennai|Kolkata|Pune|Ahmedabad|Jaipur|Lucknow|Kanpur|Nagpur|Indore|Thane|Bhopal|Visakhapatnam|Pimpri-Chinchwad|Patna|Vadodara|Ghaziabad|Ludhiana|Agra|Nashik|Faridabad|Meerut|Rajkot|Kalyan-Dombivali|Vasai-Virar|Varanasi|Srinagar|Aurangabad|Dhanbad|Amritsar|Navi Mumbai|Allahabad|Ranchi|Howrah|Coimbatore|Jabalpur|Gwalior|Vijayawada|Jodhpur|Madurai|Raipur|Kota)\b/i,
        /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2}|[A-Z][a-z]+)\b/
    ];

    for (const pattern of locationPatterns) {
        const match = text.match(pattern);
        if (match) {
            return match[1] ? match[1].trim() : match[0].trim();
        }
    }

    return '';
}

/**
 * Extract skills
 */
function extractSkills(text) {
    const skillsSection = text.match(/(?:Skills|SKILLS|Technical Skills|Core Competencies)\s*:?\s*([\s\S]*?)(?=\n\n|Experience|EXPERIENCE|Education|EDUCATION|$)/i);

    if (skillsSection) {
        const skillsText = skillsSection[1];
        // Clean up and format skills
        const skills = skillsText
            .replace(/[•\-\*]/g, ',')
            .split(/[,\n]/)
            .map(s => s.trim())
            .filter(s => s.length > 0 && s.length < 50)
            .slice(0, 15)  // Limit to 15 skills
            .join(', ');
        return skills;
    }

    // Try to find common technical skills
    const commonSkills = [
        'JavaScript', 'Python', 'Java', 'C\\+\\+', 'React', 'Angular', 'Vue',
        'Node\\.js', 'Express', 'Django', 'Flask', 'Spring', 'SQL', 'MongoDB',
        'PostgreSQL', 'MySQL', 'AWS', 'Azure', 'Docker', 'Kubernetes',
        'Git', 'HTML', 'CSS', 'TypeScript', 'PHP', 'Ruby', 'Go', 'Rust',
        'Machine Learning', 'Data Science', 'AI', 'Deep Learning'
    ];

    const foundSkills = [];
    for (const skill of commonSkills) {
        const regex = new RegExp(`\\b${skill}\\b`, 'i');
        if (regex.test(text)) {
            foundSkills.push(skill.replace(/\\/g, ''));
        }
    }

    return foundSkills.join(', ');
}

/**
 * Extract years of experience
 */
function extractExperience(text) {
    // Look for experience patterns
    const experiencePatterns = [
        /(\d+)\+?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:experience|exp)/i,
        /(?:experience|exp)\s*:?\s*(\d+)\+?\s*(?:years?|yrs?)/i,
        /(\d+)\s*-\s*(\d+)\s*(?:years?|yrs?)/i
    ];

    for (const pattern of experiencePatterns) {
        const match = text.match(pattern);
        if (match) {
            if (match[2]) {
                // Range found
                return `${match[1]}-${match[2]} years`;
            }
            return `${match[1]} years`;
        }
    }

    // Try to count work experiences
    const experienceSection = text.match(/(?:Experience|EXPERIENCE|Work Experience|WORK EXPERIENCE)\s*:?\s*([\s\S]*?)(?=Education|EDUCATION|Skills|SKILLS|$)/i);

    if (experienceSection) {
        // Count date ranges in experience section
        const dateRanges = experienceSection[1].match(/\d{4}\s*-\s*(?:\d{4}|Present|Current)/gi);
        if (dateRanges && dateRanges.length > 0) {
            // Calculate total years from date ranges
            let totalYears = 0;
            dateRanges.forEach(range => {
                const years = range.match(/\d{4}/g);
                if (years && years.length >= 1) {
                    const startYear = parseInt(years[0]);
                    const endYear = years[1] ? parseInt(years[1]) : new Date().getFullYear();
                    totalYears += (endYear - startYear);
                }
            });
            if (totalYears > 0) {
                return `${totalYears} years`;
            }
        }
    }

    return '';
}
