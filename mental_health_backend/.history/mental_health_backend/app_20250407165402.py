import hmac
import werkzeug.security
if not hasattr(werkzeug.security, "safe_str_cmp"):
    werkzeug.security.safe_str_cmp = hmac.compare_digest

from flask import Flask
from config import Config
from models import db
from routes import auth, chat_bp
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from flask_pymongo import PyMongo  # Added import

app = Flask(__name__)
app.config.from_object(Config)

# Initialize SQLAlchemy and JWT
db.init_app(app)
JWTManager(app)
Migrate(app, db)

# Configure and initialize PyMongo
app.config["MONGO_URI"] = "mongodb://localhost:27017/your_mongo_db_name"  # Update this URI as needed
mongo = PyMongo(app)

app.register_blueprint(auth, url_prefix='/api/auth')
app.register_blueprint(chat_bp, url_prefix='/api/chat')

if __name__ == '__main__':
    app.run(debug=True)
