import { css } from '@emotion/css';

import { type GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import { Card, Icon, TextLink, useStyles2 } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';
import { useNavModel } from 'app/core/hooks/useNavModel';

function getStyles(theme: GrafanaTheme2) {
  return {
    cardGrid: css({
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
      gap: theme.spacing(3),
    }),
    titleRow: css({
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1),
      marginBottom: theme.spacing(1),
    }),
    link: css({
      marginTop: theme.spacing(1),
      display: 'inline-block',
    }),
  };
}

export default function LabsPage() {
  const styles = useStyles2(getStyles);
  const navModel = useNavModel('cfg/labs');

  return (
    <Page navModel={navModel}>
      <Page.Contents>
        <section className={styles.cardGrid}>
          <Card>
            <Card.Heading>
              <div className={styles.titleRow}>
                <Icon name="toggle-on" size="lg" />
                {t('admin.labs.feature-flagging.title', 'Feature flagging dashboard')}
              </div>
            </Card.Heading>
            <Card.Description>
              {t(
                'admin.labs.feature-flagging.description',
                'View enabled runtime flags and set browser-local overrides for experimentation.'
              )}
            </Card.Description>
            <TextLink href="/admin/labs/feature-flags" className={styles.link}>
              {t('admin.labs.feature-flagging.open-link', 'Open dashboard')}
            </TextLink>
          </Card>
        </section>
      </Page.Contents>
    </Page>
  );
}
