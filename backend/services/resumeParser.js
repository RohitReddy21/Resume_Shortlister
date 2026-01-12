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

        // Clean up text
        const cleanText = text.replace(/\r/g, '\n').replace(/\n\s*\n/g, '\n');

        // Extract information from text
        const extractedData = extractResumeData(cleanText);
        return extractedData;
    } catch (error) {
        console.error('Error parsing resume:', error);
        return {
            name: 'Parse Error',
            email: '',
            contact: '',
            place: '',
            skills: '',
            experience: ''
        };
    }
}

/**
 * Extract structured data from resume text using regex patterns
 */
function extractResumeData(text) {
    return {
        name: extractName(text),
        email: extractEmail(text),
        contact: extractPhone(text),
        place: extractLocation(text),
        skills: extractSkills(text),
        experience: extractExperience(text)
    };
}

/**
 * Extract name - improved version
 */
function extractName(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    // Noise words that shouldn't be in a name
    const noise = ['address', 'location', 'phone', 'email', 'mobile', 'contact', 'curriculum', 'vitae', 'resume', 'bio', 'summary'];

    for (let i = 0; i < Math.min(lines.length, 10); i++) {
        const line = lines[i];

        // Skip lines that contain noise words
        if (noise.some(word => line.toLowerCase().includes(word))) continue;

        // Skip lines with @ (emails) or too many numbers
        if (line.includes('@') || (line.match(/\d/g) || []).length > 4) continue;

        // Pattern for a typical name: 2-3 words, capitalized
        const nameMatch = line.match(/^([A-Z][a-z]+(?:\s+[A-Z](?:[a-z]+|\.))?\s+[A-Z][a-z]+)$/);
        if (nameMatch) return nameMatch[1];

        // Looser pattern: just 2-3 capitalized words
        const looseMatch = line.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})\b/);
        if (looseMatch && looseMatch[1].split(' ').length >= 2) return looseMatch[1];
    }

    return 'Not Found';
}

/**
 * Extract email address
 */
function extractEmail(text) {
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
    const match = text.match(emailRegex);
    return match ? match[0].toLowerCase() : '';
}

/**
 * Extract phone number
 */
function extractPhone(text) {
    const phoneRegex = /(?:(?:\+91|91|0)[\s-]?)?([6-9]\d{9}|[6-9]\d{2}[\s-]\d{3}[\s-]\d{4}|\d{5}[\s-]\d{5})/g;
    const matches = text.match(phoneRegex);
    if (matches) {
        // Return first valid looking 10-digit sequence
        return matches[0].replace(/[\s-+]/g, '').slice(-10);
    }
    return '';
}

/**
 * Extract location
 */
function extractLocation(text) {
    const cities = ['mumbai', 'delhi', 'bangalore', 'bengaluru', 'hyderabad', 'chennai', 'kolkata', 'pune', 'ahmedabad', 'jaipur', 'lucknow', 'chandigarh', 'gurgaon', 'gurugram', 'noida', 'pune', 'kochi', 'thiruvananthapuram', 'coimbatore', 'madurai', 'mysore', 'visakhapatnam', 'nagpur', 'indore', 'bhopal', 'patna', 'ranchi', 'bhubaneswar', 'guwahati'];

    const textLower = text.toLowerCase();
    for (const city of cities) {
        if (textLower.includes(city)) {
            return city.charAt(0).toUpperCase() + city.slice(1);
        }
    }

    // Try to find "Location: X" pattern
    const locMatch = text.match(/(?:Location|Address|Place|City)\s*:?\s*([A-Z][a-z]+)/i);
    if (locMatch && !['road', 'street', 'lane'].includes(locMatch[1].toLowerCase())) {
        return locMatch[1].trim();
    }

    return '';
}

/**
 * Extract skills - Comprehensive list
 */
function extractSkills(text) {
    const skillKeywords = [
        'Python', 'Java', 'JavaScript', 'TypeScript', 'C++', 'C#', 'PHP', 'Ruby', 'Swift', 'Go', 'Rust', 'Kotlin', 'SQL',
        'React', 'Angular', 'Vue', 'Next.js', 'Node.js', 'Express', 'Django', 'Flask', 'Spring Boot', 'Laravel', 'ASP.NET',
        'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch', 'Firebase', 'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes',
        'HTML', 'CSS', 'Sass', 'Tailwind', 'Bootstrap', 'Redux', 'GraphQL', 'REST API', 'Microservices',
        'Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision', 'Data Science', 'Pandas', 'NumPy', 'Scikit-learn', 'TensorFlow', 'PyTorch',
        'Git', 'CI/CD', 'Agile', 'Jira', 'Postman', 'Tableau', 'Power BI', 'Excel', 'Project Management'
    ];

    const foundSkills = [];
    const textLower = text.toLowerCase();

    skillKeywords.forEach(skill => {
        // Escape special chars like . or + in skill names
        const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escaped}\\b`, 'i');
        if (regex.test(text)) {
            foundSkills.push(skill);
        }
    });

    return foundSkills.slice(0, 15).join(', ');
}

/**
 * Extract years of experience
 */
function extractExperience(text) {
    const expPatterns = [
        /(\d+)\+?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:experience|exp)/i,
        /(?:total\s+)?(?:experience|exp)\s*:?\s*(\d+)\+?\s*(?:years?|yrs?)/i,
        /(\d+(?:\.\d+)?)\s*(?:years?|yrs?)/i
    ];

    for (const pattern of expPatterns) {
        const match = text.match(pattern);
        if (match) return `${match[1]} years`;
    }

    // Try counting year ranges e.g. 2018 - 2022
    const yearRanges = text.match(/(?:20|19)\d{2}\s*-\s*(?:20\d{2}|present|current)/gi);
    if (yearRanges) {
        let total = 0;
        yearRanges.forEach(range => {
            const parts = range.match(/\d{4}|present|current/gi);
            if (parts.length >= 2) {
                const start = parseInt(parts[0]);
                const end = parts[1].match(/present|current/i) ? new Date().getFullYear() : parseInt(parts[1]);
                total += Math.max(0, end - start);
            }
        });
        if (total > 0) return `${total} years`;
    }

    return 'Fresher';
}
