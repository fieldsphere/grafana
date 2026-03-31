class LogReporter {
  constructor(globalConfig, reporterOptions, reporterContext) {
    this._globalConfig = globalConfig;
    this._options = reporterOptions;
    this._context = reporterContext;
  }

  onRunComplete(testContexts, results) {
    if (!this._options.enable) {
      return;
    }

    this.logStats(results);
    this.logTestFailures(results);
  }

  logTestFailures(results) {
    results.testResults.forEach(printTestFailures);
  }

  logStats(results) {
    const stats = {
      suites: results.numTotalTestSuites,
      tests: results.numTotalTests,
      passes: results.numPassedTests,
      pending: results.numPendingTests,
      failures: results.numFailedTests,
      duration: Date.now() - results.startTime,
    };
    // Structured line for CI (previously: JestStats key=value ...)
    // eslint-disable-next-line no-console
    console.info(JSON.stringify({ event: 'JestStats', ...stats, timestamp: Date.now() }));
  }
}

function printTestFailures(result) {
  if (result.status === 'pending') {
    return;
  }
  if (result.numFailingTests > 0) {
    const testInfo = {
      file: result.testFilePath,
      failures: result.numFailingTests,
      duration: result.perfStats.end - result.perfStats.start,
      errorMessage: result.failureMessage,
    };
    // eslint-disable-next-line no-console
    console.info(JSON.stringify({ event: 'JestFailure', ...testInfo, timestamp: Date.now() }));
  }
}

module.exports = LogReporter;
