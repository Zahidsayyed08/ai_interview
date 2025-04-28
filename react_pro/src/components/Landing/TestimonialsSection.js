"use client"

function TestimonialsSection() {
  const testimonials = [
    {
      quote:
        "This platform helped me prepare for my technical interview at a top tech company. The AI feedback was incredibly valuable!",
      author: "Sarah J.",
      role: "Software Engineer",
    },
    {
      quote:
        "I was nervous about my first job interview, but after practicing with this AI system, I felt much more confident and landed the job!",
      author: "Michael T.",
      role: "Marketing Specialist",
    },
    {
      quote:
        "The emotion analysis feature helped me realize I wasn't making enough eye contact. Game changer for virtual interviews!",
      author: "Priya K.",
      role: "Product Manager",
    },
  ]

  return (
    <section className="testimonials-section">
      <div className="section-header">
        <h2>What Our Users Say</h2>
        <p>Success stories from job seekers who used our platform</p>
      </div>
      <div className="testimonials-container">
        {testimonials.map((testimonial, index) => (
          <div className="testimonial-card" key={index}>
            <div className="quote-mark">"</div>
            <p className="testimonial-quote">{testimonial.quote}</p>
            <div className="testimonial-author">
              <p className="author-name">{testimonial.author}</p>
              <p className="author-role">{testimonial.role}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default TestimonialsSection
