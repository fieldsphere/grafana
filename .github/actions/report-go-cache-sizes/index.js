const { execSync } = require("child_process");
const { createStructuredLogger } = require("../../scripts/helpers/structuredLogger");

const structuredLogger = createStructuredLogger(".github/actions/report-go-cache-sizes/index");

function size(dir) {
  try {
    return execSync(`du -sh "${dir}" 2>/dev/null`).toString().trim().split("\t")[0];
  } catch {
    return "N/A";
  }
}

try {
  const gomodcache = execSync("go env GOMODCACHE").toString().trim();
  const gocache = execSync("go env GOCACHE").toString().trim();
  structuredLogger.log(`GOMODCACHE: ${size(gomodcache)} (${gomodcache})`);
  structuredLogger.log(`GOCACHE:    ${size(gocache)} (${gocache})`);
} catch (e) {
  structuredLogger.log("Could not determine Go cache sizes:", e.message);
}
