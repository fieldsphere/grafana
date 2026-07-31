import type * as H from 'history';
import { useEffect } from 'react';

import { locationService } from '@grafana/runtime';

interface PromptProps {
  when?: boolean;
  message: string | ((location: H.Location) => string | boolean);
}

// react-router-dom v6's `useBlocker` only works with a data router (one created via
// `createBrowserRouter`/`createMemoryRouter`), but the app uses `unstable_HistoryRouter` so
// `locationService`'s history@4 instance stays the single source of truth for navigation (see
// historyRouterAdapter.ts). `history.block` still works here because navigations triggered through
// react-router (via `<Link>`, `useNavigate`, etc.) go through that same underlying history instance.
export const Prompt = ({ message, when = true }: PromptProps) => {
  const history = locationService.getHistory();

  useEffect(() => {
    if (!when) {
      return undefined;
    }
    //@ts-expect-error TODO Update the history package to fix types
    const unblock = history.block(message);

    return () => {
      unblock();
    };
  }, [when, message, history]);

  return null;
};
