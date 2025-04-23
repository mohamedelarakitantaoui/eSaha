#!/usr/bin/env python3
"""
Tool to generate a proper Supabase token for testing
"""
import requests
import json
import base64
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get Supabase URL and key from environment or config
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://esmieijbsmvbfnfbulir.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_KEY', 'your-supabase-key')

def login_to_supabase(email, password):
    """Login to Supabase and get a session"""
    url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
    
    headers = {
        "apikey": SUPABASE_KEY,
        "Content-Type": "application/json"
    }
    
    data = {
        "email": email,
        "password": password
    }
    
    response = requests.post(url, headers=headers, json=data)
    
    if response.status_code == 200:
        result = response.json()
        access_token = result.get("access_token")
        refresh_token = result.get("refresh_token")
        
        # Print the token info
        print(f"✅ Login successful!")
        print(f"Access Token: {access_token[:15]}...{access_token[-15:]}")
        
        # Decode and print token payload
        try:
            payload = access_token.split('.')[1]
            # Add padding if needed
            payload += '=' * (4 - len(payload) % 4)
            decoded = base64.b64decode(payload).decode('utf-8')
            jwt_data = json.loads(decoded)
            print("\nToken payload:")
            print(json.dumps(jwt_data, indent=2))
        except Exception as e:
            print(f"Error decoding token: {e}")
        
        return access_token
    else:
        print(f"❌ Login failed: {response.status_code}")
        print(response.text)
        return None

def test_backend_with_supabase_token(token):
    """Test the backend using a Supabase token"""
    url = "http://127.0.0.1:5000/api/chat/token-check"
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    try:
        response = requests.get(url, headers=headers)
        print(f"\nTesting backend token check: {response.status_code}")
        print(response.text)
    except Exception as e:
        print(f"Error: {e}")

def main():
    print("=== Supabase Authentication Test ===")
    email = input("Enter Supabase email: ")
    password = input("Enter Supabase password: ")
    
    token = login_to_supabase(email, password)
    
    if token:
        test_backend_with_supabase_token(token)
        
        print("\nTo test your chat endpoint, use:")
        print(f"curl -X POST http://127.0.0.1:5000/api/chat/chat \\")
        print(f'  -H "Authorization: Bearer {token}" \\')
        print('  -H "Content-Type: application/json" \\')
        print('  -d \'{"subject":"Test","message":"Hello, this is a test message"}\'')

if __name__ == "__main__":
    main()