import { test as teardown } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Global teardown for Hydrogen Storefront E2E tests.
 * 
 * This runs after all test projects to:
 * 1. Generate test summary reports
 * 2. Clean up temporary test data
 */

teardown('global teardown - generate summary', async () => {
  const resultsPath = path.join(process.cwd(), 'test-results', 'results.json');
  
  if (fs.existsSync(resultsPath)) {
    try {
      const results = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
      
      // Generate summary
      const summary = {
        timestamp: new Date().toISOString(),
        totalTests: results.suites?.reduce((sum: number, suite: any) => 
          sum + (suite.specs?.length || 0), 0) || 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: results.stats?.duration || 0,
      };
      
      // Count results
      const countResults = (suites: any[]) => {
        for (const suite of suites) {
          if (suite.specs) {
            for (const spec of suite.specs) {
              if (spec.tests) {
                for (const test of spec.tests) {
                  for (const result of test.results || []) {
                    if (result.status === 'passed') summary.passed++;
                    else if (result.status === 'failed') summary.failed++;
                    else if (result.status === 'skipped') summary.skipped++;
                  }
                }
              }
            }
          }
          if (suite.suites) {
            countResults(suite.suites);
          }
        }
      };
      
      if (results.suites) {
        countResults(results.suites);
      }
      
      // Write summary
      const summaryPath = path.join(process.cwd(), 'test-results', 'summary.json');
      fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
      
      console.log('\n=== Test Summary ===');
      console.log(`Total: ${summary.totalTests}`);
      console.log(`Passed: ${summary.passed}`);
      console.log(`Failed: ${summary.failed}`);
      console.log(`Skipped: ${summary.skipped}`);
      console.log(`Duration: ${(summary.duration / 1000).toFixed(2)}s`);
      console.log('====================\n');
      
    } catch (error) {
      console.warn('Could not generate test summary:', error);
    }
  }
});

teardown('global teardown - cleanup temporary files', async () => {
  // Clean up any temporary test files created during tests
  const tempPatterns = [
    'e2e/.auth/*.tmp',
    'test-results/*.tmp',
  ];
  
  console.log('Cleaning up temporary files...');
  
  // Note: In a real implementation, you would use glob to find and remove
  // temporary files. For now, we just log the cleanup.
});
