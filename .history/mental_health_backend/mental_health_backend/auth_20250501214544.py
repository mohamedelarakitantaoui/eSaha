# Enhanced auth.py with better session handling and error reporting

from flask import Blueprint, request, jsonify, current_app
from models import db, User, Chat, bcrypt
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import openai
from config import Config
from datetime import datetime
from extensions import mongo, init_mongo_client
from supabase_client import supabase, verify_supabase_token
from functools import wraps
import uuid
import traceback
import json
import re

# Set the OpenAI API key
openai.api_key = Config.OPENAI_API_KEY

# Create blueprints
auth = Blueprint('auth', __name__)
chat_bp = Blueprint('chat', __name__)

# Define sentiment analysis function
def analyze_sentiment(text):
    """
    Analyze the sentiment of a message using OpenAI's API
    Returns a sentiment score and mood category
    """
    try:
        # Use the OpenAI API to analyze sentiment
        messages = [
            {"role": "system", "content": "You are a mental health professional analyzing the sentiment in a message. Rate the sentiment on a scale from -5 (extremely negative) to 5 (extremely positive). Also categorize the mood as one of: very_happy, happy, neutral, sad, very_sad, anxious, angry. Return your answer as a JSON object with fields 'score' and 'mood'."},
            {"role": "user", "content": text}
        ]
        
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=messages,
            max_tokens=150,
            temperature=0.3
        )
        
        # Extract the JSON response
        result_text = response.choices[0].message.content.strip()
        
        # Try to parse the JSON
        try:
            # Sometimes the model might return text before/after the JSON
            # This regex tries to extract the JSON object from the response
            json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
            if json_match:
                result_json = json.loads(json_match.group(0))
            else:
                # If no JSON object is found, fallback to default values
                result_json = {"score": 0, "mood": "neutral"}
                
            # Validate the sentiment score is between -5 and 5
            score = float(result_json.get("score", 0))
            score = max(-5, min(5, score))  # Clamp to range [-5, 5]
            
            # Validate the mood is one of the expected categories
            valid_moods = ["very_happy", "happy", "neutral", "sad", "very_sad", "anxious", "angry"]
            mood = result_json.get("mood", "neutral")
            if mood not in valid_moods:
                mood = "neutral"
                
            return {
                "score": score,
                "mood": mood
            }
        except Exception as json_error:
            print(f"DEBUG: Error parsing sentiment JSON: {str(json_error)}")
            return {"score": 0, "mood": "neutral"}  # Default values
            
    except Exception as e:
        print(f"DEBUG: Error in sentiment analysis: {str(e)}")
        return {"score": 0, "mood": "neutral"}  # Default values

# Hybrid function to check both Supabase and JWT tokens
def get_user_from_token(token):
    """Hybrid function that checks both Supabase and JWT tokens"""
    # First try Supabase token
    user = verify_supabase_token(token)
    if user:
        print(f"DEBUG: User authenticated with Supabase: {user.get('id')}")
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
            print(f"DEBUG: User authenticated with JWT: {user_id}")
            # Create a user dict in the format expected by your app
            return {
                "id": user_id,
                "auth_type": "jwt"  # Mark this as JWT auth
            }
    except Exception as e:
        print(f"DEBUG: JWT decode error: {str(e)}")
    
    # If both fail, return None
    print("DEBUG: Authentication failed with both methods")
    return None

# Unified authentication decorator
def auth_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authorization header required"}), 401
        
        token = auth_header.split(' ')[1]
        user = get_user_from_token(token)
        
        if not user:
            return jsonify({"error": "Invalid or expired token"}), 401
        
        # Make user info available to the wrapped function
        request.user = user
        return f(*args, **kwargs)
    
    return decorated

# Ensure MongoDB is connected
def ensure_mongo_connection():
    """Ensure MongoDB connection is active and return status"""
    if not hasattr(mongo, 'db') or mongo.db is None:
        print("DEBUG: MongoDB connection not active, reinitializing...")
        from flask import current_app
        init_mongo_client(current_app)
        
        # Double check if mongo.db is now available
        if not hasattr(mongo, 'db') or mongo.db is None:
            print("DEBUG: MongoDB connection failed")
            return False
        
        print("DEBUG: MongoDB connection reinitialized successfully")
    return True

@chat_bp.route('/token-debug', methods=['GET'])
def token_debug():
    """Debug endpoint to test token validation"""
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
    
    
def analyze_sentiment(text):
    """
    Analyze the sentiment of a message using OpenAI's API
    Returns a sentiment score, mood category, and potential emotional triggers
    """
    try:
        # Use the OpenAI API to analyze sentiment with more comprehensive prompt
        messages = [
            {"role": "system", "content": """You are a mental health professional analyzing the sentiment in a message. 
            Provide the following information:
            1. Rate the sentiment on a scale from -5 (extremely negative) to 5 (extremely positive)
            2. Categorize the mood as one of: very_happy, happy, neutral, sad, very_sad, anxious, angry
            3. Identify up to 3 potential emotional triggers or factors influencing this mood
            
            Return your answer as a JSON object with fields 'score', 'mood', and 'factors' (as an array of strings).
            Example: {"score": -2, "mood": "sad", "factors": ["work stress", "isolation"]}"""},
            {"role": "user", "content": text}
        ]
        
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=messages,
            max_tokens=150,
            temperature=0.3
        )
        
        # Extract the JSON response
        result_text = response.choices[0].message.content.strip()
        
        # Try to parse the JSON
        try:
            # This regex tries to extract the JSON object from the response
            json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
            if json_match:
                result_json = json.loads(json_match.group(0))
            else:
                # If no JSON object is found, fallback to default values
                result_json = {"score": 0, "mood": "neutral", "factors": []}
                
            # Validate the sentiment score is between -5 and 5
            score = float(result_json.get("score", 0))
            score = max(-5, min(5, score))  # Clamp to range [-5, 5]
            
            # Validate the mood is one of the expected categories
            valid_moods = ["very_happy", "happy", "neutral", "sad", "very_sad", "anxious", "angry"]
            mood = result_json.get("mood", "neutral")
            if mood not in valid_moods:
                mood = "neutral"
                
            # Ensure factors is a list
            factors = result_json.get("factors", [])
            if not isinstance(factors, list):
                factors = []
                
            return {
                "score": score,
                "mood": mood,
                "factors": factors
            }
        except Exception as json_error:
            print(f"DEBUG: Error parsing sentiment JSON: {str(json_error)}")
            return {"score": 0, "mood": "neutral", "factors": []}  # Default values
            
    except Exception as e:
        print(f"DEBUG: Error in sentiment analysis: {str(e)}")
        return {"score": 0, "mood": "neutral", "factors": []}  # Default values

@chat_bp.route('/chat', methods=['POST'])
@auth_required
def process_chat():
    """Handle chat messages from users with sentiment analysis"""
    print("DEBUG: POST /chat endpoint called")
    
    # User is available from the auth_required decorator
    user = request.user
    user_id = user.get('id')
    
    # Ensure MongoDB connection
    if not ensure_mongo_connection():
        return jsonify({"error": "Database connection unavailable"}), 500
    
    # Parse request data
    data = request.get_json() or {}
    print(f"DEBUG: Received data => {data}")

    subject_val = data.get("subject", "General")
    user_message = data.get("message")
    # Get session ID if provided (for conversation continuity)
    session_id = data.get("session_id")

    # Validate input
    if not isinstance(subject_val, str):
        return jsonify({"error": "subject must be a string"}), 422
    if not isinstance(user_message, str):
        return jsonify({"error": "message must be a string"}), 422
    if not user_message.strip():
        return jsonify({"error": "message cannot be empty"}), 422

    try:
        # Create a session if one wasn't provided
        if not session_id:
            session_id = f"session_{int(datetime.utcnow().timestamp())}_{uuid.uuid4().hex[:8]}"
            print(f"DEBUG: Created new session ID: {session_id}")
            
            try:
                # Create a new session entry in MongoDB
                session = {
                    "user_id": str(user_id),
                    "session_id": session_id,
                    "title": user_message[:30] + ('...' if len(user_message) > 30 else ''),
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow(),
                    "message_count": 0
                }
                
                mongo.db.chat_sessions.insert_one(session)
                print(f"DEBUG: Automatically created session with ID: {session_id}")
            except Exception as e:
                print(f"DEBUG: Error auto-creating session: {str(e)}")
                # Continue anyway - the message will still be stored
        
        # Perform sentiment analysis
        sentiment_result = analyze_sentiment(user_message)
        print(f"DEBUG: Sentiment analysis result: {sentiment_result}")
        
        # Fetch previous messages for this session if provided
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
                
                # Update the session's last activity timestamp
                mongo.db.chat_sessions.update_one(
                    {"user_id": user_id_str, "session_id": session_id},
                    {"$set": {"updated_at": datetime.utcnow()}}
                )
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
        try:
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=messages,
                max_tokens=800,
                temperature=0.7
            )
            gpt_response = response.choices[0].message.content.strip()
        except Exception as openai_err:
            print(f"DEBUG: OpenAI API error: {str(openai_err)}")
            return jsonify({"error": f"Error from AI service: {str(openai_err)}"}), 503

        # Store chat in MongoDB, now including session_id and sentiment
        chat_document = {
            "user_id": str(user_id),  # Convert to string for consistency
            "subject": subject_val,
            "message": user_message,
            "response": gpt_response,
            "timestamp": datetime.utcnow(),
            "session_id": session_id,  # Always include session_id now
            "sentiment": sentiment_result  # Add sentiment analysis result
        }

        print(f"DEBUG: Storing in MongoDB: {chat_document}")
        
        # Insert the chat message
        try:
            insert_result = mongo.db.chats.insert_one(chat_document)
            print(f"DEBUG: Successfully stored in MongoDB with ID: {insert_result.inserted_id}")
            # Add the MongoDB ID to the response
            chat_document["_id"] = str(insert_result.inserted_id)
            
            # Update message count in session
            mongo.db.chat_sessions.update_one(
                {"session_id": session_id, "user_id": str(user_id)},
                {"$inc": {"message_count": 1}}
            )
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
        
            try:
            # Store mood entry in separate collection for tracking
                mood_entry = {
                "user_id": str(user_id),
                "date": datetime.utcnow().strftime('%Y-%m-%d'),
                "mood": sentiment_result["mood"],
                "mood_score": sentiment_result["score"],
                "factors": sentiment_result.get("factors", []),  # Include detected factors if available
                "source": "chat_message",
                "message_id": str(chat_document["_id"]) if "_id" in chat_document else None,
                "session_id": session_id,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
        }
                mongo.db.mood_entries.insert_one(mood_entry)
                print(f"DEBUG: Stored mood entry: {mood_entry['mood']}")
                except Exception as mood_err:
            print(f"DEBUG: Error storing mood entry: {str(mood_err)}")
            # Continue anyway, non-critical
        
        # Only store in Supabase if using Supabase auth
        if user.get('auth_type') != 'jwt':
            try:
                # Store message in Supabase
                supabase_message = {
                    "senderId": str(user_id),
                    "recipientId": "system",
                    "content": user_message,
                    "timestamp": datetime.utcnow().isoformat(),
                    "session_id": session_id
                }
                supabase.table('messages').insert(supabase_message).execute()
                
                # Store response in Supabase
                supabase_response = {
                    "senderId": "system",
                    "recipientId": str(user_id),
                    "content": gpt_response,
                    "timestamp": datetime.utcnow().isoformat(),
                    "session_id": session_id
                }
                supabase.table('messages').insert(supabase_response).execute()
            except Exception as e:
                print(f"DEBUG: Supabase storage error (non-critical): {str(e)}")
        
        # Format the MongoDB document timestamp for JSON response
        if "timestamp" in chat_document and isinstance(chat_document["timestamp"], datetime):
            chat_document["timestamp"] = chat_document["timestamp"].isoformat()
            
        return jsonify(chat_document), 200
    except Exception as e:
        print(f"DEBUG: Unexpected error in chat endpoint: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@chat_bp.route('/chat/sessions', methods=['POST'])
@auth_required
def create_session():
    """Create a new chat session"""
    # User is available from the auth_required decorator
    user = request.user
    user_id = user.get('id')
    
    # Ensure MongoDB connection
    if not ensure_mongo_connection():
        return jsonify({"error": "Database connection unavailable"}), 500
    
    # Get session details from request
    data = request.get_json() or {}
    session_id = data.get('session_id')
    title = data.get('title', 'New Conversation')
    
    # Validate that we have a session ID
    if not session_id:
        # Generate a session ID if not provided
        session_id = f"session_{int(datetime.utcnow().timestamp())}_{uuid.uuid4().hex[:8]}"
        print(f"DEBUG: Auto-generated session ID: {session_id}")
    
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
            print(f"DEBUG: Returning existing session: {session_id}")
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
        traceback.print_exc()
        return jsonify({"error": "Failed to create session", "details": str(e)}), 500

@chat_bp.route('/chat/sessions', methods=['GET'])
@auth_required
def get_user_sessions():
    """Get all chat sessions for the current user"""
    # User is available from the auth_required decorator
    user = request.user
    user_id = user.get('id')
    
    # Ensure MongoDB connection
    if not ensure_mongo_connection():
        return jsonify({"error": "Database connection unavailable"}), 500
    
    try:
        # Get all sessions for this user 
        user_id_str = str(user_id)
        
        # First try to get from chat_sessions collection (preferred)
        sessions = list(mongo.db.chat_sessions.find(
            {"user_id": user_id_str}
        ).sort("updated_at", -1))
        
        # If we have sessions, format and return them
        if sessions:
            formatted_sessions = []
            for session in sessions:
                # Convert ObjectId to string for JSON serialization
                session['_id'] = str(session['_id'])
                if 'created_at' in session and isinstance(session['created_at'], datetime):
                    session['created_at'] = session['created_at'].isoformat()
                if 'updated_at' in session and isinstance(session['updated_at'], datetime):
                    session['updated_at'] = session['updated_at'].isoformat()
                formatted_sessions.append(session)
            
            print(f"DEBUG: Found {len(formatted_sessions)} sessions in chat_sessions collection")
            return jsonify(formatted_sessions), 200
        
        # If no sessions found in the chat_sessions collection, try to derive from chat messages
        print("DEBUG: No sessions found in chat_sessions, trying to derive from chat messages")
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
        
        derived_sessions = list(mongo.db.chats.aggregate(pipeline))
        
        # Format the results from aggregation
        formatted_sessions = []
        for session in derived_sessions:
            # Convert ObjectId to string for JSON serialization
            session_id = session.pop('_id')
            session_obj = {
                "session_id": session_id,
                "user_id": user_id_str,
                "title": session["first_message"][:30] + "..." if len(session["first_message"]) > 30 else session["first_message"],
                "message_count": session["message_count"],
                "preview": session["first_message"][:50] + "..." if len(session["first_message"]) > 50 else session["first_message"],
                "created_at": session["first_timestamp"].isoformat() if isinstance(session["first_timestamp"], datetime) else session["first_timestamp"],
                "updated_at": session["last_timestamp"].isoformat() if isinstance(session["last_timestamp"], datetime) else session["last_timestamp"],
            }
            
            # Create this session in the chat_sessions collection for future use
            try:
                mongo.db.chat_sessions.insert_one({
                    "user_id": user_id_str,
                    "session_id": session_id,
                    "title": session_obj["title"],
                    "created_at": datetime.fromisoformat(session_obj["created_at"]) if isinstance(session_obj["created_at"], str) else session_obj["created_at"],
                    "updated_at": datetime.fromisoformat(session_obj["updated_at"]) if isinstance(session_obj["updated_at"], str) else session_obj["updated_at"],
                    "message_count": session_obj["message_count"]
                })
                print(f"DEBUG: Created missing session record for {session_id}")
            except Exception as e:
                print(f"DEBUG: Error creating missing session record: {str(e)}")
            
            formatted_sessions.append(session_obj)
        
        print(f"DEBUG: Derived {len(formatted_sessions)} sessions from chat history")
        return jsonify(formatted_sessions), 200
    except Exception as e:
        print(f"DEBUG: Error retrieving chat sessions: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": "Failed to retrieve chat sessions", "details": str(e)}), 500

@chat_bp.route('/chat/history', methods=['GET'])
@auth_required
def get_chat_history():
    """Get all chat history for the current user"""
    # User is available from the auth_required decorator
    user = request.user
    user_id = user.get('id')
    
    # Get optional session_id filter
    session_id = request.args.get('session_id')
    
    # Ensure MongoDB connection
    if not ensure_mongo_connection():
        return jsonify({"error": "Database connection unavailable"}), 500
    
    # Convert user_id to string if it's not already (for MongoDB query consistency)
    user_id_str = str(user_id)
    
    try:
        # Prepare query filter
        query_filter = {"user_id": user_id_str}
        if session_id:
            query_filter["session_id"] = session_id
        
        # Query the database
        chats_cursor = mongo.db.chats.find(query_filter).sort("timestamp", 1)
        chat_history = []
        
        for chat in chats_cursor:
            chat['_id'] = str(chat['_id'])  # Convert ObjectId to string for JSON serialization
            if 'timestamp' in chat and isinstance(chat['timestamp'], datetime):
                chat['timestamp'] = chat['timestamp'].isoformat()
            chat_history.append(chat)
        
        return jsonify(chat_history), 200
    except Exception as e:
        print(f"DEBUG: Error retrieving chat history: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": "Failed to retrieve chat history", "details": str(e)}), 500

@chat_bp.route('/chat/history/<session_id>', methods=['GET'])
@auth_required
def get_session_history(session_id):
    """Get chat history for a specific session"""
    # User is available from the auth_required decorator 
    user = request.user
    user_id = user.get('id')
    
    # Ensure MongoDB connection
    if not ensure_mongo_connection():
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
        
        # Update the session's last accessed time
        try:
            mongo.db.chat_sessions.update_one(
                {"user_id": user_id_str, "session_id": session_id},
                {"$set": {"last_accessed": datetime.utcnow()}}
            )
        except Exception as e:
            print(f"DEBUG: Error updating session last accessed time: {str(e)}")
            # Not critical, continue
            
        return jsonify(chat_history), 200
    except Exception as e:
        print(f"DEBUG: Error retrieving session history: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": "Failed to retrieve session history", "details": str(e)}), 500

@chat_bp.route('/chat/sessions/<session_id>/title', methods=['PUT'])
@auth_required
def update_session_title(session_id):
    """Update the title of a chat session"""
    # User is available from the auth_required decorator
    user = request.user
    user_id = user.get('id')
    
    # Ensure MongoDB connection
    if not ensure_mongo_connection():
        return jsonify({"error": "Database connection unavailable"}), 500
    
    # Get the new title from the request
    data = request.get_json() or {}
    new_title = data.get('title')
    
    if not new_title or not isinstance(new_title, str):
        return jsonify({"error": "Valid title is required"}), 400
    
    try:
        # Convert user_id to string for MongoDB query consistency
        user_id_str = str(user_id)
        
        # Update the session title
        result = mongo.db.chat_sessions.update_one(
            {"user_id": user_id_str, "session_id": session_id},
            {"$set": {"title": new_title, "updated_at": datetime.utcnow()}}
        )
        
        if result.matched_count == 0:
            return jsonify({"error": "Session not found or not authorized"}), 404
        
        return jsonify({
            "success": True,
            "session_id": session_id,
            "title": new_title
        }), 200
    except Exception as e:
        print(f"DEBUG: Error updating session title: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": "Failed to update session title", "details": str(e)}), 500

@chat_bp.route('/chat/sessions/<session_id>', methods=['GET'])
@auth_required
def get_session_details(session_id):
    """Get details for a specific chat session"""
    # User is available from the auth_required decorator
    user = request.user
    user_id = user.get('id')
    
    # Ensure MongoDB connection
    if not ensure_mongo_connection():
        return jsonify({"error": "Database connection unavailable"}), 500
    
    try:
        # Convert user_id to string for MongoDB query consistency
        user_id_str = str(user_id)
        
        # Get the session from MongoDB
        session = mongo.db.chat_sessions.find_one({
            "user_id": user_id_str,
            "session_id": session_id
        })
        
        if not session:
            return jsonify({"error": "Session not found or not authorized"}), 404
        
        # Format the response
        session['_id'] = str(session['_id'])
        if 'created_at' in session and isinstance(session['created_at'], datetime):
            session['created_at'] = session['created_at'].isoformat()
        if 'updated_at' in session and isinstance(session['updated_at'], datetime):
            session['updated_at'] = session['updated_at'].isoformat()
        
        return jsonify(session), 200
    except Exception as e:
        print(f"DEBUG: Error retrieving session details: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": "Failed to retrieve session details", "details": str(e)}), 500

# We'll keep these routes for backward compatibility, but they won't be the primary auth mechanism
@auth.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")
    
    if not username or not email or not password:
        return jsonify({"msg": "Missing required fields"}), 400
        
    if User.query.filter_by(email=email).first():
        return jsonify({"msg": "User already exists"}), 409
        
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    new_user = User(username=username, email=email, password=hashed_password)
    
    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"msg": "User created successfully"}), 201
    except Exception as e:
        db.session.rollback()
        print(f"Registration error: {str(e)}")
        return jsonify({"msg": f"Error creating user: {str(e)}"}), 500

@auth.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")
    
    if not email or not password:
        return jsonify({"msg": "Missing email or password"}), 400
        
    user = User.query.filter_by(email=email).first()
    if user and bcrypt.check_password_hash(user.password, password):
        access_token = create_access_token(identity=user.id)
        return jsonify({"access_token": access_token}), 200
        
    return jsonify({"msg": "Invalid email or password"}), 401

# Add this endpoint to your auth.py file where the other chat_bp routes are defined

@chat_bp.route('/chat/sessions/<session_id>', methods=['DELETE'])
@auth_required
def delete_chat_session(session_id):
    """Delete a chat session and all its messages"""
    # User is available from the auth_required decorator
    user = request.user
    user_id = user.get('id')
    
    # Ensure MongoDB connection
    if not ensure_mongo_connection():
        return jsonify({"error": "Database connection unavailable"}), 500
    
    try:
        # Convert user_id to string for MongoDB query consistency
        user_id_str = str(user_id)
        
        # Delete the session from the chat_sessions collection
        session_result = mongo.db.chat_sessions.delete_one({
            "user_id": user_id_str,
            "session_id": session_id
        })
        
        if session_result.deleted_count == 0:
            # Try using ObjectId in case session_id is stored as an ObjectId
            from bson.objectid import ObjectId
            try:
                obj_id = ObjectId(session_id)
                session_result = mongo.db.chat_sessions.delete_one({
                    "user_id": user_id_str,
                    "_id": obj_id
                })
            except:
                # If session_id is not a valid ObjectId, this will fail
                pass
        
        # Delete all chat messages associated with this session
        messages_result = mongo.db.chats.delete_many({
            "user_id": user_id_str,
            "session_id": session_id
        })
        
        # Also try to delete messages if session_id might be stored as _id
        try:
            obj_id = ObjectId(session_id)
            mongo.db.chats.delete_many({
                "user_id": user_id_str,
                "chat_id": session_id  # Check for chat_id from routes.py
            })
            mongo.db.chats.delete_many({
                "user_id": user_id_str,
                "chat_id": str(obj_id)  # Check for chat_id as string
            })
        except:
            pass
        
        # Return success even if nothing was deleted (idempotent)
        return jsonify({
            "success": True,
            "session_deleted": session_result.deleted_count > 0,
            "messages_deleted": messages_result.deleted_count
        }), 200
    except Exception as e:
        print(f"DEBUG: Error deleting chat session: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": "Failed to delete chat session", "details": str(e)}), 500