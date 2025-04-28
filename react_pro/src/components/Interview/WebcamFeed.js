"use client"

import { useState, useEffect, useRef } from "react"
import Webcam from "react-webcam"
import axios from "axios"
import "./Interview.css"

function WebcamFeed({ webcamRef, isActive }) {
  const [emotionData, setEmotionData] = useState({
    emotion: "Analyzing...",
    confidence: 0,
    engagement: 0,
    stress: 0,
  })
  const intervalRef = useRef(null)

  useEffect(() => {
    // Start or stop sending frames based on isActive prop
    if (isActive && webcamRef.current) {
      // Start capturing frames
      intervalRef.current = setInterval(() => {
        captureAndSendFrame()
      }, 1000) // Send a frame every second
    } else {
      // Stop capturing frames
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    // Clean up interval when component unmounts
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isActive, webcamRef])

  const captureAndSendFrame = async () => {
    if (webcamRef.current && webcamRef.current.getScreenshot) {
      const screenshot = webcamRef.current.getScreenshot()

      if (screenshot) {
        // Convert base64 to blob
        const byteString = atob(screenshot.split(",")[1])
        const mimeString = screenshot.split(",")[0].split(":")[1].split(";")[0]
        const ab = new ArrayBuffer(byteString.length)
        const ia = new Uint8Array(ab)

        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i)
        }

        const blob = new Blob([ab], { type: mimeString })
        const file = new File([blob], "frame.jpg", { type: "image/jpeg" })

        // Send frame to backend
        const formData = new FormData()
        formData.append("frame", file)

        try {
          const response = await axios.post("http://localhost:5000/upload_frame", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          })

          // Update emotion data if available
          if (response.data && response.data.message === "Frame received") {
            // Extract emotion data from the response
            // This is a placeholder - adjust based on your actual API response
            const dominantEmotion = response.data.emotion || "Neutral"
            const confidence = response.data.confidence || 0
            const engagement = response.data.engagement || 0
            const stress = response.data.stress || 0

            setEmotionData({
              emotion: dominantEmotion,
              confidence: confidence,
              engagement: engagement,
              stress: stress,
            })
          }
        } catch (error) {
          console.error("Error sending frame:", error)
        }
      }
    }
  }

  return (
    <div className="webcam-container">
      <h3>Webcam Feed</h3>
      <div className="webcam-wrapper">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          width={640}
          height={480}
          videoConstraints={{
            width: 640,
            height: 480,
            facingMode: "user",
          }}
        />
      </div>
      {/* <div className="emotion-analysis">
        <h4>Emotion Analysis</h4>
        <div className="emotion-metrics">
          <div className="emotion-metric">
            <span>Dominant Emotion:</span>
            <span className="emotion-value">{emotionData.emotion}</span>
          </div>
          <div className="emotion-metric">
            <span>Confidence:</span>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${emotionData.confidence}%` }}></div>
            </div>
            <span>{emotionData.confidence}%</span>
          </div>
          <div className="emotion-metric">
            <span>Engagement:</span>
            <div className="progress-bar">
              <div className="progress-fill engagement" style={{ width: `${emotionData.engagement}%` }}></div>
            </div>
            <span>{emotionData.engagement}%</span>
          </div>
          <div className="emotion-metric">
            <span>Stress Level:</span>
            <div className="progress-bar">
              <div className="progress-fill stress" style={{ width: `${emotionData.stress}%` }}></div>
            </div>
            <span>{emotionData.stress}%</span>
          </div>
        </div>
        <p className="emotion-note">Stay focused and engaged during the interview</p>
      </div> */}
    </div>
  )
}

export default WebcamFeed

