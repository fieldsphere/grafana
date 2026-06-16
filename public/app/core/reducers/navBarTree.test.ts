import { type NavModelItem } from '@grafana/data';

import { ID_PREFIX, addLabsSectionToNav, navTreeReducer, setStarred, updateDashboardName } from './navBarTree';

function buildState(starredChildren: NavModelItem[] = []): NavModelItem[] {
  return [
    { id: 'home', text: 'Home', url: '/' },
    { id: 'starred', text: 'Starred', children: starredChildren },
  ];
}

describe('navBarTree reducer', () => {
  describe('setStarred', () => {
    it('adds a starred item with the ID_PREFIX', () => {
      const state = buildState();
      const next = navTreeReducer(state, setStarred({ id: 'abc', title: 'My Dash', url: '/d/abc', isStarred: true }));
      const starred = next.find((n) => n.id === 'starred');
      expect(starred?.children).toHaveLength(1);
      expect(starred?.children?.[0]).toMatchObject({ id: 'starred/abc', text: 'My Dash', url: '/d/abc' });
    });

    it('removes a starred item by prefixed ID', () => {
      const state = buildState([{ id: ID_PREFIX + 'abc', text: 'My Dash', url: '/d/abc' }]);
      const next = navTreeReducer(state, setStarred({ id: 'abc', title: '', url: '', isStarred: false }));
      const starred = next.find((n) => n.id === 'starred');
      expect(starred?.children).toHaveLength(0);
    });
  });

  describe('updateDashboardName', () => {
    it('updates a starred item matching ID_PREFIX + id', () => {
      const state = buildState([{ id: ID_PREFIX + 'abc', text: 'Old Name', url: '/d/abc/old-name' }]);
      const next = navTreeReducer(state, updateDashboardName({ id: 'abc', title: 'New Name', url: '/d/abc/new-name' }));
      const starred = next.find((n) => n.id === 'starred');
      expect(starred?.children?.[0]).toMatchObject({
        id: 'starred/abc',
        text: 'New Name',
        url: '/d/abc/new-name',
      });
    });

    it('no-ops when the dashboard is not starred', () => {
      const state = buildState([{ id: ID_PREFIX + 'other', text: 'Other Dash', url: '/d/other' }]);
      const next = navTreeReducer(state, updateDashboardName({ id: 'abc', title: 'New Name', url: '/d/abc/new-name' }));
      const starred = next.find((n) => n.id === 'starred');
      expect(starred?.children).toHaveLength(1);
      expect(starred?.children?.[0]).toMatchObject({ id: 'starred/other', text: 'Other Dash', url: '/d/other' });
    });

    it('re-sorts children after rename', () => {
      const state = buildState([
        { id: ID_PREFIX + 'a', text: 'Alpha', url: '/d/a' },
        { id: ID_PREFIX + 'b', text: 'Beta', url: '/d/b' },
        { id: ID_PREFIX + 'c', text: 'Charlie', url: '/d/c' },
      ]);
      // Rename 'Alpha' to 'Zulu' — should move to end
      const next = navTreeReducer(state, updateDashboardName({ id: 'a', title: 'Zulu', url: '/d/a/zulu' }));
      const starred = next.find((n) => n.id === 'starred');
      const names = starred?.children?.map((c) => c.text);
      expect(names).toEqual(['Beta', 'Charlie', 'Zulu']);
    });
  });
});

describe('addLabsSectionToNav', () => {
  it('adds Labs after Connections when signed in', () => {
    const navTree: NavModelItem[] = [
      { id: 'connections', text: 'Connections', url: '/connections' },
      { id: 'cfg', text: 'Administration', url: '/admin' },
    ];

    const result = addLabsSectionToNav(navTree, true, '', true);

    expect(result.map((item) => item.id)).toEqual(['connections', 'labs', 'cfg']);
    expect(result[1]).toMatchObject({ id: 'labs', url: '/labs', isNew: true });
  });

  it('adds Labs before Administration when Connections is missing', () => {
    const navTree: NavModelItem[] = [{ id: 'cfg', text: 'Administration', url: '/admin' }];

    const result = addLabsSectionToNav(navTree, true, '', true);

    expect(result.map((item) => item.id)).toEqual(['labs', 'cfg']);
  });

  it('does not add Labs when user is signed out', () => {
    const navTree: NavModelItem[] = [{ id: 'connections', text: 'Connections', url: '/connections' }];

    const result = addLabsSectionToNav(navTree, false, '', true);

    expect(result).toEqual(navTree);
  });

  it('does not add duplicate Labs section', () => {
    const navTree: NavModelItem[] = [
      { id: 'connections', text: 'Connections', url: '/connections' },
      { id: 'labs', text: 'Labs', url: '/labs' },
    ];

    const result = addLabsSectionToNav(navTree, true, '', true);

    expect(result).toEqual(navTree);
  });

  it('adds Labs as sibling when Connections is nested', () => {
    const navTree: NavModelItem[] = [
      {
        id: 'home',
        text: 'Home',
        url: '/',
        children: [
          { id: 'connections', text: 'Connections', url: '/connections' },
          { id: 'cfg', text: 'Administration', url: '/admin' },
        ],
      },
    ];

    const result = addLabsSectionToNav(navTree, true, '', true);
    const nestedIds = result[0].children?.map((item) => item.id);

    expect(nestedIds).toEqual(['connections', 'labs', 'cfg']);
    expect(result[0].children?.[1]).toMatchObject({ id: 'labs', url: '/labs', isNew: true });
  });

  it('does not add duplicate nested Labs section', () => {
    const navTree: NavModelItem[] = [
      {
        id: 'home',
        text: 'Home',
        url: '/',
        children: [
          { id: 'connections', text: 'Connections', url: '/connections' },
          { id: 'labs', text: 'Labs', url: '/labs' },
          { id: 'cfg', text: 'Administration', url: '/admin' },
        ],
      },
    ];

    const result = addLabsSectionToNav(navTree, true, '', true);

    expect(result).toEqual(navTree);
  });

  it('does not add Labs when user lacks feature management read permission', () => {
    const navTree: NavModelItem[] = [{ id: 'connections', text: 'Connections', url: '/connections' }];

    const result = addLabsSectionToNav(navTree, true, '', false);

    expect(result).toEqual(navTree);
  });
});
