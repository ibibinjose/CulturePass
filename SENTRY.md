# Sentry Setup (CulturePass)

## Current State
- Using EU region (`de.sentry.io`)
- DSN is public and injected via `EXPO_PUBLIC_SENTRY_DSN`
- Release tracking via lightweight Release Hook (quick win)
- Long-term goal: full `sentry-cli` integration for sourcemaps, commits, and deploys

## Environment Variables

| Variable                    | Purpose                              | Secret?     | Where to set                  |
|----------------------------|--------------------------------------|-------------|-------------------------------|
| `EXPO_PUBLIC_SENTRY_DSN`   | Runtime error tracking               | No          | eas.json + .env               |
| `SENTRY_ORG`               | `culturepass`                        | No          | eas.json + GitHub vars        |
| `SENTRY_PROJECT`           | Your project slug                    | No          | eas.json + GitHub vars        |
| `SENTRY_RELEASE_HOOK_URL`  | Lightweight release creation         | **Yes**     | EAS secret + GitHub secret    |
| `SENTRY_AUTH_TOKEN`        | Full access (for sentry-cli)         | **Yes**     | EAS secret + GitHub secret    |

## GitHub Actions Workflows

- **Main build workflow**: `.github/workflows/eas-build.yml`
  - Builds with EAS (`--platform all`)
  - After success: uses a **matrix** to call the Sentry release workflow **separately for iOS and Android**
  - Generates rich release version including EAS build number: e.g. `1.3.0-b42-a1b2c3d@production`

- **Reusable Sentry Release workflow**: `.github/workflows/sentry-release.yml`
  - Can be called from other workflows using `uses:`
  - Supports both the lightweight Release Hook **and** full `sentry-cli`
  - Example call:
    ```yaml
    - uses: ./.github/workflows/sentry-release.yml
      with:
        version: "1.3.0-a1b2c3d@production"
        environment: "production"
        upload_sourcemaps: true
    ```

## Using the Release Hook (Current)

```bash
SENTRY_RELEASE_HOOK_URL=... ./scripts/notify-sentry-release.sh "1.3.0-b42@ios"
```

## Moving to sentry-cli (Recommended)

1. Install (already added as dev dep):
   ```bash
   npm install --save-dev @sentry/cli
   ```

2. **For Web + Hermes native sourcemaps (best practice for EAS):**
   - Set `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` as **EAS secrets**.
   - The `@sentry/react-native` plugin (with `hermes: true`) will attempt automatic uploads during the EAS build.

3. In GitHub Actions CI (after build):
   - The workflow now automatically downloads artifacts for iOS/Android using `eas build:download`.
   - It then tries to extract and upload Hermes sourcemaps using `sentry-cli`.
   - Note: Reliable extraction from IPA/AAB can be fragile. The most robust path is usually uploading *during* the EAS build via secrets.

   The reusable workflow handles both the lightweight release hook and full `sentry-cli` uploads (including artifact download for native).

## Release Naming Strategy (Current)

The main workflow generates a rich version:
`{appVersion}-{shortGitSha}@{profile}`

Example: `1.3.0-a1b2c3d@production`

This is passed to both the Release Hook and `sentry-cli`.

You can override it by setting `EXPO_PUBLIC_RELEASE` before the Sentry steps if you want custom logic (e.g. including EAS build number).

## Useful Links
- Organization: https://culturepass.sentry.io/
- Project settings → Releases → Add deployment (for the hook URL)