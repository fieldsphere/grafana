import { test as setup, expect } from '@playwright/test';
import { createGuestState, createAuthenticatedState } from './utils/auth-helpers';
import { TestUsers } from './fixtures/test-data';
import path from 'path';
import fs from 'fs';

/**
 * Global setup for Hydrogen Storefront E2E tests.
 * 
 * This runs before all test projects to:
 * 1. Create fresh authentication states (guest and authenticated)
 * 2. Reset any test data state
 * 3. Ensure required directories exist
 */

const AUTH_DIR = path.join(__dirname, '.auth');
const GUEST_STATE_PATH = path.join(AUTH_DIR, 'guest.json');
const AUTHENTICATED_STATE_PATH = path.join(AUTH_DIR, 'authenticated.json');

setup('global setup - create auth states', async ({ page, context }) => {
  // Ensure auth directory exists
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }

  // Create guest (unauthenticated) storage state
  console.log('Creating guest auth state...');
  await createGuestState(GUEST_STATE_PATH);

  // Create authenticated storage state
  console.log('Creating authenticated auth state...');
  try {
    await createAuthenticatedState(
      page,
      context,
      TestUsers.STANDARD_USER,
      AUTHENTICATED_STATE_PATH
    );
    console.log('Authenticated state created successfully');
  } catch (error) {
    console.warn('Could not create authenticated state (may need running storefront):', error);
    // Create empty authenticated state as fallback
    await createGuestState(AUTHENTICATED_STATE_PATH);
  }
});

setup('global setup - verify storefront accessibility', async ({ page }) => {
  // Verify the storefront is accessible
  const baseUrl = process.env.STOREFRONT_URL || 'http://localhost:3000';
  
  try {
    const response = await page.goto(baseUrl, { timeout: 30_000 });
    
    if (!response || !response.ok()) {
      console.warn(`Storefront not accessible at ${baseUrl}. Tests may fail.`);
    } else {
      console.log(`Storefront accessible at ${baseUrl}`);
    }
  } catch (error) {
    console.warn(`Could not connect to storefront at ${baseUrl}:`, error);
  }
});

setup('global setup - clear test artifacts', async () => {
  // Clean up old test artifacts
  const artifactDirs = ['test-results', 'playwright-report'];
  
  for (const dir of artifactDirs) {
    const dirPath = path.join(process.cwd(), dir);
    if (fs.existsSync(dirPath)) {
      console.log(`Cleaning ${dir} directory...`);
      // Keep directory but remove old files
      const files = fs.readdirSync(dirPath);
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);
        // Remove files older than 24 hours
        if (Date.now() - stat.mtime.getTime() > 24 * 60 * 60 * 1000) {
          fs.rmSync(filePath, { recursive: true, force: true });
        }
      }
    }
  }
});
