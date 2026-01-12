# 📋 Resume Shortlister

A powerful Windows desktop application that intelligently parses resumes, extracts key information, and generates masked resumes for recruitment purposes.

## ✨ Features

- **📤 Multiple Upload Options**
  - Drag & drop resume files (PDF, DOC, DOCX)
  - Browse and select multiple files
  - Scan entire folders for resumes

- **🤖 Intelligent Resume Parsing**
  - Automatically extracts: Name, Email, Contact, Location, Skills, Experience
  - Supports PDF and Word documents
  - Advanced regex-based data extraction

- **📊 Excel Export**
  - Export all parsed resumes to a single Excel file
  - Organized columns for easy review
  - Editable fields for CTC, Expected Pay, and Availability

- **📄 Masked Resume Generation**
  - Generate professional PDF resumes
  - Replace candidate contact with company contact details
  - Perfect for client submissions

- **🎨 Modern UI**
  - Beautiful gradient design
  - Smooth animations and transitions
  - Responsive layout
  - Intuitive user experience

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Install Frontend Dependencies**
   ```bash
   npm install
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   cd ..
   ```

### Running the Application

You need to run both the frontend and backend servers:

1. **Start the Backend Server** (in one terminal)
   ```bash
   cd backend
   npm start
   ```
   The backend will run on `http://localhost:5000`

2. **Start the Frontend** (in another terminal)
   ```bash
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`

3. **Open your browser** and navigate to `http://localhost:5173`

## 📖 How to Use

### Step 1: Upload Resumes
- **Option A**: Drag and drop resume files onto the upload area
- **Option B**: Click the upload area to browse and select files
- **Option C**: Switch to "Scan Folder" tab and enter the full path to your resumes folder
  - Example: `C:\Users\YourName\Desktop\Resumes`

### Step 2: Review Parsed Data
- The application will automatically extract information from each resume
- Review the parsed data in the table
- All fields are editable if corrections are needed

### Step 3: Enter Company Contact Details
- Fill in your company email and phone number
- These will replace the candidate's contact details in masked resumes

### Step 4: Fill in Additional Information
For each candidate, enter:
- **Current CTC**: e.g., "5 LPA" or "₹500,000"
- **Expected Pay**: e.g., "7 LPA" or "₹700,000"
- **Availability to Join**: e.g., "30 days" or "Immediate"

### Step 5: Export or Generate PDFs
- **Export to Excel**: Click "Export to Excel" to download all data in a spreadsheet
- **Generate Masked PDF**: Click the PDF icon (📄) for any candidate to generate their masked resume

## 📁 Project Structure

```
Resume_shortlister/
├── backend/
│   ├── services/
│   │   ├── resumeParser.js      # Resume parsing logic
│   │   ├── excelGenerator.js    # Excel export functionality
│   │   └── pdfGenerator.js      # Masked PDF generation
│   ├── uploads/                 # Temporary file storage
│   ├── exports/                 # Generated files
│   ├── package.json
│   └── server.js                # Express server
├── src/
│   ├── App.tsx                  # Main React component
│   ├── App.css
│   ├── index.css                # Design system & styles
│   └── main.tsx
├── package.json
└── README.md
```

## 🛠️ Technologies Used

### Frontend
- **React** with TypeScript
- **Vite** for fast development
- Modern CSS with custom design system

### Backend
- **Node.js** with Express
- **pdf-parse** for PDF parsing
- **mammoth** for Word document parsing
- **xlsx** for Excel generation
- **pdfkit** for PDF generation
- **multer** for file uploads

## 🎨 Design Features

- **Gradient backgrounds** with smooth color transitions
- **Glassmorphism effects** for modern aesthetics
- **Micro-animations** for enhanced user experience
- **Responsive design** that works on all screen sizes
- **Custom scrollbars** for consistent look
- **Hover effects** and interactive elements

## 📝 Notes

- The application stores uploaded files temporarily in `backend/uploads/`
- Generated Excel and PDF files are saved in `backend/exports/`
- All parsing is done locally - no data is sent to external servers
- The resume parser uses regex patterns optimized for common resume formats

## 🔒 Privacy & Security

- All data processing happens locally on your machine
- No external API calls for resume parsing
- Uploaded files are only stored temporarily
- Company contact details are only used for PDF generation

## 🐛 Troubleshooting

### Backend won't start
- Make sure port 5000 is not in use
- Check that all dependencies are installed: `cd backend && npm install`

### Frontend won't connect to backend
- Verify the backend is running on `http://localhost:5000`
- Check browser console for CORS errors

### Resume parsing not working
- Ensure resume files are in PDF, DOC, or DOCX format
- Check that files are not password-protected
- Some heavily formatted resumes may require manual data entry

### Folder scanning not working
- Use the full absolute path (e.g., `C:\Users\YourName\Desktop\Resumes`)
- Ensure the folder exists and contains resume files
- Check folder permissions

## 🚀 Future Enhancements

- [ ] AI-powered resume parsing using NLP
- [ ] Bulk PDF generation
- [ ] Resume ranking and scoring
- [ ] Email integration for sending masked resumes
- [ ] Database storage for resume history
- [ ] Advanced search and filtering
- [ ] Custom PDF templates
- [ ] Multi-language support

## 📄 License

This project is created for internal use. All rights reserved.

## 👨‍💻 Support

For issues or questions, please contact your development team.

---

**Made with ❤️ for efficient recruitment**
