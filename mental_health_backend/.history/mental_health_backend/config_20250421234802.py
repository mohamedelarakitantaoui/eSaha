import os
from urllib.parse import quote_plus
from dotenv import load_dotenv

# Ensure environment variables are loaded
load_dotenv()

class Config:
    # Flask Config
    SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'default_secret_key_for_development_only')
    
    # Determine if we're in development or production
    ENV = os.environ.get('FLASK_ENV', 'development')
    
    # Choose database based on environment - SQLite for local development
    if ENV == 'development':
        SQLALCHEMY_DATABASE_URI = os.environ.get('SQLALCHEMY_DATABASE_URI', 'sqlite:///mental_health.db')
    else:
        # For production, use PostgreSQL with credentials from environment variables
        DB_USER = os.environ.get('DB_USER', 'postgres')
        DB_PASSWORD = quote_plus(os.environ.get('DB_PASSWORD', ''))
        DB_HOST = os.environ.get('DB_HOST', 'localhost')
        DB_PORT = os.environ.get('DB_PORT', '5432')
        DB_NAME = os.environ.get('DB_NAME', 'postgres')
        
        SQLALCHEMY_DATABASE_URI = f'postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}'
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT Config
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'default_secret_key_for_development_only')
    
    # MongoDB Config - Ensure database name is explicitly defined
    MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/mental_health')
    MONGO_DBNAME = os.environ.get('MONGO_DBNAME', 'mental_health')
    
    # Supabase Config
    SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
    SUPABASE_KEY = os.environ.get('SUPABASE_KEY', '')
    
    # OpenAI Config
    OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY', '')
    
    # Mental Health System Prompt
    MENTAL_HEALTH_SYSTEM_PROMPT = """You are a compassionate mental health companion designed to provide supportive, empathetic responses to people seeking emotional support.

GUIDELINES:
- Respond in the same language the person is using (French, Arabic, Tamazight, English, or any other language)
- Provide validation for the person's feelings and experiences
- Offer practical, evidence-based coping strategies when appropriate
- Use warm, empathetic language that conveys genuine understanding
- Apply appropriate mental health terminology in a non-clinical, accessible way
- Provide culturally sensitive responses that respect diverse backgrounds
- Ask thoughtful follow-up questions to better understand the person's situation
- When appropriate, suggest mindfulness techniques, breathing exercises, or grounding practices
- Acknowledge the limitations of digital support and encourage professional help when needed

HANDLING UNCLEAR MESSAGES:
- If a message is unclear, ambiguous, or difficult to understand in any language (French, Arabic, Tamazight, or others), DO NOT attempt to answer
- Instead, politely ask the person to rephrase their question or concern in simpler terms
- When encountering unclear text, respond in multiple languages (the original language plus English) to ensure comprehension
- For partially understandable messages, acknowledge the parts you understand and ask for clarification on the rest

IMPORTANT:
- Never diagnose medical or psychological conditions
- Do not replace professional mental health care or give medical advice
- Maintain a non-judgmental stance and validate emotions
- Prioritize safety - if someone indicates self-harm or harm to others, emphasize getting immediate professional help
- Respect privacy and confidentiality in all interactions

For crisis situations, always encourage reaching out to local emergency services, crisis lines, or trusted individuals who can provide immediate support.
"""
    
    # For development debugging, print the configuration settings without sensitive values
    @classmethod
    def debug_config(cls):
        debug_info = {
            'ENV': cls.ENV,
            'MONGO_URI': cls.MONGO_URI.split('@')[0] + '@...' if '@' in cls.MONGO_URI else 'mongodb://...',
            'MONGO_DBNAME': cls.MONGO_DBNAME,
            'SUPABASE_URL': cls.SUPABASE_URL,
            'OPENAI_API_KEY_SET': bool(cls.OPENAI_API_KEY),
            'JWT_SECRET_KEY_SET': bool(cls.JWT_SECRET_KEY),
        }
        return debug_info