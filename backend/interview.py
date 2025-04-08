from flask import Flask, request, jsonify
import google.generativeai as genai
import speech_recognition as sr
import os
import base64
from pydub import AudioSegment
import io
from flask_cors import CORS

app = Flask(__name__)
CORS(app, supports_credentials=True) 

# Configure Gemini API
genai.configure(api_key="GEMINI_KEY")

model = genai.GenerativeModel("gemini-1.5-flash")

# Initialize Speech Recognition
recognizer = sr.Recognizer()

# Chat History
chat_history = []

def generate_initial_question(resume, job_description):
    """Generates the first interview question."""
    prompt = f"""
    You are an expert technical interviewer conducting a job interview.
    
    Resume: {resume}
    Job Description: {job_description}
    
    Based on the resume and job description:
    1. Identify key skills or experiences that are most relevant for this position
    2. Generate a thoughtful, open-ended interview question that assesses the candidate's experience with these skills
    3. Ensure the question is specific enough to provide meaningful insight but open enough to allow the candidate to showcase their knowledge
    
    Return ONLY the interview question without any preamble, explanation, or additional text.
    """
    response = model.generate_content(prompt)
    return response.text.strip()

def generate_followup_question(chat_history):
    """Generates a follow-up question based on the chat history."""
    history_text = "\n".join([f"{item['role']}: {item['content']}" for item in chat_history])
    prompt = f"""
    You are an expert technical interviewer conducting a job interview.
    
    Previous Interview Exchange:
    {history_text}
    
    Based on the candidate's previous responses:
    1. Identify areas that require deeper exploration or clarification
    2. Consider skills mentioned in the resume that haven't been discussed yet
    3. Generate a follow-up question that either:
        - Digs deeper into their most recent answer
        - Explores a new relevant skill area 
        - Challenges them to provide specific examples of their experience
    
    Your question should feel natural in the conversation flow and provide valuable assessment insights.
    
    Return ONLY the interview question without any preamble, explanation, or additional text.
    """
    response = model.generate_content(prompt)
    return response.text.strip()

def evaluate_interview(chat_history):
    """Evaluates the interview based on the chat history."""
    history_text = "\n".join([f"{item['role']}: {item['content']}" for item in chat_history])
    prompt = f"""
    You are an expert hiring manager reviewing a candidate interview.
    
    Complete Interview Exchange:
    {history_text}
    
    Provide a comprehensive evaluation using the following structure:
    
    ## Question-by-Question Analysis
    [For each question-answer pair, provide:
    1. A brief assessment of the quality and relevance of the answer (2-3 sentences)
    2. Note specific strengths and areas for improvement
    3. Score each answer on a scale of 1-10]
    
    ## Technical Skills Assessment
    - Evaluate demonstrated technical knowledge based on job requirements
    - Identify skills that were well-demonstrated vs. areas of concern
    
    ## Communication Skills
    - Clarity and structure of responses
    - Ability to explain complex concepts
    
    ## Overall Evaluation
    - Summarize the candidate's fit for the role in 3-5 sentences
    - Highlight top strengths and any critical weaknesses
    
    ## Final Score
    - Provide an overall score out of 10
    - Brief justification for the score
    
    ## Recommendation
    [Strong Yes / Yes / Maybe / No]
    """
    response = model.generate_content(prompt)
    return response.text.strip()

@app.route('/start_interview', methods=['POST'])
def start_interview():
    global chat_history
    chat_history = []
    data = request.get_json()
    resume = data.get('resume')
    job_description = data.get('job_description')

    if not resume or not job_description:
        return jsonify({'error': 'Missing resume or job description'}), 400

    question = generate_initial_question(resume, job_description)
    chat_history.append({'role': 'AI', 'content': question})
    return jsonify({'question': question, 'chat_history': chat_history})

@app.route('/answer_question', methods=['POST'])
def answer_question():
    data = request.get_json()
    candidate_text = data.get('text')  # ✅ Receive text from React

    if not candidate_text:
        return jsonify({'error': 'Missing text data'}), 400

    # ✅ Append candidate's answer to chat history
    chat_history.append({'role': 'Candidate', 'content': candidate_text})

    # ✅ Generate follow-up question if less than 10 Q&A
    if len(chat_history) < 20:  # 10 questions, 10 answers.
        question = generate_followup_question(chat_history)
        chat_history.append({'role': 'AI', 'content': question})
        return jsonify({
            'question': question, 
            'chat_history': chat_history
        })
    else:
        # ✅ Interview ended
        return jsonify({
            'chat_history': chat_history, 
            'interview_ended': True
        })



@app.route('/end_interview', methods=['POST'])
def end_interview():
    evaluation = evaluate_interview(chat_history)
    return jsonify({'evaluation': evaluation, 'chat_history': chat_history})

if __name__ == '__main__':
    app.run(debug=True, port = 5001)
