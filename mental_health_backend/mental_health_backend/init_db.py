"""
Database initialization script for Mental Health Backend
Run this script to create all tables in the database
"""
from app import app, db

def init_database():
    """Initialize the database with all models defined in the application"""
    with app.app_context():
        print("Creating database tables...")
        db.create_all()
        print("Database tables created successfully!")

if __name__ == "__main__":
    init_database()