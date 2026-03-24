import aiosmtplib
import os
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

logger = logging.getLogger(__name__)

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", "")
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "Fun2Learn")

LOGO_URL = "https://raw.githubusercontent.com/aayushkarki-islington/Fun2Learn/fce2071c6e54cd3a0f5aa7f826477fbcacf38e1c/fun2learn_frontend/public/logo/logo-default.svg"


def _build_forgot_password_html(full_name: str, verification_code: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Your Fun2Learn Password</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6fb;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td align="center" style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:36px 40px 28px;">
              <img src="{LOGO_URL}" alt="Fun2Learn" width="56" height="56"
                   style="display:block;margin:0 auto 14px;" />
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.3px;">
                Fun2Learn
              </h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">
                Gamified Learning Platform
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 48px 32px;">
              <h2 style="margin:0 0 8px;color:#1e1b4b;font-size:22px;font-weight:700;">
                Password Reset Request
              </h2>
              <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
                Hi <strong style="color:#374151;">{full_name}</strong>,
              </p>
              <p style="margin:0 0 28px;color:#6b7280;font-size:15px;line-height:1.6;">
                We received a request to reset your Fun2Learn account password.
                Use the verification code below to proceed. This code is valid for
                <strong style="color:#374151;">15 minutes</strong>.
              </p>

              <!-- OTP Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <div style="display:inline-block;background:linear-gradient(135deg,#ede9fe 0%,#ddd6fe 100%);border:2px solid #c4b5fd;border-radius:12px;padding:24px 40px;">
                      <p style="margin:0 0 6px;color:#7c3aed;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">
                        Your Verification Code
                      </p>
                      <p style="margin:0;color:#4f46e5;font-size:42px;font-weight:800;letter-spacing:10px;font-variant-numeric:tabular-nums;">
                        {verification_code}
                      </p>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 12px;color:#6b7280;font-size:14px;line-height:1.6;">
                Enter this code in the app to reset your password. Do not share this code with anyone.
              </p>

              <!-- Warning box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="background-color:#fef3c7;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:14px 16px;">
                    <p style="margin:0;color:#92400e;font-size:13px;line-height:1.5;">
                      <strong>Didn't request this?</strong> If you didn't ask to reset your password,
                      you can safely ignore this email. Your account remains secure.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 28px;" />

              <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.6;">
                This email was sent to you because a password reset was requested for your Fun2Learn account.
                If you need help, contact our support team.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background-color:#f9fafb;padding:20px 48px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                &copy; 2025 Fun2Learn. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


async def send_forgot_password_email(recipient_email: str, full_name: str, verification_code: str) -> None:
    """Send a forgot-password OTP email to the given recipient."""
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Your Fun2Learn Password Reset Code"
    msg["From"] = f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>"
    msg["To"] = recipient_email

    html_body = _build_forgot_password_html(full_name, verification_code)
    msg.attach(MIMEText(html_body, "html"))

    await aiosmtplib.send(
        msg,
        hostname=SMTP_HOST,
        port=SMTP_PORT,
        username=SMTP_USERNAME,
        password=SMTP_PASSWORD,
        start_tls=True
    )

    logger.info(f"Forgot-password email sent to {recipient_email}")
