"use client"

import { Link } from "react-router-dom"

function HeroSection() {
  return (
    <section className="hero-section">
      <div className="hero-content">
        <h1>Master Your Interview Skills with AI</h1>
        <p>
          Practice interviews with our AI-powered platform that provides real-time feedback on your responses and body
          language.
        </p>
        <div className="hero-buttons">
          <Link to="/signup" className="btn btn-primary btn-lg">
            Get Started
          </Link>
          <Link to="/login" className="btn btn-outline btn-lg">
            Log In
          </Link>
        </div>
      </div>
      <div className="hero-image">
        <img src="/interview-illustration.svg" alt="AI Interview Illustration" />
      </div>
    </section>
  )
}

export default HeroSection
