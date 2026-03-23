import { AnnotationEvent, DataFrame, toDataFrame } from '@grafana/data';
import { config, getBackendSrv } from '@grafana/runtime';
import { StateHistoryItem } from 'app/types/unified-alerting';

import { AnnotationTagsResponse } from './types';

export interface AnnotationServer {
  query(params: Record<string, unknown>, requestId: string): Promise<DataFrame>;
  forAlert(alertUID: string): Promise<StateHistoryItem[]>;
  save(annotation: AnnotationEvent): Promise<AnnotationEvent>;
  update(annotation: AnnotationEvent): Promise<unknown>;
  delete(annotation: AnnotationEvent): Promise<unknown>;
  tags(): Promise<Array<{ term: string; count: number }>>;
}

interface AnnotationResource {
  metadata: {
    name?: string;
  };
  spec: {
    dashboardUID?: string;
    panelID?: number;
    tags?: string[];
    text: string;
    time: number;
    timeEnd?: number;
  };
}

interface AnnotationListResponse {
  items: AnnotationResource[];
  metadata?: {
    continue?: string;
  };
}

interface KubernetesAnnotationTagsResponse {
  tags: Array<{
    tag: string;
    count: number;
  }>;
}

const annotationAPIBaseURL = () => `/apis/annotation.grafana.app/v0alpha1/namespaces/${config.namespace}`;

const annotationNameFromID = (id: AnnotationEvent['id']) => {
  if (id === undefined || id === null) {
    throw new Error('annotation id is required');
  }
  const raw = String(id);
  return raw.startsWith('a-') ? raw : `a-${raw}`;
};

const annotationIDFromName = (name?: string): number | string | undefined => {
  if (!name) {
    return undefined;
  }

  if (name.startsWith('a-')) {
    const parsed = Number.parseInt(name.slice(2), 10);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return name;
};

const annotationEventToSpec = (annotation: AnnotationEvent) => ({
  dashboardUID: annotation.dashboardUID,
  panelID: annotation.panelId,
  tags: annotation.tags ?? [],
  text: annotation.text ?? '',
  time: annotation.time ?? 0,
  timeEnd: annotation.timeEnd ?? 0,
});

const annotationResourceToEvent = (resource: AnnotationResource): AnnotationEvent => ({
  id: annotationIDFromName(resource.metadata.name),
  dashboardUID: resource.spec.dashboardUID,
  panelId: resource.spec.panelID,
  tags: resource.spec.tags ?? [],
  text: resource.spec.text,
  time: resource.spec.time,
  timeEnd: resource.spec.timeEnd ?? 0,
  isRegion: (resource.spec.timeEnd ?? 0) > 0,
});

const asNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
};

const asStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === 'string');
};

const annotationMatchesQuery = (annotation: AnnotationEvent, params: Record<string, unknown>) => {
  const from = asNumber(params.from);
  const to = asNumber(params.to);
  const panelId = asNumber(params.panelId);
  const dashboardUID = typeof params.dashboardUID === 'string' ? params.dashboardUID : undefined;
  const tags = asStringArray(params.tags);
  const matchAny = Boolean(params.matchAny);

  const annotationStart = annotation.time ?? 0;
  const annotationEnd = annotation.timeEnd && annotation.timeEnd > 0 ? annotation.timeEnd : annotationStart;
  if (from !== undefined && annotationEnd < from) {
    return false;
  }
  if (to !== undefined && annotationStart > to) {
    return false;
  }
  if (panelId !== undefined && annotation.panelId !== panelId) {
    return false;
  }
  if (dashboardUID !== undefined && annotation.dashboardUID !== dashboardUID) {
    return false;
  }
  if (tags.length > 0) {
    const annotationTags = annotation.tags ?? [];
    if (matchAny) {
      if (!tags.some((tag) => annotationTags.includes(tag))) {
        return false;
      }
    } else if (!tags.every((tag) => annotationTags.includes(tag))) {
      return false;
    }
  }

  return true;
};

class LegacyAnnotationServer implements AnnotationServer {
  query(params: unknown, requestId: string): Promise<DataFrame> {
    return getBackendSrv()
      .get('/api/annotations', params, requestId)
      .then((v) => toDataFrame(v));
  }

  forAlert(alertUID: string) {
    return getBackendSrv().get('/api/annotations', {
      alertUID,
    });
  }

  save(annotation: AnnotationEvent) {
    return getBackendSrv().post('/api/annotations', annotation);
  }

  update(annotation: AnnotationEvent) {
    return getBackendSrv().put(`/api/annotations/${annotation.id}`, annotation);
  }

  delete(annotation: AnnotationEvent) {
    return getBackendSrv().delete(`/api/annotations/${annotation.id}`);
  }

  async tags() {
    const response = await getBackendSrv().get<AnnotationTagsResponse>('/api/annotations/tags?limit=1000');
    return response.result.tags.map(({ tag, count }) => ({
      term: tag,
      count,
    }));
  }
}

class KubernetesAnnotationServer implements AnnotationServer {
  private legacy = new LegacyAnnotationServer();

  async query(rawParams: Record<string, unknown>, requestId: string): Promise<DataFrame> {
    const params = rawParams ?? {};
    const limit = asNumber(params.limit) ?? 1000;

    const items: AnnotationResource[] = [];
    let continueToken: string | undefined;

    do {
      const response = await getBackendSrv().get<AnnotationListResponse>(
        `${annotationAPIBaseURL()}/annotations`,
        {
          limit: 500,
          continue: continueToken,
        },
        requestId
      );
      items.push(...(response.items ?? []));
      continueToken = response.metadata?.continue;
    } while (continueToken && items.length < 5000);

    const filtered = items
      .map(annotationResourceToEvent)
      .filter((annotation) => annotationMatchesQuery(annotation, params))
      .slice(0, limit);

    return toDataFrame(filtered);
  }

  // Alert state history still relies on legacy fields that are not in the new API spec.
  forAlert(alertUID: string): Promise<StateHistoryItem[]> {
    return this.legacy.forAlert(alertUID);
  }

  async save(annotation: AnnotationEvent): Promise<AnnotationEvent> {
    const response = await getBackendSrv().post<AnnotationResource>(`${annotationAPIBaseURL()}/annotations`, {
      apiVersion: 'annotation.grafana.app/v0alpha1',
      kind: 'Annotation',
      metadata: {
        generateName: 'a-',
      },
      spec: annotationEventToSpec(annotation),
    });
    return annotationResourceToEvent(response);
  }

  async update(annotation: AnnotationEvent): Promise<AnnotationEvent> {
    const name = annotationNameFromID(annotation.id);
    await getBackendSrv().patch(`${annotationAPIBaseURL()}/annotations/${name}`, {
      spec: annotationEventToSpec(annotation),
    });
    const response = await getBackendSrv().get<AnnotationResource>(`${annotationAPIBaseURL()}/annotations/${name}`);
    return annotationResourceToEvent(response);
  }

  delete(annotation: AnnotationEvent): Promise<unknown> {
    const name = annotationNameFromID(annotation.id);
    return getBackendSrv().delete(`${annotationAPIBaseURL()}/annotations/${name}`);
  }

  async tags() {
    const response = await getBackendSrv().get<KubernetesAnnotationTagsResponse>(`${annotationAPIBaseURL()}/tags`);
    return response.tags.map(({ tag, count }) => ({
      term: tag,
      count,
    }));
  }
}

let instance: AnnotationServer | null = null;

export function annotationServer(): AnnotationServer {
  if (!instance) {
    instance = config.featureToggles.kubernetesAnnotations ? new KubernetesAnnotationServer() : new LegacyAnnotationServer();
  }
  return instance;
}
