# CI P0 E2E Secrets Checklist

Purpose: ensure the P0 workflow matrix in CI runs fully (no skip-based false green).

## Required GitHub Actions secrets

Set these in:

- GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

### 1) `E2E_USER_EMAIL`

- Value: email of a stable fixture account used for E2E login
- Example: `test@orangecat.ch`

### 2) `E2E_USER_PASSWORD`

- Value: password for the fixture account
- Notes:
  - use a dedicated test account, not a personal account
  - rotate periodically

### 3) `E2E_PROJECT_ID`

- Value: UUID of an owned test project used for status lifecycle checks
- Notes:
  - the fixture user must own this project
  - project should be safe for repeated status transitions

### 4) `E2E_RESET_ACCESS_TOKEN`

- Value: valid recovery token for password reset completion phase
- Notes:
  - token expiry can cause P0 failures
  - refresh this secret whenever token expires

---

## Post-setup verification

1. Push a small commit/PR to trigger CI.
2. Confirm the CI step **"Validate required P0 E2E env"** shows all ✅.
3. Confirm **"Run P0 workflow matrix"** executes (not skipped/short-circuited).

---

## Failure guide

### Error: `Missing required secret: ...`

- Secret is not configured in GitHub Actions.
- Add the missing secret and rerun the workflow.

### Password reset test fails intermittently

- Most likely stale `E2E_RESET_ACCESS_TOKEN`.
- Generate a new recovery token and update the secret.

### Project status lifecycle fails with 401/403/404

- Fixture account credentials invalid, session issue, or wrong `E2E_PROJECT_ID` ownership.
- Verify the project belongs to `E2E_USER_EMAIL` account.

---

## Operational recommendations

- Keep fixture resources isolated from real data.
- Avoid deleting the fixture project/account used by CI.
- Rotate secrets on a schedule and after any exposure event.
