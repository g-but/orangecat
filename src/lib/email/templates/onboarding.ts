/**
 * Onboarding Drip Email Template
 *
 * Parameterized by day (1, 2, 3, 5, 7). Each day has a specific nudge.
 * Pure functions — no imports from outside templates.
 */

import { emailLayout, emailPlainText } from './layout';

export type OnboardingDay = 1 | 2 | 3 | 5 | 7;

export interface OnboardingEmailData {
  displayName: string;
  day: OnboardingDay;
  /** Stats for day-7 summary */
  weekStats?: {
    entitiesCreated: number;
    profileComplete: boolean;
    walletAdded: boolean;
  };
  profileUrl: string;
  walletUrl: string;
  createUrl: string;
  exploreUrl: string;
  dashboardUrl: string;
  unsubscribeUrl: string;
}

interface OnboardingConfig {
  subject: string;
  heading: string;
  bodyHtml: string;
  bodyText: string;
  ctaText: string;
  ctaUrl: string;
  preheader: string;
}

function getOnboardingConfig(data: OnboardingEmailData): OnboardingConfig {
  const {
    displayName,
    day,
    weekStats,
    profileUrl,
    walletUrl,
    createUrl,
    exploreUrl,
    dashboardUrl,
  } = data;
  const greeting = displayName !== 'there' ? displayName : 'there';

  switch (day) {
    case 1:
      return {
        subject: "Let's set up your identity — 2 minutes",
        heading: 'Quick start: your profile',
        preheader: 'It takes 2 minutes and makes everything else easier.',
        bodyHtml: `
          <p style="margin:0 0 16px;">Hi ${greeting},</p>
          <p style="margin:0 0 16px;">
            A complete profile is how people find and trust you on OrangeCat.
            It takes about 2 minutes.
          </p>
          <p style="margin:0 0 16px;">Here's what helps most:</p>
          <ul style="margin:0 0 16px;padding-left:20px;color:#4a4a4a;">
            <li style="padding:4px 0;">A display name (real or pseudonymous — your choice)</li>
            <li style="padding:4px 0;">A short bio</li>
            <li style="padding:4px 0;">An avatar</li>
          </ul>
          <p style="margin:0;">You can always change these later.</p>`,
        bodyText: [
          `Hi ${greeting},`,
          '',
          'A complete profile is how people find and trust you on OrangeCat.',
          'It takes about 2 minutes.',
          '',
          'What helps most:',
          '  - A display name (real or pseudonymous)',
          '  - A short bio',
          '  - An avatar',
          '',
          'You can always change these later.',
        ].join('\n'),
        ctaText: 'Complete your profile',
        ctaUrl: profileUrl,
      };

    case 2:
      return {
        subject: 'Add a wallet so you can receive Bitcoin',
        heading: 'Set up payments',
        preheader: 'Add a wallet and you can start receiving payments immediately.',
        bodyHtml: `
          <p style="margin:0 0 16px;">Hi ${greeting},</p>
          <p style="margin:0 0 16px;">
            To receive payments on OrangeCat, you need at least one wallet.
            Lightning is the fastest — payments arrive in seconds.
          </p>
          <p style="margin:0 0 16px;">
            You can add a Lightning address, an on-chain Bitcoin address,
            or connect via NWC. Multiple wallets are fine too.
          </p>
          <p style="margin:0;">Once a wallet is connected, you're ready to earn.</p>`,
        bodyText: [
          `Hi ${greeting},`,
          '',
          'To receive payments on OrangeCat, you need at least one wallet.',
          'Lightning is the fastest — payments arrive in seconds.',
          '',
          'You can add a Lightning address, an on-chain Bitcoin address,',
          'or connect via NWC. Multiple wallets work too.',
          '',
          "Once a wallet is connected, you're ready to earn.",
        ].join('\n'),
        ctaText: 'Add a wallet',
        ctaUrl: walletUrl,
      };

    case 3:
      return {
        subject: 'What would you like to offer?',
        heading: 'Create your first listing',
        preheader: 'Products, services, projects, causes — what fits you?',
        bodyHtml: `
          <p style="margin:0 0 16px;">Hi ${greeting},</p>
          <p style="margin:0 0 16px;">
            OrangeCat supports many types of listings. Here are some ideas:
          </p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
            <tr>
              <td style="padding:10px 16px;background:#f9fafb;border-radius:6px;">
                <strong>Product</strong><span style="color:#8a8a8a;"> — sell something physical or digital</span>
              </td>
            </tr>
            <tr><td style="height:6px;"></td></tr>
            <tr>
              <td style="padding:10px 16px;background:#f9fafb;border-radius:6px;">
                <strong>Service</strong><span style="color:#8a8a8a;"> — offer your skills or time</span>
              </td>
            </tr>
            <tr><td style="height:6px;"></td></tr>
            <tr>
              <td style="padding:10px 16px;background:#f9fafb;border-radius:6px;">
                <strong>Project</strong><span style="color:#8a8a8a;"> — fund something with milestones</span>
              </td>
            </tr>
            <tr><td style="height:6px;"></td></tr>
            <tr>
              <td style="padding:10px 16px;background:#f9fafb;border-radius:6px;">
                <strong>Cause</strong><span style="color:#8a8a8a;"> — raise funds for something you care about</span>
              </td>
            </tr>
          </table>
          <p style="margin:0;">Pick what fits. You can always add more later.</p>`,
        bodyText: [
          `Hi ${greeting},`,
          '',
          'OrangeCat supports many types of listings:',
          '',
          '  Product — sell something physical or digital',
          '  Service — offer your skills or time',
          '  Project — fund something with milestones',
          '  Cause — raise funds for something you care about',
          '',
          'Pick what fits. You can always add more later.',
        ].join('\n'),
        ctaText: 'Create a listing',
        ctaUrl: createUrl,
      };

    case 5:
      return {
        subject: "Here's what others are building",
        heading: 'Get inspired',
        preheader: 'See what people are creating on OrangeCat.',
        bodyHtml: `
          <p style="margin:0 0 16px;">Hi ${greeting},</p>
          <p style="margin:0 0 16px;">
            People on OrangeCat are building all sorts of things — freelance services,
            open-source funding, peer-to-peer lending, local goods, research projects.
          </p>
          <p style="margin:0 0 16px;">
            Browsing what others have created is one of the best ways to figure out
            what you want to offer. Take a look.
          </p>
          <p style="margin:0;color:#8a8a8a;font-size:14px;">
            And if you see something you like, supporting it is a good way to connect.
          </p>`,
        bodyText: [
          `Hi ${greeting},`,
          '',
          'People on OrangeCat are building all sorts of things — freelance services,',
          'open-source funding, peer-to-peer lending, local goods, research projects.',
          '',
          'Browsing what others have created is one of the best ways to figure out',
          'what you want to offer.',
          '',
          'If you see something you like, supporting it is a good way to connect.',
        ].join('\n'),
        ctaText: 'Explore OrangeCat',
        ctaUrl: exploreUrl,
      };

    case 7: {
      const completed: string[] = [];
      const remaining: string[] = [];

      if (weekStats?.profileComplete) {
        completed.push('Profile set up');
      } else {
        remaining.push(
          `<a href="${profileUrl}" style="color:#0ABAB5;text-decoration:none;">Complete your profile</a>`
        );
      }
      if (weekStats?.walletAdded) {
        completed.push('Wallet connected');
      } else {
        remaining.push(
          `<a href="${walletUrl}" style="color:#0ABAB5;text-decoration:none;">Add a wallet</a>`
        );
      }
      if (weekStats && weekStats.entitiesCreated > 0) {
        completed.push(
          `${weekStats.entitiesCreated} listing${weekStats.entitiesCreated > 1 ? 's' : ''} created`
        );
      } else {
        remaining.push(
          `<a href="${createUrl}" style="color:#0ABAB5;text-decoration:none;">Create your first listing</a>`
        );
      }

      const completedHtml =
        completed.length > 0
          ? completed.map(c => `<li style="padding:4px 0;color:#059669;">${c}</li>`).join('')
          : '';
      const remainingHtml =
        remaining.length > 0
          ? remaining.map(r => `<li style="padding:4px 0;">${r}</li>`).join('')
          : '';

      const everythingDone = remaining.length === 0;

      return {
        subject: "Your first week — here's where you stand",
        heading: 'One week in',
        preheader: everythingDone
          ? "You're all set up. Nice work."
          : `${completed.length} of 3 steps done — keep going.`,
        bodyHtml: `
          <p style="margin:0 0 16px;">Hi ${greeting},</p>
          <p style="margin:0 0 16px;">
            It's been a week since you joined OrangeCat. Here's a quick check-in.
          </p>
          ${
            completedHtml
              ? `
          <p style="font-size:14px;font-weight:600;margin:0 0 4px;">Done:</p>
          <ul style="margin:0 0 16px;padding-left:20px;">${completedHtml}</ul>`
              : ''
          }
          ${
            remainingHtml
              ? `
          <p style="font-size:14px;font-weight:600;margin:0 0 4px;">Still to do:</p>
          <ul style="margin:0 0 16px;padding-left:20px;">${remainingHtml}</ul>`
              : ''
          }
          ${
            everythingDone
              ? '<p style="margin:0;">You\'re fully set up. I\'m here whenever you need me.</p>'
              : '<p style="margin:0;">No rush — take your time. I\'ll be here.</p>'
          }`,
        bodyText: [
          `Hi ${greeting},`,
          '',
          "It's been a week since you joined. Here's where you stand.",
          '',
          ...(completed.length > 0 ? ['Done:', ...completed.map(c => `  [x] ${c}`), ''] : []),
          ...(remaining.length > 0
            ? ['Still to do:', ...remaining.map(r => `  [ ] ${r.replace(/<[^>]*>/g, '')}`), '']
            : []),
          everythingDone
            ? "You're fully set up. I'm here whenever you need me."
            : "No rush — take your time. I'll be here.",
        ].join('\n'),
        ctaText: everythingDone ? 'Open dashboard' : 'Continue setup',
        ctaUrl: dashboardUrl,
      };
    }
  }
}

export function onboardingTemplate(data: OnboardingEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const config = getOnboardingConfig(data);

  const html = emailLayout({
    preheader: config.preheader,
    heading: config.heading,
    body: config.bodyHtml,
    ctaText: config.ctaText,
    ctaUrl: config.ctaUrl,
    unsubscribeUrl: data.unsubscribeUrl,
  });

  const text = emailPlainText({
    heading: config.heading,
    body: config.bodyText,
    ctaText: config.ctaText,
    ctaUrl: config.ctaUrl,
    unsubscribeUrl: data.unsubscribeUrl,
  });

  return { subject: config.subject, html, text };
}
