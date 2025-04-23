"""
Simple Token Generator for Testing Authentication
This script creates a JWT token for testing your API endpoints.
"""
from flask import Flask
from datetime import timedelta
import os

app = Flask(__name__)

# Import Flask-JWT-Extended safely
try:
    from flask_jwt_extended import JWTManager, create_access_token
    jwt_imported = True
except ImportError:
    print("❌ Flask-JWT-Extended not installed. Installing...")
    os.system('pip install flask-jwt-extended')
    try:
        from flask_jwt_extended import JWTManager, create_access_token
        jwt_imported = True
        print("✅ Flask-JWT-Extended installed successfully")
    except ImportError:
        jwt_imported = False
        print("❌ Failed to install Flask-JWT-Extended")

def generate_token():
    """Generate a test JWT token"""
    if not jwt_imported:
        print("❌ Cannot generate token without Flask-JWT-Extended")
        return
    
    # Get the JWT secret key from your config
    jwt_secret_key = os.environ.get(
        'JWT_SECRET_KEY', 
        'Yj9xqgfcl1zbr6t/OtCEpg6pPEOguQsSWJfdcmP+FgTfeM99sz9KhdgxuLqpmmPoFDX/T/y3AIZwfgvY8XTHEA=='
    )
    
    # Configure Flask-JWT-Extended
    app.config['JWT_SECRET_KEY'] = jwt_secret_key
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=1)  # Set to a day for testing
    jwt = JWTManager(app)
    
    # Create test user data
    test_user = {
        'id': 1,
        'username': 'test_user',
        'email': 'test@example.com'
    }
    
    # Generate token with the app context
    with app.app_context():
        access_token = create_access_token(identity=test_user)
    
    print("\n✅ Test token generated successfully!")
    print(f"\nTest Token: {access_token}")
    print("\nTo use this token with Postman/curl:")
    print(f'curl -H "Authorization: Bearer {access_token}" http://localhost:5000/your-endpoint')
    print("\nTo use with JavaScript fetch:")
    print("""
fetch('http://localhost:5000/your-endpoint', {
    method: 'GET',
    headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE',
        'Content-Type': 'application/json'
    }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
    """.replace('YOUR_TOKEN_HERE', access_token))
    
    return access_token

if __name__ == "__main__":
    print("🔑 Generating test JWT token for API testing...\n")
    generate_token()