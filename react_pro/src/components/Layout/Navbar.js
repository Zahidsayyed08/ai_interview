"use client"
import { Link, useNavigate } from "react-router-dom"
import "./Navbar.css"

function Navbar({ isLoggedIn, user, onLogout }) {
  const navigate = useNavigate()

  const handleLogout = () => {
    onLogout()
    navigate("/login")
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          InterviewAI
        </Link>

        <div className="navbar-menu">
          {isLoggedIn ? (
            <>
              <span className="navbar-welcome">Welcome, {user?.username}</span>
              <Link to="/dashboard" className="navbar-link">
                Dashboard
              </Link>
              <button onClick={handleLogout} className="navbar-btn">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar-link">
                Login
              </Link>
              <Link to="/signup" className="navbar-link">
                Signup
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar

