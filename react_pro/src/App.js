"use client"

import { useState, useEffect } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import Login from "./components/Auth/Login"
import Signup from "./components/Auth/Signup"
import CandidateDashboard from "./components/Dashboard/CandidateDashboard"
import InterviewPage from "./components/Interview/InterviewPage"
import VoiceInterviewPage from "./components/Interview/VoiceInterviewPage"
import AnimatedLandingPage from "./components/Landing/AnimatedLandingPage"
import Navbar from "./components/Layout/Navbar"
import axios from "axios"
import "./App.css"

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Check if user is logged in
    const checkLoginStatus = async () => {
      try {
        const response = await axios.get("http://localhost:5000/session_status", {
          withCredentials: true,
        })

        if (response.data.logged_in) {
          setIsLoggedIn(true)
          setUser({
            username: response.data.username,
            role: localStorage.getItem("userRole") || "candidate",
          })
        }
      } catch (error) {
        console.error("Error checking login status:", error)
        setIsLoggedIn(false)
      }
    }

    checkLoginStatus()
  }, [])

  const handleLogin = (userData) => {
    setIsLoggedIn(true)
    setUser(userData)
    localStorage.setItem("userRole", userData.role)
  }

  const handleLogout = async () => {
    try {
      await axios.post(
        "http://localhost:5000/logout",
        {},
        {
          withCredentials: true,
        },
      )
      setIsLoggedIn(false)
      setUser(null)
      localStorage.removeItem("userRole")
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  return (
    <Router>
      <div className="app">
        <Navbar isLoggedIn={isLoggedIn} user={user} onLogout={handleLogout} />
        <Routes>
          <Route path="/" element={<AnimatedLandingPage />} />
          <Route path="/login" element={isLoggedIn ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />} />
          <Route path="/signup" element={isLoggedIn ? <Navigate to="/dashboard" /> : <Signup />} />
          <Route
            path="/dashboard"
            element={isLoggedIn ? <CandidateDashboard user={user} /> : <Navigate to="/login" />}
          />
          <Route path="/interview" element={isLoggedIn ? <InterviewPage user={user} /> : <Navigate to="/login" />} />
          <Route
            path="/voice-interview"
            element={isLoggedIn ? <VoiceInterviewPage user={user} /> : <Navigate to="/login" />}
          />
        </Routes>
      </div>
    </Router>
  )
}

export default App
