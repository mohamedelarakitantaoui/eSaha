# Create a new appointments.py file in your backend folder

from flask import Blueprint, request, jsonify
from auth import auth_required
from extensions import mongo, ensure_mongo_connection
import traceback
from datetime import datetime, timedelta
import uuid
from bson.objectid import ObjectId

# Create blueprint for appointment functionality
appointments_bp = Blueprint('appointments', __name__)

# Mock function to send a reminder notification
def send_reminder_notification(user_id, appointment, method='both'):
    """
    Send appointment reminder (mock implementation for development)
    In production, this would use proper notification channels
    """
    print(f"MOCK REMINDER to user {user_id} for appointment: {appointment['title']}")
    # In a real implementation, this would:
    # 1. Look up user's notification preferences
    # 2. Send via appropriate channels (email, SMS, push notification)
    return True

@appointments_bp.route('/appointments', methods=['GET'])
@auth_required
def get_all_appointments():
    """Get all appointments for the current user"""
    # User is available from the auth_required decorator
    user = request.user
    user_id = user.get('id')
    
    # Ensure MongoDB connection
    if not ensure_mongo_connection():
        return jsonify({"error": "Database connection unavailable"}), 500
    
    try:
        # Convert user_id to string for MongoDB query consistency
        user_id_str = str(user_id)
        
        # Get all appointments for this user, sorted by date
        appointments = list(mongo.db.appointments.find({"user_id": user_id_str}).sort("date", 1))
        
        # Format for JSON
        formatted_appointments = []
        for appointment in appointments:
            appointment['id'] = str(appointment.pop('_id'))
            formatted_appointments.append(appointment)
        
        return jsonify(formatted_appointments), 200
    except Exception as e:
        print(f"DEBUG: Error retrieving appointments: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": "Failed to retrieve appointments", "details": str(e)}), 500

@appointments_bp.route('/appointments', methods=['POST'])
@auth_required
def create_appointment():
    """Create a new appointment"""
    # User is available from the auth_required decorator
    user = request.user
    user_id = user.get('id')
    
    # Ensure MongoDB connection
    if not ensure_mongo_connection():
        return jsonify({"error": "Database connection unavailable"}), 500
    
    # Get appointment data from request
    data = request.get_json()
    
    # Validate required fields
    if not data.get('title'):
        return jsonify({"error": "Appointment title is required"}), 400
    
    if not data.get('date'):
        return jsonify({"error": "Date is required"}), 400
    
    if not data.get('start_time'):
        return jsonify({"error": "Start time is required"}), 400
    
    try:
        # Convert user_id to string for MongoDB
        user_id_str = str(user_id)
        
        # Create appointment document
        appointment = {
            "user_id": user_id_str,
            "title": data.get('title'),
            "description": data.get('description'),
            "date": data.get('date'),  # ISO format string
            "start_time": data.get('start_time'),
            "end_time": data.get('end_time'),
            "type": data.get('type', 'other'),
            "location": data.get('location'),
            "reminder_time": data.get('reminder_time'),
            "status": "scheduled",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Insert into MongoDB
        result = mongo.db.appointments.insert_one(appointment)
        
        # Schedule reminders if needed
        if appointment.get('reminder_time'):
            # In a production system, this would create a scheduled task
            # For this implementation, we just record the reminder in the database
            reminder_record = {
                "appointment_id": str(result.inserted_id),
                "user_id": user_id_str,
                "title": appointment["title"],
                "appointment_date": appointment["date"],
                "appointment_time": appointment["start_time"],
                "reminder_time": appointment["reminder_time"],
                "status": "pending",
                "created_at": datetime.utcnow()
            }
            mongo.db.reminders.insert_one(reminder_record)
        
        # Return the new appointment with ID
        appointment['id'] = str(result.inserted_id)
        del appointment['_id']
        
        # Convert dates to ISO strings
        appointment['created_at'] = appointment['created_at'].isoformat()
        appointment['updated_at'] = appointment['updated_at'].isoformat()
        
        return jsonify(appointment), 201
    except Exception as e:
        print(f"DEBUG: Error creating appointment: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": "Failed to create appointment", "details": str(e)}), 500

@appointments_bp.route('/appointments/<appointment_id>', methods=['PUT'])
@auth_required
def update_appointment(appointment_id):
    """Update an appointment"""
    # User is available from the auth_required decorator
    user = request.user
    user_id = user.get('id')
    
    # Ensure MongoDB connection
    if not ensure_mongo_connection():
        return jsonify({"error": "Database connection unavailable"}), 500
    
    # Get appointment data from request
    data = request.get_json()
    
    # Validate required fields
    if not data.get('title'):
        return jsonify({"error": "Appointment title is required"}), 400
    
    if not data.get('date'):
        return jsonify({"error": "Date is required"}), 400
    
    if not data.get('start_time'):
        return jsonify({"error": "Start time is required"}), 400
    
    try:
        # Convert user_id to string for MongoDB
        user_id_str = str(user_id)
        
        # Verify the appointment exists and belongs to this user
        existing_appointment = mongo.db.appointments.find_one({
            "_id": ObjectId(appointment_id),
            "user_id": user_id_str
        })
        
        if not existing_appointment:
            return jsonify({"error": "Appointment not found or not authorized"}), 404
        
        # Update appointment document
        updates = {
            "title": data.get('title'),
            "description": data.get('description'),
            "date": data.get('date'),
            "start_time": data.get('start_time'),
            "end_time": data.get('end_time'),
            "type": data.get('type', existing_appointment.get('type', 'other')),
            "location": data.get('location'),
            "reminder_time": data.get('reminder_time'),
            "updated_at": datetime.utcnow()
        }
        
        # Update in MongoDB
        mongo.db.appointments.update_one(
            {"_id": ObjectId(appointment_id), "user_id": user_id_str},
            {"$set": updates}
        )
        
        # Update reminder if needed
        if 'reminder_time' in data:
            # Remove any existing reminders
            mongo.db.reminders.delete_many({"appointment_id": appointment_id})
            
            # Create new reminder if needed
            if data.get('reminder_time'):
                reminder_record = {
                    "appointment_id": appointment_id,
                    "user_id": user_id_str,
                    "title": updates["title"],
                    "appointment_date": updates["date"],
                    "appointment_time": updates["start_time"],
                    "reminder_time": updates["reminder_time"],
                    "status": "pending",
                    "created_at": datetime.utcnow()
                }
                mongo.db.reminders.insert_one(reminder_record)
        
        # Get the updated appointment
        updated_appointment = mongo.db.appointments.find_one({"_id": ObjectId(appointment_id)})
        
        # Format for JSON response
        updated_appointment['id'] = str(updated_appointment.pop('_id'))
        
        # Convert dates to ISO strings
        if 'created_at' in updated_appointment and isinstance(updated_appointment['created_at'], datetime):
            updated_appointment['created_at'] = updated_appointment['created_at'].isoformat()
        if 'updated_at' in updated_appointment and isinstance(updated_appointment['updated_at'], datetime):
            updated_appointment['updated_at'] = updated_appointment['updated_at'].isoformat()
        
        return jsonify(updated_appointment), 200
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
    
    # Get status from request
    data = request.get_json()
    
    if 'status' not in data:
        return jsonify({"error": "Status is required"}), 400
    
    if data['status'] not in ['scheduled', 'completed', 'cancelled']:
        return jsonify({"error": "Invalid status value"}), 400
    
    try:
        # Convert user_id to string for MongoDB
        user_id_str = str(user_id)
        
        # Verify the appointment exists and belongs to this user
        existing_appointment = mongo.db.appointments.find_one({
            "_id": ObjectId(appointment_id),
            "user_id": user_id_str
        })
        
        if not existing_appointment:
            return jsonify({"error": "Appointment not found or not authorized"}), 404
        
        # Update status in MongoDB
        mongo.db.appointments.update_one(
            {"_id": ObjectId(appointment_id), "user_id": user_id_str},
            {
                "$set": {
                    "status": data['status'],
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # If cancelled, also cancel any reminders
        if data['status'] == 'cancelled':
            mongo.db.reminders.update_many(
                {"appointment_id": appointment_id},
                {"$set": {"status": "cancelled"}}
            )
        
        # Get the updated appointment
        updated_appointment = mongo.db.appointments.find_one({"_id": ObjectId(appointment_id)})
        
        # Format for JSON response
        updated_appointment['id'] = str(updated_appointment.pop('_id'))
        
        # Convert dates to ISO strings
        if 'created_at' in updated_appointment and isinstance(updated_appointment['created_at'], datetime):
            updated_appointment['created_at'] = updated_appointment['created_at'].isoformat()
        if 'updated_at' in updated_appointment and isinstance(updated_appointment['updated_at'], datetime):
            updated_appointment['updated_at'] = updated_appointment['updated_at'].isoformat()
        
        return jsonify(updated_appointment), 200
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
        # Convert user_id to string for MongoDB
        user_id_str = str(user_id)
        
        # Verify the appointment exists and belongs to this user
        result = mongo.db.appointments.delete_one({
            "_id": ObjectId(appointment_id),
            "user_id": user_id_str
        })
        
        if result.deleted_count == 0:
            return jsonify({"error": "Appointment not found or not authorized"}), 404
        
        # Also delete any reminders
        mongo.db.reminders.delete_many({"appointment_id": appointment_id})
        
        return jsonify({"success": True, "message": "Appointment deleted successfully"}), 200
    except Exception as e:
        print(f"DEBUG: Error deleting appointment: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": "Failed to delete appointment", "details": str(e)}), 500

@appointments_bp.route('/appointments/reminders', methods=['GET'])
@auth_required
def get_reminders():
    """Get upcoming appointment reminders for the current user"""
    # User is available from the auth_required decorator
    user = request.user
    user_id = user.get('id')
    
    # Ensure MongoDB connection
    if not ensure_mongo_connection():
        return jsonify({"error": "Database connection unavailable"}), 500
    
    try:
        # Convert user_id to string for MongoDB
        user_id_str = str(user_id)
        
        # Get all pending reminders
        reminders = list(mongo.db.reminders.find({
            "user_id": user_id_str,
            "status": "pending"
        }).sort("appointment_date", 1))
        
        # Format for JSON
        formatted_reminders = []
        for reminder in reminders:
            reminder['id'] = str(reminder.pop('_id'))
            if 'created_at' in reminder and isinstance(reminder['created_at'], datetime):
                reminder['created_at'] = reminder['created_at'].isoformat()
            formatted_reminders.append(reminder)
        
        return jsonify(formatted_reminders), 200
    except Exception as e:
        print(f"DEBUG: Error retrieving reminders: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": "Failed to retrieve reminders", "details": str(e)}), 500

# In a real application, this would be a scheduled job
# Here we'll create an endpoint that could be triggered by a cron job
@appointments_bp.route('/appointments/process-reminders', methods=['POST'])
def process_reminders():
    """Process due reminders (would normally run as a scheduled job)"""
    # This endpoint would typically be secured with an API key
    api_key = request.headers.get('X-API-Key')
    if not api_key or api_key != os.environ.get('CRON_API_KEY'):
        return jsonify({"error": "Unauthorized"}), 401
    
    # Ensure MongoDB connection
    if not ensure_mongo_connection():
        return jsonify({"error": "Database connection unavailable"}), 500
    
    try:
        now = datetime.utcnow()
        processed_count = 0
        
        # Find appointments that need reminders
        pipeline = [
            # Join appointments with reminders
            {
                "$lookup": {
                    "from": "reminders",
                    "localField": "_id",
                    "foreignField": "appointment_id",
                    "as": "reminder"
                }
            },
            # Filter for pending reminders
            {"$match": {"reminder.status": "pending"}},
            # Only include scheduled appointments
            {"$match": {"status": "scheduled"}}
        ]
        
        appointments_with_reminders = list(mongo.db.appointments.aggregate(pipeline))
        
        for appointment in appointments_with_reminders:
            # Check if reminder is due
            appointment_date = datetime.fromisoformat(appointment["date"].replace('Z', '+00:00'))
            appointment_time = appointment["start_time"].split(':')
            appointment_datetime = appointment_date.replace(
                hour=int(appointment_time[0]),
                minute=int(appointment_time[1])
            )
            
            reminder = appointment["reminder"][0]
            reminder_minutes = int(reminder["reminder_time"])
            reminder_datetime = appointment_datetime - timedelta(minutes=reminder_minutes)
            
            # If reminder time has passed, send the notification
            if now >= reminder_datetime:
                # Send the reminder notification
                send_reminder_notification(
                    appointment["user_id"],
                    appointment
                )
                
                # Update reminder status to sent
                mongo.db.reminders.update_one(
                    {"_id": ObjectId(reminder["_id"])},
                    {"$set": {"status": "sent", "sent_at": now}}
                )
                
                processed_count += 1
        
        return jsonify({
            "success": True,
            "processed_count": processed_count
        }), 200
    except Exception as e:
        print(f"DEBUG: Error processing reminders: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": "Failed to process reminders", "details": str(e)}), 500