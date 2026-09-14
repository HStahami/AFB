import smtplib
import re
from email.message import EmailMessage
from app.config import settings

EMOJI_PATTERN = re.compile(
    "["
    "\U0001F600-\U0001F64F"  # emoticons
    "\U0001F300-\U0001F5FF"  # symbols & pictographs
    "\U0001F680-\U0001F6FF"  # transport & map symbols
    "\U0001F1E0-\U0001F1FF"  # flags (iOS)
    "\U00002702-\U000027B0"
    "\U000024C2-\U0001F251"
    "\U0001F900-\U0001F9FF"  # Supplemental Symbols and Pictographs
    "\U0001FA70-\U0001FAFF"  # Symbols and Pictographs Extended-A
    "\U00002600-\U000026FF"  # Misc symbols
    "]+",
    flags=re.UNICODE
)

HTML_TAG_PATTERN = re.compile(r"<[^>]*?>")


def contains_emoji(text: str) -> bool:
    """Checks if the given string contains any emoji character."""
    if not text:
        return False
    return bool(EMOJI_PATTERN.search(str(text)))


def sanitize_text(text: str) -> str:
    """Strips HTML tags, emojis, control characters, and trims whitespace."""
    if not text:
        return ""
    # Remove HTML tags
    cleaned = HTML_TAG_PATTERN.sub("", str(text))
    # Remove emojis
    cleaned = EMOJI_PATTERN.sub("", cleaned)
    # Strip dangerous characters for NoSQL/scripting
    cleaned = cleaned.replace("\x00", "").replace("\r", "").strip()
    return cleaned


def send_email(to_email: str, subject: str, body: str, html_body: str = None) -> bool:
    # Check if SMTP settings are provided
    if not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
        print(f"\n[MOCK EMAIL] To: {to_email} | Subject: {subject}\n{body}\n")
        return True

    msg = EmailMessage()
    msg.set_content(body)
    if html_body:
        msg.add_alternative(html_body, subtype="html")

    msg['Subject'] = subject
    msg['From'] = settings.EMAIL_FROM or f"AlArabia Fi Buyutikum <{settings.SMTP_USERNAME}>"
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
    return send_email(settings.INSTITUTE_NOTIFICATION_EMAIL or settings.EMAIL_FROM, subject, body)


def send_fee_instructions_email(
    student_name: str,
    student_email: str,
    form_id: str,
    course_name: str = "Modern Standard Arabic"
) -> bool:
    """
    Sends automated fee payment instructions to the applicant immediately after admission submission.
    """
    subject = f"Admission Application Received & Fee Payment Instructions — Form #{form_id[:8]}"

    bank_name = settings.FEE_BANK_NAME
    account_title = settings.FEE_ACCOUNT_TITLE
    account_number = settings.FEE_ACCOUNT_NUMBER
    iban = settings.FEE_IBAN
    raast_id = settings.FEE_RAAST_ID
    easypaisa_jazzcash = settings.FEE_EASYPAISA_JAZZCASH
    whatsapp = settings.FEE_VERIFICATION_WHATSAPP
    verification_email = settings.FEE_VERIFICATION_EMAIL

    body = f"""Dear {student_name},

Assalamu Alaikum wa Rahmatullah,

Thank you for applying for admission to AlArabia Fi Buyutikum for {course_name}.

Your application reference ID is: {form_id}

==================================================
FEE PAYMENT INSTRUCTIONS
==================================================

Please proceed with your fee payment using any of the following accounts:

1. Bank Transfer:
   - Bank Name: {bank_name}
   - Account Title: {account_title}
   - Account Number: {account_number}
   - IBAN: {iban}

2. Raast Instant Pay:
   - Raast ID: {raast_id}

3. Mobile Wallets (EasyPaisa / JazzCash):
   - Account: {easypaisa_jazzcash}

==================================================
HOW TO VERIFY YOUR PAYMENT:
==================================================
Once your payment is transferred:
1. Take a screenshot or clear receipt of the transaction.
2. Send the receipt along with your Form ID ({form_id}) and Full Name via WhatsApp to: {whatsapp} or Email to: {verification_email}.

NEXT STEPS:
As soon as our finance department confirms your fee receipt:
- The Administration will approve your admission.
- You will receive an official email containing your unique Student ID, temporary portal password, and direct portal login link.
- You will then log in to the Student Portal and complete your student profile to begin your learning journey.

If you have any questions, feel free to reply directly to this email.

JazakAllah Khair,
Admissions Office
AlArabia Fi Buyutikum
"""

    html_body = f"""
    <div style="font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 24px; border-radius: 8px;">
        <div style="max-width: 600px; margin: 0 auto; background: #1e293b; padding: 32px; border-radius: 12px; border: 1px solid #334155;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h2 style="color: #38bdf8; margin: 0; font-size: 24px;">AlArabia Fi Buyutikum</h2>
                <p style="color: #94a3b8; font-size: 14px; margin-top: 4px;">Online Arabic Learning Institute</p>
            </div>
            
            <p style="font-size: 16px; color: #e2e8f0;">Dear <strong>{student_name}</strong>,</p>
            <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6;">
                Assalamu Alaikum wa Rahmatullah,<br/>
                Thank you for applying for admission to <strong>{course_name}</strong>. Your application has been registered with reference ID: <strong style="color: #38bdf8;">{form_id}</strong>.
            </p>

            <div style="background: rgba(56, 189, 248, 0.08); border-left: 4px solid #38bdf8; padding: 16px; margin: 20px 0; border-radius: 4px;">
                <h3 style="color: #38bdf8; margin-top: 0; font-size: 16px;">Fee Payment Accounts</h3>
                <table style="width: 100%; font-size: 14px; color: #e2e8f0; border-collapse: collapse;">
                    <tr><td style="padding: 6px 0; color: #94a3b8;">Bank Name:</td><td style="padding: 6px 0; font-weight: bold;">{bank_name}</td></tr>
                    <tr><td style="padding: 6px 0; color: #94a3b8;">Account Title:</td><td style="padding: 6px 0; font-weight: bold;">{account_title}</td></tr>
                    <tr><td style="padding: 6px 0; color: #94a3b8;">Account Number:</td><td style="padding: 6px 0; font-weight: bold; color: #38bdf8;">{account_number}</td></tr>
                    <tr><td style="padding: 6px 0; color: #94a3b8;">IBAN:</td><td style="padding: 6px 0; font-weight: bold;">{iban}</td></tr>
                    <tr><td style="padding: 6px 0; color: #94a3b8;">Raast ID:</td><td style="padding: 6px 0; font-weight: bold;">{raast_id}</td></tr>
                    <tr><td style="padding: 6px 0; color: #94a3b8;">EasyPaisa / JazzCash:</td><td style="padding: 6px 0; font-weight: bold;">{easypaisa_jazzcash}</td></tr>
                </table>
            </div>

            <div style="background: rgba(46, 204, 113, 0.1); border-left: 4px solid #2ecc71; padding: 16px; margin: 20px 0; border-radius: 4px;">
                <h4 style="color: #2ecc71; margin-top: 0; font-size: 15px;">Payment Verification Steps</h4>
                <ol style="margin: 0; padding-left: 20px; color: #cbd5e1; font-size: 13.5px; line-height: 1.6;">
                    <li>Make the transfer using any of the accounts above.</li>
                    <li>Take a screenshot or receipt of the completed payment.</li>
                    <li>Share your payment receipt with your Form ID (<strong>{form_id}</strong>) via WhatsApp: <strong style="color: #2ecc71;">{whatsapp}</strong> or Email: <strong style="color: #38bdf8;">{verification_email}</strong>.</li>
                </ol>
            </div>

            <p style="font-size: 13.5px; color: #94a3b8; line-height: 1.5;">
                Upon confirmation, your admission will be approved by the Admin and your <strong>Student Portal login ID and temporary password</strong> will be emailed to you.
            </p>

            <div style="border-top: 1px solid #334155; margin-top: 24px; padding-top: 16px; font-size: 12px; color: #64748b; text-align: center;">
                AlArabia Fi Buyutikum • Admissions Office
            </div>
        </div>
    </div>
    """

    return send_email(student_email, subject, body, html_body)
