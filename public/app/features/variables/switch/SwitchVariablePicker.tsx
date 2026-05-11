import { type ChangeEvent, type ReactElement, useCallback } from 'react';

import { type SwitchVariableModel } from '@grafana/data';
import { Switch } from '@grafana/ui';

import { variableAdapters } from '../adapters';
import { type VariablePickerProps } from '../pickers/types';

import { grafanaStructuredLogger } from '@grafana/runtime';
export interface Props extends VariablePickerProps<SwitchVariableModel> {}

export function SwitchVariablePicker({ variable, onVariableChange }: Props): ReactElement {
  const updateVariable = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (!variable.rootStateKey) {
        grafanaStructuredLogger.logError(new Error('Cannot update variable without rootStateKey'));
        return;
      }

      const newValue = event!.currentTarget.checked ? variable.options[0] : variable.options[1];

      if (variable.current.value === newValue.value) {
        return;
      }

      if (onVariableChange) {
        onVariableChange({
          ...variable,
          current: newValue,
        });
        return;
      }

      variableAdapters.get(variable.type).updateOptions(variable);
    },
    [variable, onVariableChange]
  );

  return (
    <Switch
      id={`var-${variable.id}`}
      value={variable.current.value === variable.options[0].value}
      onChange={updateVariable}
    />
  );
}
