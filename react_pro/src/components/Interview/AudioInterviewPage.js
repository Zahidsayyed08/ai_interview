// "use client"

// import { useState, useEffect, useRef } from "react"
// import { useNavigate } from "react-router-dom"
// import axios from "axios"
// import Webcam from "react-webcam"
// import "./AudioInterview.css"

// function AudioInterviewPage({ user }) {
//   const [isInterviewActive, setIsInterviewActive] = useState(false)
//   const [resumeText, setResumeText] = useState("")
//   const [chatHistory, setChatHistory] = useState([])
//   const [currentQuestion, setCurrentQuestion] = useState("")
//   const [isListening, setIsListening] = useState(false)
//   const [transcript, setTranscript] = useState("")
//   const [isProcessing, setIsProcessing] = useState(false)
//   const [evaluation, setEvaluation] = useState("")
//   const [isInterviewEnded, setIsInterviewEnded] = useState(false)
//   const [error, setError] = useState("")
//   const [isLoading, setIsLoading] = useState(false)
//   const [emotionData, setEmotionData] = useState({
//     emotion: "Analyzing...",
//     confidence: 0,
//     engagement: 0,
//     stress: 0,
//   })

//   const recognitionRef = useRef(null)
//   const webcamRef = useRef(null)
//   const intervalRef = useRef(null)
//   const mediaStreamRef = useRef(null)
//   const navigate = useNavigate()

//   // Initialize speech synthesis
//   const synth = window.speechSynthesis || window.webkitSpeechSynthesis

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

//     // Clean up
//     return () => {
//       stopListening()
//       if (synth && synth.speaking) {
//         synth.cancel()
//       }
//       if (intervalRef.current) {
//         clearInterval(intervalRef.current)
//       }
//     }
//   }, [])

//   // Start or stop sending frames based on isInterviewActive
//   useEffect(() => {
//     if (isInterviewActive && webcamRef.current) {
//       // Start capturing frames
//       intervalRef.current = setInterval(() => {
//         captureAndSendFrame()
//       }, 1000) // Send a frame every second
//     } else {
//       // Stop capturing frames
//       if (intervalRef.current) {
//         clearInterval(intervalRef.current)
//         intervalRef.current = null
//       }
//     }

//     // Clean up interval when component unmounts
//     return () => {
//       if (intervalRef.current) {
//         clearInterval(intervalRef.current)
//       }
//     }
//   }, [isInterviewActive])

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

//   const speakText = (text) => {
//     if (!synth) {
//       console.error("Speech synthesis not supported")
//       return
//     }

//     if (synth.speaking) {
//       console.log("Speech synthesis is already in progress")
//       synth.cancel()
//     }

//     const utterance = new SpeechSynthesisUtterance(text)
//     utterance.rate = 1
//     utterance.pitch = 1

//     // Get available voices and set a good one if available
//     const voices = synth.getVoices()
//     const preferredVoice = voices.find((voice) => voice.name.includes("Google") || voice.name.includes("Microsoft"))

//     if (preferredVoice) {
//       utterance.voice = preferredVoice
//     }

//     synth.speak(utterance)
//   }

//   const startListening = async () => {
//     try {
//       // Reset transcript
//       setTranscript("")
//       setError("")

//       // Request microphone permission
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
//       mediaStreamRef.current = stream

//       // Create a new SpeechRecognition instance
//       const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
//       if (!SpeechRecognition) {
//         throw new Error("Speech recognition not supported in this browser")
//       }

//       // Create and configure the recognition object
//       recognitionRef.current = new SpeechRecognition()
//       recognitionRef.current.continuous = true
//       recognitionRef.current.interimResults = true
//       recognitionRef.current.lang = "en-US"

//       // Set up event handlers
//       recognitionRef.current.onresult = (event) => {
//         let finalTranscript = ""
//         let interimTranscript = ""

//         for (let i = event.resultIndex; i < event.results.length; i++) {
//           const transcript = event.results[i][0].transcript
//           if (event.results[i].isFinal) {
//             finalTranscript += transcript
//           } else {
//             interimTranscript += transcript
//           }
//         }

//         // Update the transcript with both final and interim results
//         setTranscript(finalTranscript || interimTranscript)
//       }

//       recognitionRef.current.onerror = (event) => {
//         console.error("Speech recognition error:", event.error)
//         setError(`Microphone error: ${event.error}. Please check your microphone.`)
//         setIsListening(false)
//         stopMediaTracks()
//       }

//       recognitionRef.current.onend = () => {
//         // Only restart if we're still supposed to be listening
//         if (isListening) {
//           try {
//             recognitionRef.current.start()
//           } catch (e) {
//             console.error("Error restarting speech recognition:", e)
//           }
//         }
//       }

//       // Start recognition
//       recognitionRef.current.start()
//       setIsListening(true)
//       console.log("Speech recognition started successfully")
//     } catch (error) {
//       console.error("Error starting speech recognition:", error)
//       setError(`Failed to start microphone: ${error.message}. Please ensure you've granted microphone permissions.`)
//       setIsListening(false)
//       stopMediaTracks()
//     }
//   }

//   const stopMediaTracks = () => {
//     // Stop all media tracks
//     if (mediaStreamRef.current) {
//       mediaStreamRef.current.getTracks().forEach((track) => track.stop())
//       mediaStreamRef.current = null
//     }
//   }

//   const stopListening = () => {
//     setIsListening(false)

//     // Stop speech recognition
//     if (recognitionRef.current) {
//       try {
//         recognitionRef.current.stop()
//         console.log("Speech recognition stopped")
//       } catch (e) {
//         console.error("Error stopping speech recognition:", e)
//       }
//       recognitionRef.current = null
//     }

//     // Stop media tracks
//     stopMediaTracks()
//   }

//   const submitAnswer = async () => {
//     if (!transcript.trim()) {
//       setError("Please provide an answer before submitting")
//       return
//     }

//     stopListening()
//     setIsProcessing(true)
//     setError("")

//     try {
//       const response = await axios.post("http://localhost:5001/answer_question", {
//         text: transcript,
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
//         } else {
//           const newQuestion = response.data.question
//           setCurrentQuestion(newQuestion)
//           setChatHistory(response.data.chat_history)
//           setTranscript("")

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
//       setIsProcessing(false)
//     }
//   }

//   const stopInterview = async () => {
//     try {
//       setIsLoading(true)

//       // Stop listening and speaking
//       stopListening()
//       if (synth && synth.speaking) {
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

//   const returnToDashboard = () => {
//     navigate("/dashboard")
//   }

//   const downloadVideo = () => {
//     // Direct the browser to the download endpoint
//     window.location.href = "http://localhost:5000/download/"
//   }

//   return (
//     <div className="audio-interview-container">
//       <h1>AI Voice Interview</h1>

//       {error && <div className="alert alert-danger">{error}</div>}

//       {!isInterviewActive && !isInterviewEnded && (
//         <div className="interview-start-card">
//           <h2>Ready to Start Your Voice Interview?</h2>
//           <p>
//             This interview will use your microphone to record your responses and webcam for emotion analysis. The AI
//             will ask you questions through your speakers and listen to your answers.
//           </p>
//           <div className="microphone-permission">
//             <p>Please ensure your browser has permission to use your microphone and webcam.</p>
//           </div>
//           <button className="btn btn-primary btn-lg pulse-button" onClick={startInterview} disabled={isLoading}>
//             {isLoading ? "Starting..." : "Start Voice Interview"}
//           </button>
//         </div>
//       )}

//       {isInterviewActive && !isInterviewEnded && (
//         <div className="voice-interview-session">
//           <div className="interview-grid">
//             <div className="webcam-section">
//               <h3>Webcam Feed</h3>
//               <div className="webcam-wrapper">
//                 <Webcam
//                   audio={false}
//                   ref={webcamRef}
//                   screenshotFormat="image/jpeg"
//                   width={640}
//                   height={480}
//                   videoConstraints={{
//                     width: 640,
//                     height: 480,
//                     facingMode: "user",
//                   }}
//                 />
//               </div>
//               <div className="emotion-analysis">
//                 <h4>Emotion Analysis</h4>
//                 <div className="emotion-metrics">
//                   <div className="emotion-metric">
//                     <span>Dominant Emotion:</span>
//                     <span className="emotion-value">{emotionData.emotion}</span>
//                   </div>
//                   <div className="emotion-metric">
//                     <span>Confidence:</span>
//                     <div className="progress-bar">
//                       <div className="progress-fill" style={{ width: `${emotionData.confidence}%` }}></div>
//                     </div>
//                     <span>{emotionData.confidence}%</span>
//                   </div>
//                   <div className="emotion-metric">
//                     <span>Engagement:</span>
//                     <div className="progress-bar">
//                       <div className="progress-fill engagement" style={{ width: `${emotionData.engagement}%` }}></div>
//                     </div>
//                     <span>{emotionData.engagement}%</span>
//                   </div>
//                   <div className="emotion-metric">
//                     <span>Stress Level:</span>
//                     <div className="progress-bar">
//                       <div className="progress-fill stress" style={{ width: `${emotionData.stress}%` }}></div>
//                     </div>
//                     <span>{emotionData.stress}%</span>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <div className="question-answer-section">
//               <div className="question-display">
//                 <h3>Current Question:</h3>
//                 <div className="question-bubble">
//                   <p>{currentQuestion}</p>
//                   <div className="audio-indicator">
//                     {synth && synth.speaking && (
//                       <div className="audio-wave">
//                         <span></span>
//                         <span></span>
//                         <span></span>
//                         <span></span>
//                         <span></span>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               <div className="answer-section">
//                 <h3>Your Answer:</h3>
//                 <div className={`microphone-status ${isListening ? "listening" : ""}`}>
//                   {isListening ? (
//                     <>
//                       <div className="mic-icon pulsing">🎤</div>
//                       <p>Listening... Speak your answer</p>
//                     </>
//                   ) : (
//                     <>
//                       <div className="mic-icon">🎤</div>
//                       <p>Microphone inactive</p>
//                     </>
//                   )}
//                 </div>

//                 <div className="transcript-display">
//                   <p>{transcript || "Your spoken answer will appear here..."}</p>
//                 </div>

//                 <div className="answer-controls">
//                   {!isListening ? (
//                     <button
//                       className="btn btn-secondary"
//                       onClick={startListening}
//                       disabled={(synth && synth.speaking) || isProcessing}
//                     >
//                       Start Speaking
//                     </button>
//                   ) : (
//                     <button className="btn btn-warning" onClick={stopListening} disabled={isProcessing}>
//                       Stop Speaking
//                     </button>
//                   )}

//                   <button
//                     className="btn btn-primary"
//                     onClick={submitAnswer}
//                     disabled={isProcessing || !transcript.trim()}
//                   >
//                     {isProcessing ? "Processing..." : "Submit Answer"}
//                   </button>

//                   <button className="btn btn-danger" onClick={stopInterview} disabled={isLoading}>
//                     {isLoading ? "Stopping..." : "End Interview"}
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {isInterviewEnded && (
//         <div className="interview-results">
//           <h2>Interview Completed</h2>

//           <div className="evaluation-card">
//             <h3>Your Interview Evaluation</h3>
//             <div className="evaluation-content">
//               <pre>{evaluation}</pre>
//             </div>
//           </div>

//           <div className="chat-history-card">
//             <h3>Interview Transcript</h3>
//             <div className="chat-history">
//               {chatHistory.map((item, index) => (
//                 <div key={index} className={`chat-message ${item.role === "AI" ? "ai" : "candidate"}`}>
//                   <strong>{item.role}:</strong> {item.content}
//                 </div>
//               ))}
//             </div>
//           </div>

//           <div className="interview-actions">
//             <button className="btn btn-primary" onClick={returnToDashboard}>
//               Return to Dashboard
//             </button>

//             <button className="btn btn-success" onClick={downloadVideo}>
//               <span className="download-icon">📥</span> Download Interview Video
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

// export default AudioInterviewPage


"use client";

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Webcam from "react-webcam";
import "./AudioInterview.css";

function AudioInterviewPage({ user }) {
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [resumeText, setResumeText] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [evaluation, setEvaluation] = useState("");
  const [isInterviewEnded, setIsInterviewEnded] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emotionData, setEmotionData] = useState({
    emotion: "Analyzing...",
    confidence: 0,
    engagement: 0,
    stress: 0,
  });

  const recognitionRef = useRef(null);
  const webcamRef = useRef(null);
  const intervalRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const listeningTimeoutRef = useRef(null);
  const synth = window.speechSynthesis || window.webkitSpeechSynthesis;
  const navigate = useNavigate();

  // Maximum listening duration in milliseconds (30 seconds)
  const MAX_LISTENING_DURATION = 30000;

  useEffect(() => {
    const fetchResume = async () => {
      try {
        const response = await axios.get("http://localhost:5000/get_resume", {
          withCredentials: true,
        });
        if (response.status === 200) {
          setResumeText(response.data.resume_text);
        }
      } catch (error) {
        console.error("Error fetching resume:", error);
        setError("Failed to fetch resume. Please go back to dashboard and upload your resume.");
      }
    };

    fetchResume();

    // Initialize speech recognition
    if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0])
          .map((result) => result.transcript)
          .join("");
        setTranscript(transcript);
        console.log("Transcript updated:", transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setError(`Microphone error: ${event.error}. Please check your microphone permissions.`);
        setIsListening(false);
        clearTimeout(listeningTimeoutRef.current);
      };

      recognitionRef.current.onend = () => {
        if (isInterviewActive && isListening) {
          // Restart listening if the interview is still active and listening is enabled
          try {
            recognitionRef.current.start();
            console.log("Speech recognition restarted");
          } catch (e) {
            console.error("Failed to restart speech recognition:", e);
            setError("Failed to continue listening. Please try again.");
            setIsListening(false);
            clearTimeout(listeningTimeoutRef.current);
          }
        } else {
          setIsListening(false);
          clearTimeout(listeningTimeoutRef.current);
        }
      };
    } else {
      setError("Your browser doesn't support speech recognition. Please use Chrome or Edge.");
    }

    return () => {
      stopMedia();
      if (synth && synth.speaking) {
        synth.cancel();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      clearTimeout(listeningTimeoutRef.current);
    };
  }, [isInterviewActive, isListening]);

  useEffect(() => {
    if (isInterviewActive && webcamRef.current) {
      intervalRef.current = setInterval(() => {
        captureAndSendFrame();
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      stopMedia();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      stopMedia();
    };
  }, [isInterviewActive]);

  const checkMediaPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      mediaStreamRef.current = stream;
      return true;
    } catch (err) {
      setError("Permission denied for microphone and/or webcam. Please grant access in your browser settings.");
      console.error("Media permission error:", err);
      return false;
    }
  };

  const startListening = () => {
    if (!recognitionRef.current) {
      setError("Speech recognition not initialized. Please restart the interview.");
      return;
    }

    setTranscript("");
    setIsListening(true);
    setError("");

    try {
      recognitionRef.current.start();
      console.log("Speech recognition started");

      // Set a timeout to automatically stop listening after MAX_LISTENING_DURATION
      listeningTimeoutRef.current = setTimeout(() => {
        stopMedia();
        setError("Listening stopped after 30 seconds. Click 'Start Speaking' to continue.");
      }, MAX_LISTENING_DURATION);
    } catch (error) {
      console.error("Error starting speech recognition:", error);
      setError(`Failed to start speech recognition: ${error.message}. Please ensure microphone access.`);
      setIsListening(false);
    }
  };

  const stopMedia = () => {
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        console.log("Speech recognition stopped");
      } catch (e) {
        console.error("Error stopping speech recognition:", e);
      }
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    clearTimeout(listeningTimeoutRef.current);
  };

  const captureAndSendFrame = async () => {
    if (webcamRef.current && webcamRef.current.getScreenshot) {
      const screenshot = webcamRef.current.getScreenshot();

      if (screenshot) {
        const byteString = atob(screenshot.split(",")[1]);
        const mimeString = screenshot.split(",")[0].split(":")[1].split(";")[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);

        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }

        const blob = new Blob([ab], { type: mimeString });
        const file = new File([blob], "frame.jpg", { type: "image/jpeg" });

        const formData = new FormData();
        formData.append("frame", file);

        try {
          const response = await axios.post("http://localhost:5000/upload_frame", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });

          if (response.data && response.data.message === "Frame received") {
            setEmotionData({
              emotion: response.data.emotion || "Neutral",
              confidence: response.data.confidence || 0,
              engagement: response.data.engagement || 0,
              stress: response.data.stress || 0,
            });
          }
        } catch (error) {
          console.error("Error sending frame:", error);
        }
      }
    }
  };

  const startInterview = async () => {
    if (!resumeText) {
      setError("Please upload your resume before starting the interview");
      return;
    }

    setIsLoading(true);
    setError("");

    const hasPermission = await checkMediaPermissions();
    if (!hasPermission) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post("http://localhost:5001/start_interview", {
        resume: resumeText,
        job_description:
          "Software Developer position requiring strong programming skills, problem-solving abilities, and teamwork.",
      });

      if (response.status === 200) {
        const question = response.data.question;
        setCurrentQuestion(question);
        setChatHistory(response.data.chat_history);
        setIsInterviewActive(true);
        speakText(question);
      }
    } catch (error) {
      console.error("Error starting interview:", error);
      setError("Failed to start the interview. Please try again.");
      setIsInterviewActive(false);
    } finally {
      setIsLoading(false);
    }
  };

  const speakText = (text) => {
    if (synth.speaking) {
      console.log("Speech synthesis is already in progress");
      synth.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;

    const voices = synth.getVoices();
    const preferredVoice = voices.find((voice) => voice.name.includes("Google") || voice.name.includes("Microsoft"));
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onend = () => {
      // Do not automatically start listening; wait for user to click "Start Speaking"
    };

    synth.speak(utterance);
  };

  const submitAnswer = async () => {
    if (!transcript.trim()) {
      setError("Please provide an answer before submitting");
      return;
    }

    stopMedia();
    setIsProcessing(true);
    setError("");

    try {
      const response = await axios.post("http://localhost:5001/answer_question", {
        text: transcript,
      });

      if (response.status === 200) {
        if (response.data.interview_ended) {
          setIsInterviewEnded(true);
          setChatHistory(response.data.chat_history);
          const evalResponse = await axios.post("http://localhost:5001/end_interview");
          if (evalResponse.status === 200) {
            setEvaluation(evalResponse.data.evaluation);
          }
        } else {
          const newQuestion = response.data.question;
          setCurrentQuestion(newQuestion);
          setChatHistory(response.data.chat_history);
          setTranscript("");
          setTimeout(() => speakText(newQuestion), 1000);
        }
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
      setError("Failed to submit your answer. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const stopInterview = async () => {
    try {
      setIsLoading(true);
      stopMedia();
      if (synth && synth.speaking) {
        synth.cancel();
      }

      try {
        const response = await axios.get("http://localhost:5000/stop");
        if (response.status === 200) {
          console.log("Video created:", response.data.video_path);
        }
      } catch (error) {
        console.error("Error stopping video recording:", error);
      }

      if (!isInterviewEnded) {
        const evalResponse = await axios.post("http://localhost:5001/end_interview");
        if (evalResponse.status === 200) {
          setEvaluation(evalResponse.data.evaluation);
          setIsInterviewEnded(true);
        }
      }

      setIsInterviewActive(false);
    } catch (error) {
      console.error("Error stopping interview:", error);
      setError("Failed to stop the interview properly.");
    } finally {
      setIsLoading(false);
    }
  };

  const returnToDashboard = () => {
    navigate("/dashboard");
  };

  const downloadVideo = () => {
    window.location.href = "http://localhost:5000/download/";
  };

  return (
    <div className="audio-interview-container">
      <h1>AI Voice Interview</h1>
      {error && <div className="alert alert-danger">{error}</div>}

      {!isInterviewActive && !isInterviewEnded && (
        <div className="interview-start-card">
          <h2>Ready to Start Your Voice Interview?</h2>
          <p>
            This interview will use your microphone to record your responses and webcam for emotion analysis. The AI
            will ask you questions through your speakers and listen to your answers.
          </p>
          <div className="microphone-permission">
            <p>Please ensure your browser has permission to use your microphone and webcam.</p>
          </div>
          <button className="btn btn-primary btn-lg pulse-button" onClick={startInterview} disabled={isLoading}>
            {isLoading ? "Starting..." : "Start Voice Interview"}
          </button>
        </div>
      )}

      {isInterviewActive && !isInterviewEnded && (
        <div className="voice-interview-session">
          <div className="interview-grid">
            <div className="webcam-section">
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
              <div className="emotion-analysis">
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
              </div>
            </div>
            <div className="question-answer-section">
              <div className="question-display">
                <h3>Current Question:</h3>
                <div className="question-bubble">
                  <p>{currentQuestion}</p>
                  <div className="audio-indicator">
                    {synth && synth.speaking && (
                      <div className="audio-wave">
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="answer-section">
                <h3>Your Answer:</h3>
                <div className={`microphone-status ${isListening ? "listening" : ""}`}>
                  {isListening ? (
                    <>
                      <div className="mic-icon pulsing">🎤</div>
                      <p>Listening... Speak your answer</p>
                    </>
                  ) : (
                    <>
                      <div className="mic-icon">🎤</div>
                      <p>Microphone inactive</p>
                    </>
                  )}
                </div>
                <div className="transcript-display">
                  <p>{transcript || "Your spoken answer will appear here..."}</p>
                </div>
                <div className="answer-controls">
                  {isListening ? (
                    <button
                      className="btn btn-primary"
                      onClick={submitAnswer}
                      disabled={isProcessing || !transcript.trim()}
                    >
                      {isProcessing ? "Processing..." : "Submit Answer"}
                    </button>
                  ) : (
                    <button
                      className="btn btn-secondary"
                      onClick={startListening}
                      disabled={synth.speaking || isProcessing}
                    >
                      Start Speaking
                    </button>
                  )}
                  {isListening && (
                    <button className="btn btn-warning" onClick={stopMedia} disabled={isProcessing}>
                      Stop
                    </button>
                  )}
                  <button className="btn btn-danger" onClick={stopInterview} disabled={isLoading}>
                    {isLoading ? "Stopping..." : "End Interview"}
                  </button>
                </div>
              </div>
            </div>
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
            <button className="btn btn-primary" onClick={returnToDashboard}>
              Return to Dashboard
            </button>
            <button className="btn btn-success" onClick={downloadVideo}>
              <span className="download-icon">📥</span> Download Interview Video
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AudioInterviewPage;