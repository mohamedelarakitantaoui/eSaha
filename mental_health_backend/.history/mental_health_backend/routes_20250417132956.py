from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson.objectid import ObjectId
from datetime import datetime
from extensions import mongo
import openai
import json

chat_bp = Blueprint('chat', __name__)

# Chat endpoints
@chat_bp.route('/chat', methods=['POST'])
@jwt_required()
def chat():
    """Handle chat messages from users"""
    current_user = get_jwt_identity()
    data = request.get_json()
    
    if not data or 'message' not in data:
        return jsonify({"msg": "Missing message parameter"}), 400
    
    message = data.get('message')
    subject = data.get('subject', 'General')
    chat_id = data.get('chat_id')
    
    # Use the chat_id if provided, otherwise create a new chat session
    if not chat_id:
        # Create a new chat session
        chat_session = {
            'user_id': current_user,
            'title': message[:30] + '...' if len(message) > 30 else message,  # Use start of message as title
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        result = mongo.db.chat_sessions.insert_one(chat_session)
        chat_id = str(result.inserted_id)
    else:
        # Update the chat session's updated_at timestamp
        mongo.db.chat_sessions.update_one(
            {'_id': ObjectId(chat_id)},
            {'$set': {'updated_at': datetime.utcnow()}}
        )
    
    try:
        # Get API key from config
        api_key = current_app.config.get('OPENAI_API_KEY')
        if not api_key:
            return jsonify({"msg": "OpenAI API key not configured"}), 500
        
        openai.api_key = api_key
        
        # Get the system prompt from config
        system_prompt = current_app.config.get('MENTAL_HEALTH_SYSTEM_PROMPT', 
            "You are a supportive mental health companion. Your goal is to provide empathetic responses.")

        # Get the response from OpenAI
        client = openai.OpenAI(api_key=api_key)
        completion = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ]
        )
        
        ai_response = completion.choices[0].message.content
        
        # Store in MongoDB
        chat_message = {
            'chat_id': chat_id,
            'user_id': current_user,
            'message': message,
            'response': ai_response,
            'subject': subject,
            'timestamp': datetime.utcnow()
        }
        
        result = mongo.db.chats.insert_one(chat_message)
        chat_message['_id'] = str(result.inserted_id)
        
        # Convert ObjectId to string for JSON serialization
        chat_message['chat_id'] = chat_id
        chat_message['timestamp'] = chat_message['timestamp'].isoformat()
        
        return jsonify(chat_message)
    
    except Exception as e:
        current_app.logger.error(f"Error in chat: {str(e)}")
        return jsonify({"msg": f"Error processing chat: {str(e)}"}), 500

@chat_bp.route('/chat/sessions', methods=['GET'])
@jwt_required()
def get_chat_sessions():
    """Get all chat sessions for the current user"""
    current_user = get_jwt_identity()
    
    try:
        # Get all chat sessions for this user
        sessions = list(mongo.db.chat_sessions.find({'user_id': current_user}))
        
        # For each session, get the count of messages and the last message
        for session in sessions:
            session['id'] = str(session.pop('_id'))
            session['created_at'] = session['created_at'].isoformat()
            session['updated_at'] = session['updated_at'].isoformat()
            
            # Count messages in this chat
            message_count = mongo.db.chats.count_documents({'chat_id': session['id']})
            session['message_count'] = message_count
            
            # Get the last message if any
            if message_count > 0:
                last_message = mongo.db.chats.find_one(
                    {'chat_id': session['id']},
                    sort=[('timestamp', -1)]
                )
                if last_message:
                    session['last_message'] = last_message['message']
        
        return jsonify(sessions)
    
    except Exception as e:
        current_app.logger.error(f"Error getting chat sessions: {str(e)}")
        return jsonify({"msg": f"Error getting chat sessions: {str(e)}"}), 500

@chat_bp.route('/chat/sessions', methods=['POST'])
@jwt_required()
def create_chat_session():
    """Create a new chat session"""
    current_user = get_jwt_identity()
    data = request.get_json()
    
    title = data.get('title', 'New Chat')
    
    try:
        # Create a new chat session
        chat_session = {
            'user_id': current_user,
            'title': title,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        result = mongo.db.chat_sessions.insert_one(chat_session)
        chat_session['id'] = str(result.inserted_id)
        del chat_session['_id']
        
        # Convert dates to ISO format for JSON
        chat_session['created_at'] = chat_session['created_at'].isoformat()
        chat_session['updated_at'] = chat_session['updated_at'].isoformat()
        
        return jsonify(chat_session)
    
    except Exception as e:
        current_app.logger.error(f"Error creating chat session: {str(e)}")
        return jsonify({"msg": f"Error creating chat session: {str(e)}"}), 500

@chat_bp.route('/chat/history', methods=['GET'])
@jwt_required()
def chat_history():
    """Get chat history for the current user, optionally filtered by chat_id"""
    current_user = get_jwt_identity()
    chat_id = request.args.get('chat_id')
    
    try:
        # Prepare filter
        query_filter = {'user_id': current_user}
        if chat_id:
            query_filter['chat_id'] = chat_id
        
        # Get chat history from MongoDB
        chats = list(mongo.db.chats.find(query_filter).sort('timestamp', 1))
        
        # Convert ObjectId to string for JSON serialization
        for chat in chats:
            chat['_id'] = str(chat['_id'])
            if 'timestamp' in chat and isinstance(chat['timestamp'], datetime):
                chat['timestamp'] = chat['timestamp'].isoformat()
        
        return jsonify(chats)
    
    except Exception as e:
        current_app.logger.error(f"Error in chat history: {str(e)}")
        return jsonify({"msg": f"Error getting chat history: {str(e)}"}), 500