import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createBrowserHistory, createMemoryHistory } from 'history';
import {
  Link,
  Route,
  Routes,
  unstable_HistoryRouter as HistoryRouter,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import { toHistoryRouterHistory } from './historyRouterAdapter';

describe('toHistoryRouterHistory', () => {
  it('reflects the underlying history location and action', () => {
    const history = createMemoryHistory({ initialEntries: ['/start?a=1#frag'] });
    const adapted = toHistoryRouterHistory(history);

    expect(adapted.location.pathname).toBe('/start');
    expect(adapted.location.search).toBe('?a=1');
    expect(adapted.location.hash).toBe('#frag');
    expect(adapted.action).toBe('POP');

    history.push('/next');

    // The getters must read through to the underlying history rather than snapshot it,
    // otherwise the router renders a stale location after any non-router navigation.
    expect(adapted.location.pathname).toBe('/next');
    expect(adapted.action).toBe('PUSH');
  });

  it('forwards push and replace, including state, to the underlying history', () => {
    const history = createMemoryHistory({ initialEntries: ['/start'] });
    const adapted = toHistoryRouterHistory(history);

    adapted.push('/pushed?x=1', { from: 'push' });
    expect(history.location.pathname).toBe('/pushed');
    expect(history.location.search).toBe('?x=1');
    expect(history.location.state).toEqual({ from: 'push' });
    expect(history.action).toBe('PUSH');

    adapted.replace({ pathname: '/replaced', search: '?y=2', hash: '' }, { from: 'replace' });
    expect(history.location.pathname).toBe('/replaced');
    expect(history.location.search).toBe('?y=2');
    expect(history.location.state).toEqual({ from: 'replace' });
    expect(history.action).toBe('REPLACE');
  });

  it('translates the history@4 two-argument listener into a single update object', () => {
    const history = createMemoryHistory({ initialEntries: ['/start'] });
    const adapted = toHistoryRouterHistory(history);
    const listener = jest.fn();

    const unlisten = adapted.listen(listener);
    history.push('/next');

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'PUSH',
        location: expect.objectContaining({ pathname: '/next' }),
      })
    );

    unlisten();
    history.push('/after-unlisten');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('delegates go() to the underlying history', () => {
    const history = createMemoryHistory({ initialEntries: ['/one', '/two'], initialIndex: 1 });
    const adapted = toHistoryRouterHistory(history);

    adapted.go(-1);

    expect(history.location.pathname).toBe('/one');
    expect(history.action).toBe('POP');
  });

  describe('with a sub-path basename', () => {
    // `createBrowserHistory({ basename })` reads window.location, so the jsdom URL has to sit
    // under the basename for it to behave the way it does on a sub-path Grafana deployment.
    let adapted: ReturnType<typeof toHistoryRouterHistory>;

    beforeEach(() => {
      window.history.replaceState({}, '', '/grafana/dashboards');
      adapted = toHistoryRouterHistory(createBrowserHistory({ basename: '/grafana' }));
    });

    afterEach(() => {
      window.history.replaceState({}, '', '/');
    });

    it('strips the basename from the location react-router matches against', () => {
      expect(adapted.location.pathname).toBe('/dashboards');
    });

    it('adds the basename back when creating hrefs', () => {
      expect(adapted.createHref('/explore')).toBe('/grafana/explore');
      expect(adapted.createURL('/explore').pathname).toBe('/grafana/explore');
    });

    it('leaves pathnames untouched in encodeLocation so the basename never leaks into route matching', () => {
      expect(adapted.encodeLocation('/d/abc/my%20dashboard?x=1')).toEqual({
        pathname: '/d/abc/my%20dashboard',
        search: '?x=1',
        hash: '',
      });
    });
  });
});

describe('unstable_HistoryRouter driven by the adapter', () => {
  function setup(history = createMemoryHistory({ initialEntries: ['/first'] })) {
    function ShowLocation() {
      const location = useLocation();
      return <div data-testid="location">{`${location.pathname}${location.search}`}</div>;
    }

    function NavigateWithState() {
      const navigate = useNavigate();
      return <button onClick={() => navigate('/third', { state: { hello: 'world' } })}>navigate with state</button>;
    }

    render(
      <HistoryRouter history={toHistoryRouterHistory(history)}>
        <ShowLocation />
        <Routes>
          <Route
            path="/first"
            element={
              <>
                <Link to="/second?q=1">go to second</Link>
                <NavigateWithState />
              </>
            }
          />
          <Route path="/second" element={<div>second page</div>} />
          <Route path="/third" element={<div>third page</div>} />
        </Routes>
      </HistoryRouter>
    );

    return history;
  }

  it('renders the route matching the initial history location', () => {
    setup();
    expect(screen.getByTestId('location')).toHaveTextContent('/first');
  });

  it('navigates via <Link> and pushes onto the underlying history', async () => {
    const history = setup();

    await userEvent.click(screen.getByRole('link', { name: 'go to second' }));

    expect(screen.getByText('second page')).toBeInTheDocument();
    expect(history.location.pathname).toBe('/second');
    expect(history.location.search).toBe('?q=1');
    expect(history.action).toBe('PUSH');
  });

  it('passes navigation state through to the underlying history', async () => {
    const history = setup();

    await userEvent.click(screen.getByRole('button', { name: 'navigate with state' }));

    expect(screen.getByText('third page')).toBeInTheDocument();
    expect(history.location.state).toEqual({ hello: 'world' });
  });

  it('re-renders when the underlying history is navigated outside of react-router', () => {
    const history = setup();

    // This is how `locationService.push()` reaches the router - straight to history@4,
    // never through react-router's own navigate.
    act(() => {
      history.push('/second');
    });

    expect(screen.getByText('second page')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/second');
  });
});
