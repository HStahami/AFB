import smtplib
from email.message import EmailMessage
from app.config import settings

def send_email(to_email: str, subject: str, body: str):
    # Check if SMTP settings are provided
    if not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
        print(f"\n[MOCK EMAIL] To: {to_email} | Subject: {subject}\n{body}\n")
        return True

    msg = EmailMessage()
    msg.set_content(body)
    msg['Subject'] = subject
    msg['From'] = settings.EMAIL_FROM
    msg['To'] = to_email

    try:
        server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"Email sent successfully to {to_email}")
        return True
    except Exception as e:
        print(f"ERROR: Failed to send email to {to_email}. Error: {e}")
        # We don't raise the error because we want graceful degradation
        return False

def send_admission_alert(student_name: str, student_email: str, student_phone: str, form_id: str):
    subject = "New Admission Alert - AlArabia Fi Buyutikum"
    body = f"""New Admission Alert

Name: {student_name}
Email: {student_email}
Contact: {student_phone}
Form ID: {form_id}
"""
    return send_email(settings.INSTITUTE_NOTIFICATION_EMAIL, subject, body)
