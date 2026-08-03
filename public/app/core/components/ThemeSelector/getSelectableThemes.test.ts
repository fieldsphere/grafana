import { getSelectableThemes } from './getSelectableThemes';

describe('getSelectableThemes', () => {
  it('includes Cursor as a selectable extra theme', () => {
    const themes = getSelectableThemes();
    const cursor = themes.find((theme) => theme.id === 'cursor');

    expect(cursor).toBeDefined();
    expect(cursor?.name).toBe('Cursor');
    expect(cursor?.isExtra).toBe(true);
  });
});
