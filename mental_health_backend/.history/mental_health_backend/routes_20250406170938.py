from flask import Blueprint, request, jsonify
from models import db, User, Chat, bcrypt
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import openai
from config import Config


# Set your OpenAI API key from the config
openai.api_key = Config.OPENAI_API_KEY

# Create Blueprints for auth and chat endpoints
auth = Blueprint('auth', __name__)
chat_bp = Blueprint('chat', __name__)

# -----------------------------
# Registration Endpoint
# -----------------------------
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

# -----------------------------
# Login Endpoint
# -----------------------------
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

# -----------------------------
# Chat Endpoint (Protected, without Marshmallow)
# -----------------------------
@chat_bp.route('/chat', methods=['POST'])
# For testing purposes, disable JWT requirement.
# Uncomment the following line in production:
# @jwt_required()
def chat():
    print("DEBUG: Chat endpoint called")
    data = request.get_json() or {}
    print("DEBUG: Received data =>", data, type(data))
    
    subject_val = data.get("subject")
    print("DEBUG: subject value (repr):", repr(subject_val), "and type:", type(subject_val))
    if not subject_val:
        data["subject"] = "General"
        subject_val = "General"
        print("DEBUG: No subject provided or falsy, defaulting to:", repr(subject_val))
    
    user_message = data.get("message")
    print("DEBUG: message value (repr):", repr(user_message), "and type:", type(user_message))
    
    if not isinstance(subject_val, str):
        print("DEBUG: subject is not a string, type:", type(subject_val))
        return jsonify({"error": "subject must be a string"}), 422
    if not isinstance(user_message, str):
        print("DEBUG: message is not a string, type:", type(user_message))
        return jsonify({"error": "message must be a string"}), 422

    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": user_message}],
            max_tokens=150,
            temperature=0.7
        )
        gpt_response = response.choices[0].message.content.strip()
        
        # For testing, use a default user_id (e.g., 1) since JWT is disabled.
        chat_entry = Chat(subject=subject_val, message=user_message, response=gpt_response, user_id=1)
        db.session.add(chat_entry)
        db.session.commit()
        
        return jsonify({"response": gpt_response}), 200
    except Exception as e:
        print("DEBUG: Exception:", str(e))
        return jsonify({"error": str(e)}), 500

@chat_bp.route('/history', methods=['GET'])
@jwt_required()
def get_chat_history():
    # Get the user_id from the JWT token
    user_id = get_jwt_identity()
    
    # Optional: add filtering parameters if needed (e.g., by subject or date)
    subject_filter = request.args.get("subject")
    
    # Query all chat records for the authenticated user
    query = Chat.query.filter_by(user_id=user_id)
    if subject_filter:
        query = query.filter(Chat.subject.ilike(f"%{subject_filter}%"))
    
    chats = query.order_by(Chat.timestamp.desc()).all()
    
    # Serialize the chat history into a list of dictionaries
    chat_history = []
    for chat in chats:
        chat_history.append({
            "id": chat.id,
            "subject": chat.subject,
            "message": chat.message,
            "response": chat.response,
            "timestamp": chat.timestamp.isoformat()
        })
    
    return jsonify({"history": chat_history}), 200s
