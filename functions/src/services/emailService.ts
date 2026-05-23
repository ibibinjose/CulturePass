import { Resend } from 'resend';

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY ?? '');
  }
  return _resend;
}

const APP_URL = process.env.APP_URL ?? 'https://culturepass.app';

export interface DigestEvent {
  id: string;
  title: string;
  date: string;
  imageUrl?: string;
  venue?: string;
  city?: string;
}

export async function sendWeeklyDigestEmail(params: {
  to: string;
  displayName: string;
  city: string;
  events: DigestEvent[];
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[emailService] RESEND_API_KEY not set — skipping digest email');
    return;
  }

  await getResend().emails.send({
    from: 'CulturePass <digest@culturepass.au>',
    to: params.to,
    subject: `Your cultural week: ${params.city}`,
    html: buildDigestHtml(params),
  });
}

function buildDigestHtml(params: {
  displayName: string;
  city: string;
  events: DigestEvent[];
}): string {
  const eventRows = params.events
    .map(
      (e) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;">
        ${
          e.imageUrl
            ? `<img src="${escapeHtml(e.imageUrl)}" width="80" height="56" style="border-radius:8px;object-fit:cover;vertical-align:top;margin-right:14px;" />`
            : ''
        }
        <span style="display:inline-block;vertical-align:top;">
          <strong style="font-size:15px;color:#1a1a1a;">${escapeHtml(e.title)}</strong><br/>
          <span style="font-size:13px;color:#666;">${escapeHtml(formatDate(e.date))}${e.venue ? ` · ${escapeHtml(e.venue)}` : ''}</span><br/>
          <a href="${APP_URL}/e/${e.id}" style="font-size:13px;color:#9333EA;text-decoration:none;">View event →</a>
        </span>
      </td>
    </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f9f9f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
    <tr>
      <td style="background:linear-gradient(135deg,#9333EA,#FF5E5B);padding:28px 32px;">
        <h1 style="margin:0;font-size:22px;color:#fff;font-weight:700;">CulturePass</h1>
        <p style="margin:6px 0 0;font-size:14px;color:rgba(255,255,255,0.85);">Your cultural week in ${escapeHtml(params.city)}</p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 32px;">
        <p style="font-size:15px;color:#333;margin:0 0 16px;">Hi ${escapeHtml(params.displayName || 'there')},</p>
        <p style="font-size:15px;color:#555;margin:0 0 20px;">Here are this week's cultural events picked for you:</p>
        <table width="100%" cellpadding="0" cellspacing="0">${eventRows}</table>
        <div style="margin-top:24px;text-align:center;">
          <a href="${APP_URL}/discover" style="display:inline-block;background:linear-gradient(135deg,#9333EA,#FF5E5B);color:#fff;text-decoration:none;padding:12px 28px;border-radius:100px;font-size:14px;font-weight:600;">Discover more →</a>
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 32px;border-top:1px solid #f0f0f0;text-align:center;">
        <p style="font-size:12px;color:#999;margin:0;">
          You're receiving this because you have events notifications enabled.
          <a href="${APP_URL}/settings/notifications" style="color:#9333EA;text-decoration:none;">Manage preferences</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-AU', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}
