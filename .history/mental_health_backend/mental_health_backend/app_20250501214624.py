import hmac
import werkzeug.security
from dotenv import load_dotenv
import os
import atexit
import signal
from resources import resources_bp
from mood import mood_bp
from profile import profile_bp
from emergency import emergency_bp  # Import the emergency blueprint
from auth import auth, chat_bp as auth_chat_bp

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
from extensions import mongo, init_mongo_client, client

# Flag to track if cleanup has been performed
cleanup_performed = False

# Define shutdown cleanup function
def shutdown_cleanup():
    """Clean up resources when the application shuts down"""
    global client, cleanup_performed
    if cleanup_performed:
        return
    
    if client:
        print("Closing MongoDB connection...")
        client.close()
    print("Cleanup complete")
    cleanup_performed = True

# Register the cleanup function
atexit.register(shutdown_cleanup)

# For handling keyboard interrupts
def signal_handler(sig, frame):
    print("Shutting down gracefully...")
    shutdown_cleanup()
    # Force exit without stack trace
    os._exit(0)  # Use os._exit instead of sys.exit

# Register signal handlers for graceful shutdown
signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

def create_app():
    # Create the Flask app FIRST
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
    
    # Explicitly initialize MongoDB connection
    with app.app_context():
        # Try the direct MongoDB connection if Flask-PyMongo isn't working
        if not hasattr(mongo, 'db') or mongo.db is None:
            print("DEBUG: Flask-PyMongo not properly initialized, trying direct connection")
            init_mongo_client(app)

    # Import blueprints after initializing extensions to avoid circular imports
    from auth import auth, chat_bp

    # Register all blueprints AFTER the app is created
    app.register_blueprint(auth, url_prefix='/api/auth')
    app.register_blueprint(chat_bp, url_prefix='/api')  # Keep the chat blueprint from auth.py
    app.register_blueprint(profile_bp, url_prefix='/api')
    app.register_blueprint(mood_bp, url_prefix='/api')
    app.register_blueprint(resources_bp, url_prefix='/api')
    app.register_blueprint(emergency_bp, url_prefix='/api')  # Register the emergency blueprint
    
    # Do NOT register the chat blueprint from routes.py
    # Or you can use a different endpoint name if you need both

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
    
    @app.route('/debug/mongo', methods=['GET'])
    def debug_mongo():
        """Endpoint to check MongoDB connection"""
        try:
            if hasattr(mongo, 'db') and mongo.db is not None:
                # Try to access a collection to verify connection
                collections = mongo.db.list_collection_names()
                return jsonify({
                    "status": "connected",
                    "collections": collections,
                    "db_name": mongo.db.name
                })
            else:
                return jsonify({
                    "status": "disconnected",
                    "error": "mongo.db is None"
                }), 500
        except Exception as e:
            return jsonify({
                "status": "error",
                "message": str(e)
            }), 500

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
        
        # Ensure MongoDB is connected
        if not hasattr(mongo, 'db') or mongo.db is None:
            print("DEBUG: Initializing MongoDB connection on startup")
            init_mongo_client(app)
    
    # Improved run configuration for better shutdown handling
    app.run(
        host='0.0.0.0', 
        port=int(os.environ.get('PORT', 5000)), 
        debug=os.environ.get('FLASK_DEBUG', 'True').lower() == 'true',
        threaded=False,
        use_reloader=False  # Disable reloader to prevent duplicate processes
    )