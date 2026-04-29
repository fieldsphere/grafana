# Google Workspace CLI setup

The `gws` command is installed on this Cursor Cloud machine from the upstream
`googleworkspace/cli` release binary.

## Current state

- Installed version: `gws 0.22.5`
- Auth status: not configured
- Credential file environment variable: `GOOGLE_WORKSPACE_CLI_CREDENTIALS_FILE`
  is unset

## Complete first-time authentication

First-time OAuth setup requires browser and secret-manager access.

1. Run:

   ```bash
   gws auth setup
   ```

2. In 1Password, open **Solutions GWS OAuth Token** and copy the OAuth client
   ID and client secret.

3. Export them in the shell that will run `gws`:

   ```bash
   export GOOGLE_WORKSPACE_CLI_CLIENT_ID="<client-id-from-1password>"
   export GOOGLE_WORKSPACE_CLI_CLIENT_SECRET="<client-secret-from-1password>"
   ```

4. Complete the browser-based login:

   ```bash
   gws auth login
   ```

   To limit OAuth scopes if the app is in testing, use a scoped login such as:

   ```bash
   gws auth login -s drive,gmail,sheets
   ```

5. Verify:

   ```bash
   gws auth status
   gws drive files list --params '{"pageSize": 3}'
   ```

## Optional headless credential export

After a successful login, export reusable user credentials:

```bash
gws auth export --unmasked > ~/gws-credentials.json
chmod 600 ~/gws-credentials.json
export GOOGLE_WORKSPACE_CLI_CREDENTIALS_FILE="$HOME/gws-credentials.json"
```

Treat `~/gws-credentials.json` as a secret. Do not commit it.
