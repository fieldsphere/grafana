import { handleRequestError } from '@grafana/api-clients';
import { useListCorrelationQuery } from '@grafana/api-clients/rtkq/correlations/v0alpha1';
import { CorrelationData } from '@grafana/runtime';

import { toEnrichedCorrelationDataFromK8s } from './useCorrelations';

// we're faking traditional pagination here, realistically folks shouldnt have enough correlations to see a performance impact but if they do we can change the ui
export const useCorrelationsK8s = (limit = 100, page: number) => {
  let pagedLimit = limit;
  if (page > 1) {
    pagedLimit = limit * page;
  }

  const { currentData, isLoading, error } = useListCorrelationQuery({ limit: pagedLimit });
  const startIdx = limit * (page - 1);
  const pagedData = currentData?.items.slice(startIdx, startIdx + limit) ?? [];

  const enrichedCorrelations =
    currentData !== undefined
      ? pagedData
          .filter((i) => i.metadata.name !== undefined)
          .map((item) => toEnrichedCorrelationDataFromK8s(item))
          .filter((i) => i !== undefined)
      : [];

  const fmtedError = error ? handleRequestError(error) : undefined;

  return {
    currentData: enrichedCorrelations,
    isLoading,
    error: fmtedError,
    remainingItems: currentData?.metadata.remainingItemCount || 0,
    doesContinue: currentData?.metadata.continue !== undefined,
  };
};
