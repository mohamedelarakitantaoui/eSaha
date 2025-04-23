# schemas.py
from marshmallow import Schema, fields, validates, ValidationError

class ChatSchema(Schema):
    subject = fields.Str(required=True)
    message = fields.Str(required=True)

    @validates("subject")
    def validate_subject(self, value):
        if not isinstance(value, str):
            raise ValidationError("subject must be a string")
