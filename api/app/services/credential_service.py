import secrets
import string
from typing import Optional
from app.config import settings
from app.services.email_service import send_email


def generate_secure_temporary_password(length: int = 10) -> str:
    """
    Generates a cryptographically strong temporary password.
    Includes uppercase, lowercase, digits, and a punctuation character.
    """
    alphabet = string.ascii_letters + string.digits + "!@#$%&*"
    while True:
        password = ''.join(secrets.choice(alphabet) for _ in range(length))
        if (
            any(c.islower() for c in password)
            and any(c.isupper() for c in password)
            and any(c.isdigit() for c in password)
            and any(c in "!@#$%&*" for c in password)
        ):
            return password


def send_student_credentials(
    student_name: str,
    student_email: str,
    student_code: str,
    temp_password: str,
    login_url: Optional[str] = None
) -> bool:
    """
    Delivers newly provisioned student credentials via email.
    Plaintext password exists only in-memory for this notification and is never saved in the database.
    """
    target_login_url = login_url or settings.STUDENT_PORTAL_URL or "/login"
    subject = "Your Alarabia Fi Buyutikum Student Portal Credentials"
    body = f"""Dear {student_name},

Congratulations! Your admission to Alarabia Fi Buyutikum has been approved, and your student account has been successfully created.

Here are your account credentials:
------------------------------------------
Student ID / Code: {student_code}
Username / Email: {student_email}
Temporary Password: {temp_password}
Portal Login: {target_login_url}
------------------------------------------

Important Next Steps:
1. Log in to the Student Portal using your Student ID (or Email) and Temporary Password.
2. Upon your first login, you will be required to change your password for security.
3. Complete your student profile details to finalize onboarding.

If you have any questions, feel free to reply to this email.

JazakAllah Khair,
Alarabia Fi Buyutikum Administration
"""
    return send_email(student_email, subject, body)


def send_instructor_credentials(
    instructor_name: str,
    instructor_email: str,
    username: str,
    temp_password: str,
    login_url: Optional[str] = None
) -> bool:
    """
    Delivers instructor credentials via email.
    Plaintext password exists only in-memory for this notification and is never saved in plaintext.
    """
    target_login_url = login_url or settings.INSTRUCTOR_PORTAL_URL or "/instructor/login"
    subject = "Your Alarabia Fi Buyutikum Instructor Portal Credentials"
    body = f"""Dear {instructor_name},

Assalamu Alaikum wa Rahmatullah,

Your official instructor account at Alarabia Fi Buyutikum has been provisioned by the administration.

Here are your account login credentials:
------------------------------------------
Username: {username}
Email Address: {instructor_email}
Temporary Password: {temp_password}
Portal Login: {target_login_url}
------------------------------------------

Important Security Instructions:
1. Access the Instructor Portal at: {target_login_url}
2. Log in using your Username (or Email) and Temporary Password.
3. For security, please update your password upon your first login.

JazakAllah Khair,
Alarabia Fi Buyutikum Administration
"""

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #041416; color: #e2e8f0; margin: 0; padding: 24px; }}
        .card {{ max-width: 580px; margin: 0 auto; background: #072224; border: 1px solid rgba(197, 229, 232, 0.25); border-radius: 14px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }}
        .header {{ text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 20px; margin-bottom: 24px; }}
        .brand {{ color: #00a896; font-size: 22px; font-weight: bold; margin: 0; }}
        .box {{ background: rgba(0, 0, 0, 0.35); border: 1px solid rgba(0, 168, 150, 0.35); border-radius: 8px; padding: 18px; margin: 20px 0; }}
        .box p {{ margin: 6px 0; font-size: 15px; color: #cbd5e1; }}
        .cred {{ color: #ffffff; font-weight: bold; font-family: monospace; background: rgba(255,255,255,0.08); padding: 2px 8px; border-radius: 4px; }}
        .btn {{ display: inline-block; background: #00a896; color: #ffffff !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 10px; }}
        .footer {{ margin-top: 28px; font-size: 13px; color: #94a3b8; text-align: center; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h2 class="brand">Alarabia Fi Buyutikum</h2>
          <p style="color: #94a3b8; margin: 6px 0 0 0; font-size: 14px;">Instructor Account Provisioning</p>
        </div>
        <p>Dear <strong>{instructor_name}</strong>,</p>
        <p>Assalamu Alaikum wa Rahmatullah,</p>
        <p>Your official instructor account at <strong>Alarabia Fi Buyutikum</strong> is ready. You can now access your teaching dashboard, assigned student dossiers, and class schedules.</p>
        
        <div class="box">
          <p><strong>Username:</strong> <span class="cred">{username}</span></p>
          <p><strong>Registered Email:</strong> <span class="cred">{instructor_email}</span></p>
          <p><strong>Temporary Password:</strong> <span class="cred">{temp_password}</span></p>
        </div>

        <div style="text-align: center; margin: 24px 0;">
          <a href="{target_login_url}" class="btn">Log In to Instructor Portal</a>
        </div>

        <p style="font-size: 13px; color: #94a3b8;">
          * For security reasons, please change your password immediately upon your first login.
        </p>

        <div class="footer">
          Alarabia Fi Buyutikum Administration<br>
          Official Email: alarabiafi@gmail.com | Phone: +92 331 89675343
        </div>
      </div>
    </body>
    </html>
    """

    return send_email(instructor_email, subject, body, html_body)
