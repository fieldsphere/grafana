import React from 'react';
import { Card, HorizontalGroup } from '@grafana/ui';
import { css, cx } from '@emotion/css';

interface cardProps {
  description?: string;
  text: string;
  url: string;
  category?: string;
  clicked?: (event?: React.MouseEvent) => void;
}

const categoryStyles = ['primary', 'secondary', 'success', 'warning', 'error'] as const;
type CategoryStyle = (typeof categoryStyles)[number];

const isCategoryStyle = (cat: string) => {
  return categoryStyles.some((style) => style === cat);
};

const getStyles = () => ({
  Card: css`
    grid-template-rows: 1fr 0 2fr;
  `,
  Description: css`
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    display: -webkit-box;
    overflow: hidden;
  `,
  Primary: css`
    border: 1px solid rgba(55, 135, 255, 0.25);
    background-color: rgba(55, 135, 255, 0.08);
    &:hover {
      background-color: rgba(55, 135, 255, 0.08);
      border-color: rgba(55, 135, 255, 0.4);
    }
  `,
  Secondary: css`
    border: 1px solid rgba(180, 180, 180, 0.25);
    background-color: rgba(180, 180, 180, 0.08);
    &:hover {
      background-color: rgba(180, 180, 180, 0.08);
      border-color: rgba(180, 180, 180, 0.4);
    }
  `,
  Success: css`
    border: 1px solid rgba(115, 191, 105, 0.25);
    background-color: rgba(115, 191, 105, 0.08);
    &:hover {
      background-color: rgba(115, 191, 105, 0.08);
      border-color: rgba(115, 191, 105, 0.4);
    }
  `,
  Warning: css`
    border: 1px solid rgba(255, 152, 48, 0.25);
    background-color: rgba(255, 152, 48, 0.08);
    &:hover {
      background-color: rgba(255, 152, 48, 0.08);
      border-color: rgba(255, 152, 48, 0.4);
    }
  `,
  Error: css`
    border: 1px solid rgba(242, 73, 92, 0.25);
    background-color: rgba(242, 73, 92, 0.08);
    &:hover {
      background-color: rgba(242, 73, 92, 0.08);
      border-color: rgba(242, 73, 92, 0.4);
    }
  `,
});

const NavLandingPageCard: React.FC<cardProps> = ({ description, text, url, category, clicked }) => {
  const styles = getStyles();

  const categoryClass =
    category && isCategoryStyle(category) ? styles[category as keyof ReturnType<typeof getStyles>] : undefined;

  return (
    <Card noMargin className={cx(styles.Card, categoryClass)} href={url} onClick={clicked}>
      <Card.Heading>{text}</Card.Heading>
      <Card.Description className={styles.Description}>{description}</Card.Description>
    </Card>
  );
};

export default NavLandingPageCard;
