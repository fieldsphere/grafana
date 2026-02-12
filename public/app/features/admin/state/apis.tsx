import { createMonitoringLogger, getBackendSrv } from '@grafana/runtime';

interface AnonServerStat {
  activeDevices?: number;
}

export interface ServerStat extends AnonServerStat {
  activeAdmins: number;
  activeEditors: number;
  activeSessions: number;
  activeUsers: number;
  activeViewers: number;
  admins: number;
  alerts: number;
  dashboards: number;
  datasources: number;
  editors: number;
  orgs: number;
  playlists: number;
  snapshots: number;
  stars: number;
  tags: number;
  users: number;
  viewers: number;
}

const logger = createMonitoringLogger('features.admin.state-apis');

export const getServerStats = async (): Promise<ServerStat | null> => {
  return getBackendSrv()
    .get('api/admin/stats')
    .catch((err) => {
      if (err instanceof Error) {
        logger.logError(err, { operation: 'getServerStats' });
      } else {
        logger.logWarning('Failed to get server stats', { operation: 'getServerStats', error: String(err) });
      }
      return null;
    });
};
