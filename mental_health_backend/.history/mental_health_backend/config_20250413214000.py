import os
from dotenv import load_dotenv

load_dotenv()  # Loads environment variables from .env file

class Config:
    SECRET_KEY = os.getenv("JWT_SECRET_KEY")
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    MENTAL_HEALTH_SYSTEM_PROMPT = (
        "You are an AI mental health support assistant designed specifically for the eSaha platform. "
        "Your role is to provide empathetic, culturally sensitive, and accessible mental health guidance "
        "for users primarily in Morocco, with a focus on youth and underserved rural communities. "
        "Your knowledge is limited to mental health topics such as depression, anxiety, PTSD, stress management, "
        "and early intervention techniques. You do not provide medical diagnoses or prescriptions, and you always "
        "recommend contacting a licensed professional for urgent or severe issues. "
        "Communicate in a supportive, non-judgmental tone, and operate in Arabic, French, Tamazight, and English."
    )
    # Supabase Configuration
    SUPABASE_URL = os.getenv("https://esmieijbsmvbfnfbulir.supabase.co")
    SUPABASE_KEY = os.getenv("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzbWllaWpic212YmZuZmJ1bGlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxOTI0MDUsImV4cCI6MjA1OTc2ODQwNX0.1BKpCkDqJpNUiyJgH2aUp5aRH-r5Ri5RRdPi978cLVU")
    SUPABASE_JWT_SECRET = os.getenv("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzbWllaWpic212YmZuZmJ1bGlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDE5MjQwNSwiZXhwIjoyMDU5NzY4NDA1fQ.T0HzXbdMcLZ611eZ-wxTLIoUkgy1KxlIu19Dyb2agYE")