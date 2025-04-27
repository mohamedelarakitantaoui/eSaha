@chat_bp.route('/chat/sessions', methods=['POST'])
def create_session():
    """Create a new chat session"""
    # Get the authorization header
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "Authorization header required"}), 401
    
    token = auth_header.split(' ')[1]
    
    # Try to get user from either Supabase or JWT token
    user = get_user_from_token(token)
    if not user:
        return jsonify({"error": "Invalid or expired token"}), 401
    
    # Get user ID
    user_id = user.get('id')
    if not user_id:
        return jsonify({"error": "Could not determine user ID from token"}), 401
    
    # Get session details from request
    data = request.get_json() or {}
    session_id = data.get('session_id')
    title = data.get('title', 'New Conversation')
    
    # Validate that we have a session ID
    if not session_id:
        return jsonify({"error": "Missing session_id parameter"}), 400
    
    # Ensure MongoDB connection is active
    from flask import current_app
    if not hasattr(mongo, 'db') or mongo.db is None:
        print("DEBUG: MongoDB connection not active, reinitializing...")
        init_mongo_client(current_app)
        
        # Double check if mongo.db is now available
        if not hasattr(mongo, 'db') or mongo.db is None:
            return jsonify({"error": "Database connection unavailable"}), 500
    
    try:
        # Check if this session already exists
        existing_session = mongo.db.chat_sessions.find_one({
            "user_id": str(user_id),
            "session_id": session_id
        })
        
        if existing_session:
            # Session already exists, return it
            existing_session['_id'] = str(existing_session['_id'])
            if 'created_at' in existing_session and isinstance(existing_session['created_at'], datetime):
                existing_session['created_at'] = existing_session['created_at'].isoformat()
            if 'updated_at' in existing_session and isinstance(existing_session['updated_at'], datetime):
                existing_session['updated_at'] = existing_session['updated_at'].isoformat()
            return jsonify(existing_session), 200
        
        # Create a new session entry in MongoDB
        session = {
            "user_id": str(user_id),
            "session_id": session_id,
            "title": title,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "message_count": 0
        }
        
        result = mongo.db.chat_sessions.insert_one(session)
        
        # Format response
        response = session.copy()
        response['_id'] = str(result.inserted_id)
        response['created_at'] = response['created_at'].isoformat()
        response['updated_at'] = response['updated_at'].isoformat()
        
        print(f"DEBUG: Successfully created new session with ID: {session_id}")
        return jsonify(response), 201
        
    except Exception as e:
        print(f"DEBUG: Error creating session: {str(e)}")
        return jsonify({"error": "Failed to create session", "details": str(e)}), 500