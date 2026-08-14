/**
 * Program Blueprints — registry (SSOT)
 *
 * Add a blueprint here and it appears at /dashboard/programs for every user,
 * with no other wiring. See ./types.ts for the contract.
 *
 * Created: 2026-08-14
 */

import { COMPUTERS_TO_KIDS } from './computers-to-kids';
import type { ProgramBlueprint } from './types';

export const PROGRAM_BLUEPRINTS: ProgramBlueprint[] = [COMPUTERS_TO_KIDS];

export function getProgramBlueprint(id: string): ProgramBlueprint | undefined {
  return PROGRAM_BLUEPRINTS.find(blueprint => blueprint.id === id);
}

export { COMPUTERS_TO_KIDS };
export {
  defaultParamValues,
  numberParam,
  textParam,
  type BlueprintChildren,
  type BlueprintParam,
  type BlueprintParamValue,
  type BlueprintParamValues,
  type BlueprintStep,
  type ProgramBlueprint,
} from './types';
