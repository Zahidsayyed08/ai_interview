import os
from flask import Flask, request, jsonify, session, send_file
from flask_cors import CORS
from models import db, bcrypt, User, Resume, Video
from config import Config
from deepface import DeepFace
import PyPDF2
import io
import cv2
from pathlib import Path
from datetime import datetime
import uuid


app = Flask(__name__)
CORS(app, supports_credentials=True) 

eye_contact_time = 0
start_time = None
frame_count = 0


TEMP_FRAMES_DIR = "temp_frames"
VIDEO_OUTPUT_PATH = "static/output.mp4"

if not os.path.exists(TEMP_FRAMES_DIR):
    os.makedirs(TEMP_FRAMES_DIR)

# Load Configurations
app.config.from_object(Config)
app.config['SECRET_KEY'] = 'your_secret_key_here'
app.config['SESSION_TYPE'] = 'filesystem'  # Store sessions on the server
app.config['SESSION_PERMANENT'] = False  # Ensure session expires when browser is closed
app.config['SESSION_COOKIE_HTTPONLY'] = False  # Allow JS to access cookies if needed
app.config['SESSION_COOKIE_SAMESITE'] = "Lax"
app.config['SQLALCHEMY_BINDS'] = {
    'user': 'sqlite:///users.db',
    'resume': 'sqlite:///resumes.db',
    'video': 'sqlite:///videos.db'
}


app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///videos.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False


# Directory for temporary frames and videos
TEMP_FRAMES_DIR = "temp_frames"
VIDEO_OUTPUT_DIR = "static/videos"

if not os.path.exists(TEMP_FRAMES_DIR):
    os.makedirs(TEMP_FRAMES_DIR)
if not os.path.exists(VIDEO_OUTPUT_DIR):
    os.makedirs(VIDEO_OUTPUT_DIR)


# Initialize Databases (Only once)
db.init_app(app)
bcrypt.init_app(app)

# Create tables inside app context
with app.app_context():
    db.create_all(bind_key=['user', 'resume', 'video'])

# User Signup
@app.route('/signup', methods=['POST'])
def signup():
    data = request.json
    existing_user = User.query.filter_by(username=data['username']).first()
    if existing_user:
        return jsonify({"message": "User already exists"}), 400

    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    new_user = User(username=data['username'], email=data['email'], password=hashed_password, role=data['role'])
    
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": "User registered successfully"}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()  # Ensure JSON parsing
    print("Received login data:", data)  # Debugging

    if not data or 'username' not in data or 'password' not in data:
        return jsonify({"message": "Missing username or password"}), 400

    user = User.query.filter_by(username=data['username']).first()
    if user and bcrypt.check_password_hash(user.password, data['password']):
        session['user_id'] = user.id
        session['username'] = user.username
        session['role'] = user.role
        session.modified = True
        print("Session after login:", session)  # Debugging
        return jsonify({"message": "Login successful", "role": user.role, "username": user.username}), 200

    return jsonify({"message": "Invalid Credentials"}), 401


# User Logout
@app.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"message": "Logged out successfully"}), 200

# Fetch Users (Admin Only)
@app.route('/users', methods=['GET'])
def get_users():
    if 'user_id' not in session:
        return jsonify({"message": "Unauthorized. Please log in."}), 401

    if session.get('role') != 'admin':
        return jsonify({"message": "Forbidden. Admin access required."}), 403

    users = User.query.all()
    user_list = [{"id": user.id, "username": user.username, "email": user.email, "role": user.role} for user in users]
    return jsonify(user_list), 200

@app.route('/session_status', methods=['GET'])
def session_status():
    print("Session data in /session_status:", session)
    if "username" in session:
        return jsonify({"logged_in": True, "username": session["username"]})
    else:
        return jsonify({"logged_in": False})

def extract_text_from_pdf(file_stream):
    """Extract text from a PDF file stream using PyPDF2."""
    try:
        reader = PyPDF2.PdfReader(file_stream)
        extracted_text = ""
        for page in reader.pages:
            extracted_text += page.extract_text() or ""  # Extract text safely
        return extracted_text, None
    except Exception as e:
        return None, str(e)

# Upload Resume API
@app.route('/upload_resume', methods=['POST'])
def upload_resume():
    try:
        if 'user_id' not in session:
            return jsonify({"message": "Unauthorized. Please log in."}), 401

        user_id = session['user_id']
        # username = session.get("username")  # Use session username
        uploaded_file = request.files.get("resume")

        if not uploaded_file:
            return jsonify({"message": "No file uploaded"}), 400

        print(f"Received file: {uploaded_file.filename}")  # Debugging

        file_content = uploaded_file.read()
        file_size = len(file_content)  # Get actual file size
        print(f"Read file size: {file_size}")  # Debugging

        if file_size == 0:
            return jsonify({"message": "Uploaded file is empty. Please upload a valid PDF."}), 400

        extracted_text, error = extract_text_from_pdf(io.BytesIO(file_content))  # Pass as file-like object
        if error:
            return jsonify({"message": f"Error extracting text: {error}"}), 400

        existing_resume = Resume.query.filter_by(user_id=user_id).first()

        if existing_resume:
            existing_resume.resume_text = extracted_text
        else:
            new_resume = Resume(user_id=user_id, resume_text=extracted_text)
            db.session.add(new_resume)

        db.session.commit()
        return jsonify({"message": "Resume uploaded successfully"}), 200

    except Exception as e:
        print(f"Error: {e}")  # Debugging
        return jsonify({"message": f"Internal server error: {str(e)}"}), 500


# Fetch Resume
@app.route('/get_resume', methods=['GET'])
def get_resume():
    if 'user_id' not in session:
        return jsonify({"message": "Unauthorized. Please log in."}), 401

    user_id = session['user_id']  # Get user ID from session
    resume = Resume.query.filter_by(user_id=user_id).first()  # Use user_id instead of username

    if not resume:
        return jsonify({"message": "No resume found"}), 404

    return jsonify({"resume_text": resume.resume_text}), 200

@app.route('/upload_frame', methods=['POST'])
def upload_frame():
    file = request.files['frame']
    frame_count = len(os.listdir(TEMP_FRAMES_DIR))

    # Save frame
    frame_path = os.path.join(TEMP_FRAMES_DIR, f"frame_{frame_count:04d}.jpg")
    file.save(frame_path)

    # Analyze emotion
    frame = cv2.imread(frame_path)
    result = DeepFace.analyze(img_path=frame, actions=['emotion'], enforce_detection=False)
    emotions = result[0]['emotion']
    dominant_emotion = max(emotions, key=emotions.get)
    confidence = calculate_confidence(emotions)
    stress = calculate_stress(emotions)
    engagement = calculate_engagement(emotions)


    # Overlay text on frame
    cv2.putText(frame, f"Emotion: {dominant_emotion}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
    cv2.putText(frame, f"Confidence: {int(confidence)}%", (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 0), 2)
    cv2.putText(frame, f"Engagement: {int(engagement)}%", (10, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
    cv2.putText(frame, f"Stress: {int(stress)}%", (10, 120), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 0, 255), 2)
    cv2.imwrite(frame_path, frame)

    return jsonify({"Message": "Frame uploaded successfully", "frame_path": frame_path}),200


def calculate_confidence(emotions):
    # Calculate confidence
    confidence = 0
    for emotion in emotions:
        if emotion != 'neutral':
            confidence += emotions[emotion]
    return confidence

def calculate_engagement(emotions):
    # Calculate engagement
    engagement = 0
    for emotion in emotions:
        if emotion in ['happy', 'surprise']:
            engagement += emotions[emotion]
    return engagement

def calculate_stress(emotions):
    # Calculate stress
    stress = 0
    for emotion in emotions:
        if emotion in ['fear', 'anger', 'sad']:
            stress += emotions[emotion]
    return stress

def create_video(video_path):
    frame_paths = sorted([os.path.join(TEMP_FRAMES_DIR, f) for f in os.listdir(TEMP_FRAMES_DIR) if f.endswith(".jpg")])
    if not frame_paths:
        return False

    frame = cv2.imread(frame_paths[0])
    height, width, _ = frame.shape

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    video_writer = cv2.VideoWriter(video_path, fourcc, 10, (width, height))

    for frame_path in frame_paths:
        frame = cv2.imread(frame_path)
        video_writer.write(frame)

    video_writer.release()

    for frame_path in frame_paths:
        os.remove(frame_path)

    return True

# Route to stop and generate video
@app.route('/stop', methods=['GET'])
def stop():
    success = create_video(video_path=VIDEO_OUTPUT_PATH)  # Your function should now take `video_path`
    if success:
        return jsonify({"message": "Video created successfully", "video_path": VIDEO_OUTPUT_PATH})
    else:
        return jsonify({"message": "No frames found, video not created"})
# def stop(): 
#     user_id = session.get('user_id')

#     if not user_id:
#         return jsonify({"error": "User ID is required"}), 400

#     # Generate a unique filename using timestamp and UUID
#     filename = f"user_{user_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:6]}.mp4"
#     video_path = os.path.join(VIDEO_OUTPUT_PATH, filename)

#     success = create_video(video_path)  # Your function should now take `video_path`

#     if success:
#         with app.app_context():
#             new_video = Video(user_id=user_id, video_path=video_path)
#             db.session.add(new_video)
#             db.session.commit()

#         return jsonify({"message": "Video saved successfully", "video_path": video_path})
    
#     return jsonify({"error": "No frames found, video not created"}), 400

# Route to download the video
@app.route('/download/', methods=['GET'])
def download():
    for file in Path(TEMP_FRAMES_DIR).glob("*.jpg"):  # Adjust file type if needed
            os.remove(file)
    return send_file(VIDEO_OUTPUT_PATH, as_attachment=True)

# @app.route('/download', methods=['GET'])
# def download():
#     user_id = request.args.get("user_id")  # Get user ID from request query parameters

#     if not user_id:
#         return jsonify({"error": "User ID is required"}), 400

#     # Fetch the latest video for the user
#     latest_video = Video.query.filter_by(user_id=user_id).order_by(Video.created_at.desc()).first()

#     if not latest_video:
#         return jsonify({"error": "No video found for this user"}), 404

#     video_path = latest_video.video_path

#     # Check if file exists
#     if not os.path.exists(video_path):
#         return jsonify({"error": "Video file not found"}), 404

#     # Delete temporary frame files
#     for file in Path(TEMP_FRAMES_DIR).glob("*.jpg"):  # Adjust file type if needed
#         os.remove(file)

#     return send_file(video_path, as_attachment=True)



if __name__ == '__main__':
    if not os.path.exists('static'):
        os.makedirs('static')
    app.run(debug=True, port=5000)



