import json
import urllib.request
import urllib.parse
from app.config import settings

def send_whatsapp_message(to_number: str, message: str):
    if not settings.WHATSAPP_API_TOKEN or not settings.WHATSAPP_API_URL:
        print(f"\n[MOCK WHATSAPP] To: {to_number}\n{message}\n")
        return True

    # Example payload, this will depend on the actual provider (CallMeBot, Twilio, Meta)
    # This is a generic CallMeBot implementation for testing
    try:
        encoded_message = urllib.parse.quote(message)
        url = f"{settings.WHATSAPP_API_URL}?phone={to_number}&text={encoded_message}&apikey={settings.WHATSAPP_API_TOKEN}"
        
        req = urllib.request.Request(url, method="GET")
        with urllib.request.urlopen(req) as response:
            if response.status == 200:
                print(f"WhatsApp message sent successfully to {to_number}")
                return True
            else:
                print(f"Failed to send WhatsApp message. Status code: {response.status}")
                return False
    except Exception as e:
        print(f"ERROR: WhatsApp service failed. Error: {e}")
        return False

def send_whatsapp_admission_alert(student_name: str, student_email: str, student_phone: str, form_id: str):
    message = f"""New Admission Alert

Name: {student_name}
Email: {student_email}
Contact: {student_phone}
Form ID: {form_id}"""
    return send_whatsapp_message(settings.INSTITUTE_WHATSAPP_NUMBER, message)
