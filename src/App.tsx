import { useState } from 'react';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

function App() {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'folder'
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [folderPath, setFolderPath] = useState('');
  const [companyContact, setCompanyContact] = useState({
    email: '',
    phone: ''
  });

  // Show alert message
  const showAlert = (message, type = 'info') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 5000);
  };

  // Handle file upload
  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;

    setLoading(true);
    const formData = new FormData();

    Array.from(files).forEach(file => {
      formData.append('resumes', file);
    });

    try {
      const response = await fetch(`${API_URL}/upload-resumes`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setResumes(data.resumes);
        showAlert(`Successfully parsed ${data.resumes.length} resumes!`, 'success');
      } else {
        showAlert(data.error || 'Failed to upload resumes', 'error');
      }
    } catch (error) {
      showAlert('Error uploading resumes: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle folder scan
  const handleFolderScan = async () => {
    if (!folderPath.trim()) {
      showAlert('Please enter a folder path', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/scan-folder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderPath })
      });

      const data = await response.json();

      if (response.ok) {
        setResumes(data.resumes);
        showAlert(`Successfully scanned ${data.resumes.length} resumes!`, 'success');
      } else {
        showAlert(data.error || 'Failed to scan folder', 'error');
      }
    } catch (error) {
      showAlert('Error scanning folder: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('dragging');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('dragging');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('dragging');
    const files = e.dataTransfer.files;
    handleFileUpload(files);
  };

  // Update resume data
  const updateResumeField = (id, field, value) => {
    setResumes(resumes.map(resume =>
      resume.id === id ? { ...resume, [field]: value } : resume
    ));
  };

  // Export to Excel
  const handleExportExcel = async () => {
    if (resumes.length === 0) {
      showAlert('No resumes to export', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/export-excel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumes })
      });

      const data = await response.json();

      if (response.ok) {
        // Download the file
        window.open(`${BACKEND_URL}${data.downloadUrl}`, '_blank');
        showAlert('Excel file generated successfully!', 'success');
      } else {
        showAlert(data.error || 'Failed to export Excel', 'error');
      }
    } catch (error) {
      showAlert('Error exporting Excel: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Generate PDF for a resume
  const handleGeneratePDF = async (resume) => {
    if (!companyContact.email || !companyContact.phone) {
      showAlert('Please enter company contact details first', 'error');
      return;
    }

    if (!resume.currentCTC || !resume.expectedPay || !resume.availabilityToJoin) {
      showAlert('Please fill in all required fields (CTC, Expected Pay, Availability)', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/generate-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeData: resume,
          companyContact
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Download the file
        window.open(`${BACKEND_URL}${data.downloadUrl}`, '_blank');
        showAlert('Masked PDF generated successfully!', 'success');
      } else {
        showAlert(data.error || 'Failed to generate PDF', 'error');
      }
    } catch (error) {
      showAlert('Error generating PDF: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <h1>📋 Resume Shortlister</h1>
        <p>Intelligent Resume Parsing & Masked Resume Generator</p>
      </header>

      {/* Alert */}
      {alert && (
        <div className={`alert alert-${alert.type}`}>
          <span>{alert.message}</span>
        </div>
      )}

      {/* Main Card */}
      <div className="main-card">
        {/* Upload Section */}
        <div className="upload-section">
          <div className="upload-tabs">
            <button
              className={`tab-button ${activeTab === 'upload' ? 'active' : ''}`}
              onClick={() => setActiveTab('upload')}
            >
              📤 Upload Files
            </button>
            <button
              className={`tab-button ${activeTab === 'folder' ? 'active' : ''}`}
              onClick={() => setActiveTab('folder')}
            >
              📁 Scan Folder
            </button>
          </div>

          {activeTab === 'upload' ? (
            <div
              className="upload-area"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input').click()}
            >
              <div className="upload-icon">📄</div>
              <h3>Drop resumes here or click to browse</h3>
              <p>Supports PDF, DOC, and DOCX files</p>
              <input
                id="file-input"
                type="file"
                multiple
                accept=".pdf,.doc,.docx"
                onChange={(e) => handleFileUpload(e.target.files)}
                style={{ display: 'none' }}
              />
            </div>
          ) : (
            <div className="upload-area">
              <div className="upload-icon">📁</div>
              <h3>Scan Folder for Resumes</h3>
              <p>Enter the full path to the folder containing resumes</p>
              <div className="folder-input-group">
                <input
                  type="text"
                  className="folder-input"
                  placeholder="e.g., C:\Users\YourName\Desktop\Resumes"
                  value={folderPath}
                  onChange={(e) => setFolderPath(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleFolderScan()}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleFolderScan}
                  disabled={loading}
                >
                  {loading ? <span className="loading-spinner"></span> : '🔍'} Scan Folder
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Company Contact Section */}
        {resumes.length > 0 && (
          <div className="actions-bar">
            <div className="company-contact-form">
              <label>Company Email:</label>
              <input
                type="email"
                placeholder="company@example.com"
                value={companyContact.email}
                onChange={(e) => setCompanyContact({ ...companyContact, email: e.target.value })}
              />
              <label>Company Phone:</label>
              <input
                type="tel"
                placeholder="+91 1234567890"
                value={companyContact.phone}
                onChange={(e) => setCompanyContact({ ...companyContact, phone: e.target.value })}
              />
            </div>
            <button
              className="btn btn-success"
              onClick={handleExportExcel}
              disabled={loading}
            >
              {loading ? <span className="loading-spinner"></span> : '📊'} Export to Excel
            </button>
          </div>
        )}

        {/* Resumes Table */}
        {resumes.length > 0 ? (
          <div className="table-container">
            <table className="resume-table">
              <thead>
                <tr>
                  <th>Applicant Name</th>
                  <th>Email</th>
                  <th>Contact</th>
                  <th>Place</th>
                  <th>Skills</th>
                  <th>Experience</th>
                  <th>Current CTC</th>
                  <th>Expected Pay</th>
                  <th>Availability</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {resumes.map((resume) => (
                  <tr key={resume.id}>
                    <td>{resume.name}</td>
                    <td>{resume.email}</td>
                    <td>{resume.contact}</td>
                    <td>{resume.place}</td>
                    <td title={resume.skills}>
                      {resume.skills.length > 30
                        ? resume.skills.substring(0, 30) + '...'
                        : resume.skills}
                    </td>
                    <td>{resume.experience}</td>
                    <td>
                      <input
                        type="text"
                        placeholder="e.g., 5 LPA"
                        value={resume.currentCTC}
                        onChange={(e) => updateResumeField(resume.id, 'currentCTC', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        placeholder="e.g., 7 LPA"
                        value={resume.expectedPay}
                        onChange={(e) => updateResumeField(resume.id, 'expectedPay', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        placeholder="e.g., 30 days"
                        value={resume.availabilityToJoin}
                        onChange={(e) => updateResumeField(resume.id, 'availabilityToJoin', e.target.value)}
                      />
                    </td>
                    <td>
                      <div className="action-cell">
                        <button
                          className="btn-icon btn-pdf"
                          onClick={() => handleGeneratePDF(resume)}
                          title="Generate Masked PDF"
                          disabled={loading}
                        >
                          📄
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <h3>No Resumes Yet</h3>
            <p>Upload files or scan a folder to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
