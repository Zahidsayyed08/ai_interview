"use client"

import HeroSection from "./HeroSection"
import FeaturesSection from "./FeaturesSection"
import TestimonialsSection from "./TestimonialsSection"
import CTASection from "./CTASection"
import Footer from "./Footer"
import "./Landing.css"

function LandingPage() {
  return (
    <div className="landing-page">
      <HeroSection />
      <FeaturesSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  )
}

export default LandingPage
