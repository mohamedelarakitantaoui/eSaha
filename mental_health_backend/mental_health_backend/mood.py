# Create a new mood.py file in your backend folder

from flask import Blueprint, request, jsonify
from auth import auth_required
from extensions import mongo, ensure_mongo_connection
import traceback
from datetime import datetime, timedelta
import uuid
from bson.objectid import ObjectId
import csv
import io

# Create blueprint for mood tracking functionality
mood_bp = Blueprint('mood', __name__)

@mood_bp.route('/mood/entries', methods=['GET'])
@auth_required
def get_mood_entries():
    """Get mood entries for the current user within a specified time range"""
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
        
        # Query MongoDB for entries in the date range
        entries = list(mongo.db.mood_entries.find({
            "user_id": user_id_str,
            "date": {"$gte": start_date}
        }).sort("date", -1))  # Sort by date, newest first
        
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
        print(f"DEBUG: Error retrieving mood entries: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": "Failed to retrieve mood entries", "details": str(e)}), 500

@mood_bp.route('/mood/entries', methods=['POST'])
@auth_required
def create_mood_entry():
    """Create a new mood entry"""
    # User is available from the auth_required decorator
    user = request.user
    user_id = user.get('id')
    
    # Ensure MongoDB connection
    if not ensure_mongo_connection():
        return jsonify({"error": "Database connection unavailable"}), 500
    
    # Get entry data from request
    data = request.get_json()
    
    # Validate required fields
    if not data.get('date'):
        return jsonify({"error": "Date is required"}), 400
    
    if not data.get('mood'):
        return jsonify({"error": "Mood is required"}), 400
    
    # Validate mood value
    valid_moods = ['very_happy', 'happy', 'neutral', 'sad', 'very_sad', 'anxious', 'angry']
    if data.get('mood') not in valid_moods:
        return jsonify({"error": "Invalid mood value"}), 400
    
    try:
        # Convert user_id to string for MongoDB
        user_id_str = str(user_id)
        
        # Create entry document
        entry = {
            "user_id": user_id_str,
            "date": data.get('date'),
            "mood": data.get('mood'),
            "mood_score": data.get('mood_score', 0),
            "factors": data.get('factors', []),
            "notes": data.get('notes'),
            "source": "manual",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Insert into MongoDB
        result = mongo.db.mood_entries.insert_one(entry)
        
        # Return the new entry with ID
        entry['id'] = str(result.inserted_id)
        del entry['_id']
        
        # Convert dates to ISO strings
        entry['created_at'] = entry['created_at'].isoformat()
        entry['updated_at'] = entry['updated_at'].isoformat()
        
        return jsonify(entry), 201
    except Exception as e:
        print(f"DEBUG: Error creating mood entry: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": "Failed to create mood entry", "details": str(e)}), 500

@mood_bp.route('/mood/entries/<entry_id>', methods=['PUT'])
@auth_required
def update_mood_entry(entry_id):
    """Update a mood entry"""
    # User is available from the auth_required decorator
    user = request.user
    user_id = user.get('id')
    
    # Ensure MongoDB connection
    if not ensure_mongo_connection():
        return jsonify({"error": "Database connection unavailable"}), 500
    
    # Get entry data from request
    data = request.get_json()
    
    # Validate required fields
    if not data.get('date'):
        return jsonify({"error": "Date is required"}), 400
    
    if not data.get('mood'):
        return jsonify({"error": "Mood is required"}), 400
    
    # Validate mood value
    valid_moods = ['very_happy', 'happy', 'neutral', 'sad', 'very_sad', 'anxious', 'angry']
    if data.get('mood') not in valid_moods:
        return jsonify({"error": "Invalid mood value"}), 400
    
    try:
        # Convert user_id to string for MongoDB
        user_id_str = str(user_id)
        
        # Verify the entry exists and belongs to this user
        existing_entry = mongo.db.mood_entries.find_one({
            "_id": ObjectId(entry_id),
            "user_id": user_id_str
        })
        
        if not existing_entry:
            return jsonify({"error": "Entry not found or not authorized"}), 404
        
        # Update entry document
        updates = {
            "date": data.get('date'),
            "mood": data.get('mood'),
            "mood_score": data.get('mood_score', existing_entry.get('mood_score', 0)),
            "factors": data.get('factors', existing_entry.get('factors', [])),
            "notes": data.get('notes'),
            "updated_at": datetime.utcnow()
        }
        
        # Update in MongoDB
        mongo.db.mood_entries.update_one(
            {"_id": ObjectId(entry_id), "user_id": user_id_str},
            {"$set": updates}
        )
        
        # Get the updated entry
        updated_entry = mongo.db.mood_entries.find_one({"_id": ObjectId(entry_id)})
        
        # Format for JSON response
        updated_entry['id'] = str(updated_entry.pop('_id'))
        
        # Convert dates to ISO strings
        if 'created_at' in updated_entry and isinstance(updated_entry['created_at'], datetime):
            updated_entry['created_at'] = updated_entry['created_at'].isoformat()
        if 'updated_at' in updated_entry and isinstance(updated_entry['updated_at'], datetime):
            updated_entry['updated_at'] = updated_entry['updated_at'].isoformat()
        
        return jsonify(updated_entry), 200
    except Exception as e:
        print(f"DEBUG: Error updating mood entry: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": "Failed to update mood entry", "details": str(e)}), 500

@mood_bp.route('/mood/entries/<entry_id>', methods=['DELETE'])
@auth_required
def delete_mood_entry(entry_id):
    """Delete a mood entry"""
    # User is available from the auth_required decorator
    user = request.user
    user_id = user.get('id')
    
    # Ensure MongoDB connection
    if not ensure_mongo_connection():
        return jsonify({"error": "Database connection unavailable"}), 500
    
    try:
        # Convert user_id to string for MongoDB
        user_id_str = str(user_id)
        
        # Verify the entry exists and belongs to this user
        result = mongo.db.mood_entries.delete_one({
            "_id": ObjectId(entry_id),
            "user_id": user_id_str
        })
        
        if result.deleted_count == 0:
            return jsonify({"error": "Entry not found or not authorized"}), 404
        
        return jsonify({"success": True, "message": "Mood entry deleted successfully"}), 200
    except Exception as e:
        print(f"DEBUG: Error deleting mood entry: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": "Failed to delete mood entry", "details": str(e)}), 500

@mood_bp.route('/mood/insights', methods=['GET'])
@auth_required
def get_mood_insights():
    """Get mood insights and statistics"""
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
        
        # Query MongoDB for entries in the date range
        entries = list(mongo.db.mood_entries.find({
            "user_id": user_id_str,
            "date": {"$gte": start_date}
        }).sort("date", 1))  # Sort by date, oldest first
        
        if not entries:
            return jsonify({
                "averageMoodScore": 0,
                "moodDistribution": {},
                "topFactors": [],
                "factorAnalysis": {"positive": [], "negative": []},
                "recommendations": ["Start tracking your mood to see insights."]
            }), 200
        
        # Calculate average mood score
        total_score = sum(entry.get('mood_score', 0) for entry in entries)
        avg_mood_score = total_score / len(entries)
        
        # Calculate mood distribution
        mood_distribution = {}
        for entry in entries:
            mood = entry.get('mood')
            mood_distribution[mood] = mood_distribution.get(mood, 0) + 1
        
        # Analyze factors
        factor_counts = {}
        factor_scores = {}
        
        for entry in entries:
            for factor in entry.get('factors', []):
                # Count occurrences
                factor_counts[factor] = factor_counts.get(factor, 0) + 1
                
                # Track mood scores
                if factor not in factor_scores:
                    factor_scores[factor] = {"total": 0, "count": 0}
                factor_scores[factor]["total"] += entry.get('mood_score', 0)
                factor_scores[factor]["count"] += 1
        
        # Calculate average score per factor
        factor_avg_scores = {}
        for factor, data in factor_scores.items():
            factor_avg_scores[factor] = data["total"] / data["count"]
        
        # Get top factors by count
        top_factors = sorted(
            [{"factor": f, "count": c} for f, c in factor_counts.items()],
            key=lambda x: x["count"],
            reverse=True
        )[:10]
        
        # Get top positive and negative factors
        positive_factors = sorted(
            [{"factor": f, "score": s} for f, s in factor_avg_scores.items() if s > 0 and factor_counts[f] >= 3],
            key=lambda x: x["score"],
            reverse=True
        )[:5]
        
        negative_factors = sorted(
            [{"factor": f, "score": s} for f, s in factor_avg_scores.items() if s < 0 and factor_counts[f] >= 3],
            key=lambda x: x["score"]
        )[:5]
        
        # Generate recommendations
        recommendations = []
        
        if positive_factors:
            recommendations.append(
                f"Try to increase {positive_factors[0]['factor']} in your routine, as it's associated with your improved mood."
            )
        
        if negative_factors:
            recommendations.append(
                f"Consider strategies to manage {negative_factors[0]['factor']}, which appears to negatively affect your mood."
            )
        
        # Add some default recommendations
        recommendations.append("Continue tracking your mood regularly to get more accurate insights.")
        
        # Mood trend analysis
        if len(entries) >= 7:
            # Compare recent average to earlier average
            midpoint = len(entries) // 2
            recent_entries = entries[midpoint:]
            earlier_entries = entries[:midpoint]
            
            recent_avg = sum(e.get('mood_score', 0) for e in recent_entries) / len(recent_entries)
            earlier_avg = sum(e.get('mood_score', 0) for e in earlier_entries) / len(earlier_entries)
            
            if recent_avg > earlier_avg + 0.5:
                recommendations.append("Your mood has been improving recently. Keep up the positive momentum!")
            elif recent_avg < earlier_avg - 0.5:
                recommendations.append("Your mood has declined slightly. Consider what factors might be contributing.")
        
        insights = {
            "averageMoodScore": round(avg_mood_score, 2),
            "moodDistribution": mood_distribution,
            "topFactors": top_factors,
            "factorAnalysis": {
                "positive": positive_factors,
                "negative": negative_factors
            },
            "recommendations": recommendations
        }
        
        return jsonify(insights), 200
    except Exception as e:
        print(f"DEBUG: Error calculating mood insights: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": "Failed to calculate mood insights", "details": str(e)}), 500

@mood_bp.route('/mood/export', methods=['GET'])
@auth_required
def export_mood_data():
    """Export mood data in CSV or JSON format"""
    # User is available from the auth_required decorator
    user = request.user
    user_id = user.get('id')
    
    # Get format from query parameter
    export_format = request.args.get('format', 'csv')
    
    # Ensure MongoDB connection
    if not ensure_mongo_connection():
        return jsonify({"error": "Database connection unavailable"}), 500
    
    try:
        # Convert user_id to string for MongoDB
        user_id_str = str(user_id)
        
        # Query MongoDB for all entries
        entries = list(mongo.db.mood_entries.find({
            "user_id": user_id_str
        }).sort("date", -1))
        
        # Format entries for export
        formatted_entries = []
        for entry in entries:
            formatted_entry = {
                "id": str(entry['_id']),
                "date": entry.get('date'),
                "mood": entry.get('mood'),
                "mood_score": entry.get('mood_score', 0),
                "factors": entry.get('factors', []),
                "notes": entry.get('notes', ''),
                "source": entry.get('source', 'manual')
            }
            
            if 'created_at' in entry and isinstance(entry['created_at'], datetime):
                formatted_entry['created_at'] = entry['created_at'].isoformat()
                
            formatted_entries.append(formatted_entry)
        
        if export_format == 'json':
            # Return JSON format
            return jsonify(formatted_entries), 200
        else:
            # Return CSV format
            output = io.StringIO()
            fieldnames = ['id', 'date', 'mood', 'mood_score', 'factors', 'notes', 'source', 'created_at']
            writer = csv.DictWriter(output, fieldnames=fieldnames)
            writer.writeheader()
            
            for entry in formatted_entries:
                # Convert lists to strings for CSV
                entry_copy = entry.copy()
                if 'factors' in entry_copy and isinstance(entry_copy['factors'], list):
                    entry_copy['factors'] = '; '.join(entry_copy['factors'])
                
                writer.writerow(entry_copy)
            
            # Prepare response
            response = output.getvalue()
            
            return response, 200, {
                'Content-Type': 'text/csv',
                'Content-Disposition': f'attachment; filename=mood_data_{datetime.utcnow().strftime("%Y%m%d")}.csv'
            }
    except Exception as e:
        print(f"DEBUG: Error exporting mood data: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": "Failed to export mood data", "details": str(e)}), 500