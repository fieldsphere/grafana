import { Navigate, Route, Routes } from 'react-router-dom-v5-compat';

import FeatureFlagsPage from './pages/FeatureFlagsPage';

const FEATURE_FLAGS_SEGMENT = 'feature-flags';

export default function Labs() {
  return (
    <Routes>
      <Route path="/" element={<Navigate replace to={FEATURE_FLAGS_SEGMENT} />} />
      <Route path={FEATURE_FLAGS_SEGMENT} element={<FeatureFlagsPage />} />
    </Routes>
  );
}
