import os
from urllib.parse import quote_plus

class Config:
    # Flask Config
    SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'Yj9xqgfcl1zbr6t/OtCEpg6pPEOguQsSWJfdcmP+FgTfeM99sz9KhdgxuLqpmmPoFDX/T/y3AIZwfgvY8XTHEA==')
    
    # Determine if we're in development or production
    ENV = os.environ.get('FLASK_ENV', 'development')
    
    # Choose database based on environment - SQLite for local development
    if ENV == 'development':
        SQLALCHEMY_DATABASE_URI = 'sqlite:///mental_health.db'
    else:
        # For production, use Supabase
        DB_PASSWORD = quote_plus(os.environ.get('DB_PASSWORD', 'MamounTantaoui0812'))
        SQLALCHEMY_DATABASE_URI = f'postgresql://postgres:{DB_PASSWORD}@aws-0-eu-west-2.pooler.supabase.com:5432/postgres'
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT Config
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'Yj9xqgfcl1zbr6t/OtCEpg6pPEOguQsSWJfdcmP+FgTfeM99sz9KhdgxuLqpmmPoFDX/T/y3AIZwfgvY8XTHEA==')
    
    # MongoDB Config - Ensure database name is explicitly defined
    MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/mental_health')
    MONGO_DBNAME = os.environ.get('MONGO_DBNAME', 'mental_health')
    
    # Supabase Config
    SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://esmieijbsmvbfnfbulir.supabase.co')
    SUPABASE_KEY = os.environ.get('SUPABASE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzbWllaWpic212YmZuZmJ1bGlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxOTI0MDUsImV4cCI6MjA1OTc2ODQwNX0.1BKpCkDqJpNUiyJgH2aUp5aRH-r5Ri5RRdPi978cLVU')
    
    # OpenAI Config
    OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY', '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')
    
    # Mental Health System Prompt
    MENTAL_HEALTH_SYSTEM_PROMPT = """You are a supportive mental health companion. 
Your goal is to provide empathetic responses, helpful resources, and coping strategies. 
You should never provide medical diagnoses or replace professional mental health care. 
Always encourage seeking professional help for serious concerns."""