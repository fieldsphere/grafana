import { css, cx } from '@emotion/css';
import { type JSX, type MouseEvent } from 'react';

import { colorManipulator, type GrafanaTheme2 } from '@grafana/data';
import { Card, useStyles2 } from '@grafana/ui';

const CATEGORY_STYLES = ['primary', 'secondary', 'success', 'warning', 'error'] as const;
type CategoryStyle = (typeof CATEGORY_STYLES)[number];

function isCategoryStyle(cat: string): cat is CategoryStyle {
  return (CATEGORY_STYLES as readonly string[]).includes(cat);
}

export interface NavLandingPageCardProps {
  category?: string;
  description?: string;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  text: string;
  url: string;
}

export function NavLandingPageCard({
  category,
  description,
  onClick,
  text,
  url,
}: NavLandingPageCardProps): JSX.Element {
  const styles = useStyles2(getStyles);

  const categoryClass = category && isCategoryStyle(category) ? styles.category[category] : undefined;

  return (
    <Card noMargin className={cx(styles.card, categoryClass)} href={url} onClick={onClick}>
      <Card.Heading>{text}</Card.Heading>
      <Card.Description className={styles.description}>{description}</Card.Description>
    </Card>
  );
}

const getStyles = (theme: GrafanaTheme2) => {
  const categoryTone = (color: string) => ({
    backgroundColor: colorManipulator.alpha(color, 0.08),
    border: `1px solid ${colorManipulator.alpha(color, 0.25)}`,
    '&:hover': {
      backgroundColor: colorManipulator.alpha(color, 0.08),
      borderColor: colorManipulator.alpha(color, 0.4),
    },
  });

  return {
    card: css({
      gridTemplateRows: '1fr 0 2fr',
    }),
    category: {
      primary: css(categoryTone(theme.colors.primary.main)),
      secondary: css(categoryTone(theme.colors.secondary.main)),
      success: css(categoryTone(theme.colors.success.main)),
      warning: css(categoryTone(theme.colors.warning.main)),
      error: css(categoryTone(theme.colors.error.main)),
    },
    description: css({
      WebkitBoxOrient: 'vertical',
      WebkitLineClamp: 3,
      display: '-webkit-box',
      overflow: 'hidden',
    }),
  };
};
