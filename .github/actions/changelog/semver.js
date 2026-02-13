//
// Semver utils: parse, compare, sort etc (using official regexp)
// https://regex101.com/r/Ly7O1x/3/
//
const semverRegExp =
  /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

export function semverParse(tag) {
  const m = tag.match(semverRegExp);
  if (!m) {
    return;
  }
  const [_, major, minor, patch, prerelease, build] = m;
  return [+major, +minor, +patch, prerelease, build, tag];
};

// semverCompare takes two parsed semver tags and comparest them more or less
// according to the semver specs
export function semverCompare(a, b) {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) {
      return a[i] < b[i] ? 1 : -1;
    }
  }
  if (a[3] !== b[3]) {
    return a[3] < b[3] ? 1 : -1;
  }
  return 0;
};


// Finds the highest version that is lower than the target version.
//
// This function relies on the following invariant: versions are sorted by the release date.
// It will produce wrong result if invariant doesn't hold.
export const findPreviousVersion = (versionByDate, target) => {
  let prev = null;

  for (let i = 0; i < versionByDate.length; i++) {
    const version = versionByDate[i];

    // version is greater than the target
    if (semverCompare(target, version) > 0) {
      continue;
    }

    // we came across the target version, all versions seen previously have greater release date.
    if (semverCompare(target, version) === 0 && target[4] === version[4]) {
      prev = null;
      continue;
    }

    if (prev == null) {
      prev = version;
      continue;
    }

    if (semverCompare(prev, version) > 0) {
      prev = version;
    }
  }

  return prev;
};
