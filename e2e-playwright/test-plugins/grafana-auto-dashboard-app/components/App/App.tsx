import { AppRootProps } from '@grafana/data';
import { Route, Routes } from 'react-router-dom';

import { CreateWizard } from '../../pages/CreateWizard';

export function App(_props: AppRootProps) {
  return (
    <Routes>
      <Route path="create" element={<CreateWizard />} />
      <Route path="*" element={<CreateWizard />} />
    </Routes>
  );
}
