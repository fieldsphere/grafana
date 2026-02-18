import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { NewThemeOptionsSchema } from '../src/themes/createTheme';

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

Reflect.apply(Reflect.get(globalThis, '__structuredLog') ?? Reflect.get(console, 'info'), console, [{ timestamp: new Date().toISOString(), level: 'info', source: 'packages/grafana-data/scripts/generateSchema.ts', args: ['Successfully generated theme schema'] }]);
