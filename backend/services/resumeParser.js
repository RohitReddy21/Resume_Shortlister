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

        // Clean up text but maintain line breaks
        const cleanText = text.replace(/\r/g, '\n').replace(/[ \t]+/g, ' ');

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

function extractResumeData(text) {
    const email = extractEmail(text);
    const header = text.slice(0, 1500);

    return {
        name: extractName(header, text, email),
        email: email,
        contact: extractPhone(text),
        place: extractLocation(header, text),
        skills: extractSkills(text),
        experience: extractExperience(text)
    };
}

/**
 * Advanced Name Extraction
 */
function extractName(header, fullText, email) {
    const lines = header.split('\n').map(l => l.trim()).filter(l => l.length > 2);

    // Comprehensive blacklist of job roles and technical terms
    const roleBlacklist = [
        'developer', 'engineer', 'stack', 'backend', 'frontend', 'software', 'lead',
        'senior', 'junior', 'expert', 'architect', 'manager', 'executive', 'student',
        'machine', 'learning', 'data', 'analyst', 'full', 'stack', 'dot', 'net', 'java',
        'python', 'react', 'web', 'ui', 'ux', 'designer', 'consultant', 'graduate',
        'intern', 'associate', 'technology', 'solution', 'quality', 'tester', 'qa',
        'devops', 'cloud', 'system', 'admin', 'network', 'security', 'cyber', 'project',
        'program', 'delivery', 'service', 'operation', 'sales', 'marketing', 'hr',
        'recruiter', 'business', 'resume', 'cv', 'curriculum', 'vitae', 'profile'
    ];

    const contactKeywords = ['phone', 'mobile', 'email', 'contact', 'address', 'linkedin', 'github', 'location'];

    // Strategy 1: Look at the lines around the email address
    if (email) {
        const emailStripped = email.split('@')[0].toLowerCase().replace(/[^a-z]/g, '');
        for (let i = 0; i < Math.min(lines.length, 15); i++) {
            const line = lines[i];
            const lineLower = line.toLowerCase();

            // Skip contact info
            if (contactKeywords.some(k => lineLower.includes(k))) continue;
            if (lineLower.includes('@')) continue;

            // Check if line contains a significant portion of the email username
            const nameParts = lineLower.split(/\s+/);
            const matchesEmail = nameParts.length >= 2 && nameParts.some(p => p.length > 2 && emailStripped.includes(p));

            if (matchesEmail) {
                // Verify it doesn't look like a role
                if (!roleBlacklist.some(role => lineLower.includes(role))) {
                    return line.replace(/[^\w\s].*$/, '').trim(); // Remove trailing icons/chars
                }
            }
        }
    }

    // Strategy 2: First valid line starting with Capital Letter that isn't a role
    for (let i = 0; i < Math.min(lines.length, 8); i++) {
        const line = lines[i];
        const lineLower = line.toLowerCase();
        const words = line.split(/\s+/);

        // Skip if contains role keywords or contact keywords
        if (roleBlacklist.some(role => lineLower.includes(role))) continue;
        if (contactKeywords.some(k => lineLower.includes(k))) continue;
        if (lineLower.includes('@') || (line.match(/\d/g) || []).length > 4) continue;

        // Must be 2-4 words, all capitalized
        const isCapitalized = words.length >= 2 && words.length <= 4 && words.every(w => {
            // Must start with caps, can have dots (A.J. Smith)
            return /^[A-Z]/.test(w);
        });

        if (isCapitalized) {
            // Extra check: ensure not purely upper case common words (e.g. "SUMMARY", "OBJECTIVE")
            if (!/^[A-Z\s]+$/.test(line) || line.length > 3) {
                return line;
            }
        }
    }

    // Strategy 3: Try to find "Name: X"
    const explicitMatch = fullText.match(/(?:Name|Applicant|Candidate)\s*:?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z\.]+)*\s+[A-Z][a-z]+)/i);
    if (explicitMatch) return explicitMatch[1].trim();

    // Strategy 4: Fallback to the very first sensible line
    if (lines.length > 0) {
        const firstLine = lines[0];
        if (firstLine.split(' ').length <= 4 && !roleBlacklist.some(r => firstLine.toLowerCase().includes(r))) {
            return firstLine;
        }
    }

    return 'Not Found';
}

/**
 * Improved Email Extraction
 */
function extractEmail(text) {
    const emailRegex = /\b([a-zA-Z][a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/gi;
    const matches = text.match(emailRegex);
    return matches ? matches[0].toLowerCase() : '';
}

/**
 * Improved Phone Extraction
 */
function extractPhone(text) {
    const phoneRegex = /(?:(?:\+91|91|0)[\s-]?)?([6-9]\d{9}|[6-9]\d{2}[\s-]\d{3}[\s-]\d{4}|\d{5}[\s-]\d{5})/g;
    const matches = text.match(phoneRegex);
    if (matches) {
        let phone = matches[0].replace(/[\s-+]/g, '');
        return phone.length > 10 ? phone.slice(-10) : phone;
    }
    return '';
}

/**
 * Improved Location Extraction
 */
function extractLocation(header, fullText) {
    const cities = ['mumbai', 'delhi', 'bangalore', 'bengaluru', 'hyderabad', 'chennai', 'kolkata', 'pune', 'ahmedabad', 'jaipur', 'lucknow', 'chandigarh', 'gurgaon', 'gurugram', 'noida', 'kochi', 'thiruvananthapuram', 'coimbatore', 'madurai', 'mysore', 'visakhapatnam', 'nagpur', 'indore', 'bhopal', 'patna', 'ranchi', 'bhubaneswar', 'guwahati', 'kanpur', 'surat', 'vadodara'];

    const headerLower = header.toLowerCase();
    for (const city of cities) {
        if (headerLower.includes(city)) {
            return city.charAt(0).toUpperCase() + city.slice(1);
        }
    }

    const patterns = [
        /(?:Location|Address|Place|City|Residence)\s*:?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
        /\b(?:in|at|from)\s+([A-Z][a-z]+(?:,\s*[A-Z][a-z]+)*)\b/
    ];

    for (const pattern of patterns) {
        const match = fullText.match(pattern);
        if (match && match[1]) {
            const loc = match[1].trim();
            if (loc.length > 3 && !['road', 'street', 'lane', 'email', 'name', 'phone'].includes(loc.toLowerCase())) {
                return loc;
            }
        }
    }

    return '';
}

/**
 * Improved Skills Extraction
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
        const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escaped}\\b`, 'i');
        if (regex.test(textLower)) {
            foundSkills.push(skill);
        }
    });

    return foundSkills.slice(0, 15).join(', ');
}

/**
 * Improved Experience Extraction
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
