/**
 * ORANGECAT 3.0 INTERACTIVE DEMO
 *
 * Production-quality demo showcasing all platform features:
 * - Dashboard with user overview
 * - Community Circles with shared wallets
 * - Peer-to-Peer Lending marketplace
 * - Social Timeline with engagement
 * - Project Discovery and funding
 *
 * Architecture:
 * - Separated data layer (src/data/demo.ts)
 * - Modular tab components
 * - Responsive design
 * - Accessible UI
 *
 * Created: 2025-12-03
 * Last Modified: 2025-12-03
 */

import { Metadata } from 'next';
import { DemoClient } from './DemoClient';

export const metadata: Metadata = {
  title: 'Interactive Demo - OrangeCat 3.0',
  description:
    'Experience OrangeCat 3.0: Bitcoin crowdfunding, community circles, and peer-to-peer lending in one platform.',
  openGraph: {
    title: 'OrangeCat 3.0 Interactive Demo',
    description: 'Experience the future of Bitcoin crowdfunding, community building, and P2P lending.',
    type: 'website',
  },
};

export default function DemoPage() {
  return <DemoClient />;
}
