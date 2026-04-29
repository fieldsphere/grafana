# Google Workspace CLI setup

The `gws` CLI is installed in this environment:

```bash
gws --version
```

Expected result at setup time:

```text
gws 0.22.5
```

## Finish authentication

Authentication requires an interactive OAuth flow and should not store secrets in the repository.

1. Run:

   ```bash
   gws auth setup
   ```

2. Retrieve the OAuth client credentials from 1Password:
   - Entry: `Solutions GWS OAuth Token`
   - Fields: `Client ID` and `Client Secret`

3. Export them in the shell where you will log in:

   ```bash
   export GOOGLE_WORKSPACE_CLI_CLIENT_ID="<client-id-from-1password>"
   export GOOGLE_WORKSPACE_CLI_CLIENT_SECRET="<client-secret-from-1password>"
   ```

4. Complete browser-based OAuth:

   ```bash
   gws auth login
   ```

   If the OAuth app scope limit is reached, limit scopes, for example:

   ```bash
   gws auth login -s drive,gmail,sheets
   ```

5. Verify:

   ```bash
   gws auth status
   ```

## Optional headless credentials

After a successful interactive login, export credentials for future headless use:

```bash
gws auth export --unmasked > ~/gws-credentials.json
chmod 600 ~/gws-credentials.json
export GOOGLE_WORKSPACE_CLI_CREDENTIALS_FILE="$HOME/gws-credentials.json"
```

Treat `~/gws-credentials.json` as a secret. Do not commit it.
