from supabase import create_client
import jwt
from config import Config
import requests

# Initialize Supabase client
supabase = create_client(Config.SUPABASE_URL, Config.SUPABASE_KEY)

def verify_supabase_token(token):
    """
    Verify a Supabase JWT token.
    """
    try:
        # First, try to decode the token locally
        decoded = jwt.decode(token, options={"verify_signature": False})
        
        # Make a request to Supabase Auth to validate the token
        headers = {
            "Authorization": f"Bearer {token}",
            "apikey": Config.SUPABASE_KEY
        }
        
        # Get user data from Supabase Auth
        response = requests.get(
            f"{Config.SUPABASE_URL}/auth/v1/user",
            headers=headers
        )
        
        if response.status_code == 200:
            user_data = response.json()
            # Handle the ID format issue - convert to string if it's a number
            if 'id' in user_data:
                user_data['id'] = str(user_data['id'])
            elif 'sub' in decoded:
                # If ID is not in response but in token, use that
                user_data['id'] = str(decoded.get('sub'))
            return user_data
        else:
            print(f"Supabase token validation failed: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        print(f"Token verification error: {str(e)}")
        return None