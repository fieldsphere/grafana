#!/usr/bin/env node

const { execSync } = require('node:child_process');
const { writeFile, mkdir, access } = require('node:fs/promises');

const { CODEOWNERS_FILE_PATH, CODEOWNERS_MANIFEST_DIR, METADATA_JSON_PATH } = require('./constants.js');

/**
 * @typedef {Object} CodeownersMetadata
 * @property {string} generatedAt - ISO timestamp when metadata was generated
 * @property {string} filesHash - SHA-256 hash of all repository files
 * @property {string} codeownersHash - SHA-256 hash of CODEOWNERS file
 */

/**
 * Generate codeowners metadata for caching
 * @param {string} codeownersFilePath - Path to CODEOWNERS file
 * @param {string} manifestDir - Directory for manifest files
 * @param {string} metadataFilename - Filename for metadata file
 * @returns {CodeownersMetadata} Metadata object with hashes
 */
function generateCodeownersMetadata(codeownersFilePath, manifestDir, metadataFilename) {
  const [filesHash] = execSync('git ls-files --cached --others --exclude-standard | sort | sha256sum', {
    encoding: 'utf8',
  })
    .trim()
    .split(' ');

  const [codeownersHash] = execSync(`sha256sum "${codeownersFilePath}"`, { encoding: 'utf8' }).trim().split(' ');

  return {
    generatedAt: new Date().toISOString(),
    filesHash,
    codeownersHash,
  };
}

if (require.main === module) {
  (async () => {
    try {
      Reflect.apply(Reflect.get(globalThis, '__structuredLog') ?? Reflect.get(console, 'info'), console, [{ timestamp: new Date().toISOString(), level: 'info', source: 'scripts/codeowners-manifest/metadata.js', args: ['⚙️ Generating codeowners-manifest metadata ...'] }]);

      try {
        await access(CODEOWNERS_MANIFEST_DIR);
      } catch (error) {
        await mkdir(CODEOWNERS_MANIFEST_DIR, { recursive: true });
      }

      const metadata = generateCodeownersMetadata(CODEOWNERS_FILE_PATH, CODEOWNERS_MANIFEST_DIR, METADATA_JSON_PATH);

      await writeFile(METADATA_JSON_PATH, JSON.stringify(metadata, null, 2), 'utf8');
      Reflect.apply(Reflect.get(globalThis, '__structuredLog') ?? Reflect.get(console, 'info'), console, [{ timestamp: new Date().toISOString(), level: 'info', source: 'scripts/codeowners-manifest/metadata.js', args: ['✅ Metadata generated:'] }]);
      Reflect.apply(Reflect.get(globalThis, '__structuredLog') ?? Reflect.get(console, 'info'), console, [{ timestamp: new Date().toISOString(), level: 'info', source: 'scripts/codeowners-manifest/metadata.js', args: [`   • ${METADATA_JSON_PATH}`] }]);
    } catch (error) {
      Reflect.apply(Reflect.get(globalThis, '__structuredLog') ?? Reflect.get(console, 'error'), console, [{ timestamp: new Date().toISOString(), level: 'error', source: 'scripts/codeowners-manifest/metadata.js', args: ['❌ Error generating codeowners metadata:', error.message] }]);
      process.exit(1);
    }
  })();
}

module.exports = { generateCodeownersMetadata };
