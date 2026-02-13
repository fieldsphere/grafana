const escapeData = (s) => s.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');

export const logChangelogNotice = (message) => {
  process.stdout.write(`::notice::${escapeData(message)}\n`);
};
