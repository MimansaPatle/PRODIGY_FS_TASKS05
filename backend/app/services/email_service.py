import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

class EmailService:
    def __init__(self):
        self.smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_username = os.getenv("SMTP_USERNAME")
        self.smtp_password = os.getenv("SMTP_PASSWORD")
        self.from_email = os.getenv("SMTP_FROM_EMAIL")
        self.from_name = os.getenv("SMTP_FROM_NAME", "Vois")

    def send_email(self, to_email: str, subject: str, html_content: str, text_content: Optional[str] = None):
        """Send an email using SMTP"""
        try:
            print(f"Attempting to send email to: {to_email}")
            print(f"SMTP Config: {self.smtp_host}:{self.smtp_port}")
            print(f"From: {self.from_email}")
            
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = f"{self.from_name} <{self.from_email}>"
            message["To"] = to_email

            # Add text content if provided
            if text_content:
                text_part = MIMEText(text_content, "plain")
                message.attach(text_part)

            # Add HTML content
            html_part = MIMEText(html_content, "html")
            message.attach(html_part)

            # Connect to server and send email
            print("Connecting to SMTP server...")
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                print("Starting TLS...")
                server.starttls()  # Enable encryption
                print("Logging in...")
                server.login(self.smtp_username, self.smtp_password)
                print("Sending email...")
                server.send_message(message)
                print("Email sent successfully!")

            return True
        except smtplib.SMTPAuthenticationError as e:
            print(f"SMTP Authentication failed: {str(e)}")
            print("Check your email credentials and app password")
            return False
        except smtplib.SMTPException as e:
            print(f"SMTP error occurred: {str(e)}")
            return False
        except Exception as e:
            print(f"Failed to send email: {str(e)}")
            return False

    def send_password_reset_link(self, to_email: str, reset_token: str):
        """Send password reset email with reset link"""
        subject = "Reset Your Password - Vois"
        
        # Create reset link
        reset_link = f"http://localhost:5173/reset-password?token={reset_token}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password - Vois</title>
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 30px;
                    border-radius: 10px 10px 0 0;
                    text-align: center;
                }}
                .content {{
                    background: #f8f9fa;
                    padding: 30px;
                    border-radius: 0 0 10px 10px;
                }}
                .reset-button {{
                    display: inline-block;
                    background: #667eea;
                    color: white;
                    padding: 15px 30px;
                    text-decoration: none;
                    border-radius: 8px;
                    font-weight: bold;
                    margin: 20px 0;
                    text-align: center;
                }}
                .reset-button:hover {{
                    background: #5a6fd8;
                }}
                .footer {{
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    font-size: 14px;
                    color: #666;
                }}
                .logo {{
                    font-size: 24px;
                    font-weight: bold;
                    margin-bottom: 10px;
                }}
                .warning {{
                    background: #fff3cd;
                    border: 1px solid #ffeaa7;
                    border-radius: 5px;
                    padding: 15px;
                    margin: 20px 0;
                    color: #856404;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo">⚡ VOIS</div>
                <h1>Reset Your Password</h1>
            </div>
            
            <div class="content">
                <p>Hello,</p>
                
                <p>We received a request to reset your password for your Vois account. Click the button below to create a new password:</p>
                
                <div style="text-align: center;">
                    <a href="{reset_link}" class="reset-button">Reset My Password</a>
                </div>
                
                <div class="warning">
                    <strong>Important:</strong>
                    <ul>
                        <li>This link will expire in 1 hour</li>
                        <li>You can only use this link once</li>
                        <li>If you didn't request this reset, please ignore this email</li>
                    </ul>
                </div>
                
                <p>If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #667eea;">{reset_link}</p>
                
                <div class="footer">
                    <p>Best regards,<br>The Vois Team</p>
                    <p><em>This is an automated email. Please do not reply to this message.</em></p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        Reset Your Password - Vois
        
        Hello,
        
        We received a request to reset your password for your Vois account.
        
        Click this link to reset your password: {reset_link}
        
        Important:
        - This link will expire in 1 hour
        - You can only use this link once
        - If you didn't request this reset, please ignore this email
        
        Best regards,
        The Vois Team
        """
        
        return self.send_email(to_email, subject, html_content, text_content)

    def test_email_connection(self):
        """Test SMTP connection and credentials"""
        try:
            print("Testing SMTP connection...")
            print(f"Host: {self.smtp_host}:{self.smtp_port}")
            print(f"Username: {self.smtp_username}")
            
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                print("✅ SMTP connection successful!")
                return True
        except Exception as e:
            print(f"❌ SMTP connection failed: {str(e)}")
            return False

# Create a global instance
email_service = EmailService()