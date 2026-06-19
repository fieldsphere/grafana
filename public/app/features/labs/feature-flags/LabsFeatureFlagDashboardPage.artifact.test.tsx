import fs from 'fs';
import path from 'path';
import type { ReactNode } from 'react';

import { screen } from '@testing-library/react';
import config from 'app/core/config';
import { render } from 'test/test-utils';

import LabsFeatureFlagDashboardPage from './LabsFeatureFlagDashboardPage';

jest.mock('app/core/components/Page/Page', () => {
  const Page = ({ children }: { children: ReactNode }) => <div>{children}</div>;
  Page.Contents = ({ children }: { children: ReactNode }) => <div>{children}</div>;
  return { Page };
});

describe('LabsFeatureFlagDashboardPage artifact render', () => {
  const originalFeatureToggles = config.featureToggles;
  const artifactDir = path.resolve(process.cwd(), '.cursor/docs/artifacts');

  function writeHtmlArtifact(fileName: string) {
    const artifactPath = path.join(artifactDir, fileName);
    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Labs feature flag dashboard artifact</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; background: #f7f7f4; color: #26251e; }
    code { font-family: Menlo, monospace; }
  </style>
</head>
<body>${document.body.innerHTML}</body>
</html>`;
    fs.writeFileSync(artifactPath, html, 'utf8');
  }

  afterEach(() => {
    config.featureToggles = originalFeatureToggles;
  });

  it('writes rendered HTML artifacts for walkthrough steps', async () => {
    config.featureToggles = {
      alphaFeatureFlag: true,
      betaFeatureFlag: false,
      gammaFeatureFlag: true,
      deltaFeatureFlag: false,
    };

    const { user } = render(<LabsFeatureFlagDashboardPage />, { renderWithRouter: false });

    writeHtmlArtifact('labs-feature-flags-step-1-initial.html');

    await user.type(screen.getByPlaceholderText('Search by flag name'), 'beta');
    writeHtmlArtifact('labs-feature-flags-step-2-filtered.html');

    await user.clear(screen.getByPlaceholderText('Search by flag name'));
    await user.click(document.getElementById('labs-feature-flag-alphaFeatureFlag') as HTMLInputElement);
    writeHtmlArtifact('labs-feature-flags-step-3-toggled.html');
  });
});
