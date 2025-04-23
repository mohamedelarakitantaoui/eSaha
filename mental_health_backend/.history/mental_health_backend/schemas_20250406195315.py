from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from models import User, Conversation, Message

class UserSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = User
        load_instance = True

class ConversationSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Conversation
        include_fk = True
        load_instance = True

class MessageSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Message
        include_fk = True
        load_instance = True
