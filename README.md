# GitHub Advanced Security Training Sample

This repository supports a 90-minute GitHub Advanced Security demonstration.
**Training only. Do not deploy or expose this application to a network.**
All secret fixtures are synthetic and cannot authenticate anywhere.

## Requirements

- Node.js 22 or later and npm.
- Git.
- CodeQL CLI bundle, including JavaScript query packs.
- GitHub CLI for optional remote configuration; authenticate with `gh auth login`.
- GitHub repository administration access for security settings.

The prepared Windows tools are installed under
`%LOCALAPPDATA%\Programs\ghas-demo-tools`. Restart your terminal to pick up user PATH changes.
The local analysis script also discovers that installation directly.

## Install and Test

```powershell
npm.cmd ci
npm.cmd test
npm.cmd start
```

The server binds only to `127.0.0.1:3000`. Open
<http://127.0.0.1:3000/hello?name=Developer>. Stop it with Ctrl+C.
Do not add hosting, containers, tunnels, or deployment workflows.

## Branches

| Branch | Purpose | Expected tests | Expected CodeQL result |
|---|---|---|---|
| `main` | Safe baseline using HTML encoding | All pass | No `js/reflected-xss` finding |
| `demo/vulnerability` | Intentionally removes HTML encoding | Functional tests pass; two security tests fail | `js/reflected-xss` in `src/app.js` |
| `demo/autofix-reference` | Human-authored reference remediation based on the vulnerable branch | All pass | No `js/reflected-xss` finding |

Do not merge the vulnerable branch into `main`. The reference fix is a fallback,
not a claim that Copilot generated it.

## Code Scanning and CodeQL CLI

The repository uses **advanced setup** through
[the CodeQL workflow](.github/workflows/codeql.yml). Do not enable default setup
alongside this workflow. Query configuration restricts analysis to application source.

```powershell
git switch main
npm.cmd run demo:codeql -- -Expected absent -Label baseline

git switch demo/vulnerability
npm.cmd run test:functional
npm.cmd run test:security
npm.cmd run demo:codeql -- -Expected present -Label vulnerable

git switch demo/autofix-reference
npm.cmd test
npm.cmd run demo:codeql -- -Expected absent -Label fixed
```

The security test command is intentionally red on `demo/vulnerability`: it
demonstrates a real regression. Do not skip it or weaken its assertions.

Each analysis writes to an ignored `artifacts\<label>` directory and refuses to
overwrite prior evidence. Use a fresh label for another rehearsal.
The verification script requires successful CodeQL execution and checks the
specific rule and source location, not just the CLI exit code.

Do not upload CLI SARIF into this repository during the demonstration. Use
GitHub Actions for remote results and local SARIF for CLI inspection.

## Copilot Autofix

1. Open the vulnerability PR and its CodeQL result.
2. Open the reflected XSS alert and inspect the available Autofix suggestion.
3. Review every proposed change before committing to a new fix branch.
4. Run all tests and rerun CodeQL; confirm the alert is resolved.
5. Use the reference fix PR only if suggestion generation or live analysis is delayed.

Autofix availability and generation depend on the alert and repository configuration.
The presence of a reference fix does not prove that Autofix ran.

## Synthetic Secret Scanning and Push Protection

These demos require a **published custom pattern**. Built-in detectors will not
recognize an arbitrary training string. Custom-pattern availability must be
checked in repository settings; do not substitute active credentials.

1. Open repository Settings > Advanced Security (labels may vary).
2. Confirm secret scanning and repository-level push protection are enabled.
3. Create a custom pattern named `GHAS synthetic training value`.
4. Set its secret format to `GHAS_TRAINING_ONLY_[0-9a-f]{32}`.
5. Dry-run and publish the pattern, then enable push protection for the pattern.
   If dry-run validation needs sample content, create the historical fixture below
   before publishing and rerun the dry-run.
6. If custom patterns are unavailable for this repository/account, use a repository
   with the required entitlement or clearly labeled prepared evidence. Do not
   claim that this synthetic pattern is protected until a push is actually blocked.

### Prepare an Existing Alert

Before publishing the custom pattern and enabling its push protection:

```powershell
git switch main
git switch -c demo/secret-history
npm.cmd run demo:secret -- historical-secret.txt
git add fixtures/historical-secret.txt
git commit -m "demo: add nonfunctional historical training fixture" `
  -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
git push github demo/secret-history
```

Publish the pattern and wait for scanning to produce the alert. Keep this branch
unmerged. Explain that the fixture is not an actual leaked credential.
If push protection is already enabled for this pattern, do not bypass it to seed
history; use the pattern dry-run or existing rehearsal evidence instead.

### Rehearse a Blocked Push

After the pattern's push protection is active:

```powershell
git switch main
git switch -c demo/push-protection-rehearsal
npm.cmd run demo:secret
git add fixtures/push-protection.txt
git commit -m "demo: attempt synthetic training fixture push" `
  -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
git push github demo/push-protection-rehearsal
```

The push must be rejected. If it succeeds, the rehearsal failed: check the
published pattern and protection settings before presenting. Do not call a
successful push proof of protection.

For this fresh branch with exactly one new, unpushed commit, remove the synthetic
file from that commit, retain a harmless explanation file, and push again:

```powershell
git rm fixtures/push-protection.txt
Set-Content -LiteralPath fixtures\clean-rehearsal.txt -Value 'Synthetic fixture removed before push.'
git add fixtures/clean-rehearsal.txt
git commit --amend --no-edit
git push github demo/push-protection-rehearsal
```

Amend only that explicitly prepared local commit, never a shared commit. A later
deletion commit alone does not remove the matching value from the pushed history.
Do not bypass protection or disable it merely to make the demo succeed.

## Real Credential Response

For an actual exposure, revoke or rotate first, update dependent applications,
remove hardcoded credentials, assess exposure, then resolve the alert accurately.
Deleting a file or closing an alert does not invalidate a credential.

## Presenter Evidence

- Safe baseline tests and a completed baseline CodeQL run.
- Vulnerability PR with the expected finding and failing security tests.
- Reviewed Autofix suggestion, or clearly labeled human-authored reference fix.
- Reference-fix tests and completed CodeQL result.
- Synthetic secret-scanning alert, if custom patterns are available.
- Actual rejected push followed by a successful cleaned push.

Keep generated databases, SARIF, reports, recordings, and logs out of Git.
