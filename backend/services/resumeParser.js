import fs from 'fs/promises';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

/**
 * Parse resume file and extract structured data
 * Returns comprehensive JSON schema with all professional fields
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
            full_name: null,
            email: null,
            phone: null,
            location: null,
            current_role: null,
            seniority: null,
            total_experience_years: null,
            skills: [],
            tools_and_technologies: [],
            education: [],
            work_experience: [],
            projects: [],
            certifications: [],
            resume_summary: null
        };
    }
}

function extractResumeData(text) {
    const email = extractEmail(text);
    const header = text.slice(0, 1500);
    const phone = extractPhone(text);
    const { skills, tools } = extractSkillsAndTools(text);
    const experienceYears = extractExperienceYears(text);
    const currentRole = extractCurrentRole(header, text);
    const seniority = determineSeniority(header, text, currentRole, experienceYears);

    return {
        full_name: extractName(header, text, email),
        email: email,
        phone: phone,
        location: extractLocation(header, text),
        current_role: currentRole,
        seniority: seniority,
        total_experience_years: experienceYears,
        skills: skills,
        tools_and_technologies: tools,
        education: extractEducation(text),
        work_experience: extractWorkExperience(text),
        projects: extractProjects(text),
        certifications: extractCertifications(text),
        resume_summary: extractResumeSummary(text)
    };
}

/**
 * Improved Name Extraction - More robust and flexible
 */
function extractName(header, fullText, email) {
    // Explicit patterns first
    const explicitPatterns = [
        /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/m,
        /(?:Name|Applicant|Candidate)\s*:?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z\.]+)+)/i,
        /([A-Z][a-z]+\s+[A-Z][a-z]+)\s*\n.*(?:email|phone|address)/i
    ];

    for (const pattern of explicitPatterns) {
        const match = fullText.match(pattern);
        if (match) {
            const name = match[1].trim();
            if (isValidName(name)) return name;
        }
    }

    // Extract from email username if valid format
    if (email) {
        const username = email.split('@')[0];
        const nameFromEmail = reconstructNameFromEmail(username);
        if (nameFromEmail && isValidName(nameFromEmail)) {
            return nameFromEmail;
        }
    }

    // Get first few lines and find best candidate
    const lines = header.split('\n').map(l => l.trim()).filter(l => l.length > 2 && l.length < 100);
    
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
        const line = lines[i];
        
        // Skip if it's clearly not a name
        if (isNotAName(line)) continue;
        
        // Check if it looks like a name (proper noun structure)
        const words = line.split(/\s+/);
        if (words.length >= 2 && words.length <= 4) {
            if (words.every(w => /^[A-Z]/.test(w) && w.length > 1)) {
                if (isValidName(line)) return line;
            }
        }
    }

    return null;
}

/**
 * Helper: Reconstruct name from email username
 */
function reconstructNameFromEmail(username) {
    // Remove common separators and patterns
    let name = username.replace(/[._-]/g, ' ').replace(/\d+/g, '');
    
    // Capitalize words
    name = name.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ').trim();
    
    if (name.length > 3) return name;
    return null;
}

/**
 * Helper: Validate if string is likely a name
 */
function isValidName(str) {
    if (!str || str.length < 3 || str.length > 100) return false;
    
    const words = str.split(/\s+/);
    
    // Name should have at least 2 words
    if (words.length < 2) return false;
    
    // Each word should be mostly letters
    return words.every(w => /^[A-Za-z\s'.'-]+$/.test(w) && w.length > 1);
}

/**
 * Helper: Check if line is NOT a name
 */
function isNotAName(str) {
    const notNamePatterns = [
        /^[A-Z\s]{2,}$/,  // All caps
        /(?:phone|email|linkedin|github|address|location|summary|objective|about|skills?|experience|education|project|certification)/i,
        /^\d+/, // Starts with number
        /[^\w\s'-].*[^\w\s'-]/,  // Special characters
        /(?:developer|engineer|manager|lead|director|analyst|consultant|designer|architect|executive)/i  // Job titles alone
    ];
    
    return notNamePatterns.some(pattern => pattern.test(str));
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
 * Enhanced Skills and Tools Extraction - Dynamic and comprehensive
 * Extracts both predefined and unknown skills from the resume
 */
function extractSkillsAndTools(text) {
    // Predefined lists for validation
    const commonSoftSkills = [
        'Leadership', 'Communication', 'Problem Solving', 'Team Work', 'Teamwork', 
        'Adaptability', 'Critical Thinking', 'Creativity', 'Time Management', 'Organization',
        'Customer Service', 'Decision Making', 'Negotiation', 'Public Speaking', 'Analytical',
        'Project Management', 'Agile', 'Scrum', 'Collaboration', 'Mentoring', 'Presentation'
    ];

    const commonTools = [
        'Python', 'Java', 'JavaScript', 'TypeScript', 'C++', 'C#', 'PHP', 'Ruby', 'Swift', 'Go', 'Rust', 'Kotlin', 'SQL',
        'React', 'Angular', 'Vue', 'Next.js', 'Node.js', 'Express', 'Django', 'Flask', 'Spring Boot', 'Laravel', 'ASP.NET',
        'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch', 'Firebase', 'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes',
        'HTML', 'CSS', 'Sass', 'Tailwind', 'Bootstrap', 'Redux', 'GraphQL', 'REST API', 'Microservices',
        'Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision', 'Data Science', 'Pandas', 'NumPy', 'Scikit-learn', 'TensorFlow', 'PyTorch',
        'Git', 'CI/CD', 'Postman', 'Tableau', 'Power BI', 'Excel', 'Figma', 'Adobe XD', 'Linux', 'Windows', 'Jira'
    ];

    const foundSkills = [];
    const foundTools = [];
    const seen = new Set();
    const textLower = text.toLowerCase();

    // 1. Extract predefined soft skills
    commonSoftSkills.forEach(skill => {
        const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (regex.test(textLower) && !seen.has(skill.toLowerCase())) {
            foundSkills.push(skill);
            seen.add(skill.toLowerCase());
        }
    });

    // 2. Extract predefined tools/technologies
    commonTools.forEach(tool => {
        const regex = new RegExp(`\\b${tool.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (regex.test(textLower) && !seen.has(tool.toLowerCase())) {
            foundTools.push(tool);
            seen.add(tool.toLowerCase());
        }
    });

    // 3. Extract dynamic skills from "Skills" section
    const skillsSection = extractSection(text, /(?:technical\s+)?skills?|competencies|expertise|proficiencies/i);
    if (skillsSection) {
        const dynamicSkills = extractDynamicSkills(skillsSection, seen);
        foundTools.push(...dynamicSkills);
    }

    // 4. Extract skills from work experience descriptions
    const expSection = extractSection(text, /(?:work\s+)?experience|employment history/i);
    if (expSection) {
        const expSkills = extractDynamicSkills(expSection, seen);
        foundTools.push(...expSkills);
    }

    // 5. Extract skills from projects section
    const projectSection = extractSection(text, /projects?|portfolio/i);
    if (projectSection) {
        const projectSkills = extractDynamicSkills(projectSection, seen);
        foundTools.push(...projectSkills);
    }

    // Remove duplicates and return
    const uniqueTools = [...new Set(foundTools)];
    
    return {
        skills: foundSkills.slice(0, 20),
        tools: uniqueTools.slice(0, 40)
    };
}

/**
 * Helper: Extract a section from resume
 */
function extractSection(text, sectionPattern) {
    const parts = text.split(sectionPattern);
    if (parts.length < 2) return null;
    
    // Get the next section or next 2000 chars
    const nextPart = parts[1];
    const nextSectionMatch = nextPart.match(/\n(?:education|work|experience|project|skill|certificate|summary|objective|about)/i);
    
    if (nextSectionMatch) {
        return nextPart.slice(0, nextSectionMatch.index);
    }
    
    return nextPart.slice(0, 2000);
}

/**
 * Helper: Extract skills dynamically from text
 * Looks for capitalized words and technical-sounding terms
 */
function extractDynamicSkills(sectionText, seenSet) {
    const skills = [];
    
    // Split by common delimiters
    const items = sectionText.split(/[,;•\n|→]/);
    
    for (const item of items) {
        let skill = item.trim().replace(/^[-*•]\s*/, '').trim();
        
        // Remove trailing descriptions
        skill = skill.split(/(?:\s*[-–—]\s*|\s+\()/)[0].trim();
        
        // Validate skill
        if (skill.length > 2 && skill.length < 100 && 
            !seenSet.has(skill.toLowerCase()) &&
            /^[A-Z]/.test(skill) &&  // Starts with capital
            !/^(?:the|a|an|and|or|in|at|to|for|with|by|from|as|is|are|have|has|will|can|should|may|must|would|could|might)$/i.test(skill) &&  // Not common words
            !/\d{3,}/.test(skill) &&  // No long numbers
            !/https?:\/\//.test(skill)) {  // Not URLs
            
            skills.push(skill);
            seenSet.add(skill.toLowerCase());
        }
    }
    
    return skills;
}

/**
 * Experience Extraction - Returns total years as number
 */
function extractExperienceYears(text) {
    const expPatterns = [
        /(\d+)\+?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:experience|exp)/i,
        /(?:total\s+)?(?:experience|exp)\s*:?\s*(\d+)\+?\s*(?:years?|yrs?)/i
    ];

    for (const pattern of expPatterns) {
        const match = text.match(pattern);
        if (match) return parseInt(match[1]);
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
        if (total > 0) return total;
    }

    return null;
}

/**
 * Current Role Extraction
 */
function extractCurrentRole(header, fullText) {
    const rolePatterns = [
        /(?:current|position|role|title|working as|employed as)\s*:?\s*([A-Za-z\s]+?)(?:\n|$|at|@)/i,
        /^([A-Za-z\s]+?)\s*(?:\n|$)/m
    ];

    const roleKeywords = [
        'developer', 'engineer', 'manager', 'lead', 'architect', 'analyst', 'consultant',
        'designer', 'product', 'project', 'business', 'data', 'devops', 'qa', 'tester',
        'security', 'network', 'system', 'administrator', 'executive', 'director'
    ];

    for (const pattern of rolePatterns) {
        const match = fullText.match(pattern);
        if (match) {
            const role = match[1].trim();
            if (role.length > 3 && role.length < 100 && roleKeywords.some(k => role.toLowerCase().includes(k))) {
                return role;
            }
        }
    }

    return null;
}

/**
 * Seniority Level Determination
 */
function determineSeniority(header, fullText, currentRole, experienceYears) {
    const textLower = fullText.toLowerCase();
    
    const seniorityMap = {
        'intern': 'Intern',
        'trainee': 'Intern',
        'junior': 'Junior',
        'mid-level': 'Mid',
        'mid level': 'Mid',
        'intermediate': 'Mid',
        'senior': 'Senior',
        'lead': 'Lead',
        'principal': 'Lead',
        'architect': 'Lead',
        'staff': 'Lead',
        'director': 'Lead'
    };

    // Check for explicit seniority markers
    for (const [keyword, level] of Object.entries(seniorityMap)) {
        if (textLower.includes(keyword)) {
            return level;
        }
    }

    // Infer from experience years
    if (experienceYears !== null) {
        if (experienceYears === 0) return 'Intern';
        if (experienceYears < 2) return 'Junior';
        if (experienceYears < 5) return 'Mid';
        if (experienceYears < 10) return 'Senior';
        return 'Lead';
    }

    return null;
}

/**
 * Education Extraction
 */
function extractEducation(text) {
    const education = [];
    
    const degreePatterns = [
        { pattern: /bachelor|b\.?a\.?|b\.?s\.?|btech|b\.?tech/i, degree: 'Bachelor' },
        { pattern: /master|m\.?a\.?|m\.?s\.?|mtech|m\.?tech|mba/i, degree: 'Master' },
        { pattern: /phd|ph\.?d\.?|doctorate/i, degree: 'PhD' },
        { pattern: /diploma|certificate/i, degree: 'Diploma' },
        { pattern: /high school|secondary|12th|hsc/i, degree: 'High School' }
    ];

    const fieldPatterns = [
        'Computer Science', 'Information Technology', 'Engineering', 'Business', 'Finance',
        'Marketing', 'Data Science', 'Artificial Intelligence', 'Software Engineering',
        'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Physics', 'Mathematics'
    ];

    const institutionPatterns = /(?:from|at|university|college|institute|school)\s+([A-Za-z\s&.,'-]+?)(?:\n|$|,|in)/i;
    const yearPatterns = /(?:20\d{2}|19\d{2})(?:\s*-\s*(?:20\d{2}|19\d{2}|present))?/g;

    const sections = text.split(/(?:education|academic|qualification)/i);
    
    if (sections.length > 1) {
        const eduText = sections[1].slice(0, 2000);
        
        degreePatterns.forEach(({ pattern, degree }) => {
            if (pattern.test(eduText)) {
                const field = fieldPatterns.find(f => new RegExp(`\\b${f.toLowerCase()}\\b`, 'i').test(eduText)) || null;
                const institutionMatch = eduText.match(institutionPatterns);
                const institution = institutionMatch ? institutionMatch[1].trim() : null;
                const yearMatch = eduText.match(yearPatterns);
                const year = yearMatch ? yearMatch[yearMatch.length - 1] : null;

                if (!education.some(e => e.degree === degree)) {
                    education.push({
                        degree,
                        field,
                        institution,
                        year
                    });
                }
            }
        });
    }

    return education;
}

/**
 * Work Experience Extraction
 */
function extractWorkExperience(text) {
    const workExperience = [];
    
    const experienceSection = text.split(/(?:work\s+experience|professional\s+experience|experience)/i)[1];
    if (!experienceSection) return workExperience;

    const companyPatterns = /(?:company|at|worked at|worked with)\s*:?\s*([A-Za-z0-9\s&.,'-]+?)(?:\n|$|,)/i;
    const rolePatterns = /(?:role|position|as|designation)\s*:?\s*([A-Za-z\s]+?)(?:\n|$|,)/i;
    const datePatterns = /((?:20|19)\d{2})\s*-\s*((?:20|19)\d{2}|present|current)/i;
    
    const entries = experienceSection.split(/\n\n+/).slice(0, 5);
    
    entries.forEach(entry => {
        const companyMatch = entry.match(companyPatterns);
        const roleMatch = entry.match(rolePatterns);
        const dateMatch = entry.match(datePatterns);
        
        if (companyMatch || roleMatch) {
            workExperience.push({
                company: companyMatch ? companyMatch[1].trim() : null,
                role: roleMatch ? roleMatch[1].trim() : null,
                start_year: dateMatch ? dateMatch[1] : null,
                end_year: dateMatch ? (dateMatch[2].match(/present|current/i) ? 'Present' : dateMatch[2]) : null,
                summary: entry.slice(0, 200).trim() || null
            });
        }
    });

    return workExperience;
}

/**
 * Projects Extraction
 */
function extractProjects(text) {
    const projects = [];
    
    const projectSection = text.split(/(?:projects?|portfolio)/i)[1];
    if (!projectSection) return projects;

    const projectEntries = projectSection.split(/\n\n+/).slice(0, 4);
    
    projectEntries.forEach(entry => {
        const nameMatch = entry.match(/^([A-Za-z0-9\s\-:]+?)(?:\n|$|:|—|-)/);
        const techMatch = entry.match(/(?:technologies?|tech|stack|built with)\s*:?\s*([A-Za-z0-9\s,+.#-]+?)(?:\n|$)/i);
        
        if (nameMatch) {
            const name = nameMatch[1].trim();
            const technologies = techMatch ? 
                techMatch[1].split(/[,;]/).map(t => t.trim()).filter(t => t.length > 0) : 
                [];
            
            projects.push({
                name: name || null,
                description: entry.slice(0, 200).trim() || null,
                technologies
            });
        }
    });

    return projects;
}

/**
 * Certifications Extraction
 */
function extractCertifications(text) {
    const certifications = [];
    
    const certPatterns = [
        'AWS', 'Google Cloud', 'Azure', 'Kubernetes', 'Docker', 'Jenkins', 'Terraform',
        'Certified', 'Certification', 'Certificate', 'CISSP', 'CEH', 'CompTIA', 'CCNA',
        'PMP', 'Scrum Master', 'Six Sigma', 'ITIL', 'TOGAF', 'Salesforce', 'SAP',
        'Oracle', 'IBM', 'Microsoft', 'Coursera', 'Udacity', 'edX'
    ];

    const textLower = text.toLowerCase();
    
    certPatterns.forEach(cert => {
        const regex = new RegExp(`\\b${cert.toLowerCase()}\\b`, 'i');
        if (regex.test(textLower) && !certifications.includes(cert)) {
            certifications.push(cert);
        }
    });

    return certifications.slice(0, 10);
}

/**
 * Resume Summary Extraction
 */
function extractResumeSummary(text) {
    const summaryPatterns = [
        /(?:summary|objective|about)\s*:?\s*([^\n]+(?:\n[^\n]{0,100})?)/i,
        /^([A-Za-z0-9][^\n]*[.!?])(?:\n|$)/m
    ];

    for (const pattern of summaryPatterns) {
        const match = text.match(pattern);
        if (match) {
            const summary = match[1].trim();
            if (summary.length > 20 && summary.length < 500) {
                return summary;
            }
        }
    }

    return null;
}
