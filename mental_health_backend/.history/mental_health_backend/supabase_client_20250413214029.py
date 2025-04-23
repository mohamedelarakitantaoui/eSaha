import os
from supabase import create_client, Client
from config import Config

# Initialize Supabase client
supabase: Client = create_client(Config.SUPABASE_URL, Config.SUPABASE_KEY)

def verify_supabase_token(token):
    """
    Verify a Supabase JWT token and return the user data if valid
    """
    try:
        # Get user data from token
        user_response = supabase.auth.get_user(token)
        return user_response.user
    except Exception as e:
        print(f"Token verification error: {str(e)}")
        return None