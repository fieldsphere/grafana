import { getSelectableThemes } from './getSelectableThemes';

describe('getSelectableThemes', () => {
  it('includes the Amethyst theme in the theme switcher options', () => {
    expect(getSelectableThemes()).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'amethyst', name: 'Amethyst' })]));
  });
});
