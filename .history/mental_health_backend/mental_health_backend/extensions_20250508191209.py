from flask_pymongo import PyMongo
from pymongo import MongoClient
from flask import current_app
import os

# Initialize extensions
mongo = PyMongo()
client = None

def init_mongo_client(app):
    """Initialize MongoDB client explicitly"""
    global client
    
    try:
        mongodb_uri = app.config.get('MONGO_URI')
        db_name = app.config.get('MONGO_DBNAME')
        
        if not mongodb_uri:
            print("ERROR: MONGO_URI not configured!")
            return False
            
        if not db_name:
            print("WARNING: MONGO_DBNAME not configured, using 'mental_health' as default")
            db_name = 'mental_health'
        
        print(f"DEBUG: Connecting to MongoDB at {mongodb_uri}")
        client = MongoClient(mongodb_uri)
        mongo.db = client[db_name]
        
        # Test the connection
        db_version = client.server_info()['version']
        print(f"DEBUG: Successfully connected to MongoDB version {db_version}")
        return True
    except Exception as e:
        print(f"ERROR: Failed to connect to MongoDB: {str(e)}")
        return False

def ensure_mongo_connection():
    """Ensure MongoDB connection is active and return status"""
    if not hasattr(mongo, 'db') or mongo.db is None:
        print("DEBUG: MongoDB connection not active, reinitializing...")
        from flask import current_app
        init_mongo_client(current_app)
        
        # Double check if mongo.db is now available
        if not hasattr(mongo, 'db') or mongo.db is None:
            print("DEBUG: MongoDB connection failed")
            return False
        
        print("DEBUG: MongoDB connection reinitialized successfully")
    return True