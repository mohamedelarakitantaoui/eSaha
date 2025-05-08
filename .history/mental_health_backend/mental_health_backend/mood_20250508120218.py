from flask import Blueprint, request, jsonify
from auth import auth_required
from extensions import mongo, ensure_mongo_connection
import traceback
from datetime import datetime, timedelta
from bson.objectid import ObjectId

# Define the Blueprint at the beginning of the file
mood_bp = Blueprint('mood', __name__)

@mood_bp.route('/mood/entries/chat', methods=['GET'])
@auth_required
def get_chat_based_mood_entries():
    """Get mood entries that were derived from chat messages"""
    # User is available from the auth_required decorator
    user = request.user
    user_id = user.get('id')
    
    # Get optional session_id filter
    session_id = request.args.get('session_id')
    
    # Ensure MongoDB connection
    if not ensure_mongo_connection():
        return jsonify({"error": "Database connection unavailable"}), 500
    
    try:
        # Convert user_id to string for MongoDB query consistency
        user_id_str = str(user_id)
        
        # Build the query
        query = {
            "user_id": user_id_str,
            "source": "chat_message"
        }
        
        # Add session filter if provided
        if session_id:
            query["session_id"] = session_id
        
        # Query MongoDB
        entries = list(mongo.db.mood_entries.find(query).sort("date", -1))
        
        # Format for JSON
        formatted_entries = []
        for entry in entries:
            entry['id'] = str(entry.pop('_id'))
            if 'created_at' in entry and isinstance(entry['created_at'], datetime):
                entry['created_at'] = entry['created_at'].isoformat()
            if 'updated_at' in entry and isinstance(entry['updated_at'], datetime):
                entry['updated_at'] = entry['updated_at'].isoformat()
            formatted_entries.append(entry)
        
        return jsonify(formatted_entries), 200
    except Exception as e:
        print(f"DEBUG: Error retrieving chat-based mood entries: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": "Failed to retrieve chat-based mood entries", "details": str(e)}), 500

# Rest of your functions would go here - I'm not including them all for brevity
# You should copy all the other route functions from your original file

# Make sure the chat_bp Blueprint is also defined in your auth.py file