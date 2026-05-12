import { css } from '@emotion/css';

import { type GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import { Badge, type BadgeColor, Stack, Text, useStyles2 } from '@grafana/ui';

import { type ActionSeverity, type RecommendedAction } from './types';

interface RecommendedActionsProps {
  actions: RecommendedAction[];
  emptyMessage: string;
}

export function RecommendedActions({ actions, emptyMessage }: RecommendedActionsProps) {
  const styles = useStyles2(getStyles);

  if (actions.length === 0) {
    return (
      <div className={styles.empty} data-testid="code-health-actions-empty">
        <Text variant="body" color="secondary">
          {emptyMessage}
        </Text>
      </div>
    );
  }

  return (
    <ul
      className={styles.list}
      data-testid="code-health-actions-list"
      aria-label={t('code-health.actions.list-aria-label', 'Recommended actions')}
    >
      {actions.map((action) => (
        <li key={action.id} className={styles.item} data-testid={`code-health-action-${action.id}`}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={2}>
            <Stack direction="column" gap={0.5}>
              <Text element="h4" variant="h6">
                {action.title}
              </Text>
              <Text variant="bodySmall" color="secondary">
                {action.description}
              </Text>
              <Text variant="bodySmall" color="secondary">
                {t('code-health.actions.area-label', 'Area: {{area}}', { area: action.area })}
              </Text>
            </Stack>
            <Stack direction="column" alignItems="flex-end" gap={1}>
              <Badge text={severityLabel(action.severity)} color={severityColor(action.severity)} />
            </Stack>
          </Stack>
        </li>
      ))}
    </ul>
  );
}

function severityLabel(severity: ActionSeverity): string {
  switch (severity) {
    case 'high':
      return t('code-health.actions.severity-high', 'High priority');
    case 'medium':
      return t('code-health.actions.severity-medium', 'Medium priority');
    case 'low':
    default:
      return t('code-health.actions.severity-low', 'Low priority');
  }
}

function severityColor(severity: ActionSeverity): BadgeColor {
  switch (severity) {
    case 'high':
      return 'red';
    case 'medium':
      return 'orange';
    case 'low':
    default:
      return 'blue';
  }
}

const getStyles = (theme: GrafanaTheme2) => ({
  list: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1.5),
    listStyle: 'none',
    margin: 0,
    padding: 0,
  }),
  item: css({
    padding: theme.spacing(2),
    background: theme.colors.background.primary,
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
  }),
  empty: css({
    padding: theme.spacing(3),
    background: theme.colors.background.primary,
    border: `1px dashed ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    textAlign: 'center',
  }),
});
