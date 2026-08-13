import HeroSectionStatic from '@/components/home/sections/HeroSectionStatic';
import FirstMoveSection from '@/components/home/sections/FirstMoveSection';

/**
 * Public home page — one fold, then three first moves.
 *
 * Long-form explanation (categories, personas, steps, comparison) lives on
 * /how-it-works and /discover. Visitors should not have to scroll an essay
 * to take the first useful action.
 */
export default function HomePublic() {
  return (
    <div className="min-h-screen">
      <HeroSectionStatic />
      <FirstMoveSection />
    </div>
  );
}
