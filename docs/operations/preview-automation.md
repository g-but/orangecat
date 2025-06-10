created_date: 2025-06-10
last_modified_date: 2025-06-10
last_modified_summary: "Initial documentation for automated preview Lighthouse reporting via GitHub Actions"

# Automated Preview Lighthouse Reporting

> NOTE: This documentation describes the *pull-request* automation introduced on 2025-06-10.  It does not replace the production deployment pipeline; it enhances the developer feedback loop for non-production changes.

## Overview
Whenever a PR targets `main`, the **Deploy to Vercel** workflow now automatically:

1. Builds a preview deployment with Vercel.
2. Waits until the preview URL is reachable.
3. Executes a Lighthouse audit via `treosh/lighthouse-ci-action`.
4. Uploads the Lighthouse HTML & JSON reports as build artifacts.
5. Posts a sticky comment on the PR linking to the preview and the artifacts.

This gives reviewers immediate insight into performance, accessibility, best-practice, and SEO scores for every change.

## How It Works
* **Workflow file:** `.github/workflows/deploy.yml`
* **Key steps added:**
  * `vercel_deploy` – deploys preview (`amondnet/vercel-action@v25`).
  * `Wait for Deployment to be Ready` – 30×10-second poll until preview URL responds.
  * `Lighthouse Audit` – runs Lighthouse, uploads artifacts (named `lighthouse-<run_number>`).
  * `Comment PR with Lighthouse Scores` – sticky comment so results stay visible even after re-runs.

The preview URL is obtained from the `preview-url` output of `vercel-action`.

## Updating or Debugging
* To adjust Lighthouse settings, edit the **Lighthouse Audit** step (e.g., budgets, throttling).
* To change the comment format, update the **Comment PR with Lighthouse Scores** step.
* If the workflow times out waiting for the preview, verify Vercel deployment logs and network access.

## Permissions
`sticky-pull-request-comment` requires the `pull-requests: write` permission. The repository settings already grant this at the workflow level.

## Future Enhancements
* Parse Lighthouse JSON to surface numeric scores directly in the PR comment.
* Trigger bundle diffing and comparison against performance budgets.
* Push high-severity Lighthouse audits into the quality gate to fail CI. 