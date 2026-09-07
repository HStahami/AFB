import urllib.parse
import httpx
from app.config import settings


async def send_whatsapp_message(to_number: str, message: str) -> bool:
    if not settings.WHATSAPP_API_TOKEN or not settings.WHATSAPP_API_URL:
        # Mask number in logs to protect privacy
        masked = to_number[:4] + "***" if len(to_number) > 4 else "***"
        print(f"\n[MOCK WHATSAPP] To: {masked}\n{message}\n")
        return True

    try:
        encoded_message = urllib.parse.quote(message)
        url = f"{settings.WHATSAPP_API_URL}?phone={to_number}&text={encoded_message}&apikey={settings.WHATSAPP_API_TOKEN}"
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(url)
            return resp.status_code == 200
    except httpx.TimeoutException:
        print("[WHATSAPP TIMEOUT] Webhook exceeded 3.0s deadline. Continuing without blocking worker.")
        return False
    except Exception as e:
        print(f"[WHATSAPP NOTE] Webhook dispatch notification: {type(e).__name__}")
        return False


async def send_whatsapp_admission_alert(student_name: str, student_email: str, student_phone: str, form_id: str):
    message = f"""New Admission Alert

Name: {student_name}
Email: {student_email}
Contact: {student_phone}
Form ID: {form_id}"""
    return await send_whatsapp_message(settings.INSTITUTE_WHATSAPP_NUMBER, message)

