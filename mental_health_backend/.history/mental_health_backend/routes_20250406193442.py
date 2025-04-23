from flask import Blueprint, request, jsonify
from models import db, User, Chat, bcrypt
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import openai
from config import Config

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
    print("DEBUG: POST /chat endpoint called")
    data = request.get_json() or {}
    print("DEBUG: Received data =>", data)

    subject_val = data.get("subject")
    if not subject_val:
        subject_val = "General"
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
        
        # Using a default user_id=1 for testing if @jwt_required is disabled
        chat_entry = Chat(subject=subject_val, message=user_message, response=gpt_response, user_id=1)
        db.session.add(chat_entry)
        db.session.commit()
        
        return jsonify({"response": gpt_response}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@chat_bp.route('/history', methods=['GET'])
@jwt_required()
def get_chat_history():
    print("DEBUG: GET /history endpoint called")
    user_id = get_jwt_identity()
    print("DEBUG: JWT user_id =>", user_id)

    subject_filter = request.args.get("subject", type=str, default=None)
    print("DEBUG: subject_filter =>", subject_filter)

    query = Chat.query.filter_by(user_id=user_id)
    if subject_filter:
        query = query.filter(Chat.subject.ilike(f"%{subject_filter}%"))

    chats = query.order_by(Chat.timestamp.desc()).all()
    print("DEBUG: Retrieved", len(chats), "chats")

    chat_history = [{
        "id": c.id,
        "subject": c.subject,
        "message": c.message,
        "response": c.response,
        "timestamp": c.timestamp.isoformat()
    } for c in chats]

    return jsonify({"history": chat_history}), 200

