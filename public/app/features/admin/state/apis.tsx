import { getBackendSrv } from '@grafana/runtime';
import { structuredLogger } from 'app/core/utils/structuredLogging';

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

export const getServerStats = async (): Promise<ServerStat | null> => {
  return getBackendSrv()
    .get('api/admin/stats')
    .catch((err) => {
      structuredLogger.error(err);
      return null;
    });
};
