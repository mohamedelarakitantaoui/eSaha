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
        # First, try to decode the token to get the user info
        # Note: This doesn't fully verify the signature but gives us the payload
        payload = jwt.decode(token, options={"verify_signature": False})
        
        # Check if token is expired
        if 'exp' in payload and datetime.fromtimestamp(payload['exp']) < datetime.now():
            print("DEBUG: Token expired")
            return None
        
        # Use Supabase API to actually verify the token
        headers = {
            "apikey": Config.SUPABASE_KEY,
            "Authorization": f"Bearer {token}"
        }
        
        # Make request to Supabase user endpoint to verify token
        response = requests.get(
            f"{Config.SUPABASE_URL}/auth/v1/user",
            headers=headers
        )
        
        if response.status_code == 200:
            user_data = response.json()
            # Add the token's sub claim as id for consistency
            if 'sub' in payload and 'id' not in user_data:
                user_data['id'] = payload['sub']
            return user_data
        else:
            print(f"DEBUG: Token verification failed: {response.status_code} {response.text}")
            return None
            
    except Exception as e:
        print(f"DEBUG: Exception verifying token: {str(e)}")
        return None