"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import "./Dashboard.css"

function CandidateDashboard({ user }) {
  const [resumeText, setResumeText] = useState("")
  const [resumeFile, setResumeFile] = useState(null)
  const [uploadStatus, setUploadStatus] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    // Fetch resume if available
    const fetchResume = async () => {
      try {
        const response = await axios.get("http://localhost:5000/get_resume", {
          withCredentials: true,
        })

        if (response.status === 200) {
          setResumeText(response.data.resume_text)
        }
      } catch (error) {
        if (error.response && error.response.status !== 404) {
          console.error("Error fetching resume:", error)
        }
      }
    }

    fetchResume()
  }, [])

  const handleFileChange = (e) => {
    setResumeFile(e.target.files[0])
    setError("")
  }

  const handleUpload = async (e) => {
    e.preventDefault()

    if (!resumeFile) {
      setError("Please select a file to upload")
      return
    }

    if (resumeFile.type !== "application/pdf") {
      setError("Please upload a PDF file")
      return
    }

    setIsUploading(true)
    setUploadStatus("Uploading...")

    const formData = new FormData()
    formData.append("resume", resumeFile)

    try {
      const response = await axios.post("http://localhost:5000/upload_resume", formData, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      setIsUploading(false)

      if (response.status === 200) {
        setUploadStatus("Resume uploaded successfully!")
        // Fetch the updated resume text
        const resumeResponse = await axios.get("http://localhost:5000/get_resume", {
          withCredentials: true,
        })

        if (resumeResponse.status === 200) {
          setResumeText(resumeResponse.data.resume_text)
        }
      }
    } catch (error) {
      setIsUploading(false)
      if (error.response && error.response.data) {
        setError(error.response.data.message)
      } else {
        setError("An error occurred while uploading the resume")
      }
      setUploadStatus("")
    }
  }

  const handleStartInterview = () => {
    if (!resumeText) {
      setError("Please upload your resume before starting the interview")
      return
    }

    navigate("/interview")
  }

  return (
    <div className="dashboard-container">
      <h1>Candidate Dashboard</h1>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h2>Upload Resume</h2>
          {error && <div className="alert alert-danger">{error}</div>}
          {uploadStatus && <div className="alert alert-success">{uploadStatus}</div>}

          <form onSubmit={handleUpload}>
            <div className="form-group">
              <label htmlFor="resume">Upload PDF Resume</label>
              <input type="file" id="resume" className="form-control" onChange={handleFileChange} accept=".pdf" />
            </div>
            <button type="submit" className="btn" disabled={isUploading}>
              {isUploading ? "Uploading..." : "Upload Resume"}
            </button>
          </form>
        </div>

        <div className="dashboard-card">
          <h2>Resume Preview</h2>
          <div className="resume-preview">
            {resumeText ? <pre>{resumeText}</pre> : <p>No resume uploaded yet. Please upload your resume.</p>}
          </div>
        </div>
      </div>

      <div className="dashboard-actions">
        <button className="btn btn-success btn-lg" onClick={handleStartInterview} disabled={!resumeText}>
          Start Interview
        </button>
      </div>
    </div>
  )
}

export default CandidateDashboard

