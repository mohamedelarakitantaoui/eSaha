import hmac
import werkzeug.security
if not hasattr(werkzeug.security, "safe_str_cmp"):
    werkzeug.security.safe_str_cmp = hmac.compare_digest

from flask import Flask
from config import Config
from models import db
from routes import auth, chat_bp
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate

app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)
JWTManager(app)
Migrate(app, db)

app.register_blueprint(auth, url_prefix='/api/auth')
app.register_blueprint(chat_bp, url_prefix='/api/chat')

if __name__ == '__main__':
    app.run(debug=True)
