#!/usr/bin/env python3
"""
Trinity Email Setup Script
Easy configuration for the email sender
"""

import json
import os
import getpass

def setup_email_config():
    print("🚀 Trinity Email Configuration Setup")
    print("=" * 40)
    
    config = {}
    
    # Email provider selection
    print("\nSelect your email provider:")
    print("1. Gmail")
    print("2. Outlook/Hotmail")
    print("3. Yahoo")
    print("4. Custom SMTP")
    
    choice = input("\nEnter choice (1-4): ").strip()
    
    if choice == "1":
        config["smtp_server"] = "smtp.gmail.com"
        config["smtp_port"] = 587
        print("\n📧 Gmail selected")
        print("Note: You'll need to use an App Password, not your regular password")
        print("Generate one at: https://myaccount.google.com/apppasswords")
    elif choice == "2":
        config["smtp_server"] = "smtp-mail.outlook.com"
        config["smtp_port"] = 587
        print("\n📧 Outlook selected")
    elif choice == "3":
        config["smtp_server"] = "smtp.mail.yahoo.com"
        config["smtp_port"] = 587
        print("\n📧 Yahoo selected")
    else:
        config["smtp_server"] = input("SMTP Server: ").strip()
        config["smtp_port"] = int(input("SMTP Port (usually 587): ").strip() or "587")
    
    # Get email credentials
    print("\n🔐 Enter your email credentials:")
    config["sender_email"] = input("Your email address: ").strip()
    config["sender_password"] = getpass.getpass("Your password (or app password): ")
    
    # Default recipient
    default_recipient = input(f"Default recipient [{config['sender_email']}]: ").strip()
    config["default_recipient"] = default_recipient or config["sender_email"]
    
    # Save config
    config_file = "email_config.json"
    with open(config_file, 'w') as f:
        json.dump(config, f, indent=4)
    
    # Set secure permissions
    os.chmod(config_file, 0o600)
    
    print(f"\n✅ Configuration saved to {config_file}")
    print("📁 File permissions set to secure (600)")
    
    # Test option
    test = input("\nWould you like to send a test email? (y/n): ").strip().lower()
    if test == 'y':
        print("\n📤 Sending test email...")
        from send_email import TrinityEmailSender
        sender = TrinityEmailSender(config_file)
        success = sender.send_email(
            subject="🎉 Trinity Email Test",
            body="Congratulations! Your Trinity email configuration is working perfectly.\n\nYou can now use Trinity to send emails, notifications, and reports."
        )
        if success:
            print("🎊 Test email sent successfully!")
        else:
            print("❌ Test failed. Please check your configuration.")

if __name__ == "__main__":
    setup_email_config()