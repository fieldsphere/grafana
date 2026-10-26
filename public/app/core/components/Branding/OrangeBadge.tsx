import { css, cx } from '@emotion/css';
import { type HTMLAttributes } from 'react';

import { type GrafanaTheme2 } from '@grafana/data';
import { Icon, useStyles2 } from '@grafana/ui';

interface Props extends HTMLAttributes<HTMLDivElement> {
  text?: string;
  className?: string;
  /** Brand chips stay orange. Environment chips use purple so the running environment stands out. */
  variant?: 'brand' | 'environment';
}

export function OrangeBadge({ text, className, variant = 'brand', ...htmlProps }: Props) {
  const styles = useStyles2(getStyles, text, variant);
  return (
    <div className={cx(styles.wrapper, className)} {...htmlProps}>
      <Icon name="cloud" size={variant === 'environment' ? 'md' : 'sm'} />
      {text}
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2, text: string | undefined, variant: 'brand' | 'environment') => {
  // Tertiary is the palette purple. Success is remapped by colorblind themes.
  const environmentFill = theme.colors.mode === 'dark' ? theme.colors.tertiary.text : theme.colors.tertiary.main;
  const environmentRing = theme.colors.mode === 'dark' ? theme.colors.tertiary.main : theme.colors.tertiary.text;

  return {
    wrapper: css({
      display: 'inline-flex',
      padding: theme.spacing(0.5, 1),
      borderRadius: theme.shape.radius.pill,
      background: theme.colors.gradients.brandHorizontal,
      color: theme.colors.primary.contrastText,
      fontWeight: theme.typography.fontWeightMedium,
      gap: theme.spacing(0.5),
      fontSize: theme.typography.bodySmall.fontSize,
      lineHeight: theme.typography.bodySmall.lineHeight,
      alignItems: 'center',
      ...(text === undefined && {
        svg: {
          marginRight: 0,
        },
      }),
      ...(variant === 'environment' && {
        background: environmentFill,
        color: theme.colors.getContrastText(environmentFill),
        padding: theme.spacing(0.75, 1.5),
        fontSize: theme.typography.body.fontSize,
        fontWeight: theme.typography.fontWeightBold,
        boxShadow: `0 0 0 2px ${environmentRing}`,
      }),
    }),
  };
};
