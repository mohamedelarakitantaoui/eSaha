from flask import Blueprint, request, jsonify, current_app
from models import db, User, Chat, bcrypt
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import openai
from config import Config
from datetime import datetime

# Set the OpenAI API key
openai.api_key = Config.OPENAI_API_KEY

auth = Blueprint('auth', __name__)
chat_bp = Blueprint('chat', __name__)

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

@chat_bp.route('/chat', methods=['POST'])
def chat():
    # Log request for debugging
    print("DEBUG: POST /chat endpoint called")
    data = request.get_json() or {}
    print("DEBUG: Received data =>", data)

    subject_val = data.get("subject", "General")
    user_message = data.get("message")

    if not isinstance(subject_val, str):
        return jsonify({"error": "subject must be a string"}), 422
    if not isinstance(user_message, str):
        return jsonify({"error": "message must be a string"}), 422

    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": user_message}],
            max_tokens=150,
            temperature=0.7
        )
        gpt_response = response.choices[0].message.content.strip()

        # For testing, we're using a default user_id=1.
        # In production, use: user_id = get_jwt_identity()
        user_id = 1

        # Create a chat document for MongoDB
        chat_document = {
            "user_id": user_id,
            "subject": subject_val,
            "message": user_message,
            "response": gpt_response,
            "timestamp": datetime.utcnow()
        }
        # Insert into MongoDB using PyMongo (accessed via current_app)
        mongo_instance = current_app.extensions["pymongo"]
        mongo_instance.db.chats.insert_one(chat_document)
        
        return jsonify({"response": gpt_response}), 200
    except Exception as e:
        import traceback
        traceback.print_exc()  # Prints the full traceback in the terminal
        return jsonify({"error": str(e)}), 500

@chat_bp.route('/chat/history', methods=['GET'])
def get_chat_history():
    # For testing, using a default user_id=1.
    # In production, replace with: user_id = get_jwt_identity()
    user_id = 1
    mongo_instance = current_app.extensions["pymongo"]
    chats_cursor = mongo_instance.db.chats.find({"user_id": user_id}).sort("timestamp", -1)
    chat_history = []
    for chat in chats_cursor:
        chat['_id'] = str(chat['_id'])  # Convert ObjectId to string for JSON serialization
        chat['timestamp'] = chat['timestamp'].isoformat()
        chat_history.append(chat)
    return jsonify(chat_history), 200
