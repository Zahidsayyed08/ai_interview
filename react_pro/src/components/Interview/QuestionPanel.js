"use client"
import "./Interview.css"

function QuestionPanel({ currentQuestion, answer, handleAnswerChange, submitAnswer, isLoading }) {
  return (
    <div className="question-container">
      <h3>Interview Questions</h3>

      <div className="question-card">
        <h4>Current Question:</h4>
        <p>{currentQuestion}</p>
      </div>

      <div className="answer-section">
        <h4>Your Answer:</h4>
        <div className="copy-warning">
          <span>⚠️</span> Your webcam feed is being monitored. Please provide original answers.
        </div>
        <textarea
          className="form-control"
          rows="6"
          value={answer}
          onChange={handleAnswerChange}
          placeholder="Type your answer here..."
        ></textarea>

        <button className="btn btn-primary" onClick={submitAnswer} disabled={isLoading}>
          {isLoading ? "Submitting..." : "Submit Answer"}
        </button>
      </div>
    </div>
  )
}

export default QuestionPanel

