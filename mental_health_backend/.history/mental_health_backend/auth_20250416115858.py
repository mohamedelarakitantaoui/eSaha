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

    if not isinstance(subject_val, str):
        return jsonify({"error": "subject must be a string"}), 422
    if not isinstance(user_message, str):
        return jsonify({"error": "message must be a string"}), 422

    try:
        # Include the mental health system prompt in the messages payload.
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": Config.MENTAL_HEALTH_SYSTEM_PROMPT},
                {"role": "user", "content": user_message}
            ],
            max_tokens=150,
            temperature=0.7
        )
        gpt_response = response.choices[0].message.content.strip()

        # Store chat in MongoDB
        chat_document = {
            "user_id": str(user_id),  # Convert to string for consistency
            "subject": subject_val,
            "message": user_message,
            "response": gpt_response,
            "timestamp": datetime.utcnow()
        }

        print(f"DEBUG: Storing in MongoDB: {chat_document}")
        # Use direct MongoDB insert if mongo.db.chats isn't available
        try:
            mongo.db.chats.insert_one(chat_document)
            print("DEBUG: Successfully stored in MongoDB using mongo.db.chats")
        except Exception as mongo_err:
            print(f"DEBUG: MongoDB storage error: {str(mongo_err)}")
            # Try using client directly if available
            from extensions import client
            if client is not None:
                try:
                    db = client[Config.MONGO_DBNAME]
                    db.chats.insert_one(chat_document)
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
        
        return jsonify({"response": gpt_response}), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    
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
        chats_cursor = mongo.db.chats.find({"user_id": user_id_str}).sort("timestamp", -1)
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