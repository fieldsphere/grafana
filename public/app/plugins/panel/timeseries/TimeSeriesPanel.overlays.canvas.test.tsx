import { TimeSeriesOverlayType } from './panelcfg.gen';
import { type CanvasCase, fixedBlue, renderCanvasCase, setupCanvasCapture, withFieldConfig } from './TimeSeriesPanel.canvasTestUtils';

jest.mock('@grafana/ui/src/utils/measureText', () =>
  require('@grafana/test-utils/canvas').createGrafanaUiMeasureTextJestMock(() =>
    require('./TimeSeriesPanel.canvasTestUtils').getUPlotInstance()
  )
);

describe('TimeSeriesPanel (canvas) — series overlays', () => {
  setupCanvasCapture();

  it.each<CanvasCase>([
    {
      name: 'overlay: moving average',
      options: { overlay: { enabled: true, type: TimeSeriesOverlayType.MovingAverage, windowSize: 3 } },
      panelProps: withFieldConfig({ defaults: fixedBlue }),
    },
    {
      name: 'overlay: linear regression',
      options: { overlay: { enabled: true, type: TimeSeriesOverlayType.LinearRegression } },
      panelProps: withFieldConfig({ defaults: fixedBlue }),
    },
  ])('$name', (testCase) => renderCanvasCase(testCase));
});
