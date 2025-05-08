# Modified section from app.py to fix blueprint registration

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

    # Register blueprints AFTER the app is created - FIXED REGISTRATION
    app.register_blueprint(auth, url_prefix='/api/auth')
    app.register_blueprint(auth_chat_bp, url_prefix='/api')  # Use the chat blueprint from auth.py
    app.register_blueprint(profile_bp, url_prefix='/api')
    app.register_blueprint(mood_bp, url_prefix='/api')
    app.register_blueprint(resources_bp, url_prefix='/api')
    app.register_blueprint(emergency_bp, url_prefix='/api')
    
    # IMPORTANT: Do NOT register the chat_bp from routes.py
    # This causes conflicting routes
    
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
    
    # Enhanced MongoDB debug endpoint
    @app.route('/debug/mongo', methods=['GET'])
    def debug_mongo():
        """Enhanced endpoint to check MongoDB connection"""
        try:
            if hasattr(mongo, 'db') and mongo.db is not None:
                # Try to access a collection to verify connection
                collections = mongo.db.list_collection_names()
                
                # Also check if we can query the chat_sessions collection
                try:
                    session_count = mongo.db.chat_sessions.count_documents({})
                    chat_count = mongo.db.chats.count_documents({})
                    
                    return jsonify({
                        "status": "connected",
                        "collections": collections,
                        "db_name": mongo.db.name,
                        "session_count": session_count,
                        "chat_count": chat_count
                    })
                except Exception as coll_err:
                    return jsonify({
                        "status": "connected",
                        "collections": collections,
                        "db_name": mongo.db.name,
                        "collection_error": str(coll_err)
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