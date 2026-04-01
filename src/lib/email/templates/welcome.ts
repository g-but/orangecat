/**
 * Welcome Email Template
 *
 * Sent when a new user signs up. The Cat introduces itself.
 * Pure functions — no imports from outside templates.
 */

import { emailLayout, emailPlainText } from './layout';

export interface WelcomeEmailData {
  displayName: string;
  dashboardUrl: string;
  profileUrl: string;
  walletUrl: string;
  createUrl: string;
  unsubscribeUrl: string;
}

export function welcomeTemplate(data: WelcomeEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const { displayName, dashboardUrl, profileUrl, walletUrl, createUrl, unsubscribeUrl } = data;

  const subject = "Welcome to OrangeCat — I'm your Cat";

  const greeting = displayName !== 'there' ? displayName : 'there';

  const body = `
    <p style="margin:0 0 16px;">Hi ${greeting},</p>
    <p style="margin:0 0 16px;">
      I'm your Cat. I'll help you navigate OrangeCat — buying, selling,
      funding, lending, and everything in between. Think of me as your
      personal economic assistant.
    </p>
    <p style="margin:0 0 16px;">Here are three things to get started:</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
      <tr>
        <td style="padding:12px 16px;background:#f9fafb;border-radius:6px;margin-bottom:8px;">
          <a href="${profileUrl}" style="color:#0ABAB5;text-decoration:none;font-weight:600;">Set up your profile</a>
          <span style="color:#8a8a8a;"> — tell the world (or just me) who you are</span>
        </td>
      </tr>
      <tr><td style="height:8px;"></td></tr>
      <tr>
        <td style="padding:12px 16px;background:#f9fafb;border-radius:6px;">
          <a href="${walletUrl}" style="color:#0ABAB5;text-decoration:none;font-weight:600;">Add a wallet</a>
          <span style="color:#8a8a8a;"> — so you can receive Bitcoin payments</span>
        </td>
      </tr>
      <tr><td style="height:8px;"></td></tr>
      <tr>
        <td style="padding:12px 16px;background:#f9fafb;border-radius:6px;">
          <a href="${createUrl}" style="color:#0ABAB5;text-decoration:none;font-weight:600;">Create something</a>
          <span style="color:#8a8a8a;"> — a product, service, project, or anything you like</span>
        </td>
      </tr>
    </table>
    <p style="margin:0;">
      I'm always here when you need me. Just open your dashboard and ask.
    </p>`;

  const html = emailLayout({
    preheader: "I'm your Cat — here to help you get started on OrangeCat.",
    heading: 'Welcome to OrangeCat',
    body,
    ctaText: 'Open your dashboard',
    ctaUrl: dashboardUrl,
    unsubscribeUrl,
  });

  const text = emailPlainText({
    heading: 'Welcome to OrangeCat',
    body: [
      `Hi ${greeting},`,
      '',
      "I'm your Cat. I'll help you navigate OrangeCat — buying, selling,",
      'funding, lending, and everything in between.',
      '',
      'Three things to get started:',
      '',
      `1. Set up your profile: ${profileUrl}`,
      `2. Add a wallet: ${walletUrl}`,
      `3. Create something: ${createUrl}`,
      '',
      "I'm always here when you need me.",
    ].join('\n'),
    ctaText: 'Open your dashboard',
    ctaUrl: dashboardUrl,
    unsubscribeUrl,
  });

  return { subject, html, text };
}
