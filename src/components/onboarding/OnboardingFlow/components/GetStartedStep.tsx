/**
 * GET STARTED STEP COMPONENT
 * Final step - single primary CTA to create first project
 *
 * Context-aware: Adjusts messaging based on user's actual state
 */

import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Target, Sparkles, ArrowRight, Users, BookOpen } from 'lucide-react';
import { ROUTES } from '@/config/routes';

/** Benefits shown on the CTA card - centralized for easy updates */
const PROJECT_BENEFITS = ['No platform fees', 'Direct to your wallet', 'Full control'] as const;

interface GetStartedStepProps {
  hasWallet?: boolean;
  hasProjects?: boolean;
}

export function GetStartedStep({ hasWallet = false, hasProjects = false }: GetStartedStepProps) {
  const router = useRouter();

  // Dynamic messaging based on user state
  const ctaTitle = hasProjects ? 'Create Another Project' : 'Create Your First Project';
  const ctaDescription = hasProjects
    ? 'Launch another Bitcoin crowdfunding campaign'
    : 'Launch a Bitcoin crowdfunding campaign and start receiving support';
  const headerText = hasProjects
    ? 'Ready to grow your portfolio?'
    : 'The most important thing you can do now is create your first project.';

  // Pro tip based on wallet status
  const proTip = hasWallet
    ? "Projects with a clear story and Bitcoin address set up get 3x more support. You've already added your wallet — you're ahead of the game!"
    : 'Projects with a clear story and Bitcoin address set up get 3x more support. Add your wallet address to start receiving Bitcoin!';

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Target className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-2xl font-semibold mb-2">You're Ready to Launch!</h3>
        <p className="text-muted-foreground">{headerText}</p>
      </div>

      {/* Primary CTA - Create Project */}
      <Card
        className="border-2 border-orange-300 bg-gradient-to-r from-orange-50 to-orange-100 hover:border-orange-400 hover:shadow-lg transition-all cursor-pointer"
        onClick={() => router.push(ROUTES.PROJECTS.CREATE)}
      >
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-orange-500 rounded-xl flex-shrink-0">
                <Target className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h4 className="text-lg sm:text-xl font-bold text-orange-900 mb-1">{ctaTitle}</h4>
                <p className="text-sm sm:text-base text-orange-800 mb-3">{ctaDescription}</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {PROJECT_BENEFITS.map(benefit => (
                    <span
                      key={benefit}
                      className="bg-orange-200 text-orange-800 px-2 py-1 rounded-full"
                    >
                      {benefit}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <ArrowRight className="h-6 w-6 text-orange-600 flex-shrink-0 hidden sm:block" />
          </div>
          <Button
            className="w-full mt-4 bg-orange-600 hover:bg-orange-700"
            onClick={e => {
              e.stopPropagation();
              router.push(ROUTES.PROJECTS.CREATE);
            }}
          >
            Create My Project
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>

      {/* Secondary Options */}
      <div className="pt-4 border-t border-gray-200">
        <p className="text-sm text-muted-foreground text-center mb-4">
          Not ready to create? Explore first:
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={() => router.push(ROUTES.DISCOVER)}
            className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-orange-600 transition-colors min-h-[44px]"
          >
            <Users className="h-4 w-4" />
            Explore Projects
          </button>
          <button
            onClick={() => router.push(ROUTES.STUDY_BITCOIN)}
            className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-orange-600 transition-colors min-h-[44px]"
          >
            <BookOpen className="h-4 w-4" />
            Learn About Bitcoin
          </button>
        </div>
      </div>

      {/* Encouragement Card */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-green-800">
                <strong>Pro tip:</strong> {proTip}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
