import { ChangeEvent, ReactElement, useCallback } from 'react';

import { SwitchVariableModel } from '@grafana/data';
import { logError } from '@grafana/runtime';
import { Switch } from '@grafana/ui';

import { variableAdapters } from '../adapters';
import { VariablePickerProps } from '../pickers/types';

export interface Props extends VariablePickerProps<SwitchVariableModel> {}

export function SwitchVariablePicker({ variable, onVariableChange }: Props): ReactElement {
  const updateVariable = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (!variable.rootStateKey) {
        logError(new Error('Cannot update variable without rootStateKey'), {
          variableId: variable.id,
          variableName: variable.name,
        });
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
