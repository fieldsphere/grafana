const { execSync } = require("child_process");

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
  console.info(`GOMODCACHE: ${size(gomodcache)} (${gomodcache})`);
  console.info(`GOCACHE:    ${size(gocache)} (${gocache})`);
} catch (e) {
  console.info("Could not determine Go cache sizes:", e.message);
}
