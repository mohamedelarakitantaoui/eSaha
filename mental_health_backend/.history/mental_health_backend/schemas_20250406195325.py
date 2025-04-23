# schemas.py
from marshmallow import Schema, fields

class ChatSchema(Schema):
    subject = fields.String(required=True, error_messages={
        "required": "Subject is required",
        "invalid": "Subject must be a string"
    })
    message = fields.String(required=True, error_messages={
        "required": "Message is required",
        "invalid": "Message must be a string"
    })
