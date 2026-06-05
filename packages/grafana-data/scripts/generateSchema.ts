import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { NewThemeOptionsSchema } from '../src/themes/createTheme';

const structuredLogger = {
  log: (...args: unknown[]) => {
    process.stdout.write(
      JSON.stringify({
        args,
        level: 'log',
        message: typeof args[0] === 'string' ? args[0] : 'Grafana script log event',
        source: 'packages/grafana-data/scripts/generateSchema.ts',
      }) + '\n'
    );
  },
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const jsonOut = path.join(__dirname, '..', 'src', 'themes', 'schema.generated.json');

fs.writeFileSync(
  jsonOut,
  JSON.stringify(
    NewThemeOptionsSchema.toJSONSchema({
      target: 'draft-07',
    }),
    undefined,
    2
  )
);

structuredLogger.log('Successfully generated theme schema');
