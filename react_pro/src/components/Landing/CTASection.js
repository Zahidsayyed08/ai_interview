"use client"

import { Link } from "react-router-dom"

function CTASection() {
  return (
    <section className="cta-section">
      <div className="cta-content">
        <h2>Ready to Ace Your Next Interview?</h2>
        <p>Join thousands of job seekers who have improved their interview skills and landed their dream jobs.</p>
        <Link to="/signup" className="btn btn-primary btn-lg">
          Create Free Account
        </Link>
      </div>
    </section>
  )
}

export default CTASection
