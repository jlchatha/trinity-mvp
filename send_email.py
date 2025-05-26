#!/usr/bin/env python3
"""
Trinity Email Sender Script
A simple script to send emails using SMTP
"""

import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import os
import json
from datetime import datetime
import argparse

class TrinityEmailSender:
    def __init__(self, config_file="email_config.json"):
        self.config_file = config_file
        self.config = self.load_config()
    
    def load_config(self):
        """Load email configuration from JSON file"""
        if os.path.exists(self.config_file):
            with open(self.config_file, 'r') as f:
                return json.load(f)
        else:
            # Create default config file
            default_config = {
                "smtp_server": "smtp.gmail.com",
                "smtp_port": 587,
                "sender_email": "your_email@gmail.com",
                "sender_password": "your_app_password",
                "default_recipient": "your_email@gmail.com"
            }
            with open(self.config_file, 'w') as f:
                json.dump(default_config, f, indent=4)
            print(f"Created default config file: {self.config_file}")
            print("Please edit it with your email settings!")
            return default_config
    
    def send_email(self, to_email=None, subject="Trinity Notification", 
                   body="Hello from Trinity!", attachment_path=None, html_body=None):
        """Send an email with optional attachment"""
        
        # Use default recipient if none specified
        if not to_email:
            to_email = self.config.get("default_recipient")
        
        # Create message
        message = MIMEMultipart("alternative")
        message["From"] = self.config["sender_email"]
        message["To"] = to_email
        message["Subject"] = subject
        
        # Add timestamp to body
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        body_with_timestamp = f"{body}\n\nSent from Trinity at {timestamp}"
        
        # Add text body
        text_part = MIMEText(body_with_timestamp, "plain")
        message.attach(text_part)
        
        # Add HTML body if provided
        if html_body:
            html_part = MIMEText(html_body, "html")
            message.attach(html_part)
        
        # Add attachment if provided
        if attachment_path and os.path.exists(attachment_path):
            with open(attachment_path, "rb") as attachment:
                part = MIMEBase('application', 'octet-stream')
                part.set_payload(attachment.read())
            
            encoders.encode_base64(part)
            part.add_header(
                'Content-Disposition',
                f'attachment; filename= {os.path.basename(attachment_path)}'
            )
            message.attach(part)
        
        try:
            # Create secure connection and send email
            context = ssl.create_default_context()
            with smtplib.SMTP(self.config["smtp_server"], self.config["smtp_port"]) as server:
                server.starttls(context=context)
                server.login(self.config["sender_email"], self.config["sender_password"])
                server.sendmail(self.config["sender_email"], to_email, message.as_string())
            
            print(f"✅ Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            print(f"❌ Error sending email: {str(e)}")
            return False
    
    def send_notification(self, message, priority="normal"):
        """Quick notification sender"""
        subjects = {
            "low": "🔔 Trinity Notification",
            "normal": "📧 Trinity Alert", 
            "high": "🚨 Trinity Important Alert"
        }
        
        subject = subjects.get(priority, subjects["normal"])
        return self.send_email(subject=subject, body=message)
    
    def send_report(self, report_data, report_type="System Report"):
        """Send a formatted report"""
        
        # Create HTML report
        html_body = f"""
        <html>
        <body>
        <h2>Trinity {report_type}</h2>
        <p><strong>Generated:</strong> {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}</p>
        <hr>
        """
        
        if isinstance(report_data, dict):
            for key, value in report_data.items():
                html_body += f"<p><strong>{key}:</strong> {value}</p>"
        else:
            html_body += f"<pre>{report_data}</pre>"
        
        html_body += """
        <hr>
        <p><em>Sent automatically by Trinity</em></p>
        </body>
        </html>
        """
        
        # Create text version
        text_body = f"Trinity {report_type}\n" + "="*50 + "\n"
        if isinstance(report_data, dict):
            for key, value in report_data.items():
                text_body += f"{key}: {value}\n"
        else:
            text_body += str(report_data)
        
        return self.send_email(
            subject=f"Trinity {report_type}",
            body=text_body,
            html_body=html_body
        )

def main():
    parser = argparse.ArgumentParser(description="Send email via Trinity")
    parser.add_argument("--to", help="Recipient email address")
    parser.add_argument("--subject", default="Trinity Notification", help="Email subject")
    parser.add_argument("--body", default="Hello from Trinity!", help="Email body")
    parser.add_argument("--attachment", help="Path to attachment file")
    parser.add_argument("--priority", choices=["low", "normal", "high"], 
                       default="normal", help="Notification priority")
    parser.add_argument("--notification", help="Send quick notification with this message")
    parser.add_argument("--test", action="store_true", help="Send test email")
    
    args = parser.parse_args()
    
    # Initialize email sender
    sender = TrinityEmailSender()
    
    if args.test:
        # Send test email
        success = sender.send_email(
            subject="Trinity Email Test",
            body="This is a test email from Trinity. If you receive this, everything is working correctly!"
        )
        if success:
            print("🎉 Test email sent successfully!")
        return
    
    if args.notification:
        # Send quick notification
        sender.send_notification(args.notification, args.priority)
        return
    
    # Send regular email
    sender.send_email(
        to_email=args.to,
        subject=args.subject,
        body=args.body,
        attachment_path=args.attachment
    )

if __name__ == "__main__":
    main()