/**
 * Dispatches a page's sections to their renderers, and numbers them.
 *
 * One renderer for every hosted site is the point: it is what stops fifty
 * customer websites becoming fifty stylesheets, and it is why a site inherits
 * typography, dark mode and reading measure without its owner thinking about
 * any of them. Section shapes are the closed set in `src/config/site-content.ts`.
 *
 * Numbering counts only sections that carry a heading, so an unheaded lead
 * paragraph or a bare table does not consume a number and leave a gap in the
 * sequence a reader can see.
 */

import React from 'react';
import type { SiteSection } from '@/config/site-content';
import { HeroSection } from './sections/HeroSection';
import { MeterSection, StatsSection } from './sections/FigureSections';
import { CardsSection, DefinitionsSection, ProseSection } from './sections/ProseSections';
import { IndexSection, TableSection } from './sections/DataSections';

/** True when a section shows a heading, and therefore takes the next number. */
function isNumbered(section: SiteSection): boolean {
  return section.kind !== 'hero' && section.kind !== 'table' && Boolean(section.heading);
}

export function SiteSections({ sections }: { sections: SiteSection[] }) {
  let counter = 0;

  return (
    <div className="space-y-16">
      {sections.map((section, key) => {
        const index = isNumbered(section) ? ++counter : undefined;

        switch (section.kind) {
          case 'hero':
            return <HeroSection key={key} section={section} />;
          case 'prose':
            return <ProseSection key={key} section={section} index={index} />;
          case 'stats':
            return <StatsSection key={key} section={section} index={index} />;
          case 'meter':
            return <MeterSection key={key} section={section} index={index} />;
          case 'cards':
            return <CardsSection key={key} section={section} index={index} />;
          case 'definitions':
            return <DefinitionsSection key={key} section={section} index={index} />;
          case 'index':
            return <IndexSection key={key} section={section} index={index} />;
          case 'table':
            return <TableSection key={key} section={section} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
