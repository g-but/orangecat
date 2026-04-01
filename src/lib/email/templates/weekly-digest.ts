/**
 * Weekly Digest Email Template
 *
 * Sent weekly with a summary of activity. Sections are conditional.
 * Pure functions — no imports from outside templates.
 */

import { emailLayout, emailPlainText } from './layout';

export interface WeeklyDigestStats {
  views?: number;
  payments?: number;
  amountBtc?: string;
  followers?: number;
  newFollowers?: number;
}

export interface EntityPerformance {
  title: string;
  views: number;
  payments: number;
}

export interface WeeklyDigestEmailData {
  displayName: string;
  stats: WeeklyDigestStats;
  topEntities?: EntityPerformance[];
  /** Cat's personalized suggestions (1-3 items) */
  suggestions?: string[];
  dashboardUrl: string;
  chatUrl: string;
  unsubscribeUrl: string;
}

export function weeklyDigestTemplate(data: WeeklyDigestEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const { displayName, stats, topEntities, suggestions, dashboardUrl, chatUrl, unsubscribeUrl } =
    data;

  const subject = 'Your week with Cat';
  const greeting = displayName !== 'there' ? displayName : 'there';

  // Build HTML sections conditionally
  const htmlSections: string[] = [];
  const textSections: string[] = [];

  htmlSections.push(
    `<p style="margin:0 0 20px;">Hi ${greeting}, here's what happened this week.</p>`
  );
  textSections.push(`Hi ${greeting}, here's what happened this week.`, '');

  // Stats section
  const hasStats = stats.views || stats.payments || stats.newFollowers;

  if (hasStats) {
    const statItems: string[] = [];
    const textStatItems: string[] = [];

    if (stats.views) {
      statItems.push(statCell('Views', String(stats.views)));
      textStatItems.push(`Views: ${stats.views}`);
    }
    if (stats.payments) {
      const paymentLabel = stats.amountBtc
        ? `${stats.payments} (${stats.amountBtc} BTC)`
        : String(stats.payments);
      statItems.push(statCell('Payments', paymentLabel));
      textStatItems.push(`Payments: ${paymentLabel}`);
    }
    if (stats.newFollowers) {
      statItems.push(statCell('New followers', String(stats.newFollowers)));
      textStatItems.push(`New followers: ${stats.newFollowers}`);
    }
    if (stats.followers) {
      statItems.push(statCell('Total followers', String(stats.followers)));
      textStatItems.push(`Total followers: ${stats.followers}`);
    }

    htmlSections.push(`
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
        style="border:1px solid #e5e5e5;border-radius:8px;margin:0 0 24px;">
        <tr>${statItems.join('')}</tr>
      </table>`);

    textSections.push('--- This Week ---', ...textStatItems, '');
  }

  // Top entities section
  if (topEntities && topEntities.length > 0) {
    const entityRows = topEntities
      .map(
        e => `
        <tr>
          <td style="padding:8px 12px;font-size:14px;border-bottom:1px solid #f0f0f0;">
            <strong>${escapeHtml(e.title)}</strong>
          </td>
          <td style="padding:8px 12px;font-size:14px;color:#8a8a8a;text-align:right;border-bottom:1px solid #f0f0f0;">
            ${e.views} views &middot; ${e.payments} payments
          </td>
        </tr>`
      )
      .join('');

    htmlSections.push(`
      <p style="font-size:14px;font-weight:600;color:#1a1a1a;margin:0 0 8px;">Top performers</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
        style="border:1px solid #e5e5e5;border-radius:8px;overflow:hidden;margin:0 0 24px;">
        ${entityRows}
      </table>`);

    textSections.push(
      'Top performers:',
      ...topEntities.map(e => `  ${e.title} — ${e.views} views, ${e.payments} payments`),
      ''
    );
  }

  // Suggestions section
  if (suggestions && suggestions.length > 0) {
    const suggestionItems = suggestions
      .map(s => `<li style="padding:4px 0;font-size:14px;color:#4a4a4a;">${escapeHtml(s)}</li>`)
      .join('');

    htmlSections.push(`
      <p style="font-size:14px;font-weight:600;color:#1a1a1a;margin:0 0 8px;">From your Cat</p>
      <ul style="margin:0 0 24px;padding-left:20px;">
        ${suggestionItems}
      </ul>`);

    textSections.push('From your Cat:', ...suggestions.map(s => `  - ${s}`), '');
  }

  // Quiet week fallback
  if (!hasStats && !topEntities?.length) {
    htmlSections.push(`
      <p style="margin:0 0 16px;color:#4a4a4a;">
        It was a quiet week — no views or payments to report. That's okay.
        If you want, I can help you get more visibility.
      </p>`);
    textSections.push('It was a quiet week. If you want, I can help you get more visibility.', '');
  }

  const html = emailLayout({
    preheader: hasStats
      ? `${stats.views || 0} views, ${stats.payments || 0} payments this week`
      : 'Your weekly summary from Cat',
    heading: 'Your week with Cat',
    body: htmlSections.join('\n'),
    ctaText: 'Chat with Cat',
    ctaUrl: chatUrl,
    footer: `<a href="${escapeHtml(dashboardUrl)}" style="color:#0ABAB5;text-decoration:none;">View full dashboard</a>`,
    unsubscribeUrl,
  });

  const text = emailPlainText({
    heading: 'Your week with Cat',
    body: textSections.join('\n'),
    ctaText: 'Chat with Cat',
    ctaUrl: chatUrl,
    footer: `Full dashboard: ${dashboardUrl}`,
    unsubscribeUrl,
  });

  return { subject, html, text };
}

// --- Helpers ---

function statCell(label: string, value: string): string {
  return `
    <td style="padding:16px;text-align:center;width:25%;">
      <div style="font-size:20px;font-weight:700;color:#1a1a1a;">${escapeHtml(value)}</div>
      <div style="font-size:12px;color:#8a8a8a;margin-top:4px;">${escapeHtml(label)}</div>
    </td>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
