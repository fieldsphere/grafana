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
  // eslint-disable-next-line no-console
  console.info(
    JSON.stringify({
      level: 'INFO',
      source: 'github-actions.report-go-cache-sizes',
      gomodcache: { path: gomodcache, size: size(gomodcache) },
      gocache: { path: gocache, size: size(gocache) },
      timestamp: Date.now(),
    })
  );
} catch (e) {
  // eslint-disable-next-line no-console
  console.warn(
    JSON.stringify({
      level: 'WARN',
      source: 'github-actions.report-go-cache-sizes',
      message: 'Could not determine Go cache sizes',
      error: e.message,
      timestamp: Date.now(),
    })
  );
}
