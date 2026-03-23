import { getCorrelationsBySourceUIDs, k8sCorrelationsURL } from './utils';

const mockBackendSrv = {
  get: jest.fn(),
};

const mockToEnrichedCorrelationDataFromK8s = jest.fn();

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  config: {
    ...jest.requireActual('@grafana/runtime').config,
    namespace: 'default',
    featureToggles: {
      ...jest.requireActual('@grafana/runtime').config.featureToggles,
      kubernetesCorrelations: true,
    },
  },
  getBackendSrv: () => mockBackendSrv,
}));

jest.mock('./useCorrelations', () => ({
  getData: jest.fn(),
  toEnrichedCorrelationsData: jest.fn(),
  toEnrichedCorrelationDataFromK8s: (item: unknown) => mockToEnrichedCorrelationDataFromK8s(item),
}));

describe('getCorrelationsBySourceUIDs', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockToEnrichedCorrelationDataFromK8s.mockImplementation((item: unknown) => {
      const correlation = item as { metadata?: { name?: string }; spec?: { source?: { name?: string } } };
      return {
        uid: correlation.metadata?.name ?? '',
        source: { uid: correlation.spec?.source?.name ?? '' },
        target: { uid: 'target-ds', name: 'Target DS' },
        type: 'query',
        label: correlation.metadata?.name ?? '',
        config: { field: 'traceId', target: {} },
        provisioned: false,
      };
    });
  });

  it('follows continue tokens when listing kubernetes correlations', async () => {
    mockBackendSrv.get
      .mockResolvedValueOnce({
        items: [
          { metadata: { name: 'corr-1' }, spec: { source: { name: 'source-a' } } },
          { metadata: { name: 'corr-2' }, spec: { source: { name: 'source-b' } } },
        ],
        metadata: { continue: 'next-page' },
      })
      .mockResolvedValueOnce({
        items: [{ metadata: { name: 'corr-3' }, spec: { source: { name: 'source-a' } } }],
        metadata: {},
      });

    const result = await getCorrelationsBySourceUIDs(['source-a']);

    expect(mockBackendSrv.get).toHaveBeenCalledTimes(2);
    expect(mockBackendSrv.get).toHaveBeenNthCalledWith(1, k8sCorrelationsURL(), { limit: 1000, continue: undefined });
    expect(mockBackendSrv.get).toHaveBeenNthCalledWith(2, k8sCorrelationsURL(), { limit: 1000, continue: 'next-page' });
    expect(result.correlations.map((correlation) => correlation.uid)).toEqual(['corr-1', 'corr-3']);
  });
});
