from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt

db = SQLAlchemy()
bcrypt = Bcrypt()

# User Model (Stored in users.db)
class User(db.Model):
    __bind_key__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), nullable=False)


# Resume Model (Stored in resumes.db)
class Resume(db.Model):
    __bind_key__ = 'resume'
    resume_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False)  # Removed Foreign Key Constraint
    resume_text = db.Column(db.Text, nullable=False)
    uploaded_file_path = db.Column(db.String(200), nullable=True)

    # This method will fetch the user manually from the User database
    def get_user(self):
        from main import User
        return User.query.filter_by(id=self.user_id).first()


# Video Model (Stored in videos.db)
class Video(db.Model):
    __bind_key__ = 'video'
    video_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False)  # Removed Foreign Key Constraint
    video_path = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

    # This method will fetch the user manually from the User database
    def get_user(self):
        from main import User
        return User.query.filter_by(id=self.user_id).first()
