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
            
            # Check if token is expired
            if 'exp' in payload and datetime.fromtimestamp(payload['exp']) < datetime.now():
                print("DEBUG: Token expired")
                return None
        except Exception as e:
            print(f"DEBUG: Error decoding token: {str(e)}")
            # Continue anyway to let Supabase verify the token
        
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
        
        print(f"DEBUG: Supabase API response: {response.status_code}")
        
        if response.status_code == 200:
            user_data = response.json()
            print(f"DEBUG: Successfully verified user: {user_data.get('email', 'unknown')}")
            # Make sure we have an ID to work with
            if 'id' not in user_data and payload and 'sub' in payload:
                user_data['id'] = payload['sub']
            return user_data
        else:
            print(f"DEBUG: Token verification failed: {response.status_code} {response.text[:100]}")
            # Try a fallback method for verification
            try:
                # If we have a valid JWT payload, we can try to use that
                if payload and 'sub' in payload:
                    print(f"DEBUG: Trying fallback authentication with payload sub: {payload['sub']}")
                    # Check if this user exists in Supabase
                    user_query = supabase.table('users').select('*').eq('id', payload['sub']).execute()
                    if user_query.data and len(user_query.data) > 0:
                        print(f"DEBUG: Found user via fallback method")
                        return {'id': payload['sub'], 'email': user_query.data[0].get('email', 'unknown')}
            except Exception as fallback_error:
                print(f"DEBUG: Fallback authentication failed: {str(fallback_error)}")
            
            return None
            
    except Exception as e:
        print(f"DEBUG: Exception verifying token: {str(e)}")
        return None

def get_supabase_user(user_id):
    """
    Get user details from Supabase by ID
    """
    try:
        user_query = supabase.table('users').select('*').eq('id', user_id).execute()
        if user_query.data and len(user_query.data) > 0:
            return user_query.data[0]
        return None
    except Exception as e:
        print(f"DEBUG: Error fetching user {user_id}: {str(e)}")
        return None

def get_messages_for_user(user_id, limit=50):
    """
    Get recent messages for a user from Supabase
    """
    try:
        # Get messages where the user is either sender or recipient
        query = supabase.table('messages').select('*').or_(
            f'senderId.eq.{user_id},recipientId.eq.{user_id}'
        ).order('timestamp', desc=True).limit(limit).execute()
        
        if query.data:
            return query.data
        return []
    except Exception as e:
        print(f"DEBUG: Error fetching messages for user {user_id}: {str(e)}")
        return []