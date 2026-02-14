const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { fromPairs } = require('lodash');

const { CDPDataCollector } = require('./CDPDataCollector');
const { formatResults } = require('./formatting');
const { logE2eInfo } = require('../logging');

const remoteDebuggingPortOptionPrefix = '--remote-debugging-port=';

const getOrAddRemoteDebuggingPort = (args) => {
  const existing = args.find((arg) => arg.startsWith(remoteDebuggingPortOptionPrefix));

  if (existing) {
    return Number(existing.substring(remoteDebuggingPortOptionPrefix.length));
  }

  const port = 40000 + Math.round(Math.random() * 25000);
  args.push(`${remoteDebuggingPortOptionPrefix}${port}`);
  return port;
};

let collectors = [];
let results = [];

const startBenchmarking = async ({ testName }) => {
  await Promise.all(collectors.map((coll) => coll.start({ id: testName })));

  return true;
};

const stopBenchmarking = async ({ testName, appStats }) => {
  const data = await Promise.all(collectors.map(async (coll) => [coll.getName(), await coll.stop({ id: testName })]));

  results.push({
    collectorsData: fromPairs(data),
    appStats: appStats,
  });

  return true;
};
const afterRun = async () => {
  await Promise.all(collectors.map((coll) => coll.close()));
  collectors = [];
  results = [];
};

const afterSpec = (resultsFolder) => async (spec) => {
  fs.writeFileSync(`${resultsFolder}/${spec.name}-${Date.now()}.json`, JSON.stringify(formatResults(results), null, 2));

  results = [];
};

const initialize = (on, config) => {
  const resultsFolder = config.env['BENCHMARK_PLUGIN_RESULTS_FOLDER'];

  // File size audit: scope newly added directories and report sizes for newly added files
  try {
    const newFiles = execSync('git diff --name-status origin/main...HEAD | grep "^A" | awk \'{print $2}\'', { encoding: 'utf-8' })
      .trim()
      .split('\n')
      .filter((line) => line.length > 0);

    if (newFiles.length > 0) {
      const newDirs = [...new Set(newFiles.map((file) => {
        const dir = path.dirname(file);
        return dir === '.' ? file : dir;
      }))].filter((dir) => fs.existsSync(dir));

      if (newDirs.length > 0) {
        const dirSizes = execSync(`du -h ${newDirs.map((d) => `"${d}"`).join(' ')}`, { encoding: 'utf-8' }).trim();
        logE2eInfo('File size audit: newly added directory sizes', {
          operation: 'benchmark.initialize.sizeAudit',
          directorySizes: dirSizes,
        });
      }

      const fileSizes = newFiles
        .filter((file) => fs.existsSync(file))
        .map((file) => {
          const stats = fs.statSync(file);
          return `${file}: ${(stats.size / 1024).toFixed(2)}KB`;
        })
        .join('\n');

      if (fileSizes) {
        logE2eInfo('File size audit: newly added file sizes', {
          operation: 'benchmark.initialize.sizeAudit',
          fileSizes,
        });
      }
    }
  } catch (error) {
    // Silently ignore if git command fails (e.g., not in a git repo or no origin/main)
  }

  if (!fs.existsSync(resultsFolder)) {
    fs.mkdirSync(resultsFolder, { recursive: true });
    logE2eInfo('Created folder for benchmark results', {
      operation: 'benchmark.initialize',
      resultsFolder,
    });
  }

  on('before:browser:launch', async (browser, options) => {
    if (browser.family !== 'chromium' || browser.name === 'electron') {
      throw new Error('benchmarking plugin requires chrome');
    }

    const { args } = options;

    const port = getOrAddRemoteDebuggingPort(args);
    collectors.push(new CDPDataCollector({ port }));

    args.push('--start-fullscreen');

    logE2eInfo('Initialized benchmarking plugin', {
      operation: 'benchmark.before:browser:launch',
      collectorCount: collectors.length,
      collectors: collectors.map((col) => col.getName()).join(','),
    });

    return options;
  });

  on('task', {
    startBenchmarking,
    stopBenchmarking,
  });

  on('after:run', afterRun);
  on('after:spec', afterSpec(resultsFolder));
};

exports.initialize = initialize;
