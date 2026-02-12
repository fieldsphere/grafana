import { useRegisterActions } from 'kbar';
import { useEffect, useMemo, useState } from 'react';

import { createMonitoringLogger } from '@grafana/runtime';
import { CommandPaletteAction } from '../types';

import { getRecentDashboardActions } from './dashboardActions';
import { useStaticActions } from './staticActions';
import useExtensionActions from './useExtensionActions';

const logger = createMonitoringLogger('features.command-palette.actions');

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
        if (err instanceof Error) {
          logger.logError(err, { operation: 'useRegisterRecentDashboardsActions' });
          return;
        }
        logger.logWarning('Error loading recent dashboard actions', {
          operation: 'useRegisterRecentDashboardsActions',
          error: String(err),
        });
      });
  }, []);

  useRegisterActions(recentDashboardActions, [recentDashboardActions]);
}
