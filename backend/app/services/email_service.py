import smtplib
import re
from typing import List, Tuple, Optional
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
    cleaned = HTML_TAG_PATTERN.sub("", str(text))
    cleaned = EMOJI_PATTERN.sub("", cleaned)
    cleaned = cleaned.replace("\x00", "").replace("\r", "").strip()
    return cleaned


def build_base_email_html(
    title: str,
    recipient_name: str,
    body_html: str,
    highlight_box_html: str = "",
    button_label: str = "",
    button_url: str = "",
    sub_note_html: str = "",
    badge_label: str = ""
) -> str:
    """
    Renders the unified, professional email template for Emam.
    Fully compatible with Gmail, Outlook, Apple Mail, mobile & desktop clients.
    """
    badge_html = f'''<div style="display: inline-block; background-color: rgba(105, 14, 31, 0.08); color: #690e1f; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 4px; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 12px;">{badge_label}</div>''' if badge_label else ""
    
    button_markup = ""
    if button_label and button_url:
        button_markup = f'''
        <div style="text-align: center; margin: 26px 0 14px 0;">
          <a href="{button_url}" style="background-color: #690e1f; color: #ffffff !important; text-decoration: none; padding: 13px 32px; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block; letter-spacing: 0.5px; box-shadow: 0 2px 6px rgba(105, 14, 31, 0.25);">{button_label}</a>
        </div>
        <div style="text-align: center; font-size: 11.5px; color: #94a3b8; margin-bottom: 16px;">
          Direct Link: <a href="{button_url}" style="color: #690e1f; word-break: break-all;">{button_url}</a>
        </div>
        '''

    sub_note_markup = f'''<div style="margin-top: 20px; font-size: 12.5px; color: #64748b; line-height: 1.55; border-top: 1px dashed #e2e8f0; padding-top: 14px;">{sub_note_html}</div>''' if sub_note_html else ""

    official_email = getattr(settings, "EMAIL_FROM", "alarabiafi@gmail.com") or "alarabiafi@gmail.com"
    official_phone = getattr(settings, "INSTITUTE_WHATSAPP_NUMBER", "+92 331 89675343") or "+92 331 89675343"

    html = f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
          
          <!-- BRAND HEADER -->
          <tr>
            <td style="background-color: #690e1f; padding: 26px 24px 22px 24px; text-align: center; border-bottom: 3px solid #f1a32a;">
              <div style="font-size: 24px; font-weight: 800; color: #f1a32a; letter-spacing: 2px; text-transform: uppercase;">Emam</div>
              <div style="font-size: 12px; color: #f0ceb3; margin-top: 4px; letter-spacing: 0.5px;">Online Learning Institute</div>
            </td>
          </tr>

          <!-- MAIN CONTENT BODY -->
          <tr>
            <td style="padding: 32px 28px;">
              {badge_html}
              <h1 style="color: #690e1f; font-size: 20px; font-weight: 700; margin: 0 0 16px 0; line-height: 1.4;">{title}</h1>
              <p style="font-size: 15px; color: #1e293b; margin: 0 0 14px 0;">Dear <strong>{recipient_name}</strong>,</p>
              
              <div style="font-size: 14.5px; line-height: 1.65; color: #334155;">
                {body_html}
              </div>

              {highlight_box_html}
              {button_markup}
              {sub_note_markup}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 22px 24px; text-align: center; font-size: 12px; color: #64748b; line-height: 1.6;">
              <div style="font-weight: 600; color: #334155; margin-bottom: 4px;">Emam • Admissions & Academic Office</div>
              <div>Official Email: <a href="mailto:{official_email}" style="color: #690e1f; text-decoration: none;">{official_email}</a> | WhatsApp: <strong>{official_phone}</strong></div>
              <div style="margin-top: 8px; font-size: 11px; color: #94a3b8;">This is an official administrative email. Please keep your account credentials secure.</div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>'''
    return html


def create_table_box(rows: List[Tuple[str, str, bool]], border_color: str = "#690e1f", bg_color: str = "#f8fafc") -> str:
    """
    Renders a styled key-value highlight box.
    rows: list of tuples (Label, Value, is_monospace)
    """
    rows_html = ""
    for label, val, is_code in rows:
        val_display = (
            f'<span style="font-family: Consolas, Monaco, monospace; font-weight: bold; background: #e2e8f0; color: #002b2b; padding: 2px 7px; border-radius: 4px; font-size: 13.5px;">{val}</span>'
            if is_code else
            f'<span style="font-weight: 600; color: #1e293b;">{val}</span>'
        )
        rows_html += f'''
        <tr>
          <td style="padding: 7px 0; color: #64748b; font-size: 13.5px; width: 38%; vertical-align: top;">{label}:</td>
          <td style="padding: 7px 0; font-size: 13.5px; vertical-align: top;">{val_display}</td>
        </tr>
        '''
    return f'''
    <div style="background-color: {bg_color}; border: 1px solid #e2e8f0; border-left: 4px solid {border_color}; border-radius: 8px; padding: 18px 20px; margin: 20px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
        {rows_html}
      </table>
    </div>
    '''


def send_email(to_email: str, subject: str, body: str, html_body: Optional[str] = None) -> bool:
    """Dispatches email via SMTP server, or falls back safely to console mock in dev."""
    if not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
        print(f"\n[MOCK EMAIL] To: {to_email} | Subject: {subject}\n{body}\n")
        return True

    msg = EmailMessage()
    msg.set_content(body)
    if html_body:
        msg.add_alternative(html_body, subtype="html")

    msg['Subject'] = subject
    msg['From'] = settings.EMAIL_FROM or f"Emam <{settings.SMTP_USERNAME}>"
    msg['To'] = to_email

    try:
        server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT, timeout=8.0)
        server.starttls()
        server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"Email sent successfully to {to_email}")
        return True
    except Exception as e:
        print(f"ERROR: Failed to send email to {to_email}. Error: {e}")
        return False


def send_admission_alert(student_name: str, student_email: str, student_phone: str, form_id: str, course_name: str = "Modern Standard Arabic") -> bool:
    """Alert sent to Institute Admin when a new admission is submitted."""
    subject = f"New Admission Alert — Form #{form_id[:8]} — Emam"
    body = f"""New Admission Alert - Emam

An applicant has submitted an admission application.

Application Details:
- Form ID: {form_id}
- Applicant Name: {student_name}
- Email: {student_email}
- Contact / WhatsApp: {student_phone}
- Course: {course_name}

Please review the application and verify payment in the Admin Portal.
"""
    table = create_table_box([
        ("Form ID", form_id, True),
        ("Applicant Name", student_name, False),
        ("Email Address", student_email, False),
        ("Contact / WhatsApp", student_phone, False),
        ("Course", course_name, False)
    ], border_color="#006666")

    html_body = build_base_email_html(
        title="New Admission Application Received",
        recipient_name="Admissions Administrator",
        badge_label="New Admission Alert",
        body_html=f"<p>A prospective student has submitted an admission application for <strong>{course_name}</strong>. Details are recorded below:</p>",
        highlight_box_html=table,
        sub_note_html="Please verify fee payment proof upon receipt and proceed with admission approval in the Admin Portal."
    )
    return send_email(settings.INSTITUTE_NOTIFICATION_EMAIL or settings.EMAIL_FROM, subject, body, html_body)


def send_fee_instructions_email(
    student_name: str,
    student_email: str,
    form_id: str,
    course_name: str = "Modern Standard Arabic"
) -> bool:
    """Sends fee payment instructions to the applicant immediately after admission submission."""
    subject = f"Admission Application Received & Fee Instructions — Form #{form_id[:8]}"

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

Thank you for applying for admission to Emam for {course_name}.

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
PAYMENT VERIFICATION STEPS:
==================================================
Once your payment is transferred:
1. Take a clear screenshot or receipt of the transaction.
2. Send the receipt along with your Form ID ({form_id}) and Full Name via WhatsApp to: {whatsapp} or Email to: {verification_email}.

NEXT STEPS:
As soon as our finance department confirms your fee receipt:
- The Administration will approve your admission.
- You will receive an official email containing your unique Student ID, temporary portal password, and direct portal login link.
- You will then log in to the Student Portal to begin your learning journey.

JazakAllah Khair,
Admissions Office
Emam
"""
    table_bank = create_table_box([
        ("Application Form ID", form_id, True),
        ("Bank Name", bank_name, False),
        ("Account Title", account_title, False),
        ("Account Number", account_number, True),
        ("IBAN", iban, True),
        ("Raast Instant Pay", raast_id, True),
        ("EasyPaisa / JazzCash", easypaisa_jazzcash, False)
    ], border_color="#d4af37", bg_color="#fffdf7")

    clean_wa = re.sub(r'[^0-9]', '', whatsapp)
    wa_link = f"https://wa.me/{clean_wa}?text=Assalamu%20Alaikum,%20here%20is%20my%20fee%20payment%20receipt%20for%20Form%20ID:%20{form_id}"

    html_body = build_base_email_html(
        title="Admission Application Received & Fee Instructions",
        recipient_name=student_name,
        badge_label="Application Registered",
        body_html=f'''
        <p>Assalamu Alaikum wa Rahmatullah,</p>
        <p>Thank you for applying for admission to <strong>{course_name}</strong> at Emam. Your application has been registered successfully.</p>
        <p>To confirm your seat, please complete your fee transfer using any of the official institute accounts below:</p>
        ''',
        highlight_box_html=table_bank,
        button_label="Submit Payment Receipt via WhatsApp",
        button_url=wa_link,
        sub_note_html=f'''
        <strong>Payment Verification Steps:</strong><br/>
        1. Transfer the fee through Bank, Raast, or Mobile Wallet.<br/>
        2. Take a screenshot or receipt of the completed payment.<br/>
        3. Send your receipt along with your Form ID (<code>{form_id}</code>) via WhatsApp (<strong>{whatsapp}</strong>) or email (<strong>{verification_email}</strong>).<br/><br/>
        Upon fee verification, your admission will be approved and your <strong>Student Portal login ID and temporary password</strong> will be emailed to you immediately.
        '''
    )

    return send_email(student_email, subject, body, html_body)


def send_class_assignment_email(
    student_name: str,
    student_email: str,
    student_code: str,
    slot: str,
    instructor: str,
    login_url: Optional[str] = None
) -> bool:
    """Notifies student when class slot and instructor are assigned."""
    target_login_url = login_url or getattr(settings, "STUDENT_PORTAL_URL", "/student/login") or "/student/login"
    subject = "Class Schedule & Instructor Assigned — Emam"

    body = f"""Dear {student_name},

Assalamu Alaikum wa Rahmatullah,

Great news! Your class schedule and instructor have been officially finalized.

Class Assignment Details:
------------------------------------------
Student ID: {student_code}
Assigned Slot: {slot}
Assigned Instructor: {instructor}
Student Portal: {target_login_url}
------------------------------------------

Important Instructions:
1. Please ensure you are available on your scheduled class timings.
2. Your assigned instructor will connect with you via the Student Portal and provide further guidance.
3. Log in to your Student Portal to view your timetable, course materials, and the Touch-Typing Lab.

JazakAllah Khair,
Emam Team
"""

    table = create_table_box([
        ("Student ID", student_code, True),
        ("Assigned Slot", slot, False),
        ("Assigned Instructor", instructor, False)
    ], border_color="#006666")

    html_body = build_base_email_html(
        title="Class Schedule & Instructor Assigned",
        recipient_name=student_name,
        badge_label="Class Scheduled",
        body_html='''
        <p>Assalamu Alaikum wa Rahmatullah,</p>
        <p>Great news! Your class schedule and instructor assignment have been finalized by the Academic Office.</p>
        ''',
        highlight_box_html=table,
        button_label="Access Student Portal",
        button_url=target_login_url,
        sub_note_html='''
        <strong>Important Instructions:</strong><br/>
        • Please ensure you are online at your scheduled class timings.<br/>
        • Your instructor will reach out to you through the portal with class materials.<br/>
        • Keep practicing on the <strong>Arabic Touch-Typing Lab</strong> in your portal to build keyboard fluency.
        '''
    )

    return send_email(student_email, subject, body, html_body)


def send_contact_inquiry_alert(
    sender_name: str,
    sender_email: str,
    sender_phone: str,
    inquiry_subject: str,
    message_text: str
) -> bool:
    """Alerts Institute Admin when a public visitor submits a contact/inquiry message."""
    subject = f"New Website Inquiry from {sender_name} — Emam"

    body = f"""New Contact Form Submission - Emam

Sender Details:
- Name: {sender_name}
- Email: {sender_email}
- Phone: {sender_phone or 'Not Provided'}
- Subject: {inquiry_subject}

Message:
{message_text}
"""
    table = create_table_box([
        ("Sender Name", sender_name, False),
        ("Email Address", sender_email, False),
        ("Phone / WhatsApp", sender_phone or "Not Provided", False),
        ("Subject", inquiry_subject, False),
        ("Message Content", message_text, False)
    ], border_color="#006666")

    html_body = build_base_email_html(
        title="New Website Inquiry Received",
        recipient_name="Support Administrator",
        badge_label="Contact Us Inquiry",
        body_html="<p>A website visitor has submitted an inquiry through the Contact Us form:</p>",
        highlight_box_html=table,
        sub_note_html="Please respond to the inquirer directly at their email address or phone number."
    )

    return send_email(settings.INSTITUTE_NOTIFICATION_EMAIL or settings.EMAIL_FROM, subject, body, html_body)


def send_contact_acknowledgment_email(
    sender_name: str,
    sender_email: str,
    inquiry_subject: str
) -> bool:
    """Automated courtesy auto-reply to visitor acknowledging receipt of their message."""
    subject = "Thank you for contacting Emam"

    body = f"""Dear {sender_name},

Assalamu Alaikum wa Rahmatullah,

Thank you for reaching out to Emam.

We have received your inquiry regarding: "{inquiry_subject}".

Our admissions and support team is reviewing your message and will get back to you shortly via this email address.

If your query is urgent, you can also contact us directly via WhatsApp at {settings.INSTITUTE_WHATSAPP_NUMBER}.

JazakAllah Khair,
Support & Admissions Team
Emam
"""

    html_body = build_base_email_html(
        title="We Have Received Your Message",
        recipient_name=sender_name,
        badge_label="Inquiry Acknowledgment",
        body_html=f'''
        <p>Assalamu Alaikum wa Rahmatullah,</p>
        <p>Thank you for reaching out to <strong>Emam</strong>. We have received your inquiry regarding:</p>
        <div style="background: #f8fafc; border-left: 3px solid #690e1f; padding: 12px 16px; margin: 16px 0; font-style: italic; color: #1e293b;">
          "{inquiry_subject}"
        </div>
        <p>Our team is reviewing your message and will respond to you shortly via this email address.</p>
        <p>In the meantime, feel free to explore our courses and educational programs on our website.</p>
        ''',
        button_label="Visit Institute Website",
        button_url="/",
        sub_note_html=f"For urgent matters, you may also message our official WhatsApp support desk at <strong>{settings.INSTITUTE_WHATSAPP_NUMBER}</strong>."
    )

    return send_email(sender_email, subject, body, html_body)


def send_admission_cancellation_email(
    student_name: str,
    student_email: str,
    form_id: str,
    course_name: str = "Modern Standard Arabic",
    reason: Optional[str] = None
) -> bool:
    """Notifies applicant when their admission application is canceled or closed."""
    subject = f"Update regarding your Admission Application — Form #{form_id[:8]}"

    effective_reason = (reason.strip() if reason and reason.strip() else "Administrative review / Fee verification pending")

    body = f"""Dear {student_name},

Assalamu Alaikum wa Rahmatullah,

We are writing to provide you with an update regarding your admission application for {course_name} (Form ID: {form_id}).

Your application has been marked as Canceled by the Admissions Office.

Reason for Cancellation:
{effective_reason}

If you believe this status was updated in error, or if you have already submitted your payment proof, please reach out immediately to our Admissions Office with your Form ID ({form_id}) via WhatsApp at {settings.FEE_VERIFICATION_WHATSAPP} or email at {settings.FEE_VERIFICATION_EMAIL}.

JazakAllah Khair,
Admissions Office
Emam
"""

    table = create_table_box([
        ("Application Form ID", form_id, True),
        ("Course Name", course_name, False),
        ("Application Status", "Canceled / Inactive", False),
        ("Reason for Cancellation", effective_reason, False)
    ], border_color="#ef4444", bg_color="#fef2f2")

    html_body = build_base_email_html(
        title="Admission Application Status Update",
        recipient_name=student_name,
        badge_label="Status Update",
        body_html=f'''
        <p>Assalamu Alaikum wa Rahmatullah,</p>
        <p>We are writing to update you on your application for <strong>{course_name}</strong> at Emam.</p>
        <p>Your application status has been updated to <strong>Canceled</strong> by the Admissions Office.</p>
        ''',
        highlight_box_html=table,
        sub_note_html=f'''
        <strong>Need Assistance or Have Questions?</strong><br/>
        If you have already transferred your fee, or believe this was marked in error, please contact our Admissions Helpdesk with your Form ID (<code>{form_id}</code>) via WhatsApp at <strong>{settings.FEE_VERIFICATION_WHATSAPP}</strong> or email at <strong>{settings.FEE_VERIFICATION_EMAIL}</strong> so we can resolve this promptly for you.
        '''
    )

    return send_email(student_email, subject, body, html_body)
