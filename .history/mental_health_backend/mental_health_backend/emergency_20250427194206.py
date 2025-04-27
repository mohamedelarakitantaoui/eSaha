# Create a new emergency.py file in your backend folder

from flask import Blueprint, request, jsonify, current_app
from auth import auth_required
from extensions import mongo, ensure_mongo_connection
import traceback
from datetime import datetime
import uuid
import requests
import os
from config import Config

# Create blueprint for emergency functionality
emergency_bp = Blueprint('emergency', __name__)

# Mock function to send SMS
def send_sms(phone_number, message):
    """
    Send SMS notification (mock implementation for development)
    In production, this would use a service like Twilio
    """
    print(f"MOCK SMS to {phone_number}: {message}")
    # In production, this would be something like:
    # client = Client(account_sid, auth_token)
    # client.messages.create(to=phone_number, from_=twilio_number, body=message)
    return True

# Mock function to send email
def send_email(email_address, subject, message):
    """
    Send email notification (mock implementation for development)
    In production, this would use a service like SendGrid
    """
    print(f"MOCK EMAIL to {email_address}")
    print(f"Subject: {subject}")
    print(f"Message: {message}")
    # In production, this would be something like:
    # sg = SendGridAPIClient(api_key)
    # message = Mail(from_email=from_email, to_emails=email_address, subject=subject, html_content=message)
    # sg.send(message)
    return True

@emergency_bp.route('/emergency/contacts', methods=['GET'])
@auth_required
def get_emergency_contacts():
    """Get all emergency contacts for the current user"""
    # User is available from the auth_required decorator
    user = request.user
    user_id = user.get('id')
    
    # Ensure MongoDB connection
    if not ensure_mongo_connection():
        return jsonify({"error": "Database connection unavailable"}), 500
    
    try:
        # Convert user_id to string for MongoDB query consistency
        user_id_str = str(user_id)
        
        # Get all contacts for this user
        contacts = list(mongo.db.emergency_contacts.find({"user_id": user_id_str}))
        
        # Format for JSON
        formatted_contacts = []
        for contact in contacts:
            contact['id'] = str(contact.pop('_id'))
            formatted_contacts.append(contact)
        
        return jsonify(formatted_contacts), 200
    except Exception as e:
        print(f"DEBUG: Error retrieving emergency contacts: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": "Failed to retrieve emergency contacts", "details": str(e)}), 500

@emergency_bp.route('/emergency/contacts', methods=['POST'])
@auth_required
def add_emergency_contact():
    """Add a new emergency contact"""
    # User is available from the auth_required decorator
    user = request.user
    user_id = user.get('id')
    
    # Ensure MongoDB connection
    if not ensure_mongo_connection():
        return jsonify({"error": "Database connection unavailable"}), 500
    
    # Get contact data from request
    data = request.get_json()
    
    # Validate required fields
    if not data.get('name'):
        return jsonify({"error": "Contact name is required"}), 400
    
    if not data.get('relationship'):
        return jsonify({"error": "Relationship is required"}), 400
    
    if not data.get('phone') and not data.get('email'):
        return jsonify({"error": "Either phone or email is required"}), 400
    
    try:
        # Convert user_id to string for MongoDB
        user_id_str = str(user_id)
        
        # Create contact document
        contact = {
            "user_id": user_id_str,
            "name": data.get('name'),
            "relationship": data.get('relationship'),
            "phone": data.get('phone'),
            "email": data.get('email'),
            "notify_for": data.get('notify_for', ['crisis']),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Insert into MongoDB
        result = mongo.db.emergency_contacts.insert_one(contact)
        
        # Return the new contact with ID
        contact['id'] = str(result.inserted_id)
        del contact['_id']
        
        # Convert dates to ISO strings
        contact['created_at'] = contact['created_at'].isoformat()
        contact['updated_at'] = contact['updated_at'].isoformat()
        
        return jsonify(contact), 201
    except Exception as e:
        print(f"DEBUG: Error adding emergency contact: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": "Failed to add emergency contact", "details": str(e)}), 500

@emergency_bp.route('/emergency/contacts/<contact_id>', methods=['PUT'])
@auth_required
def update_emergency_contact(contact_id):
    """Update an emergency contact"""
    # User is available from the auth_required decorator
    user = request.user
    user_id = user.get('id')
    
    # Ensure MongoDB connection
    if not ensure_mongo_connection():
        return jsonify({"error": "Database connection unavailable"}), 500
    
    # Get contact data from request
    data = request.get_json()
    
    # Validate required fields
    if not data.get('name'):
        return jsonify({"error": "Contact name is required"}), 400
    
    if not data.get('relationship'):
        return jsonify({"error": "Relationship is required"}), 400
    
    if not data.get('phone') and not data.get('email'):
        return jsonify({"error": "Either phone or email is required"}), 400
    
    try:
        from bson.objectid import ObjectId
        
        # Convert user_id to string for MongoDB
        user_id_str = str(user_id)
        
        # Verify the contact exists and belongs to this user
        existing_contact = mongo.db.emergency_contacts.find_one({
            "_id": ObjectId(contact_id),
            "user_id": user_id_str
        })
        
        if not existing_contact:
            return jsonify({"error": "Contact not found or not authorized"}), 404
        
        # Update contact document
        updates = {
            "name": data.get('name'),
            "relationship": data.get('relationship'),
            "phone": data.get('phone'),
            "email": data.get('email'),
            "notify_for": data.get('notify_for', ['crisis']),
            "updated_at": datetime.utcnow()
        }
        
        # Update in MongoDB
        mongo.db.emergency_contacts.update_one(
            {"_id": ObjectId(contact_id), "user_id": user_id_str},
            {"$set": updates}
        )
        
        # Get the updated contact
        updated_contact = mongo.db.emergency_contacts.find_one({"_id": ObjectId(contact_id)})
        
        # Format for JSON response
        updated_contact['id'] = str(updated_contact.pop('_id'))
        
        # Convert dates to ISO strings
        if 'created_at' in updated_contact and isinstance(updated_contact['created_at'], datetime):
            updated_contact['created_at'] = updated_contact['created_at'].isoformat()
        if 'updated_at' in updated_contact and isinstance(updated_contact['updated_at'], datetime):
            updated_contact['updated_at'] = updated_contact['updated_at'].isoformat()
        
        return jsonify(updated_contact), 200
    except Exception as e:
        print(f"DEBUG: Error updating emergency contact: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": "Failed to update emergency contact", "details": str(e)}), 500

@emergency_bp.route('/emergency/contacts/<contact_id>', methods=['DELETE'])
@auth_required
def delete_emergency_contact(contact_id):
    """Delete an emergency contact"""
    # User is available from the auth_required decorator
    user = request.user
    user_id = user.get('id')
    
    # Ensure MongoDB connection
    if not ensure_mongo_connection():
        return jsonify({"error": "Database connection unavailable"}), 500
    
    try:
        from bson.objectid import ObjectId
        
        # Convert user_id to string for MongoDB
        user_id_str = str(user_id)
        
        # Verify the contact exists and belongs to this user
        result = mongo.db.emergency_contacts.delete_one({
            "_id": ObjectId(contact_id),
            "user_id": user_id_str
        })
        
        if result.deleted_count == 0:
            return jsonify({"error": "Contact not found or not authorized"}), 404
        
        return jsonify({"success": True, "message": "Contact deleted successfully"}), 200
    except Exception as e:
        print(f"DEBUG: Error deleting emergency contact: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": "Failed to delete emergency contact", "details": str(e)}), 500

@emergency_bp.route('/emergency/alert', methods=['POST'])
@auth_required
def trigger_emergency_alert():
    """Trigger an emergency alert to the user's contacts"""
    # User is available from the auth_required decorator
    user = request.user
    user_id = user.get('id')
    
    # Ensure MongoDB connection
    if not ensure_mongo_connection():
        return jsonify({"error": "Database connection unavailable"}), 500
    
    try:
        # Convert user_id to string for MongoDB
        user_id_str = str(user_id)
        
        # Get user details for the alert message
        user_profile = None
        try:
            user_profile = mongo.db.user_profiles.find_one({"user_id": user_id_str})
        except Exception as profile_err:
            print(f"DEBUG: Error getting user profile: {str(profile_err)}")
            # Continue anyway, we'll use basic info
        
        # Get user's name or default to "A user"
        user_name = "A user"
        if user_profile and user_profile.get('full_name'):
            user_name = user_profile.get('full_name')
        elif user.get('email'):
            user_name = user.get('email').split('@')[0]
        
        # Get user's location if available
        location_info = ""
        if user_profile and user_profile.get('location'):
            location_info = f" in {user_profile.get('location')}"
        
        # Get contacts who should receive crisis alerts
        contacts = list(mongo.db.emergency_contacts.find({
            "user_id": user_id_str,
            "notify_for": "crisis"
        }))
        
        if not contacts:
            return jsonify({"error": "No emergency contacts configured for alerts"}), 400
        
        # Alert timestamp for consistent messaging
        alert_time = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
        
        # Record the alert in our database
        alert_id = str(uuid.uuid4())
        alert_record = {
            "alert_id": alert_id,
            "user_id": user_id_str,
            "timestamp": datetime.utcnow(),
            "status": "initiated",
            "contacts_notified": []
        }
        
        mongo.db.emergency_alerts.insert_one(alert_record)
        
        # Send alerts to each contact
        successful_notifications = []
        
        for contact in contacts:
            contact_name = contact.get('name', 'Emergency Contact')
            
            # SMS Message
            if contact.get('phone'):
                sms_message = f"EMERGENCY ALERT: {user_name}{location_info} has requested immediate help through eSaha Mental Health App. Please check on them or contact emergency services if appropriate. Sent: {alert_time}"
                
                try:
                    # In production, this would send a real SMS
                    send_sms(contact.get('phone'), sms_message)
                    successful_notifications.append(f"SMS to {contact_name}")
                except Exception as sms_err:
                    print(f"DEBUG: Error sending SMS to {contact.get('phone')}: {str(sms_err)}")
            
            # Email Message
            if contact.get('email'):
                email_subject = f"EMERGENCY ALERT from eSaha Mental Health App"
                email_message = f"""
                <h2>Emergency Alert</h2>
                <p><strong>{user_name}</strong>{location_info} has requested immediate help through the eSaha Mental Health App.</p>
                <p>This is an automated alert sent because they activated the emergency help feature.</p>
                <p>Please check on them or contact emergency services if appropriate.</p>
                <p>Alert sent: {alert_time}</p>
                """
                
                try:
                    # In production, this would send a real email
                    send_email(contact.get('email'), email_subject, email_message)
                    successful_notifications.append(f"Email to {contact_name}")
                except Exception as email_err:
                    print(f"DEBUG: Error sending email to {contact.get('email')}: {str(email_err)}")
        
        # Update alert record with notifications sent
        mongo.db.emergency_alerts.update_one(
            {"alert_id": alert_id},
            {
                "$set": {
                    "status": "completed",
                    "completed_at": datetime.utcnow(),
                    "contacts_notified": successful_notifications
                }
            }
        )
        
        return jsonify({
            "success": True,
            "alert_id": alert_id,
            "notifications_sent": successful_notifications
        }), 200
    except Exception as e:
        print(f"DEBUG: Error triggering emergency alert: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": "Failed to trigger emergency alert", "details": str(e)}), 500