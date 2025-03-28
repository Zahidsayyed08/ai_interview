class Config:
    SECRET_KEY = 'your_secret_key'  
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Bind Multiple Databases
    SQLALCHEMY_BINDS = {
        'user': 'sqlite:///user.db',
        'resume': 'sqlite:///resume.db',
        'video': 'sqlite:///video.db'
    }
