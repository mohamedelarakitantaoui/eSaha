import os

class Config:
    # Flask Config
    SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'Yj9xqgfcl1zbr6t/OtCEpg6pPEOguQsSWJfdcmP+FgTfeM99sz9KhdgxuLqpmmPoFDX/T/y3AIZwfgvY8XTHEA==')
    
    # Database Config
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'postgresql://postgres:[Mamoun08]@db.esmieijbsmvbfnfbulir.supabase.co:5432/postgres')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT Config
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'Yj9xqgfcl1zbr6t/OtCEpg6pPEOguQsSWJfdcmP+FgTfeM99sz9KhdgxuLqpmmPoFDX/T/y3AIZwfgvY8XTHEA==')
    
    # MongoDB Config
    MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/esaha')
    
    # Supabase Config
    SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://esmieijbsmvbfnfbulir.supabase.co')
    SUPABASE_KEY = os.environ.get('SUPABASE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzbWllaWpic212YmZuZmJ1bGlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDE5MjQwNSwiZXhwIjoyMDU5NzY4NDA1fQ.T0HzXbdMcLZ611eZ-wxTLIoUkgy1KxlIu19Dyb2agYE')
    
    # OpenAI Config
    OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY', '')
    
    # Mental Health System Prompt
    MENTAL_HEALTH_SYSTEM_PROMPT = """You are a supportive mental health companion. 
Your goal is to provide empathetic responses, helpful resources, and coping strategies. 
You should never provide medical diagnoses or replace professional mental health care. 
Always encourage seeking professional help for serious concerns."""