from flask_pymongo import PyMongo
from pymongo import MongoClient
from config import Config
import atexit
import os
from flask import current_app

# Initialize PyMongo
mongo = PyMongo()

# Make client global so it can be accessed for cleanup
client = None

def init_mongo_client(app):
    """Initialize MongoDB client directly"""
    global client
    if client is None:
        mongo_uri = app.config.get('MONGO_URI')
        db_name = app.config.get('MONGO_DBNAME', 'mental_health')
        print(f"DEBUG: Connecting to MongoDB at {mongo_uri} with database {db_name}")
        try:
            client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
            # Test the connection
            client.admin.command('ping')
            print("DEBUG: MongoDB connection successful")
            # Set up db attribute for compatibility with Flask-PyMongo
            mongo.db = client[db_name]
            print(f"DEBUG: Using database: {db_name}")
            # Create the 'chats' collection if it doesn't exist
            if 'chats' not in mongo.db.list_collection_names():
                mongo.db.create_collection('chats')
                print("DEBUG: Created 'chats' collection")
            
            # Ensure chat_sessions collection exists
            if 'chat_sessions' not in mongo.db.list_collection_names():
                mongo.db.create_collection('chat_sessions')
                print("DEBUG: Created 'chat_sessions' collection")
            
            return True
        except Exception as e:
            print(f"DEBUG: MongoDB connection failed: {str(e)}")
            client = None  # Reset client on failure
            return False
    return True

# Add the missing function
def ensure_mongo_connection():
    """
    Ensures that the MongoDB connection is active and available.
    Returns True if the connection is available, False otherwise.
    """
    global client
    if client is None:
        return False
    
    try:
        # Test the connection by running a simple command
        client.admin.command('ping')
        return True
    except Exception as e:
        print(f"DEBUG: MongoDB connection error: {str(e)}")
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

# Clean up MongoDB connection specifically
def cleanup_mongo_connection():
    """Cleanup MongoDB connection during application shutdown"""
    global client
    if client is not None:
        try:
            print("Closing MongoDB connection from extensions module...")
            client.close()
            client = None
        except Exception as e:
            print(f"Error closing MongoDB connection: {str(e)}")

# Register the MongoDB cleanup function
atexit.register(cleanup_mongo_connection)
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