function writeTestLogLine(event, attrs) {
  process.stdout.write(`${event} ${attrs}\n`);
}

module.exports = {
  writeTestLogLine,
};
