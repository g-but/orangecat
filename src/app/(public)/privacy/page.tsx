import type { Metadata } from 'next';
import { LegalDocumentPage } from '@/components/legal/LegalDocumentPage';
import { PRIVACY_POLICY } from '@/config/legal-content';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How OrangeCat collects, uses, and shares your personal information — including what Bitcoin and Lightning payments mean for your privacy.',
};

export default function PrivacyPage() {
  return <LegalDocumentPage document={PRIVACY_POLICY} />;
}
