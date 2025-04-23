import os
from urllib.parse import quote_plus  # Import this to URL encode special characters

class Config:
    # Flask Config
    SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'Yj9xqgfcl1zbr6t/OtCEpg6pPEOguQsSWJfdcmP+FgTfeM99sz9KhdgxuLqpmmPoFDX/T/y3AIZwfgvY8XTHEA==')
    
    # URL encode the password to handle special characters
    DB_PASSWORD = quote_plus('MamounTantaoui0812')  # Remove the square brackets
    
    # Database Config - Use the connection pooler URL instead of direct connection
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL', 
        f'postgresql://postgres:{DB_PASSWORD}@aws-0-eu-west-2.pooler.supabase.com:5432/postgres'
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # The rest of your config remains the same
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'Yj9xqgfcl1zbr6t/OtCEpg6pPEOguQsSWJfdcmP+FgTfeM99sz9KhdgxuLqpmmPoFDX/T/y3AIZwfgvY8XTHEA==')
    MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/esaha')
    SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://esmieijbsmvbfnfbulir.supabase.co')
    SUPABASE_KEY = os.environ.get('SUPABASE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzbWllaWpic212YmZuZmJ1bGlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDE5MjQwNSwiZXhwIjoyMDU5NzY4NDA1fQ.T0HzXbdMcLZ611eZ-wxTLIoUkgy1KxlIu19Dyb2agYE')
    OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY', '')
    MENTAL_HEALTH_SYSTEM_PROMPT = """You are a supportive mental health companion. 
Your goal is to provide empathetic responses, helpful resources, and coping strategies. 
You should never provide medical diagnoses or replace professional mental health care. 
Always encourage seeking professional help for serious concerns."""