const fs = require('fs');
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

const reportDirectorySize = (dirPath) => {
  try {
    const size = execSync(`du -h "${dirPath}"`, { encoding: 'utf-8' }).trim();
    logE2eInfo('Directory size report', {
      operation: 'benchmark.reportDirectorySize',
      directory: dirPath,
      size,
    });
  } catch (error) {
    logE2eInfo('Failed to report directory size', {
      operation: 'benchmark.reportDirectorySize',
      directory: dirPath,
      error: error.message,
    });
  }
};

const reportFileSize = (filePath) => {
  try {
    const size = execSync(`du -h "${filePath}"`, { encoding: 'utf-8' }).trim();
    logE2eInfo('File size report', {
      operation: 'benchmark.reportFileSize',
      file: filePath,
      size,
    });
  } catch (error) {
    logE2eInfo('Failed to report file size', {
      operation: 'benchmark.reportFileSize',
      file: filePath,
      error: error.message,
    });
  }
};

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
  const filePath = `${resultsFolder}/${spec.name}-${Date.now()}.json`;
  fs.writeFileSync(filePath, JSON.stringify(formatResults(results), null, 2));
  reportFileSize(filePath);

  results = [];
};

const initialize = (on, config) => {
  const resultsFolder = config.env['BENCHMARK_PLUGIN_RESULTS_FOLDER'];

  if (!fs.existsSync(resultsFolder)) {
    fs.mkdirSync(resultsFolder, { recursive: true });
    logE2eInfo('Created folder for benchmark results', {
      operation: 'benchmark.initialize',
      resultsFolder,
    });
    reportDirectorySize(resultsFolder);
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
