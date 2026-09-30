import { VizPanel } from '@grafana/scenes';
import { isK8sLibraryPanelsClientEnabled, libraryPanelsK8sClient } from 'app/api/clients/dashboard/v0alpha1/libraryPanels';
import { LibraryPanelBehavior } from 'app/features/dashboard-scene/scene/LibraryPanelBehavior';
import { AutoGridItem } from 'app/features/dashboard-scene/scene/layout-auto-grid/AutoGridItem';
import { vizPanelToPanel } from 'app/features/dashboard-scene/serialization/transformSceneToSaveModel';

import { LibraryElementKind } from '../types';

import { addLibraryPanel, libraryVizPanelToSaveModel } from './api';

const mockPost = jest.fn().mockResolvedValue({ result: {} });
jest.mock('../../../core/services/backend_srv', () => ({
  getBackendSrv: () => ({ post: mockPost }),
}));

jest.mock('app/api/clients/dashboard/v0alpha1/libraryPanels', () => ({
  isK8sLibraryPanelsClientEnabled: jest.fn(),
  libraryPanelsK8sClient: {
    create: jest.fn(),
  },
}));

const mockIsK8sLibraryPanelsClientEnabled = jest.mocked(isK8sLibraryPanelsClientEnabled);
const mockK8sCreate = jest.mocked(libraryPanelsK8sClient.create);

describe('addLibraryPanel', () => {
  const panelSaveModel = {
    libraryPanel: { name: 'My Panel', uid: 'original-uid' },
    type: 'timeseries',
  };

  beforeEach(() => {
    mockPost.mockClear();
    mockK8sCreate.mockReset();
    mockIsK8sLibraryPanelsClientEnabled.mockReset();
  });

  describe('when the librarypanels resource is not served', () => {
    beforeEach(() => {
      mockIsK8sLibraryPanelsClientEnabled.mockResolvedValue(false);
    });

    it('passes uid to the legacy /api when provided', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await addLibraryPanel(panelSaveModel as any, 'folder-uid', 'original-uid');

      expect(mockPost).toHaveBeenCalledWith('/api/library-elements', {
        folderUid: 'folder-uid',
        name: 'My Panel',
        model: panelSaveModel,
        kind: LibraryElementKind.Panel,
        uid: 'original-uid',
      });
      expect(mockK8sCreate).not.toHaveBeenCalled();
    });

    it('does not include uid on the legacy /api when not provided', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await addLibraryPanel(panelSaveModel as any, 'folder-uid');

      expect(mockPost).toHaveBeenCalledWith('/api/library-elements', {
        folderUid: 'folder-uid',
        name: 'My Panel',
        model: panelSaveModel,
        kind: LibraryElementKind.Panel,
      });
      expect(mockK8sCreate).not.toHaveBeenCalled();
    });
  });

  describe('when the librarypanels resource is served', () => {
    beforeEach(() => {
      mockIsK8sLibraryPanelsClientEnabled.mockResolvedValue(true);
      mockK8sCreate.mockResolvedValue({ uid: 'created-uid' } as Awaited<ReturnType<typeof libraryPanelsK8sClient.create>>);
    });

    it('creates through the /apis client and forwards the uid', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await addLibraryPanel(panelSaveModel as any, 'folder-uid', 'original-uid');

      expect(mockK8sCreate).toHaveBeenCalledWith('My Panel', panelSaveModel, 'folder-uid', 'original-uid');
      expect(mockPost).not.toHaveBeenCalled();
    });

    it('creates through the /apis client without a uid when one is not provided', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await addLibraryPanel(panelSaveModel as any, 'folder-uid');

      expect(mockK8sCreate).toHaveBeenCalledWith('My Panel', panelSaveModel, 'folder-uid', undefined);
      expect(mockPost).not.toHaveBeenCalled();
    });
  });
});

describe('libraryVizPanelToSaveModel', () => {
  it('uses default gridPos when the parent is an AutoGridItem', () => {
    const panel = new VizPanel({ key: 'panel-1', pluginId: 'text', title: 'Title' });

    const libPanelBehavior = new LibraryPanelBehavior({
      isLoaded: true,
      uid: 'uid',
      name: 'name',
      _loadedPanel: {
        uid: 'uid',
        name: 'name',
        type: 'text',
        model: vizPanelToPanel(panel),
        version: 1,
      },
    });

    panel.setState({ $behaviors: [libPanelBehavior] });
    new AutoGridItem({ key: 'auto-grid-item-1', body: panel });

    const saveModel = libraryVizPanelToSaveModel(panel);

    expect(saveModel.model.gridPos).toEqual({ x: 0, y: 0, w: 6, h: 3 });
  });
});
