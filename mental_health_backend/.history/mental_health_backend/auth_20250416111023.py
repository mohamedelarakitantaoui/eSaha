from flask import Blueprint, request, jsonify
from models import db, User, Chat, bcrypt
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import openai
from config import Config
from datetime import datetime
from extensions import mongo
from supabase_client import supabase, verify_supabase_token
from functools import wraps

# Set the OpenAI API key
openai.api_key = Config.OPENAI_API_KEY

# Create blueprints
auth = Blueprint('auth', __name__)
chat_bp = Blueprint('chat', __name__)

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

# Debugging route to check token
@chat_bp.route('/token-check', methods=['GET'])
def token_check():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "Authorization header required"}), 401
    
    token = auth_header.split(' ')[1]
    user = verify_supabase_token(token)
    
    if not user:
        return jsonify({"error": "Invalid or expired token", "token_excerpt": f"{token[:10]}...{token[-10:]}"}), 401
    
    return jsonify({
        "success": True,
        "user_id": user.get('id'),
        "email": user.get('email')
    }), 200

# Modify your chat route to accept both JWT and Supabase tokens
@chat_bp.route('/chat', methods=['POST'])
def chat():
    print("DEBUG: POST /chat endpoint called")
    
    # Try JWT authentication first
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "Authorization header required"}), 401
    
    token = auth_header.split(' ')[1]
    
    # Try to verify as Supabase token
    user = verify_supabase_token(token)
    if user:
        # Supabase token is valid
        user_id = user.get('id')
    else:
        # Try to verify as JWT token
        try:
            from flask_jwt_extended import decode_token
            jwt_data = decode_token(token)
            user_id = jwt_data["sub"]
        except Exception as e:
            return jsonify({"error": "Invalid or expired token"}), 401
    
    # Rest of your chat function...
    data = request.get_json() or {}
    subject_val = data.get("subject", "General")
    user_message = data.get("message")
@chat_bp.route('/chat/history', methods=['GET'])
@supabase_auth_required
def get_chat_history():
    # Get user ID from Supabase token
    user_id = request.supabase_user.get('id')
    if not user_id:
        return jsonify({"error": "Could not extract user ID from token"}), 400
    
    chats_cursor = mongo.db.chats.find({"user_id": user_id}).sort("timestamp", -1)
    chat_history = []
    for chat in chats_cursor:
        chat['_id'] = str(chat['_id'])  # Convert ObjectId to string for JSON serialization
        chat['timestamp'] = chat['timestamp'].isoformat()
        chat_history.append(chat)
    return jsonify(chat_history), 200

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