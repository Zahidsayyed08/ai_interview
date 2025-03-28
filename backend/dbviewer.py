from flask import Flask
from models import db, User, Resume, Video

app = Flask(__name__)

# Use the same database bindings as in main.py
app.config['SQLALCHEMY_BINDS'] = {
    'user': 'sqlite:///users.db',
    'resume': 'sqlite:///resumes.db',
    'video': 'sqlite:///videos.db'
}

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

# Use application context to query the database
with app.app_context():
    # Fetch all users
    users = User.query.all()
    print("Users:")
    for user in users:
        print(f"ID: {user.id}, Username: {user.username}, Email: {user.email}")

    # Fetch all resumes
    resumes = Resume.query.all()
    print("\nResumes:")
    for resume in resumes:
        print(f"Resume ID: {resume.resume_id}, User ID: {resume.user_id}, Text: {resume.resume_text}")

    # Fetch all videos
    videos = Video.query.all()
    print("\nVideos:")
    for video in videos:
        print(f"Video ID: {video.video_id}, User ID: {video.user_id}, Path: {video.video_path}")
