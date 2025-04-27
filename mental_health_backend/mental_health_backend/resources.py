# Create a new resources.py file in your backend folder

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from auth import auth_required
from extensions import mongo, ensure_mongo_connection
import traceback
from datetime import datetime
import re
import requests
import os
from config import Config

# Create blueprint for resources
resources_bp = Blueprint('resources', __name__)

# Mock data function for development
def get_mock_resources_by_location(location, resource_type=None, keyword=None, max_distance=25):
    """
    Return mock resources for a given location when in development mode
    """
    # Base set of mock resources
    mock_resources = [
        {
            "id": "1",
            "name": "Community Mental Health Center",
            "description": "Offers counseling, therapy, and support services for various mental health concerns.",
            "type": "counseling",
            "address": f"123 Main St, {location}",
            "phone": "555-123-4567",
            "website": "https://example.com/cmhc",
            "distance": 2.3
        },
        {
            "id": "2",
            "name": "Anxiety & Depression Support Group",
            "description": "Weekly peer support meetings for individuals experiencing anxiety and depression.",
            "type": "support_group",
            "address": f"456 Oak Ave, {location}",
            "website": "https://example.com/support",
            "hours": "Tuesdays 7-9PM",
            "distance": 3.1
        },
        {
            "id": "3",
            "name": "Crisis Response Center",
            "description": "24/7 emergency mental health services and crisis intervention.",
            "type": "crisis",
            "phone": "555-911-HELP",
            "website": "https://example.com/crisis",
            "address": f"789 Emergency Blvd, {location}",
            "distance": 5.8
        },
        {
            "id": "4",
            "name": "Mindfulness Meditation Center",
            "description": "Guided meditation and mindfulness practices for stress management and emotional wellbeing.",
            "type": "wellness",
            "address": f"101 Calm St, {location}",
            "website": "https://example.com/mindfulness",
            "hours": "Mon-Fri 9AM-8PM, Sat 10AM-2PM",
            "distance": 1.7
        },
        {
            "id": "5",
            "name": "Veteran's Mental Health Services",
            "description": "Specialized mental health support for veterans and military personnel.",
            "type": "counseling",
            "address": f"567 Veterans Blvd, {location}",
            "phone": "555-VET-HELP",
            "website": "https://example.com/vets",
            "distance": 8.2
        }
    ]
    
    # Filter by type if provided
    if resource_type:
        mock_resources = [r for r in mock_resources if r["type"] == resource_type]
        
    # Filter by keyword if provided
    if keyword:
        keyword_lower = keyword.lower()
        mock_resources = [r for r in mock_resources if 
                        keyword_lower in r["name"].lower() or 
                        keyword_lower in r["description"].lower()]
        
    # Filter by distance if provided
    mock_resources = [r for r in mock_resources if r.get("distance", 0) <= max_distance]
    
    return mock_resources

@resources_bp.route('/resources', methods=['GET'])
@auth_required
def get_resources():
    """Get mental health resources near the user's location"""
    # User is available from the auth_required decorator
    user = request.user
    user_id = user.get('id')
    
    # Get location from query parameter
    location = request.args.get('location')
    
    if not location:
        return jsonify({"error": "Location parameter is required"}), 400
    
    # Get optional filters
    resource_type = request.args.get('type')
    keyword = request.args.get('keyword')
    
    try:
        # For development/testing, use mock data
        if Config.ENV == 'development':
            resources = get_mock_resources_by_location(location, resource_type, keyword)
            return jsonify(resources), 200
            
        # For production, we would query a real API or database
        # This is where you'd implement real resource fetching logic
        # For example, using a mental health resources API or your own database
        
        # Ensure MongoDB connection for logging
        if not ensure_mongo_connection():
            return jsonify({"error": "Database connection unavailable"}), 500
            
        # Log this request for analysis
        try:
            mongo.db.resource_searches.insert_one({
                "user_id": str(user_id),
                "location": location,
                "type": resource_type,
                "keyword": keyword,
                "timestamp": datetime.utcnow()
            })
        except Exception as log_err:
            print(f"DEBUG: Error logging resource search: {str(log_err)}")
            # Not critical, continue
        
        # For now, return mock data in production too
        resources = get_mock_resources_by_location(location, resource_type, keyword)
        return jsonify(resources), 200
            
    except Exception as e:
        print(f"DEBUG: Error getting resources: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": "Failed to retrieve resources", "details": str(e)}), 500

@resources_bp.route('/resources/search', methods=['GET'])
@auth_required
def search_resources():
    """Search for mental health resources with filters"""
    # User is available from the auth_required decorator
    user = request.user
    user_id = user.get('id')
    
    # Get search parameters
    location = request.args.get('location')
    resource_type = request.args.get('type')
    keyword = request.args.get('keyword')
    
    try:
        distance = int(request.args.get('distance', 25))
    except (TypeError, ValueError):
        distance = 25
    
    if not location:
        return jsonify({"error": "Location parameter is required"}), 400
    
    try:
        # For development/testing, use mock data
        resources = get_mock_resources_by_location(location, resource_type, keyword, distance)
        
        # Log this search
        if ensure_mongo_connection():
            try:
                mongo.db.resource_searches.insert_one({
                    "user_id": str(user_id),
                    "location": location,
                    "type": resource_type,
                    "keyword": keyword,
                    "distance": distance,
                    "timestamp": datetime.utcnow()
                })
            except Exception as log_err:
                print(f"DEBUG: Error logging resource search: {str(log_err)}")
                # Not critical, continue
        
        return jsonify(resources), 200
    except Exception as e:
        print(f"DEBUG: Error searching resources: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": "Failed to search resources", "details": str(e)}), 500

@resources_bp.route('/resources/<resource_id>', methods=['GET'])
@auth_required
def get_resource_details(resource_id):
    """Get details for a specific resource"""
    # User is available from the auth_required decorator
    user = request.user
    
    try:
        # For development/testing, construct a mock resource
        mock_resources = get_mock_resources_by_location("Sample City")
        
        # Find the resource by ID
        resource = next((r for r in mock_resources if r["id"] == resource_id), None)
        
        if not resource:
            return jsonify({"error": "Resource not found"}), 404
        
        # Add extra details for the detailed view
        resource["detailed_description"] = "This is a more detailed description of the resource that would include additional information about services offered, eligibility requirements, and other important details."
        resource["eligibility"] = "Open to all residents in the area. No referral needed."
        resource["cost"] = "Sliding scale fees based on income. Insurance accepted."
        resource["languages"] = ["English", "Spanish"]
        
        # Log this view if database is available
        if ensure_mongo_connection():
            try:
                mongo.db.resource_views.insert_one({
                    "user_id": str(user.get('id')),
                    "resource_id": resource_id,
                    "timestamp": datetime.utcnow()
                })
            except Exception as log_err:
                print(f"DEBUG: Error logging resource view: {str(log_err)}")
                # Not critical, continue
        
        return jsonify(resource), 200
    except Exception as e:
        print(f"DEBUG: Error getting resource details: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": "Failed to retrieve resource details", "details": str(e)}), 500