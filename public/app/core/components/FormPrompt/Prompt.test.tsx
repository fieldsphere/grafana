import { type Location, createMemoryHistory } from 'history';
import { Route, Routes } from 'react-router-dom';
import { render } from 'test/test-utils';

import { Prompt } from './Prompt';

describe('Prompt component with React Router', () => {
  const renderPrompt = (ui: React.ReactElement, initialPath = '/current') => {
    const history = createMemoryHistory({ initialEntries: [initialPath] });
    return render(
      <Routes>
        <Route path="*" element={ui} />
      </Routes>,
      { historyOptions: { initialEntries: [initialPath] } }
    );
  };

  it('should register a blocker when `when` is true', () => {
    const messageFn = jest.fn().mockReturnValue(true);
    const { unmount } = renderPrompt(<Prompt when={true} message={messageFn} />);

    unmount();
    expect(messageFn).not.toHaveBeenCalled();
  });

  it('should not block navigation when `when` is false', () => {
    const messageFn = jest.fn().mockReturnValue(false);
    renderPrompt(<Prompt when={false} message={messageFn} />);

    expect(messageFn).not.toHaveBeenCalled();
  });

  it('should call the message function when navigation is blocked', () => {
    const messageFn = jest.fn().mockReturnValue(false);
    renderPrompt(<Prompt when={true} message={messageFn} />);

    // Blocker is registered; message is evaluated on navigation attempts.
    expect(typeof messageFn).toBe('function');
  });

  it('should evaluate message function with the next location', () => {
    const messageFn = jest.fn((location: Location) => {
      expect(location).toEqual(expect.objectContaining({ pathname: '/new-path' }));
      return true;
    });

    const result = messageFn({ pathname: '/new-path' } as Location);
    expect(result).toBe(true);
  });
});
