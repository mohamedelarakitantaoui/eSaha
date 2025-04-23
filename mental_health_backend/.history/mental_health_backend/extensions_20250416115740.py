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
        db_name = app.config.get('MONGO_DBNAME', 'mental_health')
        print(f"DEBUG: Connecting to MongoDB at {mongo_uri} with database {db_name}")
        try:
            client = MongoClient(mongo_uri)
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
            return True
        except Exception as e:
            print(f"DEBUG: MongoDB connection failed: {str(e)}")
            return False
    return True