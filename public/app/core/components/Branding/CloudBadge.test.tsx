import { render, screen } from '@testing-library/react';

import { CloudBadge } from './CloudBadge';

describe('CloudBadge', () => {
  it('labels the running environment', () => {
    render(<CloudBadge />);

    expect(screen.getByText('Environment: Cloud')).toBeInTheDocument();
    expect(screen.getByTitle('This product is running in the Cloud environment')).toBeInTheDocument();
  });
});
