from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from bson.objectid import ObjectId
from extensions import mongo, ensure_mongo_connection
from auth import auth_required
import uuid
import traceback

# Create blueprint
appointments_bp = Blueprint('appointments', __name__)

@appointments_bp.route('/appointments', methods=['POST'])
@auth_required
def create_appointment():
    """Create a new appointment booking"""
    # User is available from the auth_required decorator
    user = request.user
    user_id = user.get('id')
    
    # Ensure MongoDB connection
    if not ensure_mongo_connection():
        return jsonify({"error": "Database connection unavailable"}), 500
    
    # Get appointment details from request
    data = request.get_json() or {}
    
    # Validate required fields
    required_fields = ['specialist_id', 'date', 'start_time']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400
    
    try:
        # Create appointment object
        appointment = {
            "user_id": str(user_id),
            "specialist_id": data.get('specialist_id'),
            "specialist_name": data.get('specialist_name', ''),  # Optional
            "title": data.get('title', f"Appointment on {data.get('date')}"),
            "description": data.get('description', ''),
            "date": data.get('date'),
            "start_time": data.get('start_time'),
            "end_time": data.get('end_time', ''),  # Optional
            "type": data.get('type', 'therapy'),
            "location": data.get('location', ''),  # Optional
            "reminder_time": data.get('reminder_time', 60),  # Default 60 min reminder
            "status": "scheduled",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Generate a unique ID if not provided
        if '_id' not in appointment:
            appointment['_id'] = str(ObjectId())
            
        # Insert into MongoDB
        result = mongo.db.appointments.insert_one(appointment)
        
        # Format the response
        appointment['id'] = str(result.inserted_id)
        
        # Format dates for JSON response
        if 'created_at' in appointment and isinstance(appointment['created_at'], datetime):
            appointment['created_at'] = appointment['created_at'].isoformat()
        if 'updated_at' in appointment and isinstance(appointment['updated_at'], datetime):
            appointment['updated_at'] = appointment['updated_at'].isoformat()
        
        return jsonify(appointment), 201
        
    except Exception as e:
        print(f"DEBUG: Error booking appointment: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": "Failed to book appointment", "details": str(e)}), 500

@appointments_bp.route('/appointments', methods=['GET'])
@auth_required
def get_appointments():
    """Get all appointments for the current user"""
    # User is available from the auth_required decorator
    user = request.user
    user_id = user.get('id')
    
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
        
        return jsonify(appointments), 200
        
    except Exception as e:
        print(f"DEBUG: Error retrieving appointments: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": "Failed to retrieve appointments", "details": str(e)}), 500

@appointments_bp.route('/appointments/<appointment_id>', methods=['PUT'])
@auth_required
def update_appointment(appointment_id):
    """Update an existing appointment"""
    # User is available from the auth_required decorator
    user = request.user
    user_id = user.get('id')
    
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
@auth_required
def update_appointment_status(appointment_id):
    """Update an appointment's status"""
    # User is available from the auth_required decorator
    user = request.user
    user_id = user.get('id')
    
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
@auth_required
def delete_appointment(appointment_id):
    """Delete an appointment"""
    # User is available from the auth_required decorator
    user = request.user
    user_id = user.get('id')
    
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

@appointments_bp.route('/appointments/specialist/<specialist_id>', methods=['GET'])
@auth_required
def get_appointments_by_specialist(specialist_id):
    """Get appointments for a specific specialist"""
    # User is available from the auth_required decorator
    user = request.user
    user_id = user.get('id')
    
    # Ensure MongoDB connection
    if not ensure_mongo_connection():
        return jsonify({"error": "Database connection unavailable"}), 500
    
    try:
        # Query MongoDB for specialist appointments for this user
        appointments_cursor = mongo.db.appointments.find({
            "user_id": str(user_id),
            "specialist_id": specialist_id
        }).sort("date", 1)
        
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
        
        return jsonify(appointments), 200
        
    except Exception as e:
        print(f"DEBUG: Error retrieving specialist appointments: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": "Failed to retrieve specialist appointments", "details": str(e)}), 500