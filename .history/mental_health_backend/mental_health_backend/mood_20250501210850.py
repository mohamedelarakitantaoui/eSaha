# Add these new endpoints to your mood.py file to support the enhanced mood-chat integration

from flask import Blueprint, request, jsonify
from auth import auth_required
from extensions import mongo, ensure_mongo_connection
import traceback
from datetime import datetime, timedelta
from bson.objectid import ObjectId

# These are new routes to add to your existing mood_bp Blueprint

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

@mood_bp.route('/mood/insights/chat/<session_id>', methods=['GET'])
@auth_required
def get_chat_session_mood_insights(session_id):
    """Get mood insights for a specific chat session"""
    # User is available from the auth_required decorator
    user = request.user
    user_id = user.get('id')
    
    # Ensure MongoDB connection
    if not ensure_mongo_connection():
        return jsonify({"error": "Database connection unavailable"}), 500
    
    try:
        # Convert user_id to string for MongoDB query consistency
        user_id_str = str(user_id)
        
        # Query MongoDB for all mood entries for this session
        entries = list(mongo.db.mood_entries.find({
            "user_id": user_id_str,
            "session_id": session_id,
            "source": "chat_message"
        }).sort("date", 1)) # Sort by date, oldest first
        
        if not entries:
            return jsonify({
                "averageMoodScore": 0,
                "moodDistribution": {},
                "topFactors": [],
                "factorAnalysis": {"positive": [], "negative": []},
                "recommendations": ["No mood data available for this chat session."]
            }), 200
        
        # Calculate average mood score
        total_score = sum(entry.get('mood_score', 0) for entry in entries)
        avg_mood_score = total_score / len(entries)
        
        # Calculate mood distribution
        mood_distribution = {}
        for entry in entries:
            mood = entry.get('mood')
            mood_distribution[mood] = mood_distribution.get(mood, 0) + 1
        
        # Get the most common mood
        most_common_mood = max(mood_distribution.items(), key=lambda x: x[1])[0] if mood_distribution else "neutral"
        
        # Calculate mood trend - first half vs second half
        if len(entries) >= 4:
            midpoint = len(entries) // 2
            first_half = entries[:midpoint]
            second_half = entries[midpoint:]
            
            first_half_avg = sum(entry.get('mood_score', 0) for entry in first_half) / len(first_half)
            second_half_avg = sum(entry.get('mood_score', 0) for entry in second_half) / len(second_half)
            
            trend = "improving" if second_half_avg > first_half_avg + 0.5 else \
                    "declining" if second_half_avg < first_half_avg - 0.5 else \
                    "stable"
        else:
            trend = "stable"
        
        # Generate recommendations based on chat mood data
        recommendations = []
        
        # Check for significant mood swings in conversation
        mood_scores = [entry.get('mood_score', 0) for entry in entries]
        max_mood = max(mood_scores)
        min_mood = min(mood_scores)
        
        if max_mood - min_mood >= 5:
            recommendations.append("This conversation showed significant mood changes. Consider what topics affected your emotions.")
        
        # Add overall mood recommendation
        if avg_mood_score >= 3:
            recommendations.append("This was a very positive conversation that improved your mood.")
        elif avg_mood_score <= -3:
            recommendations.append("This conversation was associated with negative emotions. Consider discussing this with a therapist.")
        
        # Add trend recommendation
        if trend == "improving":
            recommendations.append("Your mood improved during this conversation.")
        elif trend == "declining":
            recommendations.append("Your mood declined during this conversation.")
        
        # If no specific recommendations, add a general one
        if not recommendations:
            recommendations.append("Keep tracking your mood during conversations to see patterns over time.")
        
        insights = {
            "averageMoodScore": round(avg_mood_score, 2),
            "moodDistribution": mood_distribution,
            "mostCommonMood": most_common_mood,
            "recentTrend": trend,
            "recommendations": recommendations,
            "messageCount": len(entries)
        }
        
        return jsonify(insights), 200
    except Exception as e:
        print(f"DEBUG: Error calculating chat session mood insights: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": "Failed to calculate chat session mood insights", "details": str(e)}), 500

@mood_bp.route('/mood/triggers', methods=['GET'])
@auth_required
def get_emotional_triggers():
    """Extract emotional triggers from chat conversations based on mood analysis"""
    # User is available from the auth_required decorator
    user = request.user
    user_id = user.get('id')
    
    # Get time range from query parameter
    time_range = request.args.get('timeRange', 'month')
    
    # Ensure MongoDB connection
    if not ensure_mongo_connection():
        return jsonify({"error": "Database connection unavailable"}), 500
    
    try:
        # Convert user_id to string for MongoDB query consistency
        user_id_str = str(user_id)
        
        # Calculate date range
        now = datetime.utcnow()
        if time_range == 'week':
            start_date = (now - timedelta(days=7)).strftime('%Y-%m-%d')
        elif time_range == 'year':
            start_date = (now - timedelta(days=365)).strftime('%Y-%m-%d')
        else:  # month is default
            start_date = (now - timedelta(days=30)).strftime('%Y-%m-%d')
        
        # Get all chat-based mood entries in time range
        mood_entries = list(mongo.db.mood_entries.find({
            "user_id": user_id_str,
            "date": {"$gte": start_date},
            "source": "chat_message"
        }))
        
        if not mood_entries:
            return jsonify([]), 200
        
        # Get the chat messages for these mood entries
        message_ids = [entry.get('message_id') for entry in mood_entries if entry.get('message_id')]
        
        # Convert from string to ObjectId for the query
        object_ids = [ObjectId(id) for id in message_ids if id]
        
        # Query the chat messages
        messages = list(mongo.db.chats.find({"_id": {"$in": object_ids}}))
        
        # Create a lookup dict for mood scores by message_id
        mood_scores = {}
        for entry in mood_entries:
            if entry.get('message_id'):
                mood_scores[entry.get('message_id')] = entry.get('mood_score', 0)
        
        # Extract potential emotional triggers
        # This is simplified - in production you would want to use NLP or the OpenAI API
        # to properly extract topics and triggers from the conversation
        triggers = {}
        
        for message in messages:
            message_id = str(message.get('_id'))
            mood_score = mood_scores.get(message_id, 0)
            
            # Skip neutral messages for trigger analysis
            if -1 <= mood_score <= 1:
                continue
            
            # Extract simple keywords (in production use NLP or GPT API)
            text = message.get('message', '').lower()
            words = text.split()
            
            for word in words:
                # Skip short words and common stop words
                if len(word) < 4 or word in ["this", "that", "with", "from", "have", "about"]:
                    continue
                
                if word not in triggers:
                    triggers[word] = {
                        "impact_sum": 0,
                        "count": 0
                    }
                
                triggers[word]["impact_sum"] += mood_score
                triggers[word]["count"] += 1
        
        # Calculate average impact and prepare response
        result = []
        for word, data in triggers.items():
            if data["count"] >= 2:  # Only include words mentioned multiple times
                result.append({
                    "trigger": word,
                    "impact": round(data["impact_sum"] / data["count"], 2),
                    "frequency": data["count"]
                })
        
        # Sort by impact (absolute value) then frequency
        result.sort(key=lambda x: (abs(x["impact"]), x["frequency"]), reverse=True)
        
        # Return top triggers
        return jsonify(result[:20]), 200
    except Exception as e:
        print(f"DEBUG: Error analyzing emotional triggers: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": "Failed to analyze emotional triggers", "details": str(e)}), 500

# Add this endpoint to your chat_bp in auth.py
# This should be placed with the other chat routes

@chat_bp.route('/chat/sessions/with-mood', methods=['GET'])
@auth_required
def get_sessions_with_mood_data():
    """Get all chat sessions with added mood data summary"""
    # User is available from the auth_required decorator
    user = request.user
    user_id = user.get('id')
    
    # Ensure MongoDB connection
    if not ensure_mongo_connection():
        return jsonify({"error": "Database connection unavailable"}), 500
    
    try:
        # Convert user_id to string for MongoDB query consistency
        user_id_str = str(user_id)
        
        # Get all sessions for this user
        sessions = list(mongo.db.chat_sessions.find({
            "user_id": user_id_str
        }).sort("updated_at", -1))
        
        # Process each session to add mood data
        for session in sessions:
            session_id = session.get("session_id")
            
            # Get mood entries for this session
            mood_entries = list(mongo.db.mood_entries.find({
                "user_id": user_id_str,
                "session_id": session_id,
                "source": "chat_message"
            }))
            
            if mood_entries:
                # Calculate average mood score
                total_score = sum(entry.get('mood_score', 0) for entry in mood_entries)
                avg_mood_score = total_score / len(mood_entries)
                session["averageMoodScore"] = round(avg_mood_score, 2)
                
                # Determine dominant mood
                mood_counts = {}
                for entry in mood_entries:
                    mood = entry.get('mood')
                    mood_counts[mood] = mood_counts.get(mood, 0) + 1
                
                if mood_counts:
                    session["dominantMood"] = max(mood_counts.items(), key=lambda x: x[1])[0]
                
                # Add mood entry count
                session["moodEntryCount"] = len(mood_entries)
            
            # Format MongoDB ObjectId
            session['_id'] = str(session['_id'])
            
            # Format dates
            if 'created_at' in session and isinstance(session['created_at'], datetime):
                session['created_at'] = session['created_at'].isoformat()
            if 'updated_at' in session and isinstance(session['updated_at'], datetime):
                session['updated_at'] = session['updated_at'].isoformat()
        
        return jsonify(sessions), 200
    except Exception as e:
        print(f"DEBUG: Error retrieving chat sessions with mood: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": "Failed to retrieve chat sessions with mood data", "details": str(e)}), 500

@chat_bp.route('/chat/history/<session_id>/with-mood', methods=['GET'])
@auth_required
def get_session_messages_with_mood(session_id):
    """Get chat messages for a specific session with mood data attached"""
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
        messages = list(mongo.db.chats.find({
            "user_id": user_id_str,
            "session_id": session_id
        }).sort("timestamp", 1))
        
        # Get all mood entries for this session
        mood_entries = list(mongo.db.mood_entries.find({
            "user_id": user_id_str,
            "session_id": session_id,
            "source": "chat_message"
        }))
        
        # Create a lookup by message_id
        mood_lookup = {}
        for entry in mood_entries:
            if entry.get('message_id'):
                mood_lookup[entry.get('message_id')] = {
                    "mood": entry.get('mood'),
                    "score": entry.get('mood_score')
                }
        
        # Add mood data to messages
        for message in messages:
            message_id = str(message.get('_id'))
            if message_id in mood_lookup:
                message["sentiment"] = mood_lookup[message_id]
            
            # Format MongoDB ObjectId
            message['_id'] = message_id
            
            # Format date
            if 'timestamp' in message and isinstance(message['timestamp'], datetime):
                message['timestamp'] = message['timestamp'].isoformat()
        
        return jsonify(messages), 200
    except Exception as e:
        print(f"DEBUG: Error retrieving session messages with mood: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": "Failed to retrieve session messages with mood data", "details": str(e)}), 500