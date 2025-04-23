"""
Auth System Analyzer for Mental Health Backend
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
    
    # Load the auth module
    try:
        spec = importlib.util.spec_from_file_location("auth", auth_path)
        auth = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(auth)
        print("✅ Successfully loaded auth module")
        
        # Look for login and token generation functions
        login_func = None
        register_func = None
        token_func = None
        
        for name, obj in inspect.getmembers(auth):
            if inspect.isfunction(obj):
                if 'login' in name.lower():
                    login_func = obj
                elif 'register' in name.lower():
                    register_func = obj
                elif 'token' in name.lower() or 'jwt' in name.lower():
                    token_func = obj
        
        # Analyze login function
        if login_func:
            print(f"✅ Found login function: {login_func.__name__}")
            login_src = inspect.getsource(login_func)
            
            # Check for common issues
            if 'create_access_token' in login_src:
                print("✅ Login function creates access token")
            else:
                print("⚠️ Login function may not create an access token!")
                
            if 'expires' in login_src.lower():
                print("✅ Token expiration appears to be configured")
            else:
                print("⚠️ No explicit token expiration found - may be using default (15 minutes)")
                
            if 'fresh=' in login_src or 'fresh =' in login_src:
                print("✅ Token freshness is configured")
            
            if 'jsonify' in login_src and 'return' in login_src:
                print("✅ Login function returns a response")
            else:
                print("⚠️ Login function may not return a proper response")
                
        else:
            print("❌ Could not find login function!")
        
        # Analyze register function
        if register_func:
            print(f"✅ Found register function: {register_func.__name__}")
            
        else:
            print("❌ Could not find register function!")
        
        # Analyze token generation
        if token_func:
            print(f"✅ Found token-related function: {token_func.__name__}")
        
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