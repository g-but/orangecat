/**
 * Payment Received Email Template
 *
 * Pure functions — no imports, no side effects.
 * Returns subject + html + text for the seller notification email.
 */

export interface PaymentReceivedData {
  sellerName: string;
  entityTitle: string;
  /** Pre-formatted, e.g. "0.00100000" */
  amountBtc: string;
  buyerName: string;
  /** e.g. "Lightning" or "On-chain" */
  paymentMethod: string;
  dashboardUrl: string;
}

export function paymentReceivedTemplate(data: PaymentReceivedData): {
  subject: string;
  html: string;
  text: string;
} {
  const { sellerName, entityTitle, amountBtc, buyerName, paymentMethod, dashboardUrl } = data;

  const subject = `You received a payment for ${entityTitle}`;

  const text = [
    `Hi ${sellerName},`,
    '',
    'You received a payment on OrangeCat.',
    '',
    `  Item:    ${entityTitle}`,
    `  Amount:  ${amountBtc} BTC`,
    `  From:    @${buyerName}`,
    `  Via:     ${paymentMethod}`,
    '',
    'View your dashboard:',
    dashboardUrl,
    '',
    '— OrangeCat',
  ].join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Inter,system-ui,sans-serif;color:#1a1a1a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:40px auto;padding:0 16px;">
    <tr>
      <td>
        <p style="font-size:13px;color:#8a8a8a;margin:0 0 24px;">OrangeCat</p>
        <h1 style="font-size:22px;font-weight:600;margin:0 0 8px;">You received a payment</h1>
        <p style="font-size:15px;color:#4a4a4a;margin:0 0 32px;">for <strong>${entityTitle}</strong></p>

        <table width="100%" cellpadding="0" cellspacing="0"
          style="border:1px solid #e5e5e5;border-radius:8px;padding:24px;margin-bottom:32px;">
          <tr>
            <td style="padding:6px 0;">
              <span style="font-size:13px;color:#8a8a8a;display:inline-block;width:80px;">Item</span>
              <span style="font-size:14px;">${entityTitle}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:6px 0;">
              <span style="font-size:13px;color:#8a8a8a;display:inline-block;width:80px;">Amount</span>
              <span style="font-size:18px;font-weight:700;font-family:monospace;">${amountBtc} BTC</span>
            </td>
          </tr>
          <tr>
            <td style="padding:6px 0;">
              <span style="font-size:13px;color:#8a8a8a;display:inline-block;width:80px;">From</span>
              <span style="font-size:14px;">@${buyerName}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:6px 0;">
              <span style="font-size:13px;color:#8a8a8a;display:inline-block;width:80px;">Via</span>
              <span style="font-size:14px;">${paymentMethod}</span>
            </td>
          </tr>
        </table>

        <a href="${dashboardUrl}"
          style="display:inline-block;background:#0ABAB5;color:#ffffff;text-decoration:none;
                 padding:12px 24px;border-radius:6px;font-size:14px;font-weight:500;">
          View Dashboard
        </a>

        <p style="font-size:12px;color:#8a8a8a;margin-top:40px;">
          You're receiving this because you have a seller account on OrangeCat.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html, text };
}
