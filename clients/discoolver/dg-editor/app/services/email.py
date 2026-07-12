"""
Async email service for Discoolver Guide Editor.

Uses stdlib smtplib via run_in_executor — no extra dependencies.
Set EMAIL_ENABLED=false in .env to skip sending (dev/test mode).
"""
from __future__ import annotations

import asyncio
import logging
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from functools import partial

from app.config import settings

log = logging.getLogger(__name__)


# ── Low-level send ────────────────────────────────────────────────────────────

def _send_sync(to: str, subject: str, html: str, text: str) -> None:
    """Blocking SMTP send — called in a thread executor."""
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = settings.email_from
    msg["To"]      = to
    msg.attach(MIMEText(text, "plain", "utf-8"))
    msg.attach(MIMEText(html,  "html",  "utf-8"))

    port = settings.smtp_port
    host = settings.smtp_host

    if port == 465:
        ctx = ssl.create_default_context()
        with smtplib.SMTP_SSL(host, port, context=ctx) as s:
            if settings.smtp_user and settings.smtp_password:
                s.login(settings.smtp_user, settings.smtp_password)
            s.sendmail(settings.email_from, [to], msg.as_string())
    else:
        with smtplib.SMTP(host, port, timeout=10) as s:
            s.ehlo()
            if port == 587:
                s.starttls()
                s.ehlo()
            if settings.smtp_user and settings.smtp_password:
                s.login(settings.smtp_user, settings.smtp_password)
            s.sendmail(settings.email_from, [to], msg.as_string())


async def send_email(to: str, subject: str, html: str, text: str = "") -> None:
    """
    Send an email asynchronously.
    If EMAIL_ENABLED=false (dev default), logs to console instead.
    """
    if not settings.email_enabled:
        log.info("[email:dev] To=%s | Subject=%s", to, subject)
        log.info("[email:dev] %s", text or "[html only]")
        return

    if not settings.smtp_host:
        log.warning("[email] SMTP_HOST not configured — skipping send to %s", to)
        return

    loop = asyncio.get_event_loop()
    try:
        await loop.run_in_executor(None, partial(_send_sync, to, subject, html, text))
        log.info("[email] Sent to %s | %s", to, subject)
    except Exception as exc:
        log.error("[email] Failed to send to %s: %s", to, exc)
        # Don't raise — email failures must not break the API response


# ── Email templates ───────────────────────────────────────────────────────────

_BRAND = "#C8006B"
_FONT  = "Inter, system-ui, sans-serif"

def _wrap(body: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{{font-family:{_FONT};background:#F4F4F6;margin:0;padding:32px 16px}}
  .card{{background:#fff;border-radius:12px;max-width:540px;margin:0 auto;
         padding:40px;box-shadow:0 2px 12px rgba(0,0,0,.08)}}
  .logo{{font-size:22px;font-weight:800;color:{_BRAND};letter-spacing:-0.5px;margin-bottom:28px}}
  h1{{font-size:20px;font-weight:700;color:#111827;margin:0 0 12px}}
  p{{color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px}}
  .btn{{display:inline-block;background:{_BRAND};color:#fff;padding:12px 28px;
        border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;margin:8px 0 20px}}
  .note{{color:#6B7280;font-size:13px;line-height:1.5}}
  .footer{{text-align:center;color:#9CA3AF;font-size:12px;margin-top:32px}}
</style></head>
<body><div class="card">
<div class="logo">discoolver</div>
{body}
<div class="footer">© 2026 Discoolver — <a href="https://discoolver.com" style="color:{_BRAND}">discoolver.com</a></div>
</div></body></html>"""


async def send_registration_confirmation(to: str, name: str) -> None:
    subject = "Solicitud recibida — Discoolver Influencers"
    html = _wrap(f"""
<h1>Hola, {name} 👋</h1>
<p>Hemos recibido tu solicitud para unirte al programa de influencers de Discoolver.</p>
<p>Nuestro equipo revisará tu perfil en las próximas 48 horas y te avisaremos por email con la decisión.</p>
<p class="note">Mientras tanto, puedes consultar más sobre Discoolver en <a href="https://discoolver.com" style="color:{_BRAND}">discoolver.com</a>.</p>
""")
    text = (
        f"Hola {name},\n\n"
        "Hemos recibido tu solicitud para unirte al programa de influencers de Discoolver.\n"
        "Nuestro equipo revisará tu perfil en las próximas 48 horas y te avisaremos por email.\n\n"
        "— El equipo de Discoolver"
    )
    await send_email(to, subject, html, text)


async def send_approval_email(to: str, name: str, portal_url: str = "https://discoolver.com/portal") -> None:
    subject = "¡Bienvenido al programa de influencers de Discoolver! ✓"
    html = _wrap(f"""
<h1>¡Enhorabuena, {name}!</h1>
<p>Tu solicitud ha sido aprobada. Ya puedes acceder al portal de influencers de Discoolver.</p>
<a href="{portal_url}" class="btn">Acceder al portal</a>
<p class="note">Desde el portal podrás conectar tu Instagram, ver tu guía asignada e importar tus recomendaciones directamente.</p>
""")
    text = (
        f"¡Enhorabuena, {name}!\n\n"
        "Tu solicitud ha sido aprobada. Ya puedes acceder al portal:\n"
        f"{portal_url}\n\n"
        "— El equipo de Discoolver"
    )
    await send_email(to, subject, html, text)


async def send_rejection_email(to: str, name: str, reason: str | None = None) -> None:
    subject = "Actualización sobre tu solicitud — Discoolver"
    reason_block = (
        f'<p class="note"><strong>Motivo:</strong> {reason}</p>'
        if reason else ""
    )
    html = _wrap(f"""
<h1>Hola, {name}</h1>
<p>Gracias por tu interés en el programa de influencers de Discoolver.</p>
<p>Tras revisar tu perfil, en esta ocasión no podemos incorporarte al programa.</p>
{reason_block}
<p class="note">Si crees que hay un error o quieres más información, escríbenos a <a href="mailto:hola@discoolver.com" style="color:{_BRAND}">hola@discoolver.com</a>.</p>
""")
    text = (
        f"Hola {name},\n\n"
        "Tras revisar tu perfil, en esta ocasión no podemos incorporarte al programa de influencers.\n"
        + (f"Motivo: {reason}\n" if reason else "")
        + "\nSi tienes dudas, escríbenos a hola@discoolver.com.\n\n"
        "— El equipo de Discoolver"
    )
    await send_email(to, subject, html, text)


async def send_admin_new_application(admin_email: str, applicant_name: str, applicant_email: str, ig_handle: str | None, admin_url: str = "https://discoolver.com/editor") -> None:
    subject = f"Nueva solicitud de influencer: {applicant_name}"
    ig_line = f"Instagram: @{ig_handle.lstrip('@')}" if ig_handle else ""
    html = _wrap(f"""
<h1>Nueva solicitud de influencer</h1>
<p><strong>{applicant_name}</strong> ({applicant_email}) ha solicitado unirse al programa.</p>
{f'<p class="note">{ig_line}</p>' if ig_line else ""}
<a href="{admin_url}" class="btn">Revisar en el panel de admin</a>
""")
    text = (
        f"Nueva solicitud de influencer: {applicant_name} ({applicant_email})\n"
        + (f"{ig_line}\n" if ig_line else "")
        + f"\nRevisar: {admin_url}\n"
    )
    await send_email(admin_email, subject, html, text)
