#!/usr/bin/env python3
"""
Test script to verify SMTP email configuration
Run this to test if your email settings are working correctly
"""

import os
import sys
from dotenv import load_dotenv

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

# Load environment variables
load_dotenv()

from app.services.email_service import email_service

def test_smtp_connection():
    """Test SMTP connection"""
    print("=" * 50)
    print("TESTING SMTP CONNECTION")
    print("=" * 50)
    
    # Test connection
    if email_service.test_email_connection():
        print("\n✅ SMTP connection test passed!")
        return True
    else:
        print("\n❌ SMTP connection test failed!")
        return False

def test_send_email():
    """Test sending an actual email"""
    print("\n" + "=" * 50)
    print("TESTING EMAIL SENDING")
    print("=" * 50)
    
    # Get test email address
    test_email = input("Enter your email address to receive a test email: ").strip()
    
    if not test_email:
        print("No email address provided. Skipping email test.")
        return False
    
    # Send test email
    success = email_service.send_password_reset_link(test_email, "test-token-123456")
    
    if success:
        print(f"\n✅ Test reset link email sent successfully to {test_email}!")
        print("Check your inbox (and spam folder) for the test email.")
        print("Note: The reset link in the test email won't work (test token).")
        return True
    else:
        print(f"\n❌ Failed to send test email to {test_email}")
        return False

def main():
    print("VOIS EMAIL CONFIGURATION TEST")
    print("=" * 50)
    
    # Check environment variables
    smtp_host = os.getenv("SMTP_HOST")
    smtp_username = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")
    
    print(f"SMTP Host: {smtp_host}")
    print(f"SMTP Username: {smtp_username}")
    print(f"SMTP Password: {'*' * len(smtp_password) if smtp_password else 'NOT SET'}")
    
    if not all([smtp_host, smtp_username, smtp_password]):
        print("\n❌ SMTP configuration incomplete!")
        print("Please check your .env file and ensure all SMTP variables are set.")
        return
    
    # Test connection
    if not test_smtp_connection():
        print("\nPlease check your SMTP credentials and try again.")
        return
    
    # Ask if user wants to test sending email
    send_test = input("\nDo you want to send a test email? (y/n): ").lower().strip()
    if send_test in ['y', 'yes']:
        test_send_email()
    
    print("\n" + "=" * 50)
    print("EMAIL TEST COMPLETE")
    print("=" * 50)

if __name__ == "__main__":
    main()