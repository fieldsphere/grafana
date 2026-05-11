import { useRegisterActions } from 'kbar';
import { useEffect, useMemo, useState } from 'react';

import { type CommandPaletteAction } from '../types';

import { getRecentDashboardActions } from './dashboardActions';
import { useStaticActions } from './staticActions';
import useExtensionActions from './useExtensionActions';

import { grafanaStructuredLogger } from '@grafana/runtime';
/**
 * Register navigation actions to different parts of grafana or some preferences stuff like themes.
 */
export function useRegisterStaticActions() {
  const extensionActions = useExtensionActions();
  const staticActions = useStaticActions();

  const navTreeActions = useMemo(() => {
    return [...staticActions, ...extensionActions];
  }, [staticActions, extensionActions]);

  useRegisterActions(navTreeActions, [navTreeActions]);
}

export function useRegisterRecentDashboardsActions() {
  const [recentDashboardActions, setRecentDashboardActions] = useState<CommandPaletteAction[]>([]);
  useEffect(() => {
    getRecentDashboardActions()
      .then((recentDashboardActions) => setRecentDashboardActions(recentDashboardActions))
      .catch((err) => {
        grafanaStructuredLogger.logError(err instanceof Error ? err : new Error(String(err)), { message: String('Error loading recent dashboard actions') });
      });
  }, []);

  useRegisterActions(recentDashboardActions, [recentDashboardActions]);
}
