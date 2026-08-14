'use client';

/**
 * Review-and-create surface for a program blueprint.
 *
 * Turn the knobs, uncheck what you do not want, press the button once. Each
 * enabled step is POSTed to its entity's normal API endpoint in sequence, and
 * every row reports its own outcome — a failed step leaves the rest standing.
 *
 * Created: 2026-08-14
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { ActorSelector } from '@/components/create/ActorSelector';
import { ROUTES } from '@/config/routes';
import {
  defaultParamValues,
  getProgramBlueprint,
  type BlueprintParamValue,
} from '@/config/program-blueprints';
import { runBlueprintStep, type StepResult } from '@/services/programs/runBlueprint';
import { ProgramParamFields } from './ProgramParamFields';
import { ProgramStepList } from './ProgramStepList';

interface ProgramBlueprintRunnerProps {
  /**
   * Resolved from the registry on the client, NOT passed in as an object: a
   * blueprint carries `buildSteps` and an icon component, and functions cannot
   * cross the server → client boundary as props.
   */
  blueprintId: string;
}

export function ProgramBlueprintRunner({ blueprintId }: ProgramBlueprintRunnerProps) {
  const blueprint = getProgramBlueprint(blueprintId);
  const [values, setValues] = useState(() => (blueprint ? defaultParamValues(blueprint) : {}));
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, StepResult>>({});
  const [actorId, setActorId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  const steps = useMemo(() => blueprint?.buildSteps(values) ?? [], [blueprint, values]);
  const activeSteps = steps.filter(step => enabled[step.key] !== false);
  const createdCount = Object.values(results).filter(r => r.status === 'created').length;
  const failedCount = Object.values(results).filter(r => r.status === 'failed').length;

  const setParam = (key: string, value: BlueprintParamValue) => {
    setValues(previous => ({ ...previous, [key]: value }));
  };

  const toggleStep = (key: string) => {
    setEnabled(previous => ({ ...previous, [key]: previous[key] === false }));
  };

  const run = async () => {
    setIsRunning(true);
    setHasRun(true);
    // Only the steps that are about to run are reset — results from an earlier
    // partial run stay on screen so nothing gets created twice by accident.
    setResults(previous => {
      const next = { ...previous };
      for (const step of activeSteps) {
        if (next[step.key]?.status !== 'created') {
          next[step.key] = { key: step.key, status: 'pending' };
        }
      }
      return next;
    });

    for (const step of activeSteps) {
      if (results[step.key]?.status === 'created') {
        continue;
      }
      setResults(previous => ({
        ...previous,
        [step.key]: { key: step.key, status: 'running' },
      }));
      const result = await runBlueprintStep(step, { actorId });
      setResults(previous => ({ ...previous, [step.key]: result }));
    }

    setIsRunning(false);
  };

  // The page 404s on an unknown id before this renders; this only guards the
  // type. Placed after the hooks so hook order stays stable.
  if (!blueprint) {
    return null;
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-fg-secondary">
          Set it up
        </h2>
        <p className="mb-3 mt-1 text-sm text-fg-secondary">
          These numbers drive every entity below — titles, goals, prices and the number of machines
          on the list.
        </p>
        <ProgramParamFields
          params={blueprint.params}
          values={values}
          onChange={setParam}
          disabled={isRunning}
        />
      </section>

      <section>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-fg-secondary">
            What gets created ({activeSteps.length})
          </h2>
          <ActorSelector value={actorId} onChange={setActorId} disabled={isRunning} />
        </div>
        <ProgramStepList
          steps={steps}
          enabled={enabled}
          results={results}
          onToggle={toggleStep}
          locked={isRunning}
        />
        <p className="mt-2 text-xs text-fg-tertiary">
          Everything is created as a draft. Nothing is public until you publish it, and each one is
          an ordinary entity afterwards — edit or delete it from its own dashboard.
        </p>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="accent"
          onClick={run}
          isLoading={isRunning}
          disabled={isRunning || activeSteps.length === 0}
        >
          {hasRun && failedCount > 0
            ? 'Retry the failed ones'
            : `Create ${activeSteps.length} entities`}
        </Button>
        {hasRun && !isRunning && (
          <span className="text-sm text-fg-secondary">
            {createdCount} created
            {failedCount > 0 && `, ${failedCount} failed`}.
          </span>
        )}
      </div>

      {hasRun && !isRunning && createdCount > 0 && (
        <p className="text-sm text-fg-secondary">
          Next: publish the ones you want public, then point supporters at the{' '}
          <Link href={ROUTES.DASHBOARD.WISHLISTS} className="underline hover:text-fg-primary">
            machine list
          </Link>
          .
        </p>
      )}
    </div>
  );
}
