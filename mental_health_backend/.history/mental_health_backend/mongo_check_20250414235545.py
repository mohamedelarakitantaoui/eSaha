"""
MongoDB connection test script.
Run this to check if your MongoDB connection is working.
"""
from pymongo import MongoClient
import os

# Get MongoDB URI from environment or use default
mongo_uri = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/esaha')

def test_mongo_connection():
    try:
        # Connect to MongoDB
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
        
        # Force a connection to verify it works
        client.server_info()
        
        # Get database name from URI
        db_name = mongo_uri.split('/')[-1]
        db = client[db_name]
        
        # Print available collections
        collections = db.list_collection_names()
        
        print(f"✅ Successfully connected to MongoDB at {mongo_uri}")
        print(f"Database: {db_name}")
        print(f"Available collections: {collections}")
        
        # Check if there are any users or chats in the database
        users_count = db.users.count_documents({})
        chats_count = db.chats.count_documents({})
        
        print(f"Users in database: {users_count}")
        print(f"Chats in database: {chats_count}")
        
    except Exception as e:
        print(f"❌ Failed to connect to MongoDB: {e}")

if __name__ == "__main__":
    test_mongo_connection()