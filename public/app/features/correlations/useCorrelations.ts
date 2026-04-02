import { useAsyncFn } from 'react-use';
import { lastValueFrom } from 'rxjs';

import { Correlation as CorrelationK8s } from '@grafana/api-clients/rtkq/correlations/v0alpha1';
import { SupportedTransformationType } from '@grafana/data';
import { config, getDataSourceSrv, FetchResponse, CorrelationData, CorrelationsData } from '@grafana/runtime';
import { useGrafana } from 'app/core/context/GrafanaContext';

import {
  Correlation,
  CreateCorrelationParams,
  CreateCorrelationResponse,
  GetCorrelationsParams,
  RemoveCorrelationParams,
  RemoveCorrelationResponse,
  UpdateCorrelationParams,
  UpdateCorrelationResponse,
} from './types';
import { correlationsLogger, k8sCorrelationsURL, toK8sCorrelationPayload } from './utils';

export interface CorrelationsResponse {
  correlations: Correlation[];
  page: number;
  limit: number;
  totalCount: number;
}

export const toEnrichedCorrelationData = ({ sourceUID, ...correlation }: Correlation): CorrelationData | undefined => {
  const sourceDatasource = getDataSourceSrv().getInstanceSettings(sourceUID);
  const targetDatasource =
    correlation.type === 'query' ? getDataSourceSrv().getInstanceSettings(correlation.targetUID) : undefined;

  // According to #72258 we will remove logic to handle orgId=0/null as global correlations.
  // This logging is to check if there are any customers who did not migrate existing correlations.
  // See Deprecation Notice in https://github.com/grafana/grafana/pull/72258 for more details
  if (correlation?.orgId === undefined || correlation?.orgId === null || correlation?.orgId === 0) {
    correlationsLogger.logWarning('Invalid correlation config: Missing org id.');
  }

  if (
    sourceDatasource &&
    sourceDatasource?.uid !== undefined &&
    targetDatasource?.uid !== undefined &&
    correlation.type === 'query'
  ) {
    return {
      ...correlation,
      source: sourceDatasource,
      target: targetDatasource,
    };
  }

  if (
    sourceDatasource &&
    sourceDatasource?.uid !== undefined &&
    targetDatasource?.uid === undefined &&
    correlation.type === 'external'
  ) {
    return {
      ...correlation,
      source: sourceDatasource,
    };
  }

  correlationsLogger.logWarning(`Invalid correlation config: Missing source or target.`, {
    source: JSON.stringify(sourceDatasource),
    target: JSON.stringify(targetDatasource),
  });
  return undefined;
};

export const toEnrichedCorrelationDataFromK8s = (item: CorrelationK8s): CorrelationData | undefined => {
  const dsSrv = getDataSourceSrv();
  const sourceDS = dsSrv.getInstanceSettings({ type: item.spec.source.group, uid: item.spec.source.name });
  if (sourceDS === undefined || sourceDS.uid === undefined) {
    return undefined;
  }

  const transformations = item.spec.config.transformations?.map((transformation) => ({
    ...transformation,
    type: transformation.type === 'regex' ? SupportedTransformationType.Regex : SupportedTransformationType.Logfmt,
  }));

  if (item.spec.type === 'external') {
    return toEnrichedCorrelationData({
      uid: item.metadata.name ?? '',
      sourceUID: sourceDS.uid,
      label: item.spec.label,
      description: item.spec.description,
      type: 'external',
      config: {
        field: item.spec.config.field,
        target: { url: item.spec.config?.target?.url ?? '' },
        transformations,
      },
      provisioned: false,
    });
  }

  const targetDS = dsSrv.getInstanceSettings({ type: item.spec.target?.group, uid: item.spec.target?.name });
  if (targetDS === undefined || targetDS.uid === undefined) {
    return undefined;
  }

  return toEnrichedCorrelationData({
    uid: item.metadata.name ?? '',
    sourceUID: sourceDS.uid,
    targetUID: targetDS.uid,
    label: item.spec.label,
    description: item.spec.description,
    type: 'query',
    config: {
      field: item.spec.config.field,
      target: item.spec.config.target ?? {},
      transformations,
    },
    provisioned: false,
  });
};

const validSourceFilter = (correlation: CorrelationData | undefined): correlation is CorrelationData => !!correlation;

export const toEnrichedCorrelationsData = (correlationsResponse: CorrelationsResponse): CorrelationsData => {
  return {
    ...correlationsResponse,
    correlations: correlationsResponse.correlations.map(toEnrichedCorrelationData).filter(validSourceFilter),
  };
};

export function getData<T>(response: FetchResponse<T>) {
  return response.data;
}

const transformCorrelationPayload = (correlation: Pick<Correlation, 'config'>) => ({
  field: correlation.config.field,
  target: correlation.config.target ?? {},
  transformations: correlation.config.transformations?.map((transformation) => ({
    ...transformation,
    type: transformation.type === 'regex' ? 'regex' : 'logfmt',
  })),
});

const toK8sCorrelationPatch = (correlation: UpdateCorrelationParams) => ({
  spec: {
    type: correlation.type,
    label: correlation.label,
    description: correlation.description,
    config: transformCorrelationPayload(correlation),
  },
});

/**
 * hook for managing correlations data.
 * TODO: ideally this hook shouldn't have any side effect like showing notifications on error
 * and let consumers handle them. It works nicely with the correlations settings page, but when we'll
 * expose this we'll have to remove those side effects.
 */
export const useCorrelations = () => {
  const { backend } = useGrafana();

  const [getInfo, get] = useAsyncFn<(params: GetCorrelationsParams) => Promise<CorrelationsData>>(
    async (params) => {
      return lastValueFrom(
        backend.fetch<CorrelationsResponse>({
          url: '/api/datasources/correlations',
          params: { page: params.page },
          method: 'GET',
          showErrorAlert: false,
        })
      )
        .then(getData)
        .then(toEnrichedCorrelationsData);
    },

    [backend]
  );

  const [createInfo, create] = useAsyncFn<(params: CreateCorrelationParams) => Promise<CorrelationData>>(
    async ({ sourceUID, ...correlation }) => {
      if (config.featureToggles.kubernetesCorrelations) {
        const created = await backend.post<CorrelationK8s>(
          k8sCorrelationsURL(),
          toK8sCorrelationPayload({ sourceUID, ...correlation })
        );
        const enrichedCorrelation = toEnrichedCorrelationDataFromK8s(created);
        if (enrichedCorrelation !== undefined) {
          return enrichedCorrelation;
        }
        throw new Error('invalid sourceUID');
      }

      return backend
        .post<CreateCorrelationResponse>(`/api/datasources/uid/${sourceUID}/correlations`, correlation)
        .then((response) => {
          const enrichedCorrelation = toEnrichedCorrelationData(response.result);
          if (enrichedCorrelation !== undefined) {
            return enrichedCorrelation;
          } else {
            throw new Error('invalid sourceUID');
          }
        });
    },
    [backend]
  );

  const [removeInfo, remove] = useAsyncFn<(params: RemoveCorrelationParams) => Promise<{ message: string }>>(
    ({ sourceUID, uid }) => {
      if (config.featureToggles.kubernetesCorrelations) {
        return backend.delete<{ message: string }>(`${k8sCorrelationsURL()}/${uid}`);
      }
      return backend.delete<RemoveCorrelationResponse>(`/api/datasources/uid/${sourceUID}/correlations/${uid}`);
    },
    [backend]
  );

  const [updateInfo, update] = useAsyncFn<(params: UpdateCorrelationParams) => Promise<CorrelationData>>(
    async ({ sourceUID, uid, ...correlation }) => {
      if (config.featureToggles.kubernetesCorrelations) {
        await backend.patch<CorrelationK8s>(`${k8sCorrelationsURL()}/${uid}`, toK8sCorrelationPatch(correlation));
        const resource = await backend.get<CorrelationK8s>(`${k8sCorrelationsURL()}/${uid}`);
        const enrichedCorrelation = toEnrichedCorrelationDataFromK8s(resource);
        if (enrichedCorrelation !== undefined) {
          return enrichedCorrelation;
        }
        throw new Error('invalid sourceUID');
      }

      return backend
        .patch<UpdateCorrelationResponse>(`/api/datasources/uid/${sourceUID}/correlations/${uid}`, correlation)
        .then((response) => {
          const enrichedCorrelation = toEnrichedCorrelationData(response.result);
          if (enrichedCorrelation !== undefined) {
            return enrichedCorrelation;
          } else {
            throw new Error('invalid sourceUID');
          }
        });
    },
    [backend]
  );

  return {
    create: {
      execute: create,
      ...createInfo,
    },
    update: {
      execute: update,
      ...updateInfo,
    },
    get: {
      execute: get,
      ...getInfo,
    },
    remove: {
      execute: remove,
      ...removeInfo,
    },
  };
};
