"""
Updated Auth System Analyzer for Mental Health Backend
This script analyzes common auth issues in Flask-JWT applications.
"""
import os
import sys
import importlib.util
import inspect

def find_file(filename, start_path='.'):
    """Find a file in the directory tree"""
    for root, dirs, files in os.walk(start_path):
        if filename in files:
            return os.path.join(root, filename)
    return None

def analyze_auth_system():
    """Analyze the authentication system for common issues"""
    print("🔍 Analyzing authentication system...")
    
    # Check if auth.py exists
    auth_path = find_file('auth.py')
    if not auth_path:
        print("❌ Could not find auth.py file!")
        return
    
    print(f"✅ Found auth.py at: {auth_path}")
    
    # Read the auth file content instead of importing it
    # This avoids import errors with dependencies
    try:
        with open(auth_path, 'r') as f:
            auth_content = f.read()
        
        print("✅ Successfully read auth module content")
        
        # Analyze the content for common patterns and issues
        # Check for login functionality
        if 'def login' in auth_content:
            print("✅ Found login function")
            
            # Check for common JWT operations
            if 'create_access_token' in auth_content:
                print("✅ Code creates access tokens")
            else:
                print("⚠️ No access token creation found!")
                
            if 'jwt_required' in auth_content:
                print("✅ JWT protection is used")
            else:
                print("⚠️ No JWT protection found!")
                
            if 'expires' in auth_content.lower():
                print("✅ Token expiration appears to be configured")
            else:
                print("⚠️ No explicit token expiration found - may be using default (15 minutes)")
        else:
            print("❌ Could not find login function!")
        
        # Check for registration functionality
        if 'def register' in auth_content:
            print("✅ Found register function")
        else:
            print("❌ Could not find register function!")
        
        # Check for protected routes
        if '@jwt_required' in auth_content:
            print("✅ JWT protected routes found")
        else:
            print("⚠️ No JWT protection found on routes!")
        
        # Check for token validation
        if 'get_jwt_identity' in auth_content:
            print("✅ JWT identity verification is used")
        else:
            print("⚠️ No JWT identity verification found!")
            
        # Check for token refresh
        if 'refresh' in auth_content.lower() and 'token' in auth_content.lower():
            print("✅ Token refresh functionality appears to be implemented")
        
        # Extract the route endpoints
        endpoints = []
        for line in auth_content.split('\n'):
            if '@app.route' in line or '@auth_bp.route' in line:
                endpoints.append(line.strip())
        
        if endpoints:
            print("\n🔍 Found API endpoints:")
            for endpoint in endpoints:
                print(f"   {endpoint}")
        
        print("\n🔍 Common Authentication Issues:")
        print("1. Token expiration too short (default is 15 minutes)")
        print("2. Missing @jwt_required() decorator on protected routes")
        print("3. Incorrect token format in Authorization header (should be 'Bearer token')")
        print("4. Frontend not storing or sending the token correctly")
        print("5. Different JWT_SECRET_KEY values between app restarts")
        
    except Exception as e:
        print(f"❌ Error analyzing auth module: {e}")

if __name__ == "__main__":
    analyze_auth_system()
    
    print("\n📝 Recommended Actions:")
    print("1. Run the fix_jwt_auth.py script to generate a test token")
    print("2. Check your login endpoint implementation")
    print("3. Verify that your frontend is storing the token correctly")
    print("4. Test authentication with a tool like Postman or curl")
    print("5. Set a longer expiration time for tokens if needed")