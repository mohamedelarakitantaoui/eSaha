# Create a new profile.py file in your backend folder

from flask import Blueprint, request, jsonify
from auth import auth_required
from extensions import mongo, ensure_mongo_connection
import traceback
from datetime import datetime
import json
import io
import zipfile

# Create blueprint for profile management
profile_bp = Blueprint('profile', __name__)

@profile_bp.route('/profile', methods=['GET'])
@auth_required
def get_profile():
    """Get the current user's profile"""
    # User is available from the auth_required decorator
    user = request.user
    user_id = user.get('id')
    
    # Ensure MongoDB connection
    if not ensure_mongo_connection():
        return jsonify({"error": "Database connection unavailable"}), 500
    
    try:
        # Convert user_id to string for MongoDB query consistency
        user_id_str = str(user_id)
        
        # Get user profile from MongoDB
        profile = mongo.db.user_profiles.find_one({"user_id": user_id_str})
        
        # If profile doesn't exist, create a basic one
        if not profile:
            # Create a default profile
            default_profile = {
                "user_id": user_id_str,
                "email": user.get('email'),
                "full_name": user.get('full_name', ''),
                "notification_preferences": {
                    "email": True,
                    "push": True,
                    "sms": False
                },
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            # Insert into MongoDB
            mongo.db.user_profiles.insert_one(default_profile)
            
            # Set as current profile
            profile = default_profile
        
        # Format for JSON response
        formatted_profile = {
            "id": user_id_str,
            "email": profile.get('email'),
            "full_name": profile.get('full_name'),
            "avatar_url": profile.get('avatar_url'),
            "location": profile.get('location'),
            "phone": profile.get('phone'),
            "date_of_birth": profile.get('date_of_birth'),
            "gender": profile.get('gender'),
            "language": profile.get('language', 'en'),
            "timezone": profile.get('timezone'),
            "theme": profile.get('theme', 'light'),
            "notification_preferences": profile.get('notification_preferences', {
                "email": True,
                "push": True,
                "sms": False
            })
        }
        
        if '_id' in formatted_profile:
            del formatted_profile['_id']
        
        return jsonify(formatted_profile), 200
    except Exception as e:
        print(f"DEBUG: Error retrieving user profile: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": "Failed to retrieve user profile", "details": str(e)}), 500

@profile_bp.route('/profile', methods=['PUT'])
@auth_required
def update_profile():
    """Update the current user's profile"""
    # User is available from the auth_required decorator
    user = request.user
    user_id = user.get('id')
    
    # Ensure MongoDB connection
    if not ensure_mongo_connection():
        return jsonify({"error": "Database connection unavailable"}), 500
    
    # Get profile data from request
    data = request.get_json()
    
    try:
        # Convert user_id to string for MongoDB
        user_id_str = str(user_id)
        
        # Get existing profile
        existing_profile = mongo.db.user_profiles.find_one({"user_id": user_id_str})
        
        # If profile doesn't exist, create a new one
        if not existing_profile:
            existing_profile = {
                "user_id": user_id_str,
                "email": user.get('email'),
                "created_at": datetime.utcnow()
            }
        
        # Update profile with new data
        updates = {
            "full_name": data.get('full_name', existing_profile.get('full_name')),
            "avatar_url": data.get('avatar_url', existing_profile.get('avatar_url')),
            "location": data.get('location', existing_profile.get('location')),
            "phone": data.get('phone', existing_profile.get('phone')),
            "date_of_birth": data.get('date_of_birth', existing_profile.get('date_of_birth')),
            "gender": data.get('gender', existing_profile.get('gender')),
            "language": data.get('language', existing_profile.get('language', 'en')),
            "timezone": data.get('timezone', existing_profile.get('timezone')),
            "theme": data.get('theme', existing_profile.get('theme', 'light')),
            "updated_at": datetime.utcnow()
        }
        
        # If notification preferences are provided, update those
        if 'notification_preferences' in data:
            updates['notification_preferences'] = data['notification_preferences']
        
        # Update in MongoDB
        if existing_profile.get('_id'):
            # Update existing profile
            mongo.db.user_profiles.update_one(
                {"user_id": user_id_str},
                {"$set": updates}
            )
        else:
            # Create new profile
            profile_data = {**existing_profile, **updates}
            mongo.db.user_profiles.insert_one(profile_data)
        
        # Get updated profile
        updated_profile = mongo.db.user_profiles.find_one({"user_id": user_id_str})
        
        # Format for JSON response
        formatted_profile = {
            "id": user_id_str,
            "email": updated_profile.get('email'),
            "full_name": updated_profile.get('full_name'),
            "avatar_url": updated_profile.get('avatar_url'),
            "location": updated_profile.get('location'),
            "phone": updated_profile.get('phone'),
            "date_of_birth": updated_profile.get('date_of_birth'),
            "gender": updated_profile.get('gender'),
            "language": updated_profile.get('language', 'en'),
            "timezone": updated_profile.get('timezone'),
            "theme": updated_profile.get('theme', 'light'),
            "notification_preferences": updated_profile.get('notification_preferences', {
                "email": True,
                "push": True,
                "sms": False
            })
        }
        
        return jsonify(formatted_profile), 200
    except Exception as e:
        print(f"DEBUG: Error updating user profile: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": "Failed to update user profile", "details": str(e)}), 500

@profile_bp.route('/profile/notifications', methods=['GET'])
@auth_required
def get_notification_preferences():
    """Get the current user's notification preferences"""
    # User is available from the auth_required decorator
    user = request.user
    user_id = user.get('id')
    
    # Ensure MongoDB connection
    if not ensure_mongo_connection():
        return jsonify({"error": "Database connection unavailable"}), 500
    
    try:
        # Convert user_id to string for MongoDB
        user_id_str = str(user_id)
        
        # Get user notification preferences from MongoDB
        preferences = mongo.db.notification_preferences.find_one({"user_id": user_id_str})
        
        # If preferences don't exist, create default ones
        if not preferences:
            default_preferences = {
                "user_id": user_id_str,
                "mood_reminders": True,
                "appointment_reminders": True,
                "check_in_reminders": True,
                "mood_insights": True,
                "resource_recommendations": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            # Insert into MongoDB
            mongo.db.notification_preferences.insert_one(default_preferences)
            
            # Set as current preferences
            preferences = default_preferences
        
        # Format for JSON response
        formatted_preferences = {
            "mood_reminders": preferences.get('mood_reminders', True),
            "appointment_reminders": preferences.get('appointment_reminders', True),
            "check_in_reminders": preferences.get('check_in_reminders', True),
            "mood_insights": preferences.get('mood_insights', True),
            "resource_recommendations": preferences.get('resource_recommendations', True)
        }
        
        return jsonify(formatted_preferences), 200
    except Exception as e:
        print(f"DEBUG: Error retrieving notification preferences: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": "Failed to retrieve notification preferences", "details": str(e)}), 500

@profile_bp.route('/profile/notifications', methods=['PUT'])
@auth_required
def update_notification_preferences():
    """Update the current user's notification preferences"""
    # User is available from the auth_required decorator
    user = request.user
    user_id = user.get('id')
    
    # Ensure MongoDB connection
    if not ensure_mongo_connection():
        return jsonify({"error": "Database connection unavailable"}), 500
    
    # Get preferences data from request
    data = request.get_json()
    
    try:
        # Convert user_id to string for MongoDB
        user_id_str = str(user_id)
        
        # Get existing preferences
        existing_preferences = mongo.db.notification_preferences.find_one({"user_id": user_id_str})
        
        # If preferences don't exist, create new ones
        if not existing_preferences:
            existing_preferences = {
                "user_id": user_id_str,
                "created_at": datetime.utcnow()
            }
        
        # Update preferences with new data
        updates = {
            "mood_reminders": data.get('mood_reminders', existing_preferences.get('mood_reminders', True)),
            "appointment_reminders": data.get('appointment_reminders', existing_preferences.get('appointment_reminders', True)),
            "check_in_reminders": data.get('check_in_reminders', existing_preferences.get('check_in_reminders', True)),
            "mood_insights": data.get('mood_insights', existing_preferences.get('mood_insights', True)),
            "resource_recommendations": data.get('resource_recommendations', existing_preferences.get('resource_recommendations', True)),
            "updated_at": datetime.utcnow()
        }
        
        # Update in MongoDB
        if existing_preferences.get('_id'):
            # Update existing preferences
            mongo.db.notification_preferences.update_one(
                {"user_id": user_id_str},
                {"$set": updates}
            )
        else:
            # Create new preferences
            preferences_data = {**existing_preferences, **updates}
            mongo.db.notification_preferences.insert_one(preferences_data)
        
        # Get updated preferences
        updated_preferences = mongo.db.notification_preferences.find_one({"user_id": user_id_str})
        
        # Format for JSON response
        formatted_preferences = {
            "mood_reminders": updated_preferences.get('mood_reminders', True),
            "appointment_reminders": updated_preferences.get('appointment_reminders', True),
            "check_in_reminders": updated_preferences.get('check_in_reminders', True),
            "mood_insights": updated_preferences.get('mood_insights', True),
            "resource_recommendations": updated_preferences.get('resource_recommendations', True)
        }
        
        return jsonify(formatted_preferences), 200
    except Exception as e:
        print(f"DEBUG: Error updating notification preferences: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": "Failed to update notification preferences", "details": str(e)}), 500

@profile_bp.route('/profile/password', methods=['PUT'])
@auth_required
def update_password():
    """Update the current user's password"""
    # User is available from the auth_required decorator
    user = request.user
    user_id = user.get('id')
    
    # Get password data from request
    data = request.get_json()
    
    if not data.get('current_password'):
        return jsonify({"error": "Current password is required"}), 400
    
    if not data.get('new_password'):
        return jsonify({"error": "New password is required"}), 400
    
    try:
        # For Supabase implementation, we would update through their API
        # Here we'll focus on standard auth implementation
        from models import User, db, bcrypt
        
        # Find user in database
        user_record = User.query.filter_by(id=user_id).first()
        
        if not user_record:
            return jsonify({"error": "User not found"}), 404
        
        # Verify current password
        if not bcrypt.check_password_hash(user_record.password, data.get('current_password')):
            return jsonify({"error": "Current password is incorrect"}), 401
        
        # Update password
        hashed_password = bcrypt.generate_password_hash(data.get('new_password')).decode('utf-8')
        user_record.password = hashed_password
        
        # Save to database
        db.session.commit()
        
        return jsonify({"success": True, "message": "Password updated successfully"}), 200
    except Exception as e:
        print(f"DEBUG: Error updating password: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": "Failed to update password", "details": str(e)}), 500

@profile_bp.route('/profile', methods=['DELETE'])
@auth_required
def delete_account():
    """Delete the current user's account"""
    # User is available from the auth_required decorator
    user = request.user
    user_id = user.get('id')
    
    # Ensure MongoDB connection
    if not ensure_mongo_connection():
        return jsonify({"error": "Database connection unavailable"}), 500
    
    try:
        # Convert user_id to string for MongoDB
        user_id_str = str(user_id)
        
        # Delete all user data from MongoDB
        collections_to_clean = [
            'user_profiles',
            'notification_preferences',
            'mood_entries',
            'chat_sessions',
            'chats',
            'appointments',
            'reminders',
            'emergency_contacts',
            'emergency_alerts',
            'resource_searches',
        ]
        
        for collection_name in collections_to_clean:
            if collection_name in mongo.db.list_collection_names():
                mongo.db.get_collection(collection_name).delete_many({"user_id": user_id_str})
        
        # Delete user from SQL database if using standard auth
        # For Supabase, we would call their API to delete the user
        try:
            from models import User, db
            user_record = User.query.filter_by(id=user_id).first()
            if user_record:
                db.session.delete(user_record)
                db.session.commit()
        except Exception as auth_err:
            print(f"DEBUG: Error deleting user from auth database: {str(auth_err)}")
            # Continue with the response even if this fails
        
        return jsonify({"success": True, "message": "Account deleted successfully"}), 200
    except Exception as e:
        print(f"DEBUG: Error deleting account: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": "Failed to delete account", "details": str(e)}), 500

@profile_bp.route('/profile/export', methods=['GET'])
@auth_required
def export_user_data():
    """Export all user data"""
    # User is available from the auth_required decorator
    user = request.user
    user_id = user.get('id')
    
    # Ensure MongoDB connection
    if not ensure_mongo_connection():
        return jsonify({"error": "Database connection unavailable"}), 500
    
    try:
        # Convert user_id to string for MongoDB
        user_id_str = str(user_id)
        
        # Create a ZIP file in memory
        memory_file = io.BytesIO()
        with zipfile.ZipFile(memory_file, 'w', zipfile.ZIP_DEFLATED) as zf:
            # Export profile data
            profile = mongo.db.user_profiles.find_one({"user_id": user_id_str})
            if profile:
                profile['_id'] = str(profile['_id'])
                zf.writestr('profile.json', json.dumps(profile, default=str))
            
            # Export notification preferences
            prefs = mongo.db.notification_preferences.find_one({"user_id": user_id_str})
            if prefs:
                prefs['_id'] = str(prefs['_id'])
                zf.writestr('notification_preferences.json', json.dumps(prefs, default=str))
            
            # Export mood entries
            mood_entries = list(mongo.db.mood_entries.find({"user_id": user_id_str}))
            if mood_entries:
                for entry in mood_entries:
                    entry['_id'] = str(entry['_id'])
                zf.writestr('mood_entries.json', json.dumps(mood_entries, default=str))
            
            # Export chat data
            chats = list(mongo.db.chats.find({"user_id": user_id_str}))
            if chats:
                for chat in chats:
                    chat['_id'] = str(chat['_id'])
                zf.writestr('chats.json', json.dumps(chats, default=str))
            
            # Export chat sessions
            sessions = list(mongo.db.chat_sessions.find({"user_id": user_id_str}))
            if sessions:
                for session in sessions:
                    session['_id'] = str(session['_id'])
                zf.writestr('chat_sessions.json', json.dumps(sessions, default=str))
            
            # Export appointments
            appointments = list(mongo.db.appointments.find({"user_id": user_id_str}))
            if appointments:
                for appt in appointments:
                    appt['_id'] = str(appt['_id'])
                zf.writestr('appointments.json', json.dumps(appointments, default=str))
            
            # Export emergency contacts
            contacts = list(mongo.db.emergency_contacts.find({"user_id": user_id_str}))
            if contacts:
                for contact in contacts:
                    contact['_id'] = str(contact['_id'])
                zf.writestr('emergency_contacts.json', json.dumps(contacts, default=str))
        
        # Reset file pointer to beginning of file
        memory_file.seek(0)
        
        # Set filename with date
        filename = f"eSaha_data_{datetime.utcnow().strftime('%Y%m%d')}.zip"
        
        # Return the file
        return memory_file.getvalue(), 200, {
            'Content-Type': 'application/zip',
            'Content-Disposition': f'attachment; filename={filename}'
        }
    except Exception as e:
        print(f"DEBUG: Error exporting user data: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": "Failed to export user data", "details": str(e)}), 500