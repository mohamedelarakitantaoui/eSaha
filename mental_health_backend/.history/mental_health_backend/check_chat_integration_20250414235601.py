"""
Check chat integration components.
This script verifies that all components needed for the chat system are working.
"""
from config import Config
import os
import sys

def check_components():
    issues = []
    
    # Check OpenAI API key
    openai_key = Config.OPENAI_API_KEY
    if not openai_key:
        issues.append("❌ OpenAI API key is missing")
    else:
        print("✅ OpenAI API key is configured")
    
    # Check MongoDB URI
    mongo_uri = Config.MONGO_URI
    if not mongo_uri:
        issues.append("❌ MongoDB URI is missing")
    else:
        print(f"✅ MongoDB URI is configured: {mongo_uri}")
    
    # Check if required Python packages are installed
    required_packages = ['flask', 'pymongo', 'sqlalchemy', 'openai', 'flask_jwt_extended']
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package)
            print(f"✅ {package} is installed")
        except ImportError:
            missing_packages.append(package)
            issues.append(f"❌ {package} is not installed")
    
    # Report overall status
    if issues:
        print("\n⚠️ Found issues that may prevent chat functionality:")
        for issue in issues:
            print(f"  {issue}")
        
        # Suggest solutions
        if missing_packages:
            packages_str = " ".join(missing_packages)
            print(f"\nInstall missing packages with: pip install {packages_str}")
    else:
        print("\n✅ All components for chat functionality appear to be properly configured")

if __name__ == "__main__":
    check_components()