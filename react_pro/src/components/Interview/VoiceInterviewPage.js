// "use client"

// import { useState, useEffect, useRef } from "react"
// import { useNavigate } from "react-router-dom"
// import axios from "axios"
// import Webcam from "react-webcam"
// import "./VoiceInterview.css"

// function VoiceInterviewPage({ user }) {
//   // Interview state
//   const [isInterviewActive, setIsInterviewActive] = useState(false)
//   const [resumeText, setResumeText] = useState("")
//   const [chatHistory, setChatHistory] = useState([])
//   const [currentQuestion, setCurrentQuestion] = useState("")
//   const [isInterviewEnded, setIsInterviewEnded] = useState(false)
//   const [evaluation, setEvaluation] = useState("")

//   // Voice interaction state
//   const [isSpeaking, setIsSpeaking] = useState(false)
//   const [isListening, setIsListening] = useState(false)
//   const [transcript, setTranscript] = useState("")
//   const [isReadyToSpeak, setIsReadyToSpeak] = useState(false)
//   const [manualInputMode, setManualInputMode] = useState(false)
//   const [manualTranscript, setManualTranscript] = useState("")
//   const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState(true)

//   // UI state
//   const [isLoading, setIsLoading] = useState(false)
//   const [error, setError] = useState("")
//   const [downloadUrl, setDownloadUrl] = useState("")
//   const [videoUrl, setVideoUrl] = useState("")

//   // Emotion analysis state
//   const [emotionData, setEmotionData] = useState({
//     emotion: "Analyzing...",
//     confidence: 0,
//     engagement: 0,
//     stress: 0,
//   })

//   // Refs
//   const webcamRef = useRef(null)
//   const recognitionRef = useRef(null)
//   const frameIntervalRef = useRef(null)
//   const navigate = useNavigate()

//   // Speech synthesis setup
//   const synth = window.speechSynthesis

//   // Initialize on component mount
//   useEffect(() => {
//     // Fetch resume
//     const fetchResume = async () => {
//       try {
//         const response = await axios.get("http://localhost:5000/get_resume", {
//           withCredentials: true,
//         })

//         if (response.status === 200) {
//           setResumeText(response.data.resume_text)
//         }
//       } catch (error) {
//         console.error("Error fetching resume:", error)
//         setError("Failed to fetch resume. Please go back to dashboard and upload your resume.")
//       }
//     }

//     fetchResume()

//     // Check if speech recognition is supported
//     const isSpeechRecognitionSupported = "SpeechRecognition" in window || "webkitSpeechRecognition" in window

//     setSpeechRecognitionSupported(isSpeechRecognitionSupported)

//     // Initialize speech recognition if supported
//     if (isSpeechRecognitionSupported) {
//       try {
//         const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
//         recognitionRef.current = new SpeechRecognition()
//         recognitionRef.current.continuous = true
//         recognitionRef.current.interimResults = true
//         recognitionRef.current.lang = "en-US" // Set language explicitly

//         recognitionRef.current.onresult = (event) => {
//           const transcript = Array.from(event.results)
//             .map((result) => result[0])
//             .map((result) => result.transcript)
//             .join("")

//           setTranscript(transcript)
//         }

//         recognitionRef.current.onend = () => {
//           // If we're still in listening mode but recognition stopped, restart it
//           if (isListening) {
//             try {
//               recognitionRef.current.start()
//             } catch (error) {
//               console.error("Failed to restart speech recognition:", error)
//             }
//           }
//         }

//         recognitionRef.current.onerror = (event) => {
//           console.error("Speech recognition error", event.error, event)

//           // Don't show error for no-speech as it's common
//           if (event.error !== "no-speech") {
//             // For network errors, provide more specific guidance
//             if (event.error === "network") {
//               setError(`Speech recognition network error. Switching to manual input mode.`)
//               setManualInputMode(true)
//               setIsListening(false)
//             } else {
//               setError(`Microphone error: ${event.error}. Please check your microphone permissions.`)
//             }

//             // Don't stop listening for aborted or audio-capture errors, as these can be temporary
//             if (event.error !== "aborted" && event.error !== "audio-capture") {
//               setIsListening(false)
//             }
//           }
//         }
//       } catch (error) {
//         console.error("Error initializing speech recognition:", error)
//         setSpeechRecognitionSupported(false)
//       }
//     } else {
//       setError("Your browser doesn't support speech recognition. You can use manual text input instead.")
//     }

//     // Clean up on unmount
//     return () => {
//       if (recognitionRef.current) {
//         try {
//           recognitionRef.current.stop()
//         } catch (error) {
//           console.error("Error stopping speech recognition:", error)
//         }
//       }
//       if (synth.speaking) {
//         synth.cancel()
//       }
//       if (frameIntervalRef.current) {
//         clearInterval(frameIntervalRef.current)
//       }
//     }
//   }, [])

//   // Handle webcam frame capture when interview is active
//   useEffect(() => {
//     if (isInterviewActive && webcamRef.current) {
//       // Start capturing frames
//       frameIntervalRef.current = setInterval(() => {
//         captureAndSendFrame()
//       }, 1000) // Send a frame every second
//     } else {
//       // Stop capturing frames
//       if (frameIntervalRef.current) {
//         clearInterval(frameIntervalRef.current)
//         frameIntervalRef.current = null
//       }
//     }

//     // Clean up interval when component unmounts
//     return () => {
//       if (frameIntervalRef.current) {
//         clearInterval(frameIntervalRef.current)
//       }
//     }
//   }, [isInterviewActive])

//   // Capture and send webcam frame to backend
//   const captureAndSendFrame = async () => {
//     if (webcamRef.current && webcamRef.current.getScreenshot) {
//       const screenshot = webcamRef.current.getScreenshot()

//       if (screenshot) {
//         // Convert base64 to blob
//         const byteString = atob(screenshot.split(",")[1])
//         const mimeString = screenshot.split(",")[0].split(":")[1].split(";")[0]
//         const ab = new ArrayBuffer(byteString.length)
//         const ia = new Uint8Array(ab)

//         for (let i = 0; i < byteString.length; i++) {
//           ia[i] = byteString.charCodeAt(i)
//         }

//         const blob = new Blob([ab], { type: mimeString })
//         const file = new File([blob], "frame.jpg", { type: "image/jpeg" })

//         // Send frame to backend
//         const formData = new FormData()
//         formData.append("frame", file)

//         try {
//           const response = await axios.post("http://localhost:5000/upload_frame", formData, {
//             headers: {
//               "Content-Type": "multipart/form-data",
//             },
//           })

//           // Update emotion data if available
//           if (response.data && response.data.message === "Frame received") {
//             // Extract emotion data from the response
//             const dominantEmotion = response.data.emotion || "Neutral"
//             const confidence = response.data.confidence || 0
//             const engagement = response.data.engagement || 0
//             const stress = response.data.stress || 0

//             setEmotionData({
//               emotion: dominantEmotion,
//               confidence: confidence,
//               engagement: engagement,
//               stress: stress,
//             })
//           }
//         } catch (error) {
//           console.error("Error sending frame:", error)
//         }
//       }
//     }
//   }

//   // Start the interview
//   const startInterview = async () => {
//     if (!resumeText) {
//       setError("Please upload your resume before starting the interview")
//       return
//     }

//     setIsLoading(true)
//     setError("")

//     try {
//       // Start the interview with the LLM
//       const response = await axios.post("http://localhost:5001/start_interview", {
//         resume: resumeText,
//         job_description:
//           "Software Developer position requiring strong programming skills, problem-solving abilities, and teamwork.",
//       })

//       if (response.status === 200) {
//         const question = response.data.question
//         setCurrentQuestion(question)
//         setChatHistory(response.data.chat_history)
//         setIsInterviewActive(true)

//         // Speak the question
//         speakText(question)
//       }
//     } catch (error) {
//       console.error("Error starting interview:", error)
//       setError("Failed to start the interview. Please try again.")
//       setIsInterviewActive(false)
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   // Convert text to speech and speak it
//   const speakText = (text) => {
//     if (synth.speaking) {
//       console.log("Speech synthesis is already in progress")
//       synth.cancel()
//     }

//     setIsSpeaking(true)
//     setIsReadyToSpeak(false)

//     const utterance = new SpeechSynthesisUtterance(text)
//     utterance.rate = 1
//     utterance.pitch = 1

//     // Get available voices and set a good one if available
//     const voices = synth.getVoices()
//     const preferredVoice = voices.find((voice) => voice.name.includes("Google") || voice.name.includes("Microsoft"))

//     if (preferredVoice) {
//       utterance.voice = preferredVoice
//     }

//     utterance.onend = () => {
//       setIsSpeaking(false)
//       setIsReadyToSpeak(true)
//     }

//     synth.speak(utterance)
//   }

//   // Toggle between voice and manual input modes
//   const toggleInputMode = () => {
//     if (isListening) {
//       stopListening()
//     }
//     setManualInputMode(!manualInputMode)
//     setError("")
//   }

//   // Start listening to user's voice
//   const startListening = () => {
//     if (!speechRecognitionSupported) {
//       setManualInputMode(true)
//       return
//     }

//     setTranscript("")
//     setIsListening(true)
//     setIsReadyToSpeak(false)
//     setError("") // Clear any previous errors

//     if (recognitionRef.current) {
//       try {
//         recognitionRef.current.abort() // Stop any ongoing recognition
//         setTimeout(() => {
//           try {
//             recognitionRef.current.start()
//             console.log("Speech recognition started successfully")
//           } catch (error) {
//             console.error("Error starting speech recognition:", error)
//             setError("Failed to start speech recognition. Switching to manual input mode.")
//             setManualInputMode(true)
//             setIsListening(false)
//           }
//         }, 100) // Small delay to ensure previous instance is fully aborted
//       } catch (error) {
//         console.error("Error aborting previous speech recognition:", error)
//         // Try to start anyway
//         try {
//           recognitionRef.current.start()
//         } catch (startError) {
//           console.error("Error starting speech recognition:", startError)
//           setError("Failed to start speech recognition. Switching to manual input mode.")
//           setManualInputMode(true)
//           setIsListening(false)
//         }
//       }
//     }
//   }

//   // Stop listening to user's voice
//   const stopListening = () => {
//     setIsListening(false)

//     if (recognitionRef.current) {
//       try {
//         recognitionRef.current.stop()
//       } catch (error) {
//         console.error("Error stopping speech recognition:", error)
//       }
//     }
//   }

//   // Handle manual transcript input
//   const handleManualTranscriptChange = (e) => {
//     setManualTranscript(e.target.value)
//   }

//   // Submit manual transcript
//   const submitManualTranscript = () => {
//     if (!manualTranscript.trim()) {
//       setError("Please enter your answer before submitting")
//       return
//     }

//     setTranscript(manualTranscript)
//     setManualInputMode(false)
//   }

//   // Submit the user's answer
//   const submitAnswer = async () => {
//     const finalTranscript = manualInputMode ? manualTranscript : transcript

//     if (!finalTranscript.trim()) {
//       setError("Please provide an answer before submitting")
//       return
//     }

//     stopListening()
//     setIsLoading(true)
//     setError("")

//     try {
//       const response = await axios.post("http://localhost:5001/answer_question", {
//         text: finalTranscript,
//       })

//       if (response.status === 200) {
//         if (response.data.interview_ended) {
//           setIsInterviewEnded(true)
//           setChatHistory(response.data.chat_history)

//           // Get the evaluation
//           const evalResponse = await axios.post("http://localhost:5001/end_interview")
//           if (evalResponse.status === 200) {
//             setEvaluation(evalResponse.data.evaluation)
//           }

//           // Stop the webcam recording
//           try {
//             const stopResponse = await axios.get("http://localhost:5000/stop")
//             if (stopResponse.status === 200) {
//               console.log("Video created:", stopResponse.data.video_path)
//             }
//           } catch (error) {
//             console.error("Error stopping video recording:", error)
//           }
//         } else {
//           const newQuestion = response.data.question
//           setCurrentQuestion(newQuestion)
//           setChatHistory(response.data.chat_history)
//           setTranscript("")
//           setManualTranscript("")

//           // Speak the next question
//           setTimeout(() => {
//             speakText(newQuestion)
//           }, 1000)
//         }
//       }
//     } catch (error) {
//       console.error("Error submitting answer:", error)
//       setError("Failed to submit your answer. Please try again.")
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   // Stop the interview
//   const stopInterview = async () => {
//     try {
//       setIsLoading(true)

//       // Stop listening and speaking
//       stopListening()
//       if (synth.speaking) {
//         synth.cancel()
//       }

//       // Stop the webcam recording and generate video
//       try {
//         const response = await axios.get("http://localhost:5000/stop")
//         if (response.status === 200) {
//           console.log("Video created:", response.data.video_path)
//         }
//       } catch (error) {
//         console.error("Error stopping video recording:", error)
//       }

//       // End the interview if not already ended
//       if (!isInterviewEnded) {
//         const evalResponse = await axios.post("http://localhost:5001/end_interview")
//         if (evalResponse.status === 200) {
//           setEvaluation(evalResponse.data.evaluation)
//           setIsInterviewEnded(true)
//         }
//       }

//       setIsInterviewActive(false)
//     } catch (error) {
//       console.error("Error stopping interview:", error)
//       setError("Failed to stop the interview properly.")
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   // Download interview data
//   const downloadInterviewData = async () => {
//     try {
//       setIsLoading(true)
//       const response = await axios.get("http://localhost:5000/download_data", {
//         responseType: "blob",
//       })

//       if (response.status === 200) {
//         // Create a URL for the blob
//         const url = window.URL.createObjectURL(new Blob([response.data]))
//         setDownloadUrl(url)

//         // Create a link and click it to trigger download
//         const link = document.createElement("a")
//         link.href = url
//         link.setAttribute("download", "interview_data.zip")
//         document.body.appendChild(link)
//         link.click()

//         // Clean up
//         link.parentNode.removeChild(link)
//       }
//     } catch (error) {
//       console.error("Error downloading interview data:", error)
//       setError("Failed to download interview data.")
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   // Download interview video
//   const downloadInterviewVideo = async () => {
//     try {
//       setIsLoading(true)
//       const response = await axios.get("http://localhost:5000/download", {
//         responseType: "blob",
//       })

//       if (response.status === 200) {
//         // Create a URL for the blob
//         const url = window.URL.createObjectURL(new Blob([response.data]))
//         setVideoUrl(url)

//         // Create a link and click it to trigger download
//         const link = document.createElement("a")
//         link.href = url
//         link.setAttribute("download", "interview_video.mp4")
//         document.body.appendChild(link)
//         link.click()

//         // Clean up
//         link.parentNode.removeChild(link)
//       }
//     } catch (error) {
//       console.error("Error downloading interview video:", error)
//       setError("Failed to download interview video.")
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   // Return to dashboard
//   const returnToDashboard = () => {
//     navigate("/dashboard")
//   }

//   return (
//     <div className="voice-interview-container">
//       <h1>AI Voice Interview</h1>

//       {error && <div className="alert alert-danger">{error}</div>}

//       {!isInterviewActive && !isInterviewEnded && (
//         <div className="interview-start-card">
//           <h2>Ready for Your Voice Interview?</h2>
//           <p>
//             This interview will use your microphone to record your responses and webcam for emotion analysis. The AI
//             will ask you questions through your speakers and listen to your answers.
//           </p>
//           <div className="permission-notice">
//             <div className="permission-icon">🎤</div>
//             <p>Please ensure your browser has permission to use your microphone and webcam.</p>
//           </div>
//           <button className="start-interview-btn" onClick={startInterview} disabled={isLoading}>
//             {isLoading ? (
//               <>
//                 <span className="loading-spinner"></span>
//                 Starting...
//               </>
//             ) : (
//               <>Start Voice Interview</>
//             )}
//           </button>
//         </div>
//       )}

//       {isInterviewActive && !isInterviewEnded && (
//         <div className="active-interview">
//           <div className="interview-grid">
//             <div className="webcam-column">
//               <div className="webcam-container">
//                 <h3>Webcam Feed</h3>
//                 <div className="webcam-wrapper">
//                   <Webcam
//                     audio={false}
//                     ref={webcamRef}
//                     screenshotFormat="image/jpeg"
//                     width={640}
//                     height={480}
//                     videoConstraints={{
//                       width: 640,
//                       height: 480,
//                       facingMode: "user",
//                     }}
//                   />
//                 </div>
//               </div>

//               <div className="emotion-container">
//                 <h3>Emotion Analysis</h3>
//                 <div className="emotion-metrics">
//                   <div className="emotion-metric">
//                     <span className="metric-label">Dominant Emotion:</span>
//                     <span className="emotion-value">{emotionData.emotion}</span>
//                   </div>
//                   <div className="emotion-metric">
//                     <span className="metric-label">Confidence:</span>
//                     <div className="progress-bar">
//                       <div className="progress-fill" style={{ width: `${emotionData.confidence}%` }}></div>
//                     </div>
//                     <span className="metric-value">{emotionData.confidence}%</span>
//                   </div>
//                   <div className="emotion-metric">
//                     <span className="metric-label">Engagement:</span>
//                     <div className="progress-bar">
//                       <div className="progress-fill engagement" style={{ width: `${emotionData.engagement}%` }}></div>
//                     </div>
//                     <span className="metric-value">{emotionData.engagement}%</span>
//                   </div>
//                   <div className="emotion-metric">
//                     <span className="metric-label">Stress Level:</span>
//                     <div className="progress-bar">
//                       <div className="progress-fill stress" style={{ width: `${emotionData.stress}%` }}></div>
//                     </div>
//                     <span className="metric-value">{emotionData.stress}%</span>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <div className="interaction-column">
//               <div className="question-container">
//                 <h3>Current Question</h3>
//                 <div className="question-bubble">
//                   <p>{currentQuestion}</p>
//                   {isSpeaking && (
//                     <div className="speaking-indicator">
//                       <div className="sound-wave">
//                         <span></span>
//                         <span></span>
//                         <span></span>
//                         <span></span>
//                       </div>
//                       <p>AI is speaking...</p>
//                     </div>
//                   )}
//                 </div>
//               </div>

//               <div className="answer-container">
//                 <h3>Your Answer</h3>

//                 <div className="input-mode-toggle">
//                   <button
//                     className={`mode-btn ${!manualInputMode ? "active" : ""}`}
//                     onClick={() => setManualInputMode(false)}
//                     disabled={!speechRecognitionSupported}
//                   >
//                     Voice Input
//                   </button>
//                   <button
//                     className={`mode-btn ${manualInputMode ? "active" : ""}`}
//                     onClick={() => setManualInputMode(true)}
//                   >
//                     Text Input
//                   </button>
//                 </div>

//                 {!manualInputMode && (
//                   <>
//                     {isReadyToSpeak && !isListening && (
//                       <div className="speak-prompt">
//                         <button className="speak-btn" onClick={startListening}>
//                           <div className="mic-icon">🎤</div>
//                           <span>Speak Now</span>
//                         </button>
//                         <p>Click the button and start speaking your answer</p>
//                       </div>
//                     )}

//                     {isListening && (
//                       <div className="recording-status">
//                         <div className="recording-indicator">
//                           <div className="pulse-ring"></div>
//                           <div className="mic-icon">🎤</div>
//                         </div>
//                         <p>Recording your answer... Speak clearly</p>
//                         <button className="stop-recording-btn" onClick={stopListening}>
//                           Stop Recording
//                         </button>
//                       </div>
//                     )}

//                     <div className="transcript-box">
//                       <p>{transcript || "Your answer will appear here as you speak..."}</p>
//                     </div>
//                   </>
//                 )}

//                 {manualInputMode && (
//                   <div className="manual-input-container">
//                     <textarea
//                       className="manual-transcript-input"
//                       value={manualTranscript}
//                       onChange={handleManualTranscriptChange}
//                       placeholder="Type your answer here..."
//                       rows={6}
//                     />
//                     <button
//                       className="submit-manual-btn"
//                       onClick={submitManualTranscript}
//                       disabled={!manualTranscript.trim()}
//                     >
//                       Use This Answer
//                     </button>
//                   </div>
//                 )}

//                 <div className="answer-actions">
//                   {((transcript && !isListening && !manualInputMode) || (manualInputMode && manualTranscript)) && (
//                     <button
//                       className="submit-answer-btn"
//                       onClick={submitAnswer}
//                       disabled={isLoading || (!transcript.trim() && !manualTranscript.trim())}
//                     >
//                       {isLoading ? "Processing..." : "Submit Answer"}
//                     </button>
//                   )}

//                   <button className="end-interview-btn" onClick={stopInterview} disabled={isLoading}>
//                     {isLoading ? "Ending..." : "End Interview"}
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {isInterviewEnded && (
//         <div className="interview-summary">
//           <h2>Interview Summary</h2>

//           <div className="evaluation-section">
//             <h3>Your Performance Evaluation</h3>
//             <div className="evaluation-content">
//               <pre>{evaluation}</pre>
//             </div>
//           </div>

//           <div className="transcript-section">
//             <h3>Interview Transcript</h3>
//             <div className="chat-history">
//               {chatHistory.map((item, index) => (
//                 <div key={index} className={`chat-message ${item.role === "AI" ? "ai" : "candidate"}`}>
//                   <div className="message-header">
//                     <strong>{item.role === "AI" ? "Interviewer" : "You"}</strong>
//                   </div>
//                   <div className="message-content">{item.content}</div>
//                 </div>
//               ))}
//             </div>
//           </div>

//           <div className="summary-actions">
//             <button className="download-btn" onClick={downloadInterviewData} disabled={isLoading}>
//               {isLoading ? "Preparing Download..." : "Download Interview Data"}
//             </button>
//             <button className="download-video-btn" onClick={downloadInterviewVideo} disabled={isLoading}>
//               {isLoading ? "Preparing Video..." : "Download Interview Video"}
//             </button>
//             <button className="dashboard-btn" onClick={returnToDashboard}>
//               Return to Dashboard
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

// export default VoiceInterviewPage



// VoiceInterviewPage.js
"use client"

import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import Webcam from "react-webcam"
import "./VoiceInterview.css"

function VoiceInterviewPage({ user }) {
  // Interview state
  const [isInterviewActive, setIsInterviewActive] = useState(false)
  const [resumeText, setResumeText] = useState("")
  const [chatHistory, setChatHistory] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState("")
  const [isInterviewEnded, setIsInterviewEnded] = useState(false)
  const [evaluation, setEvaluation] = useState("")

  // Voice interaction state
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [isReadyToSpeak, setIsReadyToSpeak] = useState(false)
  const [manualInputMode, setManualInputMode] = useState(false)
  const [manualTranscript, setManualTranscript] = useState("")
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState(true)

  // UI state
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [downloadUrl, setDownloadUrl] = useState("")
  const [videoUrl, setVideoUrl] = useState("")

  // Emotion analysis state
  const [emotionData, setEmotionData] = useState({
    emotion: "Analyzing...",
    confidence: 0,
    engagement: 0,
    stress: 0,
  })

  // Refs
  const webcamRef = useRef(null)
  const recognitionRef = useRef(null)
  const frameIntervalRef = useRef(null)
  const navigate = useNavigate()

  // Speech synthesis setup
  const synth = window.speechSynthesis

  // Initialize on component mount
  useEffect(() => {
    // Check for manual input preference
    if (localStorage.getItem("preferManualInput") === "true") {
      setManualInputMode(true)
    }

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

    // Check if speech recognition is supported
    const isSpeechRecognitionSupported = "SpeechRecognition" in window || "webkitSpeechRecognition" in window
    console.log("SpeechRecognition supported:", isSpeechRecognitionSupported)
    setSpeechRecognitionSupported(isSpeechRecognitionSupported)

    // Initialize speech recognition if supported
    if (isSpeechRecognitionSupported) {
      try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = "en-US"

        recognitionRef.current.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map((result) => result[0])
            .map((result) => result.transcript)
            .join("")
          setTranscript(transcript)
        }

        recognitionRef.current.onend = () => {
          if (isListening) {
            try {
              recognitionRef.current.start()
            } catch (error) {
              console.error("Failed to restart speech recognition:", error)
            }
          }
        }

        recognitionRef.current.onerror = (event) => {
          console.error("Speech recognition error details:", {
            error: event.error,
            message: event.message,
            event,
          })

          if (event.error !== "no-speech") {
            if (event.error === "network") {
              setError(
                "Unable to connect to the speech recognition service. Please check your internet connection or use manual input mode."
              )
              setManualInputMode(true)
              setIsListening(false)
              localStorage.setItem("preferManualInput", "true")
            } else if (event.error === "not-allowed" || event.error === "service-not-allowed") {
              setError("Microphone access denied. Please allow microphone permissions in your browser settings.")
              setIsListening(false)
            } else {
              setError(`Microphone error: ${event.error}. Please check your microphone permissions or try again.`)
              if (event.error !== "aborted" && event.error !== "audio-capture") {
                setIsListening(false)
              }
            }
          }
        }
      } catch (error) {
        console.error("Error initializing speech recognition:", error)
        setSpeechRecognitionSupported(false)
        setError("Speech recognition initialization failed. Using manual input mode.")
        setManualInputMode(true)
        localStorage.setItem("preferManualInput", "true")
      }
    } else {
      setError("Your browser doesn't support speech recognition. You can use manual text input instead.")
      setManualInputMode(true)
      localStorage.setItem("preferManualInput", "true")
    }

    // Clean up on unmount
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (error) {
          console.error("Error stopping speech recognition:", error)
        }
      }
      if (synth.speaking) {
        synth.cancel()
      }
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current)
      }
    }
  }, [])

  // Handle webcam frame capture when interview is active
  useEffect(() => {
    if (isInterviewActive && webcamRef.current) {
      frameIntervalRef.current = setInterval(() => {
        captureAndSendFrame()
      }, 1000)
    } else {
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current)
        frameIntervalRef.current = null
      }
    }

    return () => {
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current)
      }
    }
  }, [isInterviewActive])

  // Capture and send webcam frame to backend
  const captureAndSendFrame = async () => {
    if (webcamRef.current && webcamRef.current.getScreenshot) {
      const screenshot = webcamRef.current.getScreenshot()

      if (screenshot) {
        const byteString = atob(screenshot.split(",")[1])
        const mimeString = screenshot.split(",")[0].split(":")[1].split(";")[0]
        const ab = new ArrayBuffer(byteString.length)
        const ia = new Uint8Array(ab)

        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i)
        }

        const blob = new Blob([ab], { type: mimeString })
        const file = new File([blob], "frame.jpg", { type: "image/jpeg" })

        const formData = new FormData()
        formData.append("frame", file)

        try {
          const response = await axios.post("http://localhost:5000/upload_frame", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          })

          if (response.data && response.data.message === "Frame received") {
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

  // Start the interview
  const startInterview = async () => {
    if (!resumeText) {
      setError("Please upload your resume before starting the interview")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await axios.post("http://localhost:5001/start_interview", {
        resume: resumeText,
        job_description:
          "Software Developer position requiring strong programming skills, problem-solving abilities, and teamwork.",
      })

      if (response.status === 200) {
        const question = response.data.question
        setCurrentQuestion(question)
        setChatHistory(response.data.chat_history)
        setIsInterviewActive(true)
        speakText(question)
      }
    } catch (error) {
      console.error("Error starting interview:", error)
      setError("Failed to start the interview. Please try again.")
      setIsInterviewActive(false)
    } finally {
      setIsLoading(false)
    }
  }

  // Convert text to speech and speak it
  const speakText = (text) => {
    if (synth.speaking) {
      console.log("Speech synthesis is already in progress")
      synth.cancel()
    }

    setIsSpeaking(true)
    setIsReadyToSpeak(false)

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1
    utterance.pitch = 1

    const voices = synth.getVoices()
    const preferredVoice = voices.find((voice) => voice.name.includes("Google") || voice.name.includes("Microsoft"))

    if (preferredVoice) {
      utterance.voice = preferredVoice
    }

    utterance.onend = () => {
      setIsSpeaking(false)
      setIsReadyToSpeak(true)
    }

    synth.speak(utterance)
  }

  // Toggle between voice and manual input modes
  const toggleInputMode = () => {
    if (isListening) {
      stopListening()
    }
    setManualInputMode(!manualInputMode)
    setError("")
    if (!manualInputMode) {
      localStorage.setItem("preferManualInput", "true")
    } else {
      localStorage.removeItem("preferManualInput")
    }
  }

  // Start listening to user's voice
  const startListening = () => {
    if (!speechRecognitionSupported) {
      setError("Speech recognition is not supported in this browser. Using manual input mode.")
      setManualInputMode(true)
      localStorage.setItem("preferManualInput", "true")
      return
    }

    setTranscript("")
    setIsListening(true)
    setIsReadyToSpeak(false)
    setError("")

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
        setTimeout(() => {
          try {
            recognitionRef.current.start()
            console.log("Speech recognition started successfully")
          } catch (error) {
            console.error("Error starting speech recognition:", error)
            setError(
              "Failed to start speech recognition. Please check your internet connection or microphone permissions."
            )
            setManualInputMode(true)
            setIsListening(false)
            localStorage.setItem("preferManualInput", "true")
          }
        }, 200)
      } catch (error) {
        console.error("Error stopping previous recognition:", error)
        setError("Failed to initialize speech recognition. Switching to manual input mode.")
        setManualInputMode(true)
        setIsListening(false)
        localStorage.setItem("preferManualInput", "true")
      }
    }
  }

  // Stop listening to user's voice
  const stopListening = () => {
    setIsListening(false)

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (error) {
        console.error("Error stopping speech recognition:", error)
      }
    }
  }

  // Handle manual transcript input
  const handleManualTranscriptChange = (e) => {
    setManualTranscript(e.target.value)
  }

  // Submit manual transcript
  const submitManualTranscript = () => {
    if (!manualTranscript.trim()) {
      setError("Please enter your answer before submitting")
      return
    }

    setTranscript(manualTranscript)
    setManualInputMode(false)
  }

  // Submit the user's answer
  const submitAnswer = async () => {
    const finalTranscript = manualInputMode ? manualTranscript : transcript

    if (!finalTranscript.trim()) {
      setError("Please provide an answer before submitting")
      return
    }

    stopListening()
    setIsLoading(true)
    setError("")

    try {
      const response = await axios.post("http://localhost:5001/answer_question", {
        text: finalTranscript,
      })

      if (response.status === 200) {
        if (response.data.interview_ended) {
          setIsInterviewEnded(true)
          setChatHistory(response.data.chat_history)

          const evalResponse = await axios.post("http://localhost:5001/end_interview")
          if (evalResponse.status === 200) {
            setEvaluation(evalResponse.data.evaluation)
          }

          try {
            const stopResponse = await axios.get("http://localhost:5000/stop")
            if (stopResponse.status === 200) {
              console.log("Video created:", stopResponse.data.video_path)
            }
          } catch (error) {
            console.error("Error stopping video recording:", error)
          }
        } else {
          const newQuestion = response.data.question
          setCurrentQuestion(newQuestion)
          setChatHistory(response.data.chat_history)
          setTranscript("")
          setManualTranscript("")

          setTimeout(() => {
            speakText(newQuestion)
          }, 1000)
        }
      }
    } catch (error) {
      console.error("Error submitting answer:", error)
      setError("Failed to submit your answer. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Stop the interview
  const stopInterview = async () => {
    try {
      setIsLoading(true)

      stopListening()
      if (synth.speaking) {
        synth.cancel()
      }

      try {
        const response = await axios.get("http://localhost:5000/stop")
        if (response.status === 200) {
          console.log("Video created:", response.data.video_path)
        }
      } catch (error) {
        console.error("Error stopping video recording:", error)
      }

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

  // Download interview data
  const downloadInterviewData = async () => {
    try {
      setIsLoading(true)
      const response = await axios.get("http://localhost:5000/download_data", {
        responseType: "blob",
      })

      if (response.status === 200) {
        const url = window.URL.createObjectURL(new Blob([response.data]))
        setDownloadUrl(url)

        const link = document.createElement("a")
        link.href = url
        link.setAttribute("download", "interview_data.zip")
        document.body.appendChild(link)
        link.click()
        link.parentNode.removeChild(link)
      }
    } catch (error) {
      console.error("Error downloading interview data:", error)
      setError("Failed to download interview data.")
    } finally {
      setIsLoading(false)
    }
  }

  // Download interview video
  const downloadInterviewVideo = async () => {
    try {
      setIsLoading(true)
      const response = await axios.get("http://localhost:5000/download", {
        responseType: "blob",
      })

      if (response.status === 200) {
        const url = window.URL.createObjectURL(new Blob([response.data]))
        setVideoUrl(url)

        const link = document.createElement("a")
        link.href = url
        link.setAttribute("download", "interview_video.mp4")
        document.body.appendChild(link)
        link.click()
        link.parentNode.removeChild(link)
      }
    } catch (error) {
      console.error("Error downloading interview video:", error)
      setError("Failed to download interview video.")
    } finally {
      setIsLoading(false)
    }
  }

  // Return to dashboard
  const returnToDashboard = () => {
    navigate("/dashboard")
  }

  return (
    <div className="voice-interview-container">
      <h1>AI Voice Interview</h1>

      {error && <div className="alert alert-danger">{error}</div>}

      {!isInterviewActive && !isInterviewEnded && (
        <div className="interview-start-card">
          <h2>Ready for Your Voice Interview?</h2>
          <p>
            This interview will use your microphone to record your responses and webcam for emotion analysis. The AI
            will ask you questions through your speakers and listen to your answers.
          </p>
          <div className="permission-notice">
            <div className="permission-icon">🎤</div>
            <p>Please ensure your browser has permission to use your microphone and webcam.</p>
          </div>
          <button className="start-interview-btn" onClick={startInterview} disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="loading-spinner"></span>
                Starting...
              </>
            ) : (
              <>Start Voice Interview</>
            )}
          </button>
        </div>
      )}

      {isInterviewActive && !isInterviewEnded && (
        <div className="active-interview">
          <div className="interview-grid">
            <div className="webcam-column">
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
              </div>

              <div className="emotion-container">
                <h3>Emotion Analysis</h3>
                <div className="emotion-metrics">
                  <div className="emotion-metric">
                    <span className="metric-label">Dominant Emotion:</span>
                    <span className="emotion-value">{emotionData.emotion}</span>
                  </div>
                  <div className="emotion-metric">
                    <span className="metric-label">Confidence:</span>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${emotionData.confidence}%` }}></div>
                    </div>
                    <span className="metric-value">{emotionData.confidence}%</span>
                  </div>
                  <div className="emotion-metric">
                    <span className="metric-label">Engagement:</span>
                    <div className="progress-bar">
                      <div className="progress-fill engagement" style={{ width: `${emotionData.engagement}%` }}></div>
                    </div>
                    <span className="metric-value">{emotionData.engagement}%</span>
                  </div>
                  <div className="emotion-metric">
                    <span className="metric-label">Stress Level:</span>
                    <div className="progress-bar">
                      <div className="progress-fill stress" style={{ width: `${emotionData.stress}%` }}></div>
                    </div>
                    <span className="metric-value">{emotionData.stress}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="interaction-column">
              <div className="question-container">
                <h3>Current Question</h3>
                <div className="question-bubble">
                  <p>{currentQuestion}</p>
                  {isSpeaking && (
                    <div className="speaking-indicator">
                      <div className="sound-wave">
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                      <p>AI is speaking...</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="answer-container">
                <h3>Your Answer</h3>

                <div className="input-mode-toggle">
                  <button
                    className={`mode-btn ${!manualInputMode ? "active" : ""}`}
                    onClick={() => setManualInputMode(false)}
                    disabled={!speechRecognitionSupported}
                  >
                    Voice Input
                  </button>
                  <button
                    className={`mode-btn ${manualInputMode ? "active" : ""}`}
                    onClick={() => setManualInputMode(true)}
                  >
                    Text Input
                  </button>
                </div>

                {!manualInputMode && (
                  <>
                    {isReadyToSpeak && !isListening && (
                      <div className="speak-prompt">
                        <button className="speak-btn" onClick={startListening}>
                          <div className="mic-icon">🎤</div>
                          <span>Speak Now</span>
                        </button>
                        <p>Click the button and start speaking your answer</p>
                      </div>
                    )}

                    {isListening && (
                      <div className="recording-status">
                        <div className="recording-indicator">
                          <div className="pulse-ring"></div>
                          <div className="mic-icon">🎤</div>
                        </div>
                        <p>Recording your answer... Speak clearly</p>
                        <button className="stop-recording-btn" onClick={stopListening}>
                          Stop Recording
                        </button>
                      </div>
                    )}

                    <div className="transcript-box">
                      <p>{transcript || "Your answer will appear here as you speak..."}</p>
                    </div>
                  </>
                )}

                {manualInputMode && (
                  <div className="manual-input-container">
                    <textarea
                      className="manual-transcript-input"
                      value={manualTranscript}
                      onChange={handleManualTranscriptChange}
                      placeholder="Type your answer here..."
                      rows={6}
                    />
                    <button
                      className="submit-manual-btn"
                      onClick={submitManualTranscript}
                      disabled={!manualTranscript.trim()}
                    >
                      Use This Answer
                    </button>
                  </div>
                )}

                <div className="answer-actions">
                  {((transcript && !isListening && !manualInputMode) || (manualInputMode && manualTranscript)) && (
                    <button
                      className="submit-answer-btn"
                      onClick={submitAnswer}
                      disabled={isLoading || (!transcript.trim() && !manualTranscript.trim())}
                    >
                      {isLoading ? "Processing..." : "Submit Answer"}
                    </button>
                  )}

                  <button className="end-interview-btn" onClick={stopInterview} disabled={isLoading}>
                    {isLoading ? "Ending..." : "End Interview"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isInterviewEnded && (
        <div className="interview-summary">
          <h2>Interview Summary</h2>

          <div className="evaluation-section">
            <h3>Your Performance Evaluation</h3>
            <div className="evaluation-content">
              <pre>{evaluation}</pre>
            </div>
          </div>

          <div className="transcript-section">
            <h3>Interview Transcript</h3>
            <div className="chat-history">
              {chatHistory.map((item, index) => (
                <div key={index} className={`chat-message ${item.role === "AI" ? "ai" : "candidate"}`}>
                  <div className="message-header">
                    <strong>{item.role === "AI" ? "Interviewer" : "You"}</strong>
                  </div>
                  <div className="message-content">{item.content}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="summary-actions">
            <button className="download-btn" onClick={downloadInterviewData} disabled={isLoading}>
              {isLoading ? "Preparing Download..." : "Download Interview Data"}
            </button>
            <button className="download-video-btn" onClick={downloadInterviewVideo} disabled={isLoading}>
              {isLoading ? "Preparing Video..." : "Download Interview Video"}
            </button>
            <button className="dashboard-btn" onClick={returnToDashboard}>
              Return to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default VoiceInterviewPage