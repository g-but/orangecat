/**
 * Milestone Email Template
 *
 * Sent when a user hits an achievement. Parameterized by milestone type.
 * Pure functions — no imports from outside templates.
 */

import { emailLayout, emailPlainText } from './layout';

export type MilestoneType =
  | 'first_entity'
  | 'first_payment'
  | 'first_view'
  | 'profile_complete'
  | 'entity_published';

export interface MilestoneEmailData {
  displayName: string;
  milestoneType: MilestoneType;
  /** Context-specific detail, e.g. entity title or payment amount */
  detail?: string;
  dashboardUrl: string;
  unsubscribeUrl: string;
}

interface MilestoneConfig {
  subject: string;
  heading: string;
  message: string;
  nextStep: string;
  nextStepLabel: string;
}

function getMilestoneConfig(type: MilestoneType, detail: string | undefined): MilestoneConfig {
  switch (type) {
    case 'first_entity':
      return {
        subject: `You created your first listing${detail ? `: ${detail}` : ''}`,
        heading: 'Your first listing is live!',
        message: detail
          ? `<strong>${detail}</strong> is now out there. That took courage — most people never get this far.`
          : 'Your first listing is now live. That took courage — most people never get this far.',
        nextStep: 'Share it with someone, or create another.',
        nextStepLabel: 'View your listing',
      };
    case 'first_payment':
      return {
        subject: 'You received your first payment!',
        heading: 'Your first payment just landed',
        message: detail
          ? `<strong>${detail}</strong> — your first payment on OrangeCat. This is real.`
          : 'Your first payment on OrangeCat just came through. This is real.',
        nextStep: 'Check your dashboard to see the details.',
        nextStepLabel: 'View payment',
      };
    case 'first_view':
      return {
        subject: 'Someone viewed your listing',
        heading: 'You got your first view',
        message: detail
          ? `Someone just checked out <strong>${detail}</strong>. People are finding you.`
          : 'Someone just viewed one of your listings. People are finding you.',
        nextStep: 'Make sure your listing looks its best.',
        nextStepLabel: 'Review your listing',
      };
    case 'profile_complete':
      return {
        subject: 'Your profile is complete',
        heading: 'Profile complete — you look great',
        message:
          'Your profile is fully set up. People browsing OrangeCat can now find you and see what you offer.',
        nextStep: "If you haven't already, create your first listing.",
        nextStepLabel: 'Create a listing',
      };
    case 'entity_published':
      return {
        subject: `Published: ${detail || 'Your listing'}`,
        heading: detail ? `${detail} is now published` : 'Your listing is published',
        message: detail
          ? `<strong>${detail}</strong> moved from draft to published. It's visible to everyone now.`
          : 'Your listing moved from draft to published. Anyone can find it now.',
        nextStep: 'Share it to get your first views.',
        nextStepLabel: 'View listing',
      };
  }
}

export function milestoneTemplate(data: MilestoneEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const { displayName, milestoneType, detail, dashboardUrl, unsubscribeUrl } = data;
  const config = getMilestoneConfig(milestoneType, detail);
  const greeting = displayName !== 'there' ? displayName : 'there';

  const body = `
    <p style="margin:0 0 16px;">Hi ${greeting},</p>
    <p style="margin:0 0 16px;">${config.message}</p>
    <p style="margin:0;color:#8a8a8a;font-size:14px;">${config.nextStep}</p>`;

  const html = emailLayout({
    preheader: config.message.replace(/<[^>]*>/g, ''),
    heading: config.heading,
    body,
    ctaText: config.nextStepLabel,
    ctaUrl: dashboardUrl,
    unsubscribeUrl,
  });

  const text = emailPlainText({
    heading: config.heading,
    body: [`Hi ${greeting},`, '', config.message.replace(/<[^>]*>/g, ''), '', config.nextStep].join(
      '\n'
    ),
    ctaText: config.nextStepLabel,
    ctaUrl: dashboardUrl,
    unsubscribeUrl,
  });

  return { subject: config.subject, html, text };
}
