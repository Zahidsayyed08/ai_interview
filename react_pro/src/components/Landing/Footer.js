"use client"

import { Link } from "react-router-dom"

function Footer() {
  return (
    <footer className="landing-footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>InterviewAI</h3>
          <p>Helping job seekers prepare for interviews with AI-powered feedback and practice.</p>
        </div>

        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/login">Login</Link>
            </li>
            <li>
              <Link to="/signup">Sign Up</Link>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Features</h4>
          <ul>
            <li>
              <a href="#features">AI Interviews</a>
            </li>
            <li>
              <a href="#features">Emotion Analysis</a>
            </li>
            <li>
              <a href="#features">Performance Evaluation</a>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Contact</h4>
          <ul>
            <li>
              <a href="mailto:support@interviewai.com">support@interviewai.com</a>
            </li>
            <li>
              <a href="tel:+1234567890">+1 (234) 567-890</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} InterviewAI. All rights reserved.</p>
      </div>
    </footer>
  )
}

export default Footer
