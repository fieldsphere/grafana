import { type Location } from 'history';
import { Link, Route, Routes } from 'react-router-dom';
import { render, screen } from 'test/test-utils';

import { Prompt } from './Prompt';

interface SetupOptions {
  when?: boolean;
  message: string | ((location: Location) => string | boolean);
}

// Rendered through the real router/locationService rather than a mocked history, so these tests
// actually prove that `history.block` still intercepts react-router navigation now that the app
// runs on a native react-router v6 router (see the comment in Prompt.tsx).
function setup({ when = true, message }: SetupOptions) {
  return render(
    <Routes>
      <Route
        path="/form"
        element={
          <>
            <Prompt when={when} message={message} />
            <Link to="/other">leave</Link>
          </>
        }
      />
      <Route path="/other" element={<div>other page</div>} />
    </Routes>,
    {
      historyOptions: {
        initialEntries: ['/form'],
        // createBrowserHistory (what the app runs on) defaults to window.confirm; memory history
        // has no default at all, so wire up the equivalent to exercise string prompt messages.
        getUserConfirmation: (message, callback) => callback(window.confirm(message)),
      },
    }
  );
}

describe('Prompt', () => {
  it('blocks navigation when the message callback returns false', async () => {
    const { user } = setup({ message: () => false });

    await user.click(screen.getByRole('link', { name: 'leave' }));

    expect(screen.queryByText('other page')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'leave' })).toBeInTheDocument();
  });

  it('allows navigation when the message callback returns true', async () => {
    const { user } = setup({ message: () => true });

    await user.click(screen.getByRole('link', { name: 'leave' }));

    expect(await screen.findByText('other page')).toBeInTheDocument();
  });

  it('does not block at all when `when` is false', async () => {
    const { user } = setup({ when: false, message: () => false });

    await user.click(screen.getByRole('link', { name: 'leave' }));

    expect(await screen.findByText('other page')).toBeInTheDocument();
  });

  it('passes the attempted location to the message callback', async () => {
    const message = jest.fn().mockReturnValue(false);
    const { user } = setup({ message });

    await user.click(screen.getByRole('link', { name: 'leave' }));

    expect(message).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/other' }), 'PUSH');
  });

  it('asks the user to confirm when the message is a string', async () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);
    const { user } = setup({ message: 'Are you sure you want to leave?' });

    await user.click(screen.getByRole('link', { name: 'leave' }));

    expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to leave?');
    expect(screen.queryByText('other page')).not.toBeInTheDocument();

    confirmSpy.mockRestore();
  });

  it('stops blocking once unmounted', async () => {
    const { user, unmount } = setup({ message: () => false });

    await user.click(screen.getByRole('link', { name: 'leave' }));
    expect(screen.queryByText('other page')).not.toBeInTheDocument();

    unmount();

    const { user: nextUser } = setup({ when: false, message: () => false });
    await nextUser.click(screen.getByRole('link', { name: 'leave' }));
    expect(await screen.findByText('other page')).toBeInTheDocument();
  });
});
