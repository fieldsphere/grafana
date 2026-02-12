import { noop } from 'lodash';
import { FormEvent } from 'react';

import { t } from '@grafana/i18n';
import { createMonitoringLogger } from '@grafana/runtime';
import { SceneVariable, TextBoxVariable } from '@grafana/scenes';
import { OptionsPaneItemDescriptor } from 'app/features/dashboard/components/PanelEditor/OptionsPaneItemDescriptor';

import { TextBoxVariableForm } from '../components/TextBoxVariableForm';

const logger = createMonitoringLogger('features.dashboard-scene.textbox-variable-editor');

interface TextBoxVariableEditorProps {
  variable: TextBoxVariable;
  onChange: (variable: TextBoxVariable) => void;
  inline?: boolean;
}

export function TextBoxVariableEditor({ variable, inline }: TextBoxVariableEditorProps) {
  const { value } = variable.useState();

  const onTextValueChange = (e: FormEvent<HTMLInputElement>) => {
    variable.setState({ value: e.currentTarget.value });
  };

  return <TextBoxVariableForm defaultValue={value} onBlur={onTextValueChange} inline={inline} />;
}

export function getTextBoxVariableOptions(variable: SceneVariable): OptionsPaneItemDescriptor[] {
  if (!(variable instanceof TextBoxVariable)) {
    logger.logWarning('getTextBoxVariableOptions: variable is not a TextBoxVariable');
    return [];
  }

  return [
    new OptionsPaneItemDescriptor({
      title: t('dashboard-scene.textbox-variable-form.label-value', 'Value'),
      id: `variable-${variable.state.name}-value`,
      render: () => <TextBoxVariableEditor onChange={noop} variable={variable} inline={true} />,
    }),
  ];
}
