#!/usr/bin/env python3
"""
Startup script for Mental Health Backend
Handles both development and production modes with appropriate server configurations
"""
import os
import sys
import argparse
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def main():
    parser = argparse.ArgumentParser(description='Start the Mental Health Backend Server')
    parser.add_argument('--mode', choices=['dev', 'prod'], default='dev',
                        help='Server mode: dev (development) or prod (production)')
    parser.add_argument('--port', type=int, default=int(os.environ.get('PORT', 5000)),
                        help='Port to run the server on (default: 5000)')
    parser.add_argument('--host', default='0.0.0.0',
                        help='Host to bind the server to (default: 0.0.0.0)')
    parser.add_argument('--debug', action='store_true',
                        help='Enable debug mode in development')
    
    args = parser.parse_args()
    
    # Set environment variables
    os.environ['FLASK_ENV'] = 'development' if args.mode == 'dev' else 'production'
    os.environ['FLASK_DEBUG'] = 'True' if args.debug and args.mode == 'dev' else 'False'
    os.environ['PORT'] = str(args.port)
    
    print(f"Starting server in {args.mode.upper()} mode on {args.host}:{args.port}")
    
    if args.mode == 'dev':
        # Import the Flask app and run it in development mode
        from app import app
        
        # In development mode, use the Flask development server with specific settings for better shutdown
        app.run(
            host=args.host,
            port=args.port,
            debug=args.debug,
            threaded=False,
            use_reloader=False  # Disable reloader to prevent shutdown issues
        )
    else:
        # In production mode, use gunicorn
        # Check if gunicorn is installed
        try:
            import gunicorn
        except ImportError:
            print("Gunicorn is required for production mode. Please install it with:")
            print("pip install gunicorn")
            sys.exit(1)
            
        # Configure the number of workers - adjust as needed
        workers = os.environ.get('GUNICORN_WORKERS', '4')
        # Configure the timeout - default to 120 seconds
        timeout = os.environ.get('GUNICORN_TIMEOUT', '120')
            
        # Build the gunicorn command
        cmd = f"gunicorn app:app --bind {args.host}:{args.port} " \
              f"--workers {workers} --timeout {timeout} --log-level info"
        
        print(f"Starting gunicorn with command: {cmd}")
        os.system(cmd)

if __name__ == "__main__":
    main()