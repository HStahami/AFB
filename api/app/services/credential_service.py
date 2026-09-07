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
    subject = "Your AlArabia Fi Buyutikum Student Portal Credentials"
    body = f"""Dear {student_name},

Congratulations! Your admission to AlArabia Fi Buyutikum has been approved, and your student account has been successfully created.

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
AlArabia Fi Buyutikum Administration
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
    """
    target_login_url = login_url or settings.INSTRUCTOR_PORTAL_URL or "/login"
    subject = "Your AlArabia Fi Buyutikum Instructor Portal Credentials"
    body = f"""Dear {instructor_name},

Your instructor account at AlArabia Fi Buyutikum is ready.

Here are your account credentials:
------------------------------------------
Username: {username}
Email: {instructor_email}
Temporary Password: {temp_password}
Portal Login: {target_login_url}
------------------------------------------

Please log in and update your password immediately upon your first login.

JazakAllah Khair,
AlArabia Fi Buyutikum Administration
"""
    return send_email(instructor_email, subject, body)
