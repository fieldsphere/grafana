import { css } from '@emotion/css';
import { type JSX, useMemo } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';

import { AlertLabels } from '@grafana/alerting/unstable';
import { type GrafanaTheme2 } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { config, isFetchError } from '@grafana/runtime';
import { Alert, Card, Icon, LoadingPlaceholder, useStyles2 } from '@grafana/ui';

import { RuleViewerLayout } from './components/rule-viewer/RuleViewerLayout';
import { useCloudCombinedRulesMatching } from './hooks/useCombinedRule';
import { getRulesSourceByName } from './utils/datasource';
import { createViewLink } from './utils/misc';
import { unescapePathSeparators } from './utils/rule-id';
import { withPageErrorBoundary } from './withPageErrorBoundary';

const pageTitle = 'Find rule';
const subUrl = config.appSubUrl;

function useRuleFindParams() {
  const location = useLocation();
  const { sourceName: sourceNameParam, name: nameParam } = useParams<{
    sourceName?: string;
    name?: string;
  }>();

  return useMemo(() => {
    const segments = location.pathname?.replace(subUrl, '').split('/') ?? [];
    const nameFromPath = segments[3]
      ? unescapePathSeparators(decodeURIComponent(unescapePathSeparators(segments[3])))
      : undefined;
    const sourceNameFromPath = segments[2] ? decodeURIComponent(segments[2]) : undefined;
    const name = nameParam
      ? unescapePathSeparators(decodeURIComponent(unescapePathSeparators(nameParam)))
      : nameFromPath;
    const sourceName = sourceNameParam ? decodeURIComponent(sourceNameParam) : sourceNameFromPath;

    const searchParams = new URLSearchParams(location.search);

    return {
      name,
      sourceName,
      namespace: searchParams.get('namespace') ?? undefined,
      group: searchParams.get('group') ?? undefined,
    };
  }, [location, nameParam, sourceNameParam]);
}

export function RedirectToRuleViewer(): JSX.Element | null {
  const styles = useStyles2(getStyles);

  const { name, sourceName, namespace, group } = useRuleFindParams();
  const {
    error,
    loading,
    rules = [],
  } = useCloudCombinedRulesMatching(name, sourceName, { namespace, groupName: group });

  if (!name || !sourceName) {
    return <Navigate replace to="/notfound" />;
  }

  if (error) {
    return (
      <RuleViewerLayout title={pageTitle}>
        <Alert
          title={t(
            'alerting.redirect-to-rule-viewer.title-failed-to-load',
            'Failed to load rules from {{sourceName}}',
            { sourceName }
          )}
        >
          {isFetchError(error) && (
            <details className={styles.errorMessage}>
              {error.message}
              <br />
              {/* {!!error?.stack && error.stack} */}
            </details>
          )}
        </Alert>
      </RuleViewerLayout>
    );
  }

  if (loading) {
    return (
      <RuleViewerLayout title={pageTitle}>
        <LoadingPlaceholder text={t('alerting.redirect-to-rule-viewer.text-loading-rule', 'Loading rule...')} />
      </RuleViewerLayout>
    );
  }

  const rulesSource = getRulesSourceByName(sourceName);

  if (!rulesSource) {
    return (
      <RuleViewerLayout title={pageTitle}>
        <Alert title={t('alerting.redirect-to-rule-viewer.title-could-not-view-rule', 'Could not view rule')}>
          <details className={styles.errorMessage}>{`Could not find data source with name: ${sourceName}.`}</details>
        </Alert>
      </RuleViewerLayout>
    );
  }

  if (rules.length === 1) {
    const [rule] = rules;
    const to = createViewLink(rulesSource, rule, '/alerting/list').replace(subUrl, '');
    return <Navigate replace to={to} />;
  }

  if (rules.length === 0) {
    return (
      <RuleViewerLayout title={pageTitle}>
        <div data-testid="no-rules">
          <Trans i18nKey="alerting.redirect-to-rule-viewer.no-rules-found" values={{ sourceName, name }}>
            No rules in <span className={styles.param}>{'{{sourceName}}'}</span> matched the name{' '}
            <span className={styles.param}>{'{{name}}'}</span>
          </Trans>
        </div>
      </RuleViewerLayout>
    );
  }

  return (
    <RuleViewerLayout title={pageTitle}>
      <div>
        <Trans i18nKey="alerting.redirect-to-rule-viewer.several-rules-found" values={{ sourceName, name }}>
          Several rules in <span className={styles.param}>{'{{sourceName}}'}</span> matched the name{' '}
          <span className={styles.param}>{'{{name}}'}</span>, please select the rule you want to view.
        </Trans>
      </div>
      <div className={styles.rules}>
        {rules.map((rule, index) => {
          return (
            <Card noMargin key={`${rule.name}-${index}`} href={createViewLink(rulesSource, rule, '/alerting/list')}>
              <Card.Heading>{rule.name}</Card.Heading>
              <Card.Meta separator={''}>
                <Icon name="folder" />
                <span className={styles.namespace}>{`${rule.namespace.name} / ${rule.group.name}`}</span>
              </Card.Meta>
              <Card.Tags>
                <AlertLabels labels={rule.labels} />
              </Card.Tags>
            </Card>
          );
        })}
      </div>
    </RuleViewerLayout>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    param: css({
      fontStyle: 'italic',
      color: theme.colors.text.secondary,
    }),
    rules: css({
      marginTop: theme.spacing(2),
    }),
    namespace: css({
      marginLeft: theme.spacing(1),
    }),
    errorMessage: css({
      whiteSpace: 'pre-wrap',
    }),
  };
}

export default withPageErrorBoundary(RedirectToRuleViewer);
