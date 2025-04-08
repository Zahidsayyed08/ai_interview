"use client"

import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import WebcamFeed from "./WebcamFeed"
import QuestionPanel from "./QuestionPanel"
import "./Interview.css"

function InterviewPage({ user }) {
  const [isInterviewActive, setIsInterviewActive] = useState(false)
  const [resumeText, setResumeText] = useState("")
  const [chatHistory, setChatHistory] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState("")
  const [answer, setAnswer] = useState("")
  const [evaluation, setEvaluation] = useState("")
  const [isInterviewEnded, setIsInterviewEnded] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const webcamRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Fetch resume
    const fetchResume = async () => {
      try {
        const response = await axios.get("http://localhost:5000/get_resume", {
          withCredentials: true,
        })

        if (response.status === 200) {
          setResumeText(response.data.resume_text)
        }
      } catch (error) {
        console.error("Error fetching resume:", error)
        setError("Failed to fetch resume. Please go back to dashboard and upload your resume.")
      }
    }

    fetchResume()
  }, [])

  // Update the startInterview function to ensure webcam and AI interview start simultaneously
  const startInterview = async () => {
    if (!resumeText) {
      setError("Please upload your resume before starting the interview")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // Start the interview with the LLM
      const response = await axios.post("http://localhost:5001/start_interview", {
        resume: resumeText,
        job_description:
          "Software Developer position requiring strong programming skills, problem-solving abilities, and teamwork.",
      })

      if (response.status === 200) {
        setCurrentQuestion(response.data.question)
        setChatHistory(response.data.chat_history)
        setIsInterviewActive(true)
      }
    } catch (error) {
      console.error("Error starting interview:", error)
      setError("Failed to start the interview. Please try again.")
      setIsInterviewActive(false)
    } finally {
      setIsLoading(false)
    }
  }

  const submitAnswer = async () => {
    if (!answer.trim()) {
      setError("Please provide an answer before submitting")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await axios.post("http://localhost:5001/answer_question", {
        text: answer,
      })

      if (response.status === 200) {
        if (response.data.interview_ended) {
          setIsInterviewEnded(true)
          setChatHistory(response.data.chat_history)

          // Get the evaluation
          const evalResponse = await axios.post("http://localhost:5001/end_interview")
          if (evalResponse.status === 200) {
            setEvaluation(evalResponse.data.evaluation)
          }
        } else {
          setCurrentQuestion(response.data.question)
          setChatHistory(response.data.chat_history)
          setAnswer("")
        }
      }
    } catch (error) {
      console.error("Error submitting answer:", error)
      setError("Failed to submit your answer. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Update the stopInterview function to properly stop both webcam and interview
  const stopInterview = async () => {
    try {
      setIsLoading(true)

      // Stop the webcam recording and generate video
      const response = await axios.get("http://localhost:5000/stop")

      if (response.status === 200) {
        console.log("Video created:", response.data.video_path)
      }

      // End the interview if not already ended
      if (!isInterviewEnded) {
        const evalResponse = await axios.post("http://localhost:5001/end_interview")
        if (evalResponse.status === 200) {
          setEvaluation(evalResponse.data.evaluation)
          setIsInterviewEnded(true)
        }
      }

      setIsInterviewActive(false)
    } catch (error) {
      console.error("Error stopping interview:", error)
      setError("Failed to stop the interview properly.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnswerChange = (e) => {
    setAnswer(e.target.value)
  }

  const returnToDashboard = () => {
    navigate("/dashboard")
  }

  const downloadInterviewVideo = async () => {
    try {
      // Set window location to the download endpoint
      window.location.href = "http://localhost:5000/download/"
    } catch (error) {
      console.error("Error downloading video:", error)
      setError("Failed to download the interview video.")
    }
  }

  return (
    <div className="interview-container">
      <h1>AI Interview Session</h1>

      {error && <div className="alert alert-danger">{error}</div>}

      {!isInterviewActive && !isInterviewEnded && (
        <div className="interview-start-card">
          <h2>Ready to Start Your Interview?</h2>
          <p>
            This interview will analyze your responses and facial expressions to provide feedback. Make sure you're in a
            quiet environment with good lighting.
          </p>
          <button className="btn btn-success btn-lg" onClick={startInterview} disabled={isLoading}>
            {isLoading ? "Starting..." : "Start Interview"}
          </button>
        </div>
      )}

      {isInterviewActive && !isInterviewEnded && (
        <div className="interview-session">
          <div className="interview-grid">
            <WebcamFeed webcamRef={webcamRef} isActive={isInterviewActive} />

            <QuestionPanel
              currentQuestion={currentQuestion}
              answer={answer}
              handleAnswerChange={handleAnswerChange}
              submitAnswer={submitAnswer}
              isLoading={isLoading}
            />
          </div>

          <div className="interview-controls">
            <button className="btn btn-danger" onClick={stopInterview} disabled={isLoading}>
              {isLoading ? "Stopping..." : "Stop Interview"}
            </button>
          </div>
        </div>
      )}

      {isInterviewEnded && (
        <div className="interview-results">
          <h2>Interview Completed</h2>

          <div className="evaluation-card">
            <h3>Your Interview Evaluation</h3>
            <div className="evaluation-content">
              <pre>{evaluation}</pre>
            </div>
          </div>

          <div className="chat-history-card">
            <h3>Interview Transcript</h3>
            <div className="chat-history">
              {chatHistory.map((item, index) => (
                <div key={index} className={`chat-message ${item.role === "AI" ? "ai" : "candidate"}`}>
                  <strong>{item.role}:</strong> {item.content}
                </div>
              ))}
            </div>
          </div>

          <div className="interview-actions">
            <button className="btn" onClick={returnToDashboard}>
              Return to Dashboard
            </button>
            <button className="btn btn-success" onClick={downloadInterviewVideo}>
              Download Interview Video
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default InterviewPage
