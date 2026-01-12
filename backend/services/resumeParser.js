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

        // Preserve basic layout but clean excess whitespace
        const cleanText = text.replace(/\r/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n\s*\n/g, '\n');

        // Extract information from text
        return extractResumeData(cleanText);
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
    // We analyze the header (first 1000 chars) more intensely for personal info
    const header = text.slice(0, 1000);

    return {
        name: extractName(header, text),
        email: extractEmail(text),
        contact: extractPhone(text),
        place: extractLocation(header, text),
        skills: extractSkills(text),
        experience: extractExperience(text)
    };
}

/**
 * Extract name - Uses a blacklist to avoid common header noise
 */
function extractName(header, fullText) {
    const lines = header.split('\n').map(l => l.trim()).filter(l => l.length > 2);

    // Blacklist of words that often appear at the top but aren't names
    const blackList = [
        'resume', 'cv', 'curriculum', 'vitae', 'profile', 'summary', 'professional',
        'contact', 'email', 'phone', 'mobile', 'address', 'location', 'linkedin',
        'github', 'developer', 'engineer', 'manager', 'lead', 'senior', 'junior',
        'backend', 'frontend', 'fullstack', 'software', 'web', 'data', 'analyst',
        'experience', 'education', 'skills', 'objective', 'about', 'me', 'page'
    ];

    for (let i = 0; i < Math.min(lines.length, 6); i++) {
        const line = lines[i];
        const lineLower = line.toLowerCase();

        // 1. Check if line is purely a blacklist item or job title
        if (blackList.some(word => lineLower === word || lineLower.startsWith(word + ' '))) continue;

        // 2. Skip emails and phone numbers
        if (line.includes('@') || (line.match(/\d/g) || []).length > 4) continue;

        // 3. Match 2-3 words starting with Capital letters
        // Matches "John Doe", "Jane S. Doe", "Dr. Alan Smith"
        const nameMatch = line.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z\.]*)*\s+[A-Z][a-z]+)$/);
        if (nameMatch) {
            const name = nameMatch[1];
            // Final check: ensures found string isn't too long or contains non-name noise
            if (name.split(' ').length <= 4 && name.length < 40) return name;
        }

        // 4. Fallback: Take first multi-word capitalized line that isn't blacklisted
        const words = line.split(/\s+/);
        if (words.length >= 2 && words.length <= 4 &&
            words.every(w => /^[A-Z]/.test(w)) &&
            !blackList.some(b => lineLower.includes(b))) {
            return line;
        }
    }

    // Try a "Name: X" regex catch-all
    const explicitMatch = fullText.match(/(?:Name|NAME)\s*:?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/i);
    if (explicitMatch) return explicitMatch[1].trim();

    return 'Not Found';
}

/**
 * Extract email address - Stricter boundaries
 */
function extractEmail(text) {
    // This regex ensures we don't pick up leading numbers (often phone numbers) 
    // that are stuck to the email in the PDF text layer.
    const emailRegex = /([a-zA-Z][a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
    const match = text.match(emailRegex);
    return match ? match[0].toLowerCase() : '';
}

/**
 * Extract phone number
 */
function extractPhone(text) {
    // Specifically looking for 10 consecutive or formatted digits
    const phoneRegex = /(?:(?:\+91|91|0)[\s-]?)?([6-9]\d{9}|[6-9]\d{2}[\s-]\d{3}[\s-]\d{4}|\d{5}[\s-]\d{5})/g;
    const matches = text.match(phoneRegex);
    if (matches) {
        let phone = matches[0].replace(/[\s-+]/g, '');
        return phone.length > 10 ? phone.slice(-10) : phone;
    }
    return '';
}

/**
 * Extract location
 */
function extractLocation(header, fullText) {
    const cities = ['mumbai', 'delhi', 'bangalore', 'bengaluru', 'hyderabad', 'chennai', 'kolkata', 'pune', 'ahmedabad', 'jaipur', 'lucknow', 'chandigarh', 'gurgaon', 'gurugram', 'noida', 'kochi', 'thiruvananthapuram', 'coimbatore', 'madurai', 'mysore', 'visakhapatnam', 'nagpur', 'indore', 'bhopal', 'patna', 'ranchi', 'bhubaneswar', 'guwahati', 'kanpur', 'surat', 'vadodara'];

    // Check header first for city names
    const headerLower = header.toLowerCase();
    for (const city of cities) {
        if (headerLower.includes(city)) {
            return city.charAt(0).toUpperCase() + city.slice(1);
        }
    }

    // Look for explicit patterns
    const patterns = [
        /(?:Location|Address|Place|City|Residence)\s*:?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
        /\b(?:in|at|from)\s+([A-Z][a-z]+(?:,\s*[A-Z][a-z]+)*)\b/
    ];

    for (const pattern of patterns) {
        const match = fullText.match(pattern);
        if (match && match[1]) {
            const loc = match[1].trim();
            // Filter out junk matches like "ing", "Email", etc.
            if (loc.length > 3 && !['road', 'street', 'lane', 'email', 'name'].includes(loc.toLowerCase())) {
                return loc;
            }
        }
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
    text = text.toLowerCase();

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
