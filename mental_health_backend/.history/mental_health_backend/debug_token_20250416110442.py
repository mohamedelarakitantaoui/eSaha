#!/usr/bin/env python3
"""
Debug tool for examining JWT tokens
Run with: python debug_token.py <your_token>
"""
import sys
import jwt
import json
from datetime import datetime

def decode_token(token):
    """Decode a JWT token without verification"""
    try:
        decoded = jwt.decode(token, options={"verify_signature": False})
        return decoded
    except Exception as e:
        return {"error": str(e)}

def format_timestamp(timestamp):
    """Format a Unix timestamp as a readable date"""
    if not timestamp:
        return "N/A"
    try:
        dt = datetime.fromtimestamp(timestamp)
        return dt.strftime("%Y-%m-%d %H:%M:%S")
    except:
        return f"{timestamp} (Invalid timestamp)"

def main():
    if len(sys.argv) < 2:
        print("Usage: python debug_token.py <token>")
        sys.exit(1)
    
    token = sys.argv[1]
    print(f"Analyzing token: {token[:10]}...{token[-10:]}")
    
    decoded = decode_token(token)
    
    if "error" in decoded:
        print(f"\nError decoding token: {decoded['error']}")
        return
    
    print("\nDecoded Token:")
    print(json.dumps(decoded, indent=2))
    
    # Extract and display key information
    print("\nKey Information:")
    print(f"Subject (sub): {decoded.get('sub', 'Not found')}")
    print(f"Issuer (iss): {decoded.get('iss', 'Not found')}")
    print(f"Issued at (iat): {format_timestamp(decoded.get('iat'))}")
    print(f"Expiration (exp): {format_timestamp(decoded.get('exp'))}")
    
    # Calculate expiration
    if 'exp' in decoded:
        now = datetime.now().timestamp()
        exp = decoded['exp']
        if now > exp:
            print(f"\n⚠️ Token is EXPIRED by {int((now - exp) / 60)} minutes")
        else:
            print(f"\n✅ Token is valid for {int((exp - now) / 60)} more minutes")

if __name__ == "__main__":
    main()