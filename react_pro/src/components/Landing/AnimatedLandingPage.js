"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import axios from "axios"
import "./AnimatedLanding.css"

function AnimatedLandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Check if user is logged in
    const checkLoginStatus = async () => {
      try {
        const response = await axios.get("http://localhost:5000/session_status", {
          withCredentials: true,
        })

        setIsLoggedIn(response.data.logged_in)
      } catch (error) {
        console.error("Error checking login status:", error)
        setIsLoggedIn(false)
      }
    }

    checkLoginStatus()
  }, [])

  const handleStartInterview = () => {
    if (isLoggedIn) {
      navigate("/dashboard") // Navigate to resume upload/dashboard
    } else {
      navigate("/login") // Navigate to login/signup
    }
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 },
    },
  }

  const buttonVariants = {
    rest: { scale: 1 },
    hover: {
      scale: 1.05,
      boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.15)",
      transition: { duration: 0.3, type: "spring", stiffness: 400 },
    },
    tap: { scale: 0.95 },
  }

  return (
    <div className="animated-landing">
      <div className="animated-background">
        <div className="animated-shape shape1"></div>
        <div className="animated-shape shape2"></div>
        <div className="animated-shape shape3"></div>
      </div>

      <motion.div className="animated-content" variants={containerVariants} initial="hidden" animate="visible">
        <motion.h1 variants={itemVariants}>
          Master Your Interview Skills with <span className="highlight">AI</span>
        </motion.h1>

        <motion.p variants={itemVariants}>
          Practice interviews with our AI-powered platform that provides real-time feedback on your responses and body
          language.
        </motion.p>

        <motion.div className="features-grid" variants={itemVariants}>
          <div className="feature">
            <div className="feature-icon">💬</div>
            <h3>AI Questions</h3>
            <p>Dynamic interview questions based on your resume</p>
          </div>

          <div className="feature">
            <div className="feature-icon">🎤</div>
            <h3>Voice Interaction</h3>
            <p>Speak your answers naturally as in a real interview</p>
          </div>

          <div className="feature">
            <div className="feature-icon">📊</div>
            <h3>Real-time Analysis</h3>
            <p>Get instant feedback on your performance</p>
          </div>
        </motion.div>

        <motion.button
          className="cta-button"
          onClick={handleStartInterview}
          variants={buttonVariants}
          initial="rest"
          whileHover="hover"
          whileTap="tap"
        >
          Start AI Interview
          <div className="button-glow"></div>
        </motion.button>
      </motion.div>
    </div>
  )
}

export default AnimatedLandingPage
