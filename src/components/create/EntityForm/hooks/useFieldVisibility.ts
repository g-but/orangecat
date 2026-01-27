/**
 * FIELD VISIBILITY HOOK
 * Handles conditional visibility logic for form fields and groups
 */

import { useCallback, useMemo } from 'react';
import type { FieldConfig, FieldGroup } from '../../types';

interface WizardMode {
  currentStep: number;
  totalSteps: number;
  visibleFields: string[];
  onNext?: () => void;
  onPrevious?: () => void;
  onSkip?: () => void;
  isLastStep?: boolean;
}

interface UseFieldVisibilityOptions<T extends Record<string, unknown>> {
  formData: T;
  fieldGroups: FieldGroup[];
  wizardMode?: WizardMode;
}

export function useFieldVisibility<T extends Record<string, unknown>>({
  formData,
  fieldGroups,
  wizardMode,
}: UseFieldVisibilityOptions<T>) {
  const isFieldVisible = useCallback(
    (field: FieldConfig) => {
      if (!field.showWhen) {
        return true;
      }

      const { field: condField, value: condValue } = field.showWhen;
      const currentValue = formData[condField as keyof T];

      if (Array.isArray(condValue)) {
        return condValue.includes(currentValue as string);
      }
      return currentValue === condValue;
    },
    [formData]
  );

  const isGroupVisible = useCallback(
    (group: FieldGroup) => {
      if (!group.conditionalOn) {
        return true;
      }

      const { field: condField, value: condValue } = group.conditionalOn;
      const currentValue = formData[condField as keyof T];

      if (Array.isArray(condValue)) {
        return condValue.includes(currentValue as string);
      }
      return currentValue === condValue;
    },
    [formData]
  );

  const visibleFieldGroups = useMemo(() => {
    if (!wizardMode) {
      return fieldGroups;
    }

    return fieldGroups
      .map(group => {
        if (!group.fields) {
          return group;
        }

        const filteredFields = group.fields.filter(field =>
          wizardMode.visibleFields.includes(field.name)
        );

        return { ...group, fields: filteredFields };
      })
      .filter(group => !group.fields || group.fields.length > 0);
  }, [fieldGroups, wizardMode]);

  return {
    isFieldVisible,
    isGroupVisible,
    visibleFieldGroups,
  };
}
