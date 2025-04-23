#!/usr/bin/env python3
"""
Test script for checking authentication issues
Run with: python test_auth.py
"""
import requests
import json
import sys
from pprint import pprint

BASE_URL = "http://127.0.0.1:5000"

def test_login():
    """Test the login endpoint and get JWT token"""
    print("Testing login...")
    
    url = f"{BASE_URL}/api/auth/login"
    payload = {
        "email": input("Enter email: "),
        "password": input("Enter password: ")
    }
    
    try:
        response = requests.post(url, json=payload)
        print(f"Status code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            print("✅ Login successful!")
            print(f"Token: {token[:15]}...{token[-15:]}")
            return token
        else:
            print(f"❌ Login failed: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return None

def test_chat(token):
    """Test the chat endpoint with the token"""
    print("\nTesting chat endpoint...")
    
    url = f"{BASE_URL}/api/chat/chat"
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "subject": "Test",
        "message": "Hello, this is a test message."
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        print(f"Status code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Chat request successful!")
            pprint(response.json())
        else:
            print(f"❌ Chat request failed: {response.text}")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

def test_chat_history(token):
    """Test the chat history endpoint with the token"""
    print("\nTesting chat history endpoint...")
    
    url = f"{BASE_URL}/api/chat/chat/history"
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(url, headers=headers)
        print(f"Status code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Chat history request successful!")
            data = response.json()
            print(f"Retrieved {len(data)} chat entries")
            if data:
                print("First entry:")
                pprint(data[0])
        else:
            print(f"❌ Chat history request failed: {response.text}")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

def main():
    print("=== Authentication Test Tool ===")
    token = test_login()
    
    if token:
        test_chat(token)
        test_chat_history(token)
    
    print("\nDone!")

if __name__ == "__main__":
    main()