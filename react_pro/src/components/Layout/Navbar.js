"use client"
import { Link, useNavigate, useLocation } from "react-router-dom"
import "./Navbar.css"

function Navbar({ isLoggedIn, user, onLogout }) {
  const navigate = useNavigate()
  const location = useLocation()
  const isLandingPage = location.pathname === "/"

  const handleLogout = () => {
    onLogout()
    navigate("/login")
  }

  return (
    <nav className={`navbar ${isLandingPage ? "navbar-landing" : ""}`}>
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          InterviewAI
        </Link>

        <div className="navbar-menu">
          {isLoggedIn ? (
            <>
              <span className="navbar-welcome">Welcome, {user?.username}</span>
              <Link to="/" className="navbar-link">
                Dashboard
              </Link>
              <button onClick={handleLogout} className="navbar-btn">
                Logout
              </button>
            </>
          ) : (
            <>
              {isLandingPage ? (
                <>
                  <a href="#features" className="navbar-link">
                    Features
                  </a>
                  <a href="#testimonials" className="navbar-link">
                    Testimonials
                  </a>
                  <Link to="/login" className="navbar-link">
                    Login
                  </Link>
                  <Link to="/signup" className="navbar-btn navbar-cta">
                    Sign Up
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/login" className="navbar-link">
                    Login
                  </Link>
                  <Link to="/signup" className="navbar-link">
                    Sign Up
                  </Link>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
