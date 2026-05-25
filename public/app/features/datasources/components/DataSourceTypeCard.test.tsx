import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from 'test/test-utils';

import { createTheme } from '@grafana/data';

import { getMockDataSourceMeta } from '../mocks/dataSourcesMocks';

import { DataSourceTypeCard, type Props } from './DataSourceTypeCard';

const setup = (overrides: Partial<Props> = {}) => {
  const defaultProps: Props = {
    dataSourcePlugin: getMockDataSourceMeta(),
    onClick: jest.fn(),
  };

  return {
    ...render(<DataSourceTypeCard {...defaultProps} {...overrides} />),
    props: { ...defaultProps, ...overrides },
  };
};

describe('DataSourceTypeCard', () => {
  it('renders the data source name', () => {
    setup();
    expect(screen.getByText('datasource-test')).toBeInTheDocument();
  });

  it('renders the data source description', () => {
    setup();
    expect(screen.getByText('Some sample description.')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const onClick = jest.fn();
    setup({ onClick });
    const card = screen.getByText('datasource-test').closest('[role="button"]') ?? screen.getByText('datasource-test');
    await userEvent.click(card);
    expect(onClick).toHaveBeenCalled();
  });

  it('renders the learn more link', () => {
    setup();
    expect(screen.getByText('Website')).toBeInTheDocument();
  });

  it('v1 heading.h5 and v2 typography.h5.fontSize produce equivalent values', () => {
    const theme = createTheme();
    expect(theme.v1.typography.heading.h5).toBe(theme.typography.h5.fontSize);
  });
});
