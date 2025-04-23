import os
import json
import requests
from config import Config
from supabase import create_client, Client
import jwt
from datetime import datetime

# Initialize Supabase client
supabase: Client = create_client(Config.SUPABASE_URL, Config.SUPABASE_KEY)

def verify_supabase_token(token):
    """
    Verify a Supabase JWT token and return the user data if valid
    """
    try:
        print(f"DEBUG: Verifying token: {token[:10]}...{token[-10:] if len(token) > 20 else token}")
        
        # First, try to decode the token to get basic info (without verification)
        try:
            payload = jwt.decode(token, options={"verify_signature": False})
            print(f"DEBUG: Token payload: {payload}")
            
            # Check if this looks like a Flask JWT token (not a Supabase token)
            if 'type' in payload and payload['type'] == 'access' and 'sub' in payload and isinstance(payload['sub'], int):
                print("DEBUG: This appears to be a Flask JWT token, not a Supabase token")
                return None
                
            # Check if token is expired
            if 'exp' in payload and datetime.fromtimestamp(payload['exp']) < datetime.now():
                print("DEBUG: Token expired")
                return None
        except Exception as e:
            print(f"DEBUG: Error decoding token: {str(e)}")
            return None
        
        # Use Supabase API to actually verify the token
        headers = {
            "apikey": Config.SUPABASE_KEY,
            "Authorization": f"Bearer {token}"
        }
        
        # Make request to Supabase auth API
        response = requests.get(
            f"{Config.SUPABASE_URL}/auth/v1/user",
            headers=headers
        )
        
        print(f"DEBUG: Supabase API response: {response.status_code} {response.text}")
        
        if response.status_code == 200:
            user_data = response.json()
            # Add the token's sub claim as id for consistency
            if 'id' not in user_data and 'sub' in payload:
                user_data['id'] = payload['sub']
            return user_data
        else:
            print(f"DEBUG: Token verification failed: {response.status_code} {response.text}")
            return None
            
    except Exception as e:
        print(f"DEBUG: Exception verifying token: {str(e)}")
        return None