import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { parseResume } from './services/resumeParser.js';
import { generateExcel } from './services/excelGenerator.js';
import { generateMaskedPDF } from './services/pdfGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigin = process.env.FRONTEND_URL;
    // Allow if no origin (like mobile apps or curl) or if it matches our settings
    if (!origin || (allowedOrigin && (origin === allowedOrigin || origin === allowedOrigin.replace(/\/$/, '')))) {
      callback(null, true);
    } else if (!allowedOrigin || origin === 'http://localhost:5173') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/exports', express.static(path.join(__dirname, 'exports')));

// Health check / Root route
app.get('/', (req, res) => {
  res.json({ status: 'Backend is running', version: '1.0.0' });
});

// Ensure directories exist
const ensureDirectories = async () => {
  const dirs = ['uploads', 'exports'];
  for (const dir of dirs) {
    const dirPath = path.join(__dirname, dir);
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and Word documents are allowed'));
    }
  }
});

// Routes

// Upload and parse resumes
app.post('/api/upload-resumes', upload.array('resumes', 50), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const parsedResumes = [];

    for (const file of req.files) {
      try {
        const resumeData = await parseResume(file.path);
        parsedResumes.push({
          id: Date.now() + Math.random(),
          fileName: file.originalname,
          ...resumeData,
          currentCTC: '',
          expectedPay: '',
          availabilityToJoin: ''
        });
      } catch (error) {
        console.error(`Error parsing ${file.originalname}:`, error);
        parsedResumes.push({
          id: Date.now() + Math.random(),
          fileName: file.originalname,
          name: 'Parse Error',
          email: '',
          contact: '',
          place: '',
          skills: '',
          experience: '',
          currentCTC: '',
          expectedPay: '',
          availabilityToJoin: '',
          error: error.message
        });
      }
    }

    res.json({ resumes: parsedResumes });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Scan folder for resumes
app.post('/api/scan-folder', async (req, res) => {
  try {
    const { folderPath } = req.body;

    if (!folderPath) {
      return res.status(400).json({ error: 'Folder path is required' });
    }

    // Check if folder exists
    try {
      await fs.access(folderPath);
    } catch {
      return res.status(404).json({ error: 'Folder not found' });
    }

    const files = await fs.readdir(folderPath);
    const resumeFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.pdf', '.doc', '.docx'].includes(ext);
    });

    const parsedResumes = [];

    for (const file of resumeFiles) {
      try {
        const filePath = path.join(folderPath, file);
        const resumeData = await parseResume(filePath);
        parsedResumes.push({
          id: Date.now() + Math.random(),
          fileName: file,
          ...resumeData,
          currentCTC: '',
          expectedPay: '',
          availabilityToJoin: ''
        });
      } catch (error) {
        console.error(`Error parsing ${file}:`, error);
        parsedResumes.push({
          id: Date.now() + Math.random(),
          fileName: file,
          name: 'Parse Error',
          email: '',
          contact: '',
          place: '',
          skills: '',
          experience: '',
          currentCTC: '',
          expectedPay: '',
          availabilityToJoin: '',
          error: error.message
        });
      }
    }

    res.json({ resumes: parsedResumes });
  } catch (error) {
    console.error('Scan folder error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export to Excel
app.post('/api/export-excel', async (req, res) => {
  try {
    const { resumes } = req.body;

    if (!resumes || resumes.length === 0) {
      return res.status(400).json({ error: 'No resume data provided' });
    }

    const filePath = await generateExcel(resumes);
    const fileName = path.basename(filePath);

    res.json({
      success: true,
      downloadUrl: `/exports/${fileName}`,
      fileName
    });
  } catch (error) {
    console.error('Excel export error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate masked PDF
app.post('/api/generate-pdf', async (req, res) => {
  try {
    const { resumeData, companyContact } = req.body;

    if (!resumeData) {
      return res.status(400).json({ error: 'Resume data is required' });
    }

    if (!companyContact || !companyContact.email || !companyContact.phone) {
      return res.status(400).json({ error: 'Company contact details are required' });
    }

    const filePath = await generateMaskedPDF(resumeData, companyContact);
    const fileName = path.basename(filePath);

    res.json({
      success: true,
      downloadUrl: `/exports/${fileName}`,
      fileName
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
const startServer = async () => {
  await ensureDirectories();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
};

startServer();
