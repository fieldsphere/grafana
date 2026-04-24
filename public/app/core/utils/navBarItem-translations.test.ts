import { getNavSubTitle, getNavTitle } from './navBarItem-translations';

describe('navBarItem-translations', () => {
  it('maps labs nav id to title and subtitle', () => {
    const title = getNavTitle('labs') ?? '';
    const sub = getNavSubTitle('labs') ?? '';
    expect(title.toLowerCase()).toMatch(/labs/);
    expect(sub.length).toBeGreaterThan(0);
  });
});
