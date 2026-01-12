# 🚀 Quick Start Guide

## Step-by-Step Instructions

### 1. Start the Application

**Option A: Use the Batch Script (Easiest)**
- Double-click `start.bat` in the project folder
- This will open two terminal windows (backend and frontend)

**Option B: Manual Start**

Terminal 1 - Backend:
```bash
cd backend
npm start
```

Terminal 2 - Frontend:
```bash
npm run dev
```

### 2. Access the Application

Open your browser and go to: **http://localhost:5173**

### 3. Prepare Your Resumes

Create a folder on your Desktop called "Resumes" and place your resume files there:
- Supported formats: PDF, DOC, DOCX
- Example path: `C:\Users\pc\Desktop\Resumes`

### 4. Using the Application

#### Method 1: Upload Files
1. Click the "📤 Upload Files" tab
2. Drag and drop resume files OR click to browse
3. Wait for parsing to complete

#### Method 2: Scan Folder
1. Click the "📁 Scan Folder" tab
2. Enter the full path to your resumes folder
   - Example: `C:\Users\pc\Desktop\Resumes`
3. Click "🔍 Scan Folder"

### 5. Enter Company Details

In the "Company Email" and "Company Phone" fields, enter:
- Your company email (e.g., `hr@yourcompany.com`)
- Your company phone (e.g., `+91 1234567890`)

These will replace candidate details in masked resumes.

### 6. Fill in Candidate Information

For each candidate in the table, fill in:
- **Current CTC**: e.g., "5 LPA" or "₹500,000"
- **Expected Pay**: e.g., "7 LPA" or "₹700,000"  
- **Availability to Join**: e.g., "30 days" or "Immediate"

### 7. Export or Generate PDFs

- **Export All to Excel**: Click "📊 Export to Excel" button
  - Downloads a spreadsheet with all candidate data
  - File saved in: `backend/exports/`

- **Generate Masked PDF**: Click the 📄 icon for any candidate
  - Creates a professional resume with your company contact
  - File saved in: `backend/exports/`

## 📝 Example Folder Structure

```
C:\Users\pc\Desktop\
├── Resume_shortlister\          (This project)
│   ├── backend\
│   ├── src\
│   ├── start.bat               (Double-click to start)
│   └── README.md
│
└── Resumes\                     (Your resumes folder)
    ├── John_Doe_Resume.pdf
    ├── Jane_Smith_Resume.docx
    └── ...
```

## ⚡ Quick Tips

1. **First Time Setup**: Make sure you've run `npm install` in both root and backend folders
2. **Port Issues**: If port 5000 or 5173 is in use, close other applications
3. **Parsing Issues**: Some heavily formatted resumes may need manual data entry
4. **File Paths**: Always use full absolute paths (e.g., `C:\Users\pc\Desktop\Resumes`)

## 🎯 Workflow Summary

```
Upload/Scan Resumes 
    ↓
Review Parsed Data
    ↓
Enter Company Contact
    ↓
Fill CTC/Expected Pay/Availability
    ↓
Export to Excel OR Generate Masked PDFs
```

## 🆘 Troubleshooting

**Backend won't start?**
- Check if port 5000 is available
- Run `cd backend && npm install` again

**Frontend won't load?**
- Check if port 5173 is available
- Run `npm install` in root folder again

**Can't scan folder?**
- Use full path: `C:\Users\pc\Desktop\Resumes`
- Make sure folder exists and has resume files
- Check folder permissions

**Parsing not working?**
- Ensure files are PDF, DOC, or DOCX
- Check files aren't password-protected
- Try uploading files individually first

## 📞 Need Help?

Check the main README.md for detailed documentation and troubleshooting.

---

**Happy Recruiting! 🎉**
