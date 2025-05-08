from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from bson.objectid import ObjectId
from extensions import mongo
import traceback
import json
# Import the new email utilities
from email_utils import send_appointment_confirmation

# Create blueprint
appointments_bp = Blueprint('appointments', __name__)

def ensure_mongo_connection():
    """Ensure MongoDB connection is active and return status"""
    if not hasattr(mongo, 'db') or mongo.db is None:
        print("DEBUG: MongoDB connection not active, reinitializing...")
        from flask import current_app
        from extensions import init_mongo_client
        
        success = init_mongo_client(current_app)
        
        # Double check if mongo.db is now available
        if not success or not hasattr(mongo, 'db') or mongo.db is None:
            print("DEBUG: MongoDB connection failed")
            return False
        
        print("DEBUG: MongoDB connection reinitialized successfully")
    
    # Verify connection is still alive with a ping
    try:
        mongo.db.command('ping')
        return True
    except Exception as e:
        print(f"DEBUG: MongoDB connection test failed: {str(e)}")
        traceback.print_exc()
        
        # Try to reconnect one more time
        try:
            from flask import current_app
            from extensions import init_mongo_client
            success = init_mongo_client(current_app)
            return success
        except Exception as reconnect_err:
            print(f"DEBUG: MongoDB reconnection failed: {str(reconnect_err)}")
            return False

@appointments_bp.route('/appointments', methods=['POST'])
def create_appointment():
    """Create a new appointment booking"""
    print("DEBUG: Appointment creation endpoint called")
    print(f"DEBUG: Request headers: {dict(request.headers)}")
    
    # Get authorization header
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        print("DEBUG: Missing or invalid Authorization header")
        return jsonify({"error": "Authorization header required"}), 401
    
    # Get token from header
    token = auth_header.split(' ')[1]
    print(f"DEBUG: Received token (first 15 chars): {token[:15]}")
    
    # Get user ID from token
    try:
        # Import auth functions locally to avoid circular imports
        from auth import get_user_from_token
        
        # Get user info from token
        user = get_user_from_token(token)
        
        if not user:
            print("DEBUG: Failed to authenticate token")
            return jsonify({"error": "Invalid token"}), 401
            
        user_id = user.get('id')
        user_email = user.get('email')  # Get the user's email for confirmation
        print(f"DEBUG: Authenticated user ID: {user_id}")
    except Exception as auth_err:
        print(f"DEBUG: Authentication error: {str(auth_err)}")
        traceback.print_exc()
        return jsonify({"error": "Authentication error", "details": str(auth_err)}), 401
    
    # Ensure MongoDB connection
    if not ensure_mongo_connection():
        return jsonify({"error": "Database connection unavailable"}), 500
    
    # Get appointment details from request
    try:
        data = request.get_json() or {}
        print(f"DEBUG: Received appointment data: {json.dumps(data, indent=2, default=str)}")
        
        # Validate required fields
        required_fields = ['specialist_id', 'date', 'start_time']
        for field in required_fields:
            if field not in data:
                print(f"DEBUG: Missing required field: {field}")
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Create appointment object with defaults for optional fields
        appointment = {
            "user_id": str(user_id),
            "specialist_id": data.get('specialist_id'),
            "specialist_name": data.get('specialist_name', ''),
            "title": data.get('title', f"Appointment on {data.get('date')}"),
            "description": data.get('description', ''),
            "date": data.get('date'),
            "start_time": data.get('start_time'),
            "end_time": data.get('end_time', ''),
            "type": data.get('type', 'therapy'),
            "location": data.get('location', ''),
            "reminder_time": data.get('reminder_time', 60),
            "status": "scheduled",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        print(f"DEBUG: Inserting appointment into MongoDB: {json.dumps(appointment, default=str, indent=2)}")
        
        # Generate a unique ID
        appointment['_id'] = str(ObjectId())
        
        # Insert into MongoDB
        result = mongo.db.appointments.insert_one(appointment)
        print(f"DEBUG: Inserted appointment with ID: {result.inserted_id}")
        
        # Format for response
        response_appointment = appointment.copy()
        response_appointment['id'] = str(result.inserted_id)
        del response_appointment['_id']  # Remove _id from response
        
        # Format dates for JSON response
        if 'created_at' in response_appointment and isinstance(response_appointment['created_at'], datetime):
            response_appointment['created_at'] = response_appointment['created_at'].isoformat()
        if 'updated_at' in response_appointment and isinstance(response_appointment['updated_at'], datetime):
            response_appointment['updated_at'] = response_appointment['updated_at'].isoformat()
        
        # Send confirmation email if user email is available
        if user_email:
            try:
                email_sent = send_appointment_confirmation(user_email, response_appointment)
                if email_sent:
                    print(f"DEBUG: Confirmation email sent to {user_email}")
                else:
                    print(f"DEBUG: Failed to send confirmation email to {user_email}")
            except Exception as email_err:
                print(f"DEBUG: Error sending confirmation email: {str(email_err)}")
                # Don't fail the appointment creation just because email failed
        else:
            print("DEBUG: No user email available for confirmation")
        
        print(f"DEBUG: Returning appointment: {json.dumps(response_appointment, default=str)}")
        return jsonify(response_appointment), 201
        
    except Exception as e:
        print(f"DEBUG: Error booking appointment: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": "Failed to book appointment", "details": str(e)}), 500

@appointments_bp.route('/appointments', methods=['GET'])
def get_appointments():
    """Get all appointments for the current user"""
    # Get authorization header
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        print("DEBUG: Missing or invalid Authorization header")
        return jsonify({"error": "Authorization header required"}), 401
    
    # Get token from header
    token = auth_header.split(' ')[1]
    
    # Get user ID from token
    try:
        # Import auth functions locally to avoid circular imports
        from auth import get_user_from_token
        
        # Get user info from token
        user = get_user_from_token(token)
        
        if not user:
            print("DEBUG: Failed to authenticate token")
            return jsonify({"error": "Invalid token"}), 401
            
        user_id = user.get('id')
        print(f"DEBUG: Authenticated user ID: {user_id}")
    except Exception as auth_err:
        print(f"DEBUG: Authentication error: {str(auth_err)}")
        traceback.print_exc()
        return jsonify({"error": "Authentication error", "details": str(auth_err)}), 401
    
    # Ensure MongoDB connection
    if not ensure_mongo_connection():
        return jsonify({"error": "Database connection unavailable"}), 500
    
    try:
        # Query filter options
        status = request.args.get('status')
        
        # Build query filter
        query_filter = {"user_id": str(user_id)}
        if status:
            query_filter["status"] = status
        
        print(f"DEBUG: Querying appointments with filter: {query_filter}")
        
        # Query MongoDB for appointments
        appointments_cursor = mongo.db.appointments.find(query_filter).sort("date", 1)
        
        # Convert to list and format for response
        appointments = []
        for appointment in appointments_cursor:
            # Convert ObjectId to string
            appointment['id'] = str(appointment.pop('_id'))
            
            # Format dates
            if 'created_at' in appointment and isinstance(appointment['created_at'], datetime):
                appointment['created_at'] = appointment['created_at'].isoformat()
            if 'updated_at' in appointment and isinstance(appointment['updated_at'], datetime):
                appointment['updated_at'] = appointment['updated_at'].isoformat()
                
            appointments.append(appointment)
        
        print(f"DEBUG: Found {len(appointments)} appointments")
        return jsonify(appointments), 200
        
    except Exception as e:
        print(f"DEBUG: Error retrieving appointments: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": "Failed to retrieve appointments", "details": str(e)}), 500

@appointments_bp.route('/appointments/<appointment_id>', methods=['PUT'])
def update_appointment(appointment_id):
    """Update an existing appointment"""
    # Get authorization header
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        print("DEBUG: Missing or invalid Authorization header")
        return jsonify({"error": "Authorization header required"}), 401
    
    # Get token from header
    token = auth_header.split(' ')[1]
    
    # Get user ID from token
    try:
        # Import auth functions locally to avoid circular imports
        from auth import get_user_from_token
        
        # Get user info from token
        user = get_user_from_token(token)
        
        if not user:
            print("DEBUG: Failed to authenticate token")
            return jsonify({"error": "Invalid token"}), 401
            
        user_id = user.get('id')
    except Exception as auth_err:
        print(f"DEBUG: Authentication error: {str(auth_err)}")
        traceback.print_exc()
        return jsonify({"error": "Authentication error", "details": str(auth_err)}), 401
    
    # Ensure MongoDB connection
    if not ensure_mongo_connection():
        return jsonify({"error": "Database connection unavailable"}), 500
    
    # Get updated appointment details
    data = request.get_json() or {}
    
    try:
        # Fields that cannot be updated
        protected_fields = ['user_id', '_id', 'id', 'created_at']
        update_data = {k: v for k, v in data.items() if k not in protected_fields}
        
        # Always update the updated_at timestamp
        update_data['updated_at'] = datetime.utcnow()
        
        # Update in MongoDB
        result = mongo.db.appointments.update_one(
            {"_id": ObjectId(appointment_id), "user_id": str(user_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            return jsonify({"error": "Appointment not found or not authorized"}), 404
            
        # Get the updated appointment
        updated = mongo.db.appointments.find_one({"_id": ObjectId(appointment_id)})
        
        # Format for response
        updated['id'] = str(updated.pop('_id'))
        if 'created_at' in updated and isinstance(updated['created_at'], datetime):
            updated['created_at'] = updated['created_at'].isoformat()
        if 'updated_at' in updated and isinstance(updated['updated_at'], datetime):
            updated['updated_at'] = updated['updated_at'].isoformat()
        
        return jsonify(updated), 200
        
    except Exception as e:
        print(f"DEBUG: Error updating appointment: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": "Failed to update appointment", "details": str(e)}), 500

@appointments_bp.route('/appointments/<appointment_id>/status', methods=['PUT'])
def update_appointment_status(appointment_id):
    """Update an appointment's status"""
    # Get authorization header
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        print("DEBUG: Missing or invalid Authorization header")
        return jsonify({"error": "Authorization header required"}), 401
    
    # Get token from header
    token = auth_header.split(' ')[1]
    
    # Get user ID from token
    try:
        # Import auth functions locally to avoid circular imports
        from auth import get_user_from_token
        
        # Get user info from token
        user = get_user_from_token(token)
        
        if not user:
            print("DEBUG: Failed to authenticate token")
            return jsonify({"error": "Invalid token"}), 401
            
        user_id = user.get('id')
    except Exception as auth_err:
        print(f"DEBUG: Authentication error: {str(auth_err)}")
        traceback.print_exc()
        return jsonify({"error": "Authentication error", "details": str(auth_err)}), 401
    
    # Ensure MongoDB connection
    if not ensure_mongo_connection():
        return jsonify({"error": "Database connection unavailable"}), 500
    
    # Get the status update
    data = request.get_json() or {}
    status = data.get('status')
    
    if not status or status not in ['scheduled', 'completed', 'cancelled']:
        return jsonify({"error": "Invalid or missing status. Must be one of: scheduled, completed, cancelled"}), 400
    
    try:
        # Update in MongoDB
        result = mongo.db.appointments.update_one(
            {"_id": ObjectId(appointment_id), "user_id": str(user_id)},
            {"$set": {"status": status, "updated_at": datetime.utcnow()}}
        )
        
        if result.matched_count == 0:
            return jsonify({"error": "Appointment not found or not authorized"}), 404
            
        # Get the updated appointment
        updated = mongo.db.appointments.find_one({"_id": ObjectId(appointment_id)})
        
        # Format for response
        updated['id'] = str(updated.pop('_id'))
        if 'created_at' in updated and isinstance(updated['created_at'], datetime):
            updated['created_at'] = updated['created_at'].isoformat()
        if 'updated_at' in updated and isinstance(updated['updated_at'], datetime):
            updated['updated_at'] = updated['updated_at'].isoformat()
        
        return jsonify(updated), 200
        
    except Exception as e:
        print(f"DEBUG: Error updating appointment status: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": "Failed to update appointment status", "details": str(e)}), 500

@appointments_bp.route('/appointments/<appointment_id>', methods=['DELETE'])
def delete_appointment(appointment_id):
    """Delete an appointment"""
    # Get authorization header
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        print("DEBUG: Missing or invalid Authorization header")
        return jsonify({"error": "Authorization header required"}), 401
    
    # Get token from header
    token = auth_header.split(' ')[1]
    
    # Get user ID from token
    try:
        # Import auth functions locally to avoid circular imports
        from auth import get_user_from_token
        
        # Get user info from token
        user = get_user_from_token(token)
        
        if not user:
            print("DEBUG: Failed to authenticate token")
            return jsonify({"error": "Invalid token"}), 401
            
        user_id = user.get('id')
    except Exception as auth_err:
        print(f"DEBUG: Authentication error: {str(auth_err)}")
        traceback.print_exc()
        return jsonify({"error": "Authentication error", "details": str(auth_err)}), 401
    
    # Ensure MongoDB connection
    if not ensure_mongo_connection():
        return jsonify({"error": "Database connection unavailable"}), 500
    
    try:
        # Delete from MongoDB
        result = mongo.db.appointments.delete_one(
            {"_id": ObjectId(appointment_id), "user_id": str(user_id)}
        )
        
        if result.deleted_count == 0:
            return jsonify({"error": "Appointment not found or not authorized"}), 404
            
        return jsonify({"success": True, "message": "Appointment deleted successfully"}), 200
        
    except Exception as e:
        print(f"DEBUG: Error deleting appointment: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": "Failed to delete appointment", "details": str(e)}), 500