import os
import requests
import json
from collections import namedtuple
from config import Config

# Create a lightweight client for Supabase
class SupabaseClient:
    def __init__(self, url, key):
        self.url = url
        self.key = key
        self.headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json"
        }
    
    def table(self, table_name):
        return TableQuery(self, table_name)

# Simple table query builder
class TableQuery:
    def __init__(self, client, table_name):
        self.client = client
        self.table_name = table_name
        self.url = f"{client.url}/rest/v1/{table_name}"
    
    def insert(self, data):
        return InsertQuery(self, data)

# Insert query executor
class InsertQuery:
    def __init__(self, table_query, data):
        self.table_query = table_query
        self.data = data
    
    def execute(self):
        response = requests.post(
            self.table_query.url,
            headers=self.table_query.client.headers,
            json=self.data
        )
        return response.json() if response.status_code < 300 else {"error": response.text}

# Initialize the Supabase client
supabase = SupabaseClient(
    Config.SUPABASE_URL,
    Config.SUPABASE_KEY
)

# Function to verify a Supabase JWT token
def verify_supabase_token(token):
    try:
        # Make a request to Supabase auth to verify the token
        response = requests.get(
            f"{Config.SUPABASE_URL}/auth/v1/user",
            headers={
                "apikey": Config.SUPABASE_KEY,
                "Authorization": f"Bearer {token}"
            }
        )
        
        if response.status_code == 200:
            user_data = response.json()
            # Create a namedtuple to store user info
            User = namedtuple('User', ['id', 'email', 'role'])
            return User(
                id=user_data.get('id'),
                email=user_data.get('email'),
                role=user_data.get('role', 'authenticated')
            )
        return None
    except Exception as e:
        print(f"Error verifying token: {str(e)}")
        return None