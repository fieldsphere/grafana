import CopyWebpackPlugin from 'copy-webpack-plugin';
import grafanaConfig, { type Env } from '@grafana/plugin-configs/webpack.config.ts';
import { mergeWithCustomize, unique } from 'webpack-merge';
import { type Configuration } from 'webpack';

function skipFiles(f: string): boolean {
  if (f.includes('/dist/')) {
    return false;
  }
  if (f.includes('/node_modules/')) {
    return false;
  }
  if (f.includes('/package.json')) {
    return false;
  }
  return true;
}

const config = async (env: Env): Promise<Configuration> => {
  const baseConfig = await grafanaConfig(env);
  const customConfig = {
    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          { from: 'README.md', to: '.', force: true },
          { from: 'plugin.json', to: '.' },
          { from: 'CHANGELOG.md', to: '.', force: true, noErrorOnMissing: true },
          { from: '**/*.json', to: '.', filter: skipFiles },
          { from: '**/*.svg', to: '.', noErrorOnMissing: true, filter: skipFiles },
          {
            from: 'dist/gpx_grafana_auto_dashboard_app',
            to: '.',
            noErrorOnMissing: true,
          },
        ],
      }),
    ],
    externals: [...(baseConfig.externals as unknown as string[]), 'i18next'],
  };

  return mergeWithCustomize({
    customizeArray: unique('plugins', ['CopyPlugin'], (plugin) => plugin.constructor && plugin.constructor.name),
  })(baseConfig, customConfig);
};

export default config;
