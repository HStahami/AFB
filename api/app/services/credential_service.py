import secrets
import string
from typing import Optional
from app.config import settings
from app.services.email_service import send_email, build_base_email_html, create_table_box


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
    Delivers newly provisioned student credentials via email using the institute branded template.
    Plaintext password exists only in-memory for this notification and is never saved in plaintext.
    """
    target_login_url = login_url or getattr(settings, "STUDENT_PORTAL_URL", "/student/login") or "/student/login"
    subject = "Your Emam Student Portal Credentials"

    body = f"""Dear {student_name},

Assalamu Alaikum wa Rahmatullah,

Congratulations! Your admission to Emam has been approved, and your student account has been successfully created.

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
Emam Administration
"""

    box = create_table_box([
        ("Student ID / Code", student_code, True),
        ("Username / Email", student_email, False),
        ("Temporary Password", temp_password, True),
        ("Portal Login URL", target_login_url, False)
    ], border_color="#006666")

    html_body = build_base_email_html(
        title="Student Portal Login Credentials",
        recipient_name=student_name,
        badge_label="Admission Confirmed",
        body_html='''
        <p>Assalamu Alaikum wa Rahmatullah,</p>
        <p>Congratulations! Your admission to <strong>Emam</strong> has been officially approved. Your student account has been provisioned and is ready for access.</p>
        <p>Your secure portal login credentials are listed below:</p>
        ''',
        highlight_box_html=box,
        button_label="Log In to Student Portal",
        button_url=target_login_url,
        sub_note_html='''
        <strong>Important Next Steps:</strong><br/>
        1. Click the button above to access the Student Portal.<br/>
        2. Log in using your <strong>Student ID</strong> (or Email) and <strong>Temporary Password</strong>.<br/>
        3. For security, update your password immediately upon your first login.<br/>
        4. Complete your onboarding profile to begin accessing course materials and the <strong>Arabic Touch-Typing Lab</strong>.
        '''
    )

    return send_email(student_email, subject, body, html_body)


def send_instructor_credentials(
    instructor_name: str,
    instructor_email: str,
    username: str,
    temp_password: str,
    login_url: Optional[str] = None
) -> bool:
    """
    Delivers instructor credentials via email using the institute branded template.
    Plaintext password exists only in-memory for this notification and is never saved in plaintext.
    """
    target_login_url = login_url or getattr(settings, "INSTRUCTOR_PORTAL_URL", "/instructor/login") or "/instructor/login"
    subject = "Your Emam Instructor Portal Credentials"

    body = f"""Dear {instructor_name},

Assalamu Alaikum wa Rahmatullah,

Your official instructor account at Emam has been provisioned by the administration.

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
Emam Administration
"""

    box = create_table_box([
        ("Username", username, True),
        ("Registered Email", instructor_email, False),
        ("Temporary Password", temp_password, True),
        ("Instructor Portal", target_login_url, False)
    ], border_color="#006666")

    html_body = build_base_email_html(
        title="Instructor Portal Login Credentials",
        recipient_name=instructor_name,
        badge_label="Instructor Account Ready",
        body_html='''
        <p>Assalamu Alaikum wa Rahmatullah,</p>
        <p>Your official instructor account at <strong>Emam</strong> has been provisioned. You can now access your teaching dashboard, assigned student dossiers, and class schedules.</p>
        <p>Your portal login credentials are provided below:</p>
        ''',
        highlight_box_html=box,
        button_label="Log In to Instructor Portal",
        button_url=target_login_url,
        sub_note_html='''
        <strong>Important Security Instructions:</strong><br/>
        1. Access the Instructor Portal at the link above.<br/>
        2. Log in with your Username (or Email) and Temporary Password.<br/>
        3. For security, please update your password immediately upon your first login.
        '''
    )

    return send_email(instructor_email, subject, body, html_body)
