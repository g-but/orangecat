import type { Metadata } from 'next';
import { LegalDocumentPage } from '@/components/legal/LegalDocumentPage';
import { TERMS_OF_SERVICE } from '@/config/legal-content';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'The terms that govern your use of OrangeCat: marketplace role, Bitcoin payments, acceptable use, and your responsibilities.',
};

export default function TermsPage() {
  return <LegalDocumentPage document={TERMS_OF_SERVICE} />;
}
