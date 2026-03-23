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
});
