from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from extensions import mongo
from bson.objectid import ObjectId
from auth import auth_required

# Create the mood blueprint
mood_bp = Blueprint('mood', __name__)

@mood_bp.route('/api/mood/entries', methods=['GET'])
@auth_required
def get_mood_entries():
    """Get mood entries for a specific time range"""
    # User is available from the auth_required decorator
    user = request.user
    user_id = user.get('id')
    
    # Get time range from query parameters
    time_range = request.args.get('timeRange', 'month')
    
    # Calculate the start date based on time range
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    if time_range == 'week':
        start_date = today - timedelta(days=7)
    elif time_range == 'month':
        start_date = today - timedelta(days=30)
    elif time_range == 'year':
        start_date = today - timedelta(days=365)
    else:
        start_date = today - timedelta(days=30)  # Default to month
    
    try:
        # Convert user_id to string for consistency
        user_id_str = str(user_id)
        
        # Query MongoDB for mood entries within the specified time range
        entries_cursor = mongo.db.mood_entries.find({
            "user_id": user_id_str,
            "date": {"$gte": start_date.strftime('%Y-%m-%d')}
        }).sort("date", -1)
        
        # Format the entries for JSON response
        entries = []
        for entry in entries_cursor:
            # Convert ObjectId to string
            entry["id"] = str(entry.pop("_id"))
            
            # Convert datetime objects to ISO format strings
            if "created_at" in entry and isinstance(entry["created_at"], datetime):
                entry["created_at"] = entry["created_at"].isoformat()
            if "updated_at" in entry and isinstance(entry["updated_at"], datetime):
                entry["updated_at"] = entry["updated_at"].isoformat()
                
            entries.append(entry)
        
        return jsonify(entries), 200
    except Exception as e:
        print(f"ERROR: Failed to fetch mood entries: {str(e)}")
        return jsonify({"error": "Failed to fetch mood entries"}), 500

@mood_bp.route('/api/mood/entries', methods=['POST'])
@auth_required
def create_mood_entry():
    """Create a new mood entry"""
    # User is available from the auth_required decorator
    user = request.user
    user_id = user.get('id')
    
    # Get data from request
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    # Validate required fields
    required_fields = ["date", "mood", "mood_score", "factors"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400
    
    # Validate mood value
    valid_moods = ["very_happy", "happy", "neutral", "sad", "very_sad", "anxious", "angry"]
    if data["mood"] not in valid_moods:
        return jsonify({"error": f"Invalid mood. Must be one of: {', '.join(valid_moods)}"}), 400
    
    # Validate mood_score (should be between -5 and 5)
    try:
        mood_score = float(data["mood_score"])
        if mood_score < -5 or mood_score > 5:
            return jsonify({"error": "mood_score must be between -5 and 5"}), 400
    except (ValueError, TypeError):
        return jsonify({"error": "mood_score must be a number"}), 400
    
    # Validate factors is a list
    if not isinstance(data["factors"], list):
        return jsonify({"error": "factors must be a list"}), 400
    
    try:
        # Convert user_id to string for consistency
        user_id_str = str(user_id)
        
        # Create the new entry
        now = datetime.utcnow()
        entry = {
            "user_id": user_id_str,
            "date": data["date"],
            "mood": data["mood"],
            "mood_score": mood_score,
            "factors": data["factors"],
            "notes": data.get("notes", ""),
            "source": "manual",
            "created_at": now,
            "updated_at": now
        }
        
        # Insert into MongoDB
        result = mongo.db.mood_entries.insert_one(entry)
        
        # Add the ID to the response
        entry["id"] = str(result.inserted_id)
        del entry["_id"]
        
        # Convert datetime objects to ISO format strings
        entry["created_at"] = entry["created_at"].isoformat()
        entry["updated_at"] = entry["updated_at"].isoformat()
        
        return jsonify(entry), 201
    except Exception as e:
        print(f"ERROR: Failed to create mood entry: {str(e)}")
        return jsonify({"error": "Failed to create mood entry"}), 500

@mood_bp.route('/api/mood/entries/<entry_id>', methods=['PUT'])
@auth_required
def update_mood_entry(entry_id):
    """Update a mood entry"""
    # User is available from the auth_required decorator
    user = request.user
    user_id = user.get('id')
    
    # Get data from request
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    # Validate mood value if provided
    if "mood" in data:
        valid_moods = ["very_happy", "happy", "neutral", "sad", "very_sad", "anxious", "angry"]
        if data["mood"] not in valid_moods:
            return jsonify({"error": f"Invalid mood. Must be one of: {', '.join(valid_moods)}"}), 400
    
    # Validate mood_score if provided
    if "mood_score" in data:
        try:
            mood_score = float(data["mood_score"])
            if mood_score < -5 or mood_score > 5:
                return jsonify({"error": "mood_score must be between -5 and 5"}), 400
            data["mood_score"] = mood_score
        except (ValueError, TypeError):
            return jsonify({"error": "mood_score must be a number"}), 400
    
    # Validate factors is a list if provided
    if "factors" in data and not isinstance(data["factors"], list):
        return jsonify({"error": "factors must be a list"}), 400
    
    try:
        # Convert user_id to string for consistency
        user_id_str = str(user_id)
        
        # Create a MongoDB ObjectId from the entry_id
        try:
            object_id = ObjectId(entry_id)
        except:
            return jsonify({"error": "Invalid entry ID"}), 400
        
        # Get the existing entry
        existing_entry = mongo.db.mood_entries.find_one({
            "_id": object_id,
            "user_id": user_id_str
        })
        
        if not existing_entry:
            return jsonify({"error": "Entry not found or not authorized"}), 404
        
        # Prepare the update data
        update_data = {}
        for field in ["date", "mood", "mood_score", "factors", "notes"]:
            if field in data:
                update_data[field] = data[field]
        
        # Add updated_at timestamp
        update_data["updated_at"] = datetime.utcnow()
        
        # Update the entry
        mongo.db.mood_entries.update_one(
            {"_id": object_id},
            {"$set": update_data}
        )
        
        # Get the updated entry
        updated_entry = mongo.db.mood_entries.find_one({"_id": object_id})
        updated_entry["id"] = str(updated_entry.pop("_id"))
        
        # Convert datetime objects to ISO format strings
        if "created_at" in updated_entry and isinstance(updated_entry["created_at"], datetime):
            updated_entry["created_at"] = updated_entry["created_at"].isoformat()
        if "updated_at" in updated_entry and isinstance(updated_entry["updated_at"], datetime):
            updated_entry["updated_at"] = updated_entry["updated_at"].isoformat()
        
        return jsonify(updated_entry), 200
    except Exception as e:
        print(f"ERROR: Failed to update mood entry: {str(e)}")
        return jsonify({"error": "Failed to update mood entry"}), 500

@mood_bp.route('/api/mood/entries/<entry_id>', methods=['DELETE'])
@auth_required
def delete_mood_entry(entry_id):
    """Delete a mood entry"""
    # User is available from the auth_required decorator
    user = request.user
    user_id = user.get('id')
    
    try:
        # Convert user_id to string for consistency
        user_id_str = str(user_id)
        
        # Create a MongoDB ObjectId from the entry_id
        try:
            object_id = ObjectId(entry_id)
        except:
            return jsonify({"error": "Invalid entry ID"}), 400
        
        # Check if the entry exists and belongs to the user
        existing_entry = mongo.db.mood_entries.find_one({
            "_id": object_id,
            "user_id": user_id_str
        })
        
        if not existing_entry:
            return jsonify({"error": "Entry not found or not authorized"}), 404
        
        # Delete the entry
        mongo.db.mood_entries.delete_one({"_id": object_id})
        
        return jsonify({"message": "Entry deleted successfully"}), 200
    except Exception as e:
        print(f"ERROR: Failed to delete mood entry: {str(e)}")
        return jsonify({"error": "Failed to delete mood entry"}), 500

@mood_bp.route('/api/mood/insights', methods=['GET'])
@auth_required
def get_mood_insights():
    """Get mood insights and statistics"""
    # User is available from the auth_required decorator
    user = request.user
    user_id = user.get('id')
    
    # Get time range from query parameters
    time_range = request.args.get('timeRange', 'month')
    
    # Calculate the start date based on time range
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    if time_range == 'week':
        start_date = today - timedelta(days=7)
        period_name = "week"
    elif time_range == 'month':
        start_date = today - timedelta(days=30)
        period_name = "month"
    elif time_range == 'year':
        start_date = today - timedelta(days=365)
        period_name = "year"
    else:
        start_date = today - timedelta(days=30)  # Default to month
        period_name = "month"
    
    try:
        # Convert user_id to string for consistency
        user_id_str = str(user_id)
        
        # Query MongoDB for mood entries within the specified time range
        entries_cursor = mongo.db.mood_entries.find({
            "user_id": user_id_str,
            "date": {"$gte": start_date.strftime('%Y-%m-%d')}
        })
        
        entries = list(entries_cursor)
        
        # Calculate insights
        # 1. Average mood score
        if entries:
            avg_score = sum(entry["mood_score"] for entry in entries) / len(entries)
        else:
            avg_score = 0
        
        # 2. Mood distribution
        mood_distribution = {
            "very_happy": 0,
            "happy": 0,
            "neutral": 0,
            "sad": 0,
            "very_sad": 0,
            "anxious": 0,
            "angry": 0
        }
        
        for entry in entries:
            if entry["mood"] in mood_distribution:
                mood_distribution[entry["mood"]] += 1
        
        # 3. Top factors
        factor_counts = {}
        for entry in entries:
            for factor in entry.get("factors", []):
                factor_counts[factor] = factor_counts.get(factor, 0) + 1
        
        # Sort factors by count
        top_factors = [
            {"factor": factor, "count": count}
            for factor, count in sorted(factor_counts.items(), key=lambda x: x[1], reverse=True)
        ][:10]  # Top 10 factors
        
        # 4. Factor analysis
        positive_factors = []
        negative_factors = []
        
        for factor, count in factor_counts.items():
            # Calculate average mood score for entries containing this factor
            factor_entries = [entry for entry in entries if factor in entry.get("factors", [])]
            if factor_entries:
                avg_factor_score = sum(entry["mood_score"] for entry in factor_entries) / len(factor_entries)
                
                if avg_factor_score > 0:
                    positive_factors.append({"factor": factor, "score": avg_factor_score})
                else:
                    negative_factors.append({"factor": factor, "score": avg_factor_score})
        
        # Sort factors by score
        positive_factors.sort(key=lambda x: x["score"], reverse=True)
        negative_factors.sort(key=lambda x: x["score"])
        
        # 5. Generate recommendations based on insights
        recommendations = []
        
        if entries:
            # Add general recommendation
            recommendations.append(f"You've tracked your mood {len(entries)} times in the past {period_name}.")
            
            # Add recommendation based on average mood
            if avg_score > 2:
                recommendations.append("Your overall mood has been very positive. Keep up the good work!")
            elif avg_score > 0:
                recommendations.append("Your mood has been generally positive. Continue with activities that make you feel good.")
            elif avg_score > -2:
                recommendations.append("Your mood has been somewhat neutral to negative. Consider incorporating more mood-boosting activities.")
            else:
                recommendations.append("Your mood has been quite low. Consider reaching out to a mental health professional for support.")
            
            # Add recommendation based on negative factors
            if negative_factors:
                top_negative = negative_factors[0]["factor"]
                recommendations.append(f"'{top_negative}' seems to be associated with lower mood scores. Consider strategies to address this factor.")
            
            # Add recommendation based on positive factors
            if positive_factors:
                top_positive = positive_factors[0]["factor"]
                recommendations.append(f"'{top_positive}' seems to be associated with higher mood scores. Try to incorporate more of this in your routine.")
        else:
            recommendations.append("Start tracking your mood daily to get personalized insights and recommendations.")
        
        # Construct the insights response
        insights = {
            "averageMoodScore": round(avg_score, 2),
            "moodDistribution": mood_distribution,
            "topFactors": top_factors,
            "factorAnalysis": {
                "positive": positive_factors[:5],  # Top 5 positive factors
                "negative": negative_factors[:5]   # Top 5 negative factors
            },
            "recommendations": recommendations
        }
        
        return jsonify(insights), 200
    except Exception as e:
        print(f"ERROR: Failed to generate mood insights: {str(e)}")
        return jsonify({"error": "Failed to generate mood insights"}), 500

@mood_bp.route('/api/mood/export', methods=['GET'])
@auth_required
def export_mood_data():
    """Export mood data as CSV or JSON"""
    # User is available from the auth_required decorator
    user = request.user
    user_id = user.get('id')
    
    # Get export format
    export_format = request.args.get('format', 'csv')
    
    try:
        # Convert user_id to string for consistency
        user_id_str = str(user_id)
        
        # Get all mood entries for this user
        entries_cursor = mongo.db.mood_entries.find({
            "user_id": user_id_str
        }).sort("date", 1)
        
        entries = list(entries_cursor)
        
        # Prepare the data for export
        export_data = []
        for entry in entries:
            # Convert ObjectId to string
            entry["id"] = str(entry.pop("_id"))
            
            # Convert datetime objects to ISO format strings
            if "created_at" in entry and isinstance(entry["created_at"], datetime):
                entry["created_at"] = entry["created_at"].isoformat()
            if "updated_at" in entry and isinstance(entry["updated_at"], datetime):
                entry["updated_at"] = entry["updated_at"].isoformat()
            
            export_data.append(entry)
        
        if export_format.lower() == 'json':
            # Return as JSON
            return jsonify(export_data), 200
        else:
            # Return as CSV
            import csv
            import io
            
            output = io.StringIO()
            
            # Get all possible fields
            fields = set()
            for entry in export_data:
                fields.update(entry.keys())
            
            # Sort fields for consistency
            sorted_fields = sorted(list(fields))
            
            # Write CSV header
            writer = csv.DictWriter(output, fieldnames=sorted_fields)
            writer.writeheader()
            
            # Write data rows
            for entry in export_data:
                # Convert factors list to string
                if "factors" in entry and isinstance(entry["factors"], list):
                    entry["factors"] = ", ".join(entry["factors"])
                writer.writerow(entry)
            
            # Prepare response
            csv_data = output.getvalue()
            response = jsonify({"data": csv_data})
            response.headers["Content-Type"] = "text/csv"
            response.headers["Content-Disposition"] = "attachment; filename=mood_data.csv"
            
            return response
    except Exception as e:
        print(f"ERROR: Failed to export mood data: {str(e)}")
        return jsonify({"error": "Failed to export mood data"}), 500