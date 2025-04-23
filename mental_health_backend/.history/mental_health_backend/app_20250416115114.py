import hmac
import werkzeug.security
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

# Fix for werkzeug.security.safe_str_cmp
if not hasattr(werkzeug.security, "safe_str_cmp"):
    werkzeug.security.safe_str_cmp = hmac.compare_digest

from flask import Flask, request, jsonify
from flask_cors import CORS
from config import Config
from models import db
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from extensions import mongo

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Initialize SQLAlchemy, JWT, and Flask-Migrate
    db.init_app(app)
    JWTManager(app)
    Migrate(app, db)

    # Configure and initialize PyMongo
    app.config["MONGO_URI"] = Config.MONGO_URI
    mongo.init_app(app)

    # Import blueprints after initializing extensions to avoid circular imports
    from auth import auth, chat_bp

    # Register blueprints - IMPORTANT: register chat_bp at /api, not /api/chat
    app.register_blueprint(auth, url_prefix='/api/auth')
    app.register_blueprint(chat_bp, url_prefix='/api')  # This is key - no /chat in the prefix

    # Debug endpoints
    @app.route('/debug/routes', methods=['GET'])
    def debug_routes():
        routes = []
        for rule in app.url_map.iter_rules():
            routes.append({
                'endpoint': rule.endpoint,
                'methods': list(rule.methods),
                'path': str(rule)
            })
        return jsonify(routes)

    # Health check endpoint
    @app.route('/health', methods=['GET'])
    def health_check():
        return jsonify({"status": "healthy"}), 200
        
    return app

app = create_app()

if __name__ == '__main__':
    with app.app_context():
        # Create all database tables if they don't exist
        db.create_all()
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)), debug=True)