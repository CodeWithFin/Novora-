import { env } from '../../config/env.js';
import { sendMailBackground } from '../../shared/mailer.js';

export function sendWelcomeEmail(
  org: { name: string },
  user: { email: string }
) {
  sendMailBackground({
    to: user.email,
    subject: `Welcome to Novora, ${org.name}!`,
    html: `
      <h2>Welcome to Novora!</h2>
      <p>Your organization <strong>${org.name}</strong> is ready.</p>
      <p><a href="${env.APP_URL}/login">Log in to your dashboard</a></p>
    `,
  });
}

export function sendInviteEmail(
  invite: { email: string; token: string; role: string },
  org: { name: string }
) {
  const link = `${env.APP_URL}/accept-invite?token=${invite.token}`;
  sendMailBackground({
    to: invite.email,
    subject: `You've been invited to join ${org.name} on Novora`,
    html: `
      <h2>You're invited!</h2>
      <p>Join <strong>${org.name}</strong> on Novora as <strong>${invite.role}</strong>.</p>
      <p><a href="${link}">Accept invite and set your password</a></p>
      <p>This link expires in 24 hours.</p>
    `,
  });
}

export function sendStockInEmail(
  org: { name: string; email: string },
  items: { name: string; quantity: number; expiryDate?: string | null }[]
) {
  const rows = items
    .map(
      (i) =>
        `<tr><td>${i.name}</td><td>${i.quantity}</td><td>${i.expiryDate ?? '—'}</td></tr>`
    )
    .join('');
  sendMailBackground({
    to: org.email,
    subject: `Stock Received — ${org.name}`,
    html: `
      <h2>Stock Received</h2>
      <table border="1" cellpadding="8">
        <tr><th>Item</th><th>Qty</th><th>Expiry</th></tr>
        ${rows}
      </table>
    `,
  });
}

export function sendStockOutEmail(
  org: { name: string; email: string },
  shop: { name: string },
  items: { name: string; quantity: number }[]
) {
  const rows = items
    .map((i) => `<tr><td>${i.name}</td><td>${i.quantity}</td></tr>`)
    .join('');
  sendMailBackground({
    to: org.email,
    subject: `Stock Dispatched to ${shop.name}`,
    html: `
      <h2>Stock Dispatched to ${shop.name}</h2>
      <table border="1" cellpadding="8">
        <tr><th>Item</th><th>Qty</th></tr>
        ${rows}
      </table>
    `,
  });
}

export function sendRequestAccessEmail(form: {
  name: string;
  company: string;
  email: string;
  phone?: string;
  message?: string;
}) {
  sendMailBackground({
    to: env.EMAIL_RECIPIENT,
    subject: `New Access Request — ${form.name} from ${form.company}`,
    html: `
      <h2>New Access Request</h2>
      <p><strong>Name:</strong> ${form.name}</p>
      <p><strong>Company:</strong> ${form.company}</p>
      <p><strong>Email:</strong> ${form.email}</p>
      <p><strong>Phone:</strong> ${form.phone ?? '—'}</p>
      <p><strong>Message:</strong> ${form.message ?? '—'}</p>
    `,
  });
}
