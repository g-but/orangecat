import HeroSectionStatic from '@/components/home/sections/HeroSectionStatic';
import WhatCanYouDoSection from '@/components/home/sections/WhatCanYouDoSection';
import ProofSection from '@/components/home/sections/ProofSection';
import HowItWorksSection from '@/components/home/sections/HowItWorksSection';
import TransparencySection from '@/components/home/sections/TransparencySection';
import TrustSection from '@/components/home/sections/TrustSection';

/**
 * Public home page — fully server-rendered.
 *
 * This used to be a client component that lazy-loaded every below-the-fold
 * section via next/dynamic with animated placeholders: visitors without
 * JavaScript (and crawlers reading the HTML) got an empty page below the
 * hero. The sections are static marketing copy, so they now render in the
 * RSC tree and ship as plain HTML — no hydration required to read the page.
 */
export default function HomePublic() {
  return (
    <div className="min-h-screen">
      <HeroSectionStatic />
      <WhatCanYouDoSection />
      <ProofSection />
      <HowItWorksSection />
      <TransparencySection />
      <TrustSection />
    </div>
  );
}
