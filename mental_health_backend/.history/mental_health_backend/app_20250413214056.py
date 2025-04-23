import hmac
import werkzeug.security
if not hasattr(werkzeug.security, "safe_str_cmp"):
    werkzeug.security.safe_str_cmp = hmac.compare_digest

from flask import Flask, request, jsonify
from flask_cors import CORS
from config import Config
from models import db
from routes import auth, chat_bp
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from extensions import mongo
from supabase_client import verify_supabase_token

app = Flask(__name__)
app.config.from_object(Config)

# Enable CORS
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Initialize SQLAlchemy, JWT, and Flask-Migrate
db.init_app(app)
JWTManager(app)
Migrate(app, db)

# Configure and initialize PyMongo
app.config["MONGO_URI"] = "mongodb://localhost:27017/esaha"
mongo.init_app(app)

# Register blueprints
app.register_blueprint(auth, url_prefix='/api/auth')
app.register_blueprint(chat_bp, url_prefix='/api/chat')

# Supabase webhook handler (optional)
@app.route('/api/webhooks/supabase', methods=['POST'])
def supabase_webhook():
    # Verify the webhook signature if needed
    payload = request.json
    
    # Process different event types
    event_type = payload.get('type')
    
    # Example: handle user.created event
    if event_type == 'user.created':
        user_data = payload.get('data', {})
        # Do something with the new user data
        print(f"New user created: {user_data.get('email')}")
    
    return jsonify({"status": "success"}), 200

if __name__ == '__main__':
    app.run(debug=True)