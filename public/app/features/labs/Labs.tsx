import { Navigate, Route, Routes } from 'react-router-dom-v5-compat';

import { ROUTES } from './constants';
import { FeatureFlagsPage } from './FeatureFlagsPage';

export default function Labs() {
  return (
    <Routes>
      <Route caseSensitive path="/" element={<Navigate replace to={ROUTES.FeatureFlags} />} />
      <Route caseSensitive path={ROUTES.FeatureFlags.replace(ROUTES.Base, '')} element={<FeatureFlagsPage />} />
      <Route path="*" element={<Navigate replace to={ROUTES.FeatureFlags} />} />
    </Routes>
  );
}
