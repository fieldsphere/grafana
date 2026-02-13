function writeE2ELogLine(event, attrs, stream = 'stdout') {
  if (stream === 'stderr') {
    process.stderr.write(`${event} ${attrs}\n`);
    return;
  }

  process.stdout.write(`${event} ${attrs}\n`);
}

module.exports = {
  writeE2ELogLine,
};
