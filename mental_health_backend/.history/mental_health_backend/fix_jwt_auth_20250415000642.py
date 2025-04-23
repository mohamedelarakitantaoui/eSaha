"""
JWT Authentication Fix for Mental Health Backend
This script checks JWT configuration and provides solutions for token issues.
"""
from flask import Flask
from flask_jwt_extended import create_access_token, JWTManager
import datetime
import os
import sys

# Add path to ensure we can import from the project
sys.path.append('.')

# Create a simple Flask app for testing
app = Flask(__name__)

# Configure JWT
app.config['JWT_SECRET_KEY'] = os.environ.get(
    'JWT_SECRET_KEY', 
    'Yj9xqgfcl1zbr6t/OtCEpg6pPEOguQsSWJfdcmP+FgTfeM99sz9KhdgxuLqpmmPoFDX/T/y3AIZwfgvY8XTHEA=='
)
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = datetime.timedelta(hours=1)  # Set token expiry to 1 hour
jwt = JWTManager(app)

def generate_test_token():
    """Generate a test JWT token for verification purposes"""
    with app.app_context():
        # Create a test user identity
        test_identity = {
            'id': 1,
            'username': 'test_user',
            'email': 'test@example.com'
        }
        
        # Create access token
        access_token = create_access_token(identity=test_identity)
        
        return access_token

def check_jwt_config():
    """Check JWT configuration and provide troubleshooting steps"""
    print("🔍 Checking JWT configuration...")
    
    # Check if JWT_SECRET_KEY is properly set
    jwt_secret = app.config.get('JWT_SECRET_KEY')
    if not jwt_secret:
        print("❌ JWT_SECRET_KEY is not set!")
        print("   Fix: Set JWT_SECRET_KEY in your environment variables or config.py")
    else:
        print("✅ JWT_SECRET_KEY is configured")
        print(f"   Secret key first 10 chars: {jwt_secret[:10]}...")
    
    # Check token expiration time
    expiry = app.config.get('JWT_ACCESS_TOKEN_EXPIRES')
    if not expiry:
        print("⚠️ JWT_ACCESS_TOKEN_EXPIRES is not set! Using default expiration time.")
    else:
        print(f"✅ Token expiration set to: {expiry}")
    
    # Generate a test token
    try:
        test_token = generate_test_token()
        print("✅ Successfully generated test token")
        print(f"   Test token: {test_token}")
        print("\n🔑 Token Troubleshooting Instructions:")
        print("1. Ensure this JWT_SECRET_KEY matches in your config.py and environment")
        print("2. Check that your client is sending the token correctly in the Authorization header")
        print("3. Make sure the token format is: 'Bearer your_token_here'")
        print("4. Verify your token is not expired (default expiry is 15 minutes)")
        print("\n🧪 To test your API with this token:")
        print(f"   curl -H \"Authorization: Bearer {test_token}\" http://localhost:5000/your-endpoint")
    except Exception as e:
        print(f"❌ Failed to generate test token: {e}")

if __name__ == "__main__":
    check_jwt_config()
    
    print("\n📝 Steps to Fix 'Invalid or expired token' Error:")
    print("1. Check if users are properly logged in")
    print("2. Ensure the frontend is storing and sending the token correctly")
    print("3. Verify your JWT_SECRET_KEY is consistent between app restarts")
    print("4. Try logging out and logging in again to get a fresh token")
    print("5. Increase token expiration time if tokens are expiring too quickly")