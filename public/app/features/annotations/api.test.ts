import { AnnotationEvent } from '@grafana/data';

const mockBackendSrv = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
};

const mockConfig = {
  namespace: 'default',
  featureToggles: {
    kubernetesAnnotations: false,
  },
};

jest.mock('@grafana/runtime', () => ({
  config: mockConfig,
  getBackendSrv: () => mockBackendSrv,
}));

describe('annotationServer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('uses legacy save endpoint when kubernetes annotations is disabled', async () => {
    mockConfig.featureToggles.kubernetesAnnotations = false;
    mockBackendSrv.post.mockResolvedValue({});

    const { annotationServer } = await import('./api');
    const annotation = { text: 'legacy', time: 1 } as AnnotationEvent;
    await annotationServer().save(annotation);

    expect(mockBackendSrv.post).toHaveBeenCalledWith('/api/annotations', annotation);
  });

  it('uses kubernetes save endpoint when kubernetes annotations is enabled', async () => {
    mockConfig.featureToggles.kubernetesAnnotations = true;
    mockBackendSrv.post.mockResolvedValue({
      metadata: { name: 'a-42' },
      spec: { text: 'k8s', time: 10, timeEnd: 0, tags: ['ops'] },
    });

    const { annotationServer } = await import('./api');
    await annotationServer().save({ text: 'k8s', time: 10 } as AnnotationEvent);

    expect(mockBackendSrv.post).toHaveBeenCalledWith(
      '/apis/annotation.grafana.app/v0alpha1/namespaces/default/annotations',
      expect.objectContaining({
        apiVersion: 'annotation.grafana.app/v0alpha1',
        kind: 'Annotation',
      })
    );
  });

  it('uses kubernetes delete endpoint and id translation when enabled', async () => {
    mockConfig.featureToggles.kubernetesAnnotations = true;
    mockBackendSrv.delete.mockResolvedValue({});

    const { annotationServer } = await import('./api');
    await annotationServer().delete({ id: 99 } as AnnotationEvent);

    expect(mockBackendSrv.delete).toHaveBeenCalledWith(
      '/apis/annotation.grafana.app/v0alpha1/namespaces/default/annotations/a-99'
    );
  });

  it('uses field selectors for kubernetes annotation queries', async () => {
    mockConfig.featureToggles.kubernetesAnnotations = true;
    mockBackendSrv.get.mockResolvedValue({
      items: [
        {
          metadata: { name: 'a-42' },
          spec: { dashboardUID: 'dash-1', panelID: 7, text: 'query result', time: 20, timeEnd: 30, tags: ['ops'] },
        },
      ],
      metadata: { continue: 'next-page' },
    });

    const { annotationServer } = await import('./api');
    await annotationServer().query({ dashboardUID: 'dash-1', panelId: 7, from: 10, to: 40, limit: 1 }, 'query-1');

    expect(mockBackendSrv.get).toHaveBeenCalledTimes(1);
    expect(mockBackendSrv.get).toHaveBeenCalledWith(
      '/apis/annotation.grafana.app/v0alpha1/namespaces/default/annotations',
      expect.objectContaining({
        limit: 500,
        continue: undefined,
        fieldSelector: 'spec.dashboardUID=dash-1,spec.panelID=7,spec.time=10,spec.timeEnd=40',
      }),
      'query-1'
    );
  });
});
