import { QueryVariable, type SceneVariable } from '@grafana/scenes';

import { OptionsPaneItemDescriptor } from '../../../../../dashboard/components/PanelEditor/OptionsPaneItemDescriptor';

import { PaneItem } from './PaneItem';

import { createStructuredLogger } from '@grafana/data';
const logger = createStructuredLogger('features.dashboard-scene');

export function getQueryVariableOptions(variable: SceneVariable): OptionsPaneItemDescriptor[] {
  if (!(variable instanceof QueryVariable)) {
    logger.warn('getQueryVariableOptions: variable is not a QueryVariable');
    return [];
  }

  return [
    new OptionsPaneItemDescriptor({
      id: `variable-${variable.state.name}-value`,
      render: () => <PaneItem variable={variable} />,
    }),
  ];
}
