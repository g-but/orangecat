/**
 * Document Text Extraction Helpers
 *
 * Pure functions for extracting metadata from uploaded text files.
 */

/** Generate a human-readable title from a filename */
export function generateTitle(fileName: string): string {
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
  const cleaned = nameWithoutExt
    .replace(/[-_]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

/** Detect document type from filename and content keywords */
export function detectDocumentType(content: string, fileName: string): string {
  const lc = content.toLowerCase();
  const ln = fileName.toLowerCase();

  if (ln.includes('goal') || ln.includes('objective')) {return 'goals';}
  if (ln.includes('skill') || ln.includes('resume') || ln.includes('cv')) {return 'skills';}
  if (ln.includes('finance') || ln.includes('budget') || ln.includes('money')) {return 'finances';}
  if (ln.includes('business') || ln.includes('plan') || ln.includes('startup')) {return 'business_plan';}

  if (lc.includes('my goal') || lc.includes('objective') || lc.includes('i want to achieve')) {return 'goals';}
  if (lc.includes('experience') || lc.includes('skill') || lc.includes('proficient')) {return 'skills';}
  if (lc.includes('budget') || lc.includes('income') || lc.includes('expense') || lc.includes('savings')) {return 'finances';}
  if (lc.includes('business') || lc.includes('market') || lc.includes('revenue')) {return 'business_plan';}

  return 'notes';
}
