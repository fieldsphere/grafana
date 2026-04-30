import { getSelectableThemes } from './getSelectableThemes';

describe('getSelectableThemes', () => {
  it('includes the Amethyst theme in the theme switcher', () => {
    const themeIds = getSelectableThemes().map((theme) => theme.id);

    expect(themeIds).toContain('amethyst');
  });
});
