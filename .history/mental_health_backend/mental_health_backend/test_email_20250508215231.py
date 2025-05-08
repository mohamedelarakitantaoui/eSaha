"""
Simple test script to verify email configuration
"""
import os
from email_utils import send_appointment_confirmation
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_email():
    # Sample appointment data
    test_appointment = {
        "specialist_name": "Imane Boukhare",
        "date": "2025-05-20",
        "start_time": "12:30",
        "end_time": "13:00",
        "title": "Appointment with Imane Boukhare",
        "type": "therapy",
        "location": "Building 8b, room 203"
    }
    
    # Email to send the test to
    test_email = "elaraki48@gmail.com"  # Change this to your email
    
    # Try sending email
    result = send_appointment_confirmation(test_email, test_appointment)
    
    if result:
        print("✅ Email sent successfully!")
    else:
        print("❌ Email sending failed")
        print("Check your email configuration in .env file")

if __name__ == "__main__":
    test_email()