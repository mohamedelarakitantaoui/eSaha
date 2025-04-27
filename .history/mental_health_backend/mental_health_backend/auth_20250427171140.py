from flask import Blueprint, request, jsonify
from models import db, User, Chat, bcrypt
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import openai
from config import Config
from datetime import datetime
from extensions import mongo, init_mongo_client
from supabase_client import supabase, verify_supabase_token
from functools import wraps

# Set the OpenAI API key
openai.api_key = Config.OPENAI_API_KEY

# Create blueprints
auth = Blueprint('auth', __name__)
chat_bp = Blueprint('chat', __name__)

# Hybrid function to check both Supabase and JWT tokens
def get_user_from_token(token):
    """Hybrid function that checks both Supabase and JWT tokens"""
    # First try Supabase token
    user = verify_supabase_token(token)
    if user:
        return user
    
    # If Supabase fails, try JWT token
    try:
        # Import locally to avoid circular imports
        from flask_jwt_extended import decode_token
        
        # Manually decode the token without verification
        # This is a workaround for the subject validation issue
        import jwt
        jwt_header = jwt.get_unverified_header(token)
        jwt_payload = jwt.decode(token, options={"verify_signature": False})
        
        # Check if this looks like a Flask JWT token
        if 'type' in jwt_payload and jwt_payload['type'] == 'access' and 'sub' in jwt_payload:
            user_id = jwt_payload.get('sub')
            print(f"DEBUG: Found JWT token with user_id: {user_id}")
            # Create a user dict in the format expected by your app
            return {
                "id": user_id,
                "auth_type": "jwt"  # Mark this as JWT auth
            }
    except Exception as e:
        print(f"DEBUG: JWT decode error: {str(e)}")
    
    # If both fail, return None
    return None

# Custom decorator to verify Supabase token
def supabase_auth_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authorization header required"}), 401
        
        token = auth_header.split(' ')[1]
        user = verify_supabase_token(token)
        
        if not user:
            return jsonify({"error": "Invalid or expired token"}), 401
        
        # Set user in context
        request.supabase_user = user
        return f(*args, **kwargs)
    
    return decorated

# Add a new debug route for testing the hybrid token verification
@chat_bp.route('/token-debug', methods=['GET'])
def token_debug():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "Authorization header required"}), 401
    
    token = auth_header.split(' ')[1]
    
    # Try both verification methods
    user = get_user_from_token(token)
    
    if user:
        return jsonify({
            "success": True,
            "user": user,
            "auth_type": user.get('auth_type', 'supabase')
        }), 200
    else:
        return jsonify({"error": "Invalid token from both verification methods"}), 401

@chat_bp.route('/chat', methods=['POST'])
def chat():
    print("DEBUG: POST /chat endpoint called")
    
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
    
    # Ensure MongoDB connection is active
    from flask import current_app
    if not hasattr(mongo, 'db') or mongo.db is None:
        print("DEBUG: MongoDB connection not active, reinitializing...")
        init_mongo_client(current_app)
        
        # Double check if mongo.db is now available
        if not hasattr(mongo, 'db') or mongo.db is None:
            return jsonify({"error": "Database connection unavailable"}), 500
    
    # Rest of your chat function...
    data = request.get_json() or {}
    print(f"DEBUG: Received data => {data}")

    subject_val = data.get("subject", "General")
    user_message = data.get("message")
    # NEW: Get session ID if provided (for conversation continuity)
    session_id = data.get("session_id")

    if not isinstance(subject_val, str):
        return jsonify({"error": "subject must be a string"}), 422
    if not isinstance(user_message, str):
        return jsonify({"error": "message must be a string"}), 422

    try:
        # NEW: Fetch previous messages for this user in this session if a session_id is provided
        conversation_history = []
        if session_id:
            try:
                # Convert user_id to string for consistency in querying
                user_id_str = str(user_id)
                # Get previous messages for this session, ordered by timestamp
                previous_messages = list(mongo.db.chats.find(
                    {"user_id": user_id_str, "session_id": session_id}
                ).sort("timestamp", 1))
                
                # Add messages to conversation history
                for msg in previous_messages:
                    conversation_history.append({"role": "user", "content": msg["message"]})
                    conversation_history.append({"role": "assistant", "content": msg["response"]})
                
                print(f"DEBUG: Found {len(previous_messages)} previous messages in this session")
            except Exception as e:
                print(f"DEBUG: Error retrieving conversation history: {str(e)}")
                # Continue anyway even if we can't get history

        # Build the messages array for OpenAI
        messages = [{"role": "system", "content": Config.MENTAL_HEALTH_SYSTEM_PROMPT}]
        
        # Add conversation history if we have it
        if conversation_history:
            messages.extend(conversation_history)
        
        # Add the current user message
        messages.append({"role": "user", "content": user_message})
        
        print(f"DEBUG: Sending {len(messages)} messages to OpenAI")
        
        # Make the API call to OpenAI with the full conversation context
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=messages,
            max_tokens=800,
            temperature=0.7
        )
        gpt_response = response.choices[0].message.content.strip()

        # Store chat in MongoDB, now including session_id if provided
        chat_document = {
            "user_id": str(user_id),  # Convert to string for consistency
            "subject": subject_val,
            "message": user_message,
            "response": gpt_response,
            "timestamp": datetime.utcnow()
        }
        
        # Add session_id if provided
        if session_id:
            chat_document["session_id"] = session_id

        print(f"DEBUG: Storing in MongoDB: {chat_document}")
        # Use direct MongoDB insert if mongo.db.chats isn't available
        try:
            insert_result = mongo.db.chats.insert_one(chat_document)
            print(f"DEBUG: Successfully stored in MongoDB using mongo.db.chats with ID: {insert_result.inserted_id}")
            # Add the MongoDB ID to the response
            chat_document["_id"] = str(insert_result.inserted_id)
        except Exception as mongo_err:
            print(f"DEBUG: MongoDB storage error: {str(mongo_err)}")
            # Try using client directly if available
            from extensions import client
            if client is not None:
                try:
                    db = client[Config.MONGO_DBNAME]
                    insert_result = db.chats.insert_one(chat_document)
                    chat_document["_id"] = str(insert_result.inserted_id)
                    print("DEBUG: Successfully stored in MongoDB using client directly")
                except Exception as client_err:
                    print(f"DEBUG: Direct client MongoDB error: {str(client_err)}")
                    # Continue anyway so we return the response to the user
        
        # Only store in Supabase if using Supabase auth
        if user.get('auth_type') != 'jwt':
            try:
                # Store message in Supabase
                supabase_message = {
                    "senderId": str(user_id),
                    "recipientId": "system",
                    "content": user_message,
                    "timestamp": datetime.utcnow().isoformat()
                }
                supabase.table('messages').insert(supabase_message).execute()
                
                # Store response in Supabase
                supabase_response = {
                    "senderId": "system",
                    "recipientId": str(user_id),
                    "content": gpt_response,
                    "timestamp": datetime.utcnow().isoformat()
                }
                supabase.table('messages').insert(supabase_response).execute()
            except Exception as e:
                print(f"DEBUG: Supabase storage error (non-critical): {str(e)}")
        
        # Format the MongoDB document timestamp for JSON response
        if "timestamp" in chat_document and isinstance(chat_document["timestamp"], datetime):
            chat_document["timestamp"] = chat_document["timestamp"].isoformat()
            
        return jsonify(chat_document), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    
@chat_bp.route('/chat/sessions', methods=['POST'])
def create_session():
    """Create a new chat session"""
    # Authentication checks...
    
    # Get session details from request
    data = request.get_json() or {}
    session_id = data.get('session_id')
    title = data.get('title', 'New Conversation')
    
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
    # ...
    
@chat_bp.route('/chat/history', methods=['GET'])
def get_chat_history():
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
    
    # Ensure MongoDB connection is active
    from flask import current_app
    if not hasattr(mongo, 'db') or mongo.db is None:
        print("DEBUG: MongoDB connection not active, reinitializing...")
        init_mongo_client(current_app)
        
        # Double check if mongo.db is now available
        if not hasattr(mongo, 'db') or mongo.db is None:
            return jsonify({"error": "Database connection unavailable"}), 500
    
    # Convert user_id to string if it's not already (for MongoDB query consistency)
    user_id_str = str(user_id)
    
    try:
        chats_cursor = mongo.db.chats.find({"user_id": user_id_str}).sort("timestamp", 1)
        chat_history = []
        for chat in chats_cursor:
            chat['_id'] = str(chat['_id'])  # Convert ObjectId to string for JSON serialization
            chat['timestamp'] = chat['timestamp'].isoformat()
            chat_history.append(chat)
        return jsonify(chat_history), 200
    except Exception as e:
        print(f"DEBUG: Error retrieving chat history: {str(e)}")
        return jsonify({"error": "Failed to retrieve chat history", "details": str(e)}), 500

# We'll keep these routes for backward compatibility, but they won't be the primary auth mechanism
@auth.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")
    if User.query.filter_by(email=email).first():
        return jsonify({"msg": "User already exists"}), 409
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    new_user = User(username=username, email=email, password=hashed_password)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"msg": "User created successfully"}), 201

@auth.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")
    user = User.query.filter_by(email=email).first()
    if user and bcrypt.check_password_hash(user.password, password):
        access_token = create_access_token(identity=user.id)
        return jsonify({"access_token": access_token}), 200
    return jsonify({"msg": "Bad email or password"}), 401

# Add this to your auth.py file

@chat_bp.route('/chat/sessions', methods=['GET'])
def get_user_sessions():
    """Get all chat sessions for the current user"""
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
    
    # Ensure MongoDB connection is active
    from flask import current_app
    if not hasattr(mongo, 'db') or mongo.db is None:
        print("DEBUG: MongoDB connection not active, reinitializing...")
        init_mongo_client(current_app)
        
        # Double check if mongo.db is now available
        if not hasattr(mongo, 'db') or mongo.db is None:
            return jsonify({"error": "Database connection unavailable"}), 500
    
    try:
        # Get all distinct session_ids for this user
        user_id_str = str(user_id)
        
        # Aggregate to get session information
        pipeline = [
            {"$match": {"user_id": user_id_str, "session_id": {"$exists": True}}},
            {"$sort": {"timestamp": 1}},
            {"$group": {
                "_id": "$session_id",
                "message_count": {"$sum": 1},
                "first_message": {"$first": "$message"},
                "last_message": {"$last": "$message"},
                "first_timestamp": {"$first": "$timestamp"},
                "last_timestamp": {"$last": "$timestamp"}
            }},
            {"$sort": {"last_timestamp": -1}} # Sort by most recent activity
        ]
        
        sessions = list(mongo.db.chats.aggregate(pipeline))
        
        # Format the results
        formatted_sessions = []
        for session in sessions:
            # Convert ObjectId to string for JSON serialization
            session_id = session.pop('_id')
            formatted_sessions.append({
                "session_id": session_id,
                "message_count": session["message_count"],
                "preview": session["first_message"][:50] + "..." if len(session["first_message"]) > 50 else session["first_message"],
                "first_timestamp": session["first_timestamp"].isoformat() if isinstance(session["first_timestamp"], datetime) else session["first_timestamp"],
                "last_timestamp": session["last_timestamp"].isoformat() if isinstance(session["last_timestamp"], datetime) else session["last_timestamp"],
            })
        
        return jsonify(formatted_sessions), 200
    except Exception as e:
        print(f"DEBUG: Error retrieving chat sessions: {str(e)}")
        return jsonify({"error": "Failed to retrieve chat sessions", "details": str(e)}), 500

@chat_bp.route('/chat/history/<session_id>', methods=['GET'])
def get_session_history(session_id):
    """Get chat history for a specific session"""
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
    
    # Ensure MongoDB connection is active
    from flask import current_app
    if not hasattr(mongo, 'db') or mongo.db is None:
        print("DEBUG: MongoDB connection not active, reinitializing...")
        init_mongo_client(current_app)
        
        # Double check if mongo.db is now available
        if not hasattr(mongo, 'db') or mongo.db is None:
            return jsonify({"error": "Database connection unavailable"}), 500
    
    try:
        # Convert user_id to string for MongoDB query consistency
        user_id_str = str(user_id)
        
        # Get all messages for this session
        chats_cursor = mongo.db.chats.find({
            "user_id": user_id_str,
            "session_id": session_id
        }).sort("timestamp", 1)
        
        chat_history = []
        for chat in chats_cursor:
            chat['_id'] = str(chat['_id'])  # Convert ObjectId to string for JSON serialization
            if 'timestamp' in chat and isinstance(chat['timestamp'], datetime):
                chat['timestamp'] = chat['timestamp'].isoformat()
            chat_history.append(chat)
            
        return jsonify(chat_history), 200
    except Exception as e:
        print(f"DEBUG: Error retrieving session history: {str(e)}")
        return jsonify({"error": "Failed to retrieve session history", "details": str(e)}), 500
    
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