import { NavModelItem } from '@grafana/data';

import { addLabsSectionToNav } from './navBarTree';

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
