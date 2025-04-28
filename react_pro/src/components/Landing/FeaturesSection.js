"use client"

function FeaturesSection() {
  const features = [
    {
      icon: "💬",
      title: "AI-Powered Questions",
      description: "Dynamic interview questions generated based on your resume and job description.",
    },
    {
      icon: "📊",
      title: "Emotion Analysis",
      description: "Real-time feedback on your facial expressions and engagement levels.",
    },
    {
      icon: "📝",
      title: "Detailed Evaluation",
      description: "Comprehensive assessment of your interview performance with actionable insights.",
    },
    {
      icon: "📱",
      title: "Accessible Anywhere",
      description: "Practice interviews from any device with a camera and internet connection.",
    },
  ]

  return (
    <section className="features-section">
      <div className="section-header">
        <h2>Why Choose Our Platform</h2>
        <p>Prepare for your next job interview with confidence</p>
      </div>
      <div className="features-grid">
        {features.map((feature, index) => (
          <div className="feature-card" key={index}>
            <div className="feature-icon">{feature.icon}</div>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default FeaturesSection
