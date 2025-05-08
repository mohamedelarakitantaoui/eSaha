import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging

# Setup logger
logger = logging.getLogger(__name__)

# Get email configuration from environment variables
EMAIL_HOST = os.environ.get("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.environ.get("EMAIL_PORT", "587"))
EMAIL_USER = os.environ.get("EMAIL_USER", "")
EMAIL_PASSWORD = os.environ.get("EMAIL_PASSWORD", "")
EMAIL_FROM = os.environ.get("EMAIL_FROM", EMAIL_USER)
EMAIL_USE_TLS = os.environ.get("EMAIL_USE_TLS", "True").lower() == "true"

def send_appointment_confirmation(user_email, appointment_data):
    """
    Send an appointment confirmation email to the user.
    
    Args:
        user_email (str): The recipient's email address
        appointment_data (dict): Appointment details (date, time, specialist, etc.)
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    if not all([EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD]):
        logger.warning("Email configuration is incomplete - cannot send confirmation email")
        return False
        
    try:
        # Create message container
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f"eSaha: Your Appointment with {appointment_data.get('specialist_name', 'a specialist')} has been confirmed"
        msg['From'] = EMAIL_FROM
        msg['To'] = user_email
        
        # Format date for display
        try:
            date_str = appointment_data.get('date', 'Not specified')
            start_time = appointment_data.get('start_time', 'Not specified')
            end_time = appointment_data.get('end_time', '')
            time_display = f"{start_time}" if not end_time else f"{start_time} - {end_time}"
        except Exception as e:
            logger.error(f"Error formatting date/time: {str(e)}")
            date_str = appointment_data.get('date', 'Not specified')
            time_display = appointment_data.get('start_time', 'Not specified')
        
        # Get appointment details
        specialist_name = appointment_data.get('specialist_name', 'your specialist')
        location = appointment_data.get('location', 'Not specified')
        appointment_type = appointment_data.get('type', 'therapy')
        title = appointment_data.get('title', 'Your appointment')

        # Create the plain-text message
        text = f"""
Dear User,

Your appointment has been confirmed!

Details:
- Title: {title}
- Date: {date_str}
- Time: {time_display}
- With: {specialist_name}
- Type: {appointment_type.capitalize()}
- Location: {location}

Please arrive 5 minutes before your scheduled time.

If you need to reschedule or cancel, please log into your eSaha account or contact us directly.

Thank you for using eSaha - your mental wellbeing partner.
"""
        
        # Create the HTML message
        html = f"""
<html>
  <head></head>
  <body>
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
      <h2 style="color: #4f46e5;">Appointment Confirmation</h2>
      <p>Dear User,</p>
      <p>Your appointment has been confirmed!</p>
      
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #4b5563;">Appointment Details</h3>
        <p><strong>Title:</strong> {title}</p>
        <p><strong>Date:</strong> {date_str}</p>
        <p><strong>Time:</strong> {time_display}</p>
        <p><strong>With:</strong> {specialist_name}</p>
        <p><strong>Type:</strong> {appointment_type.capitalize()}</p>
        <p><strong>Location:</strong> {location}</p>
      </div>
      
      <p>Please arrive 5 minutes before your scheduled time.</p>
      <p>If you need to reschedule or cancel, please log into your eSaha account or contact us directly.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaeaea; text-align: center; color: #6b7280;">
        <p>Thank you for using eSaha - your mental wellbeing partner.</p>
      </div>
    </div>
  </body>
</html>
"""
        
        # Attach parts
        part1 = MIMEText(text, 'plain')
        part2 = MIMEText(html, 'html')
        msg.attach(part1)
        msg.attach(part2)
        
        # Connect to server and send
        with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as server:
            if EMAIL_USE_TLS:
                server.starttls()
            server.login(EMAIL_USER, EMAIL_PASSWORD)
            server.sendmail(EMAIL_FROM, user_email, msg.as_string())
            
        logger.info(f"Confirmation email sent to {user_email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send confirmation email: {str(e)}")
        return False

def send_appointment_reminder(user_email, appointment_data, hours_before=24):
    """
    Send an appointment reminder email to the user.
    
    Args:
        user_email (str): The recipient's email address
        appointment_data (dict): Appointment details
        hours_before (int): How many hours before the appointment this reminder is
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    if not all([EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD]):
        logger.warning("Email configuration is incomplete - cannot send reminder email")
        return False
        
    try:
        # Create message container
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f"eSaha: Reminder for your appointment with {appointment_data.get('specialist_name', 'a specialist')}"
        msg['From'] = EMAIL_FROM
        msg['To'] = user_email
        
        # Format date for display
        try:
            date_str = appointment_data.get('date', 'Not specified')
            start_time = appointment_data.get('start_time', 'Not specified')
            end_time = appointment_data.get('end_time', '')
            time_display = f"{start_time}" if not end_time else f"{start_time} - {end_time}"
        except Exception as e:
            logger.error(f"Error formatting date/time: {str(e)}")
            date_str = appointment_data.get('date', 'Not specified')
            time_display = appointment_data.get('start_time', 'Not specified')
        
        # Get appointment details
        specialist_name = appointment_data.get('specialist_name', 'your specialist')
        location = appointment_data.get('location', 'Not specified')
        appointment_type = appointment_data.get('type', 'therapy')
        title = appointment_data.get('title', 'Your appointment')

        # Create the plain-text message
        text = f"""
Dear User,

This is a reminder about your upcoming appointment.

Details:
- Title: {title}
- Date: {date_str}
- Time: {time_display}
- With: {specialist_name}
- Type: {appointment_type.capitalize()}
- Location: {location}

Please arrive 5 minutes before your scheduled time.

If you need to reschedule or cancel, please log into your eSaha account or contact us directly.

Thank you for using eSaha - your mental wellbeing partner.
"""
        
        # Create the HTML message
        html = f"""
<html>
  <head></head>
  <body>
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
      <h2 style="color: #4f46e5;">Appointment Reminder</h2>
      <p>Dear User,</p>
      <p>This is a reminder about your upcoming appointment.</p>
      
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #4b5563;">Appointment Details</h3>
        <p><strong>Title:</strong> {title}</p>
        <p><strong>Date:</strong> {date_str}</p>
        <p><strong>Time:</strong> {time_display}</p>
        <p><strong>With:</strong> {specialist_name}</p>
        <p><strong>Type:</strong> {appointment_type.capitalize()}</p>
        <p><strong>Location:</strong> {location}</p>
      </div>
      
      <p>Please arrive 5 minutes before your scheduled time.</p>
      <p>If you need to reschedule or cancel, please log into your eSaha account or contact us directly.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaeaea; text-align: center; color: #6b7280;">
        <p>Thank you for using eSaha - your mental wellbeing partner.</p>
      </div>
    </div>
  </body>
</html>
"""
        
        # Attach parts
        part1 = MIMEText(text, 'plain')
        part2 = MIMEText(html, 'html')
        msg.attach(part1)
        msg.attach(part2)
        
        # Connect to server and send
        with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as server:
            if EMAIL_USE_TLS:
                server.starttls()
            server.login(EMAIL_USER, EMAIL_PASSWORD)
            server.sendmail(EMAIL_FROM, user_email, msg.as_string())
            
        logger.info(f"Reminder email sent to {user_email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send reminder email: {str(e)}")
        return False