from flask import Blueprint, request, jsonify, current_app
from datetime import datetime
from bson.objectid import ObjectId
from extensions import mongo
import traceback

# Create blueprint
appointments_bp = Blueprint('appointments', __name__)

@appointments_bp.route('/appointments', methods=['POST'])
def create_appointment():
    """Create a new appointment booking"""
    print("DEBUG: Appointment creation endpoint called")
    
    # Get authorization header
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        print("DEBUG: Missing or invalid Authorization header")
        return jsonify({"error": "Authorization header required"}), 401
    
    # Get token from header
    token = auth_header.split(' ')[1]
    print(f"DEBUG: Received token: {token[:10]}...")
    
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
        print(f"DEBUG: Authenticated user: {user_id}")
    except Exception as auth_err:
        print(f"DEBUG: Authentication error: {str(auth_err)}")
        traceback.print_exc()
        return jsonify({"error": "Authentication error", "details": str(auth_err)}), 401
    
    # Get appointment details from request
    try:
        data = request.get_json() or {}
        print(f"DEBUG: Received appointment data: {data}")
        
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
        
        # Generate a unique ID
        appointment['_id'] = str(ObjectId())
        print(f"DEBUG: Created appointment object: {appointment}")
        
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
        
        print(f"DEBUG: Returning appointment: {response_appointment}")
        return jsonify(response_appointment), 201
        
    except Exception as e:
        print(f"DEBUG: Error booking appointment: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": "Failed to book appointment", "details": str(e)}), 500