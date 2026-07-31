import { Link, Route, Routes } from 'react-router-dom';
import { render, screen } from 'test/test-utils';

import { FormPrompt, type Props } from './FormPrompt';

// Exercises the whole unsaved-changes flow against the real router rather than a mocked history,
// so it covers the interaction between `history.block` (in Prompt) and the `<Navigate>` that
// FormPrompt renders once the user discards - the part most at risk from the react-router v6 move.
function setup(props: Partial<Props> = {}) {
  const onDiscard = jest.fn();

  const result = render(
    <Routes>
      <Route
        path="/form"
        element={
          <>
            <FormPrompt confirmRedirect onDiscard={onDiscard} {...props} />
            <Link to="/other">leave</Link>
            <Link to="/form?tab=second">change params</Link>
          </>
        }
      />
      <Route path="/other" element={<div>other page</div>} />
    </Routes>,
    { historyOptions: { initialEntries: ['/form'] } }
  );

  return { ...result, onDiscard };
}

const modalTitle = /leave page\?/i;

describe('FormPrompt', () => {
  beforeEach(() => {
    // FormPrompt compares the attempted route against `window.location.pathname` to detect
    // params-only changes. Tests run on a memory history, which never touches window.location,
    // so point jsdom at the starting route to match how the browser behaves.
    window.history.replaceState({}, '', '/form');
  });

  afterEach(() => {
    window.history.replaceState({}, '', '/');
  });

  it('lets the user navigate away when there is nothing to confirm', async () => {
    const { user } = setup({ confirmRedirect: false });

    await user.click(screen.getByRole('link', { name: 'leave' }));

    expect(await screen.findByText('other page')).toBeInTheDocument();
    expect(screen.queryByText(modalTitle)).not.toBeInTheDocument();
  });

  it('blocks navigation and opens the unsaved changes modal when the form is dirty', async () => {
    const { user } = setup();

    await user.click(screen.getByRole('link', { name: 'leave' }));

    expect(await screen.findByText(modalTitle)).toBeInTheDocument();
    expect(screen.queryByText('other page')).not.toBeInTheDocument();
  });

  it('stays on the form when the user chooses to continue editing', async () => {
    const { user, onDiscard } = setup();

    await user.click(screen.getByRole('link', { name: 'leave' }));
    await user.click(await screen.findByRole('button', { name: /continue editing/i }));

    expect(screen.queryByText(modalTitle)).not.toBeInTheDocument();
    expect(screen.queryByText('other page')).not.toBeInTheDocument();
    expect(onDiscard).not.toHaveBeenCalled();
  });

  it('navigates to the blocked location after discarding changes', async () => {
    const { user, onDiscard } = setup();

    await user.click(screen.getByRole('link', { name: 'leave' }));
    await user.click(await screen.findByRole('button', { name: /discard unsaved changes/i }));

    expect(onDiscard).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('other page')).toBeInTheDocument();
  });

  it('does not prompt when only the query params change', async () => {
    const { user } = setup();

    await user.click(screen.getByRole('link', { name: 'change params' }));

    expect(screen.queryByText(modalTitle)).not.toBeInTheDocument();
  });

  it('lets onLocationChange opt out of blocking for a specific destination', async () => {
    const onLocationChange = jest.fn().mockReturnValue(false);
    const { user, onDiscard } = setup({ onLocationChange });

    await user.click(screen.getByRole('link', { name: 'leave' }));

    expect(onLocationChange).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/other' }));
    expect(await screen.findByText('other page')).toBeInTheDocument();
    expect(onDiscard).not.toHaveBeenCalled();
  });
});
