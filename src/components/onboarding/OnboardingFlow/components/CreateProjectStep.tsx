/**
 * CREATE PROJECT STEP COMPONENT
 * Second step of the onboarding flow — pick what to create
 *
 * Shows entity type cards from ENTITY_REGISTRY so users get value
 * before being asked for wallet setup.
 *
 * Uses OnboardingContext to mark onboarding complete before navigating away.
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { ArrowRight, Loader2 } from 'lucide-react';
import { getEntitiesByCategory } from '@/config/entity-registry';
import { ONBOARDING_CATEGORIES, CATEGORY_LABELS } from '@/config/onboarding';
import { useOnboardingContext } from '../context';
import type { EntityMetadata } from '@/config/entity-registry';

export function CreateProjectStep() {
  const { onNavigateAway } = useOnboardingContext();
  const entitiesByCategory = getEntitiesByCategory();
  const [loadingPath, setLoadingPath] = useState<string | null>(null);

  const handleEntityClick = (entity: EntityMetadata) => {
    if (loadingPath) {
      return;
    }
    setLoadingPath(entity.createPath);
    onNavigateAway(entity.createPath);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold mb-2">What would you like to create?</h3>
      </div>

      {ONBOARDING_CATEGORIES.map(category => {
        const entities = entitiesByCategory[category];
        if (!entities?.length) {
          return null;
        }

        return (
          <div key={category}>
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              {CATEGORY_LABELS[category] ?? category}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {entities.slice(0, 4).map(entity => {
                const Icon = entity.icon;
                return (
                  <Card
                    key={entity.type}
                    className={`transition-all ${loadingPath === entity.createPath ? 'border-orange-300 shadow-md opacity-100' : loadingPath ? 'opacity-50 cursor-not-allowed' : 'hover:border-orange-300 hover:shadow-md cursor-pointer'}`}
                    onClick={() => handleEntityClick(entity)}
                  >
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="p-2 bg-orange-50 rounded-lg flex-shrink-0">
                        <Icon className="h-5 w-5 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{entity.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {entity.description}
                        </p>
                      </div>
                      {loadingPath === entity.createPath ? (
                        <Loader2 className="h-4 w-4 text-orange-500 animate-spin flex-shrink-0" />
                      ) : (
                        <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="pt-4 border-t border-gray-200">
        <p className="text-xs text-center text-muted-foreground">
          Not sure yet? Skip this step and explore what others have created.
        </p>
      </div>
    </div>
  );
}
