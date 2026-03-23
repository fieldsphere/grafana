import { lastValueFrom } from 'rxjs';

import { Correlation as CorrelationK8s } from '@grafana/api-clients/rtkq/correlations/v0alpha1';
import { DataFrame, DataLinkConfigOrigin } from '@grafana/data';
import { t } from '@grafana/i18n';
import {
  config,
  CorrelationData,
  CorrelationsData,
  createMonitoringLogger,
  getBackendSrv,
  getDataSourceSrv,
} from '@grafana/runtime';
import { ExploreItemState } from 'app/types/explore';

import { formatValueName } from '../explore/PrometheusListView/ItemLabels';
import { parseLogsFrame } from '../logs/logsFrame';

import { CreateCorrelationParams, CreateCorrelationResponse } from './types';
import { CorrelationsResponse, getData, toEnrichedCorrelationDataFromK8s, toEnrichedCorrelationsData } from './useCorrelations';

type DataFrameRefIdToDataSourceUid = Record<string, string>;

interface CorrelationK8sListResponse {
  items: CorrelationK8s[];
  metadata: {
    remainingItemCount?: number;
  };
}

export const k8sCorrelationsURL = () => `/apis/correlations.grafana.app/v0alpha1/namespaces/${config.namespace}/correlations`;

export const toK8sCorrelationPayload = (correlation: CreateCorrelationParams): CorrelationK8s => {
  const sourceDs = getDataSourceSrv().getInstanceSettings(correlation.sourceUID);
  if (!sourceDs) {
    throw new Error(`Source datasource ${correlation.sourceUID} was not found`);
  }

  const spec: CorrelationK8s['spec'] = {
    type: correlation.type,
    label: correlation.label,
    description: correlation.description,
    source: {
      group: sourceDs.type,
      name: sourceDs.uid,
    },
    config: {
      field: correlation.config.field,
      target: correlation.config.target ?? {},
      transformations: correlation.config.transformations?.map((transformation) => ({
        ...transformation,
        type: transformation.type === 'regex' ? 'regex' : 'logfmt',
      })),
    },
  };

  if (correlation.type === 'query') {
    const targetDs = getDataSourceSrv().getInstanceSettings(correlation.targetUID);
    if (!targetDs) {
      throw new Error(`Target datasource ${correlation.targetUID} was not found`);
    }
    spec.target = {
      group: targetDs.type,
      name: targetDs.uid,
    };
  }

  return {
    apiVersion: 'correlations.grafana.app/v0alpha1',
    kind: 'Correlation',
    metadata: {
      generateName: 'corr-',
    },
    spec,
  };
};

/**
 * Creates data links from provided CorrelationData object
 *
 * @param dataFrames list of data frames to be processed
 * @param correlations list of of possible correlations that can be applied
 * @param dataFrameRefIdToDataSourceUid a map that for provided refId references corresponding data source ui
 */
export const attachCorrelationsToDataFrames = (
  dataFrames: DataFrame[],
  correlations: CorrelationData[],
  dataFrameRefIdToDataSourceUid: DataFrameRefIdToDataSourceUid
): DataFrame[] => {
  dataFrames.forEach((dataFrame) => {
    const frameRefId = dataFrame.refId;
    if (!frameRefId) {
      return;
    }
    let dataSourceUid = dataFrameRefIdToDataSourceUid[frameRefId];

    // rawPrometheus queries append a value to refId to a separate dataframe for the table view
    if (dataSourceUid === undefined && dataFrame.meta?.preferredVisualisationType === 'rawPrometheus') {
      const formattedRefID = formatValueName(frameRefId);
      dataSourceUid = dataFrameRefIdToDataSourceUid[formattedRefID];
    }

    const sourceCorrelations = correlations.filter((correlation) => correlation.source.uid === dataSourceUid);
    decorateDataFrameWithInternalDataLinks(dataFrame, fixLokiDataplaneFields(sourceCorrelations, dataFrame));
  });

  return dataFrames;
};

const decorateDataFrameWithInternalDataLinks = (dataFrame: DataFrame, correlations: CorrelationData[]) => {
  dataFrame.fields.forEach((field) => {
    field.config.links = field.config.links?.filter((link) => link.origin !== DataLinkConfigOrigin.Correlations) || [];
    correlations.map((correlation) => {
      if (correlation.config.field === field.name) {
        if (correlation.type === 'query') {
          const targetQuery = correlation.config.target || {};
          field.config.links!.push({
            internal: {
              query: { ...targetQuery, datasource: { uid: correlation.target.uid } },
              datasourceUid: correlation.target.uid,
              datasourceName: correlation.target.name,
            },
            url: '',
            title: correlation.label || correlation.target.name,
            origin: DataLinkConfigOrigin.Correlations,
            meta: {
              transformations: correlation.config.transformations,
            },
          });
        } else if (correlation.type === 'external') {
          const externalTarget = correlation.config.target;
          field.config.links!.push({
            url: externalTarget.url,
            title: correlation.label || 'External URL',
            origin: DataLinkConfigOrigin.Correlations,
            meta: { transformations: correlation.config?.transformations },
          });
        }
      }
    });
  });
};

/*
If a correlation was made based on the log line field prior to the loki data plane, they would use the field "Line"

Change it to use whatever the body field name is post-loki data plane
*/
const fixLokiDataplaneFields = (correlations: CorrelationData[], dataFrame: DataFrame) => {
  return correlations.map((correlation) => {
    if (
      correlation.source.meta?.id === 'loki' &&
      config.featureToggles.lokiLogsDataplane === true &&
      correlation.config.field === 'Line'
    ) {
      const logsFrame = parseLogsFrame(dataFrame);
      if (logsFrame != null && logsFrame.bodyField.name !== undefined) {
        correlation.config.field = logsFrame?.bodyField.name;
      }
    }
    return correlation;
  });
};

export const getCorrelationsBySourceUIDs = async (sourceUIDs: string[]): Promise<CorrelationsData> => {
  if (config.featureToggles.kubernetesCorrelations) {
    const response = await getBackendSrv().get<CorrelationK8sListResponse>(k8sCorrelationsURL(), {
      limit: 1000,
    });
    const correlations = response.items
      .map(toEnrichedCorrelationDataFromK8s)
      .filter((correlation): correlation is CorrelationData => correlation !== undefined)
      .filter((correlation) => sourceUIDs.includes(correlation.source.uid));

    return {
      correlations,
      page: 1,
      limit: correlations.length || 1000,
      totalCount: correlations.length,
    };
  }

  return lastValueFrom(
    getBackendSrv().fetch<CorrelationsResponse>({
      url: `/api/datasources/correlations`,
      method: 'GET',
      showErrorAlert: false,
      params: {
        sourceUID: sourceUIDs,
      },
    })
  )
    .then(getData)
    .then(toEnrichedCorrelationsData);
};

export const createCorrelation = async (
  sourceUID: string,
  correlation: CreateCorrelationParams
): Promise<CreateCorrelationResponse> => {
  if (config.featureToggles.kubernetesCorrelations) {
    const created = await getBackendSrv().post<CorrelationK8s>(k8sCorrelationsURL(), toK8sCorrelationPayload(correlation));
    return {
      message: t('correlations.message.created', 'Correlation created'),
      result: {
        ...correlation,
        sourceUID,
        uid: created.metadata.name ?? '',
        provisioned: false,
      },
    };
  }

  return getBackendSrv().post<CreateCorrelationResponse>(`/api/datasources/uid/${sourceUID}/correlations`, correlation);
};

const getDSInstanceForPane = async (pane: ExploreItemState) => {
  if (pane.datasourceInstance?.meta.mixed) {
    return await getDataSourceSrv().get(pane.queries[0].datasource);
  } else {
    return pane.datasourceInstance;
  }
};

export const generateDefaultLabel = async (sourcePane: ExploreItemState, targetPane: ExploreItemState) => {
  return Promise.all([getDSInstanceForPane(sourcePane), getDSInstanceForPane(targetPane)]).then((dsInstances) => {
    return dsInstances[0]?.name !== undefined && dsInstances[1]?.name !== undefined
      ? `${dsInstances[0]?.name} to ${dsInstances[1]?.name}`
      : '';
  });
};

export const correlationsLogger = createMonitoringLogger('features.correlations');
