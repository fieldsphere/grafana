import { css } from '@emotion/css';

import { type GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

function getStyles(theme: GrafanaTheme2) {
  return css({
    marginTop: theme.spacing(2),
    maxWidth: theme.spacing(100),
  });
}

export default function LabsFeatureTogglesPage() {
  const className = useStyles2(getStyles);

  return (
    <Page className={className}>
      <Page.Contents>
        <h1>Feature toggles</h1>
        <p>Labs is a new home for experimental Grafana experiences.</p>
        <p>
          This first pass adds a placeholder for feature flag controls while the backend API contract and persistence
          model are still being defined.
        </p>
      </Page.Contents>
    </Page>
  );
}
