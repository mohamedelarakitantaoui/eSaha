from flask_pymongo import PyMongo
from pymongo import MongoClient
from config import Config

# Initialize PyMongo
mongo = PyMongo()

# Alternative connection approach
client = None

def init_mongo_client(app):
    """Initialize MongoDB client directly"""
    global client
    if client is None:
        mongo_uri = app.config.get('MONGO_URI')
        print(f"DEBUG: Connecting to MongoDB at {mongo_uri}")
        try:
            client = MongoClient(mongo_uri)
            # Test the connection
            client.admin.command('ping')
            print("DEBUG: MongoDB connection successful")
            # Set up db attribute for compatibility with Flask-PyMongo
            mongo.db = client.get_database()
            return True
        except Exception as e:
            print(f"DEBUG: MongoDB connection failed: {str(e)}")
            return False
    return True