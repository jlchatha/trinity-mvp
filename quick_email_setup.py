#!/usr/bin/env python3
"""
Trinity Quick Email Setup
Non-interactive setup with common defaults
"""

import json
import os

def create_email_config():
    print("🚀 Trinity Quick Email Setup")
    print("=" * 40)
    print("Creating default Gmail configuration...")
    print("You can customize this later by editing email_config.json")
    
    # Default Gmail configuration
    config = {
        "smtp_server": "smtp.gmail.com",
        "smtp_port": 587,
        "sender_email": "your_email@gmail.com",
        "sender_password": "your_app_password_here",
        "default_recipient": "your_email@gmail.com"
    }
    
    config_file = "email_config.json"
    
    # Check if config already exists
    if os.path.exists(config_file):
        print(f"⚠️  Configuration file {config_file} already exists!")
        print("Current configuration:")
        with open(config_file, 'r') as f:
            existing_config = json.load(f)
            for key, value in existing_config.items():
                if 'password' in key.lower():
                    print(f"  {key}: {'*' * len(str(value))}")
                else:
                    print(f"  {key}: {value}")
        return existing_config
    
    # Save new config
    with open(config_file, 'w') as f:
        json.dump(config, f, indent=4)
    
    # Set secure permissions
    os.chmod(config_file, 0o600)
    
    print(f"\n✅ Configuration template saved to {config_file}")
    print("📁 File permissions set to secure (600)")
    
    print("\n🔧 Next Steps:")
    print("1. Edit email_config.json and replace placeholders with your actual email settings")
    print("2. For Gmail users:")
    print("   - Use your Gmail address for sender_email")
    print("   - Generate an App Password at: https://myaccount.google.com/apppasswords")
    print("   - Use the App Password (not your regular password) for sender_password")
    print("3. Run: python3 send_email.py --test")
    print("\n📝 Configuration format:")
    print(json.dumps(config, indent=2))
    
    return config

if __name__ == "__main__":
    create_email_config()