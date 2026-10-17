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

## Prepared Demo Links

- [Repository](https://github.com/ksamba/ghas-demo)
- [Vulnerability PR with generated Copilot Autofix suggestion](https://github.com/ksamba/ghas-demo/pull/1)
- [Human-authored reference fix PR](https://github.com/ksamba/ghas-demo/pull/2)
- [Code scanning alert](https://github.com/ksamba/ghas-demo/security/code-scanning/1)
- [Synthetic secret alert, resolved as used in tests](https://github.com/ksamba/ghas-demo/security/secret-scanning/1)
- [Workflow runs](https://github.com/ksamba/ghas-demo/actions)

Installed tools: GitHub CLI 2.102.0 and CodeQL bundle 2.27.2.
Node.js 24.14.1 and Git were already installed.
The Autofix suggestion is deliberately left unapplied for the live demo.
Repository-level secret scanning and push protection remain enabled.

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
| `demo/provider-protection` | Historical synthetic fixture, explicitly authorized test-only bypass | All pass | Safe application |
| `demo/push-protection-live` | Local-only fresh synthetic fixture for an actually blocked push | All pass | Safe application |
| `demo/provider-clean` | Clean branch demonstrating a successful push | All pass | Safe application |

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

Custom patterns are unavailable for this personal repository (GitHub returned
HTTP 404, "Feature not available in this repository"). The prepared demo instead
uses a **synthetic, unissued GitHub-token-shaped value** with the documented
format checksum. It was generated locally, never issued by GitHub, and has no
account or authentication capability. An actual push was rejected with GH013.

An arbitrary fake token will not necessarily trigger detection. Do not substitute
active credentials if GitHub changes its detection behavior.

### Existing Alert

Open [synthetic secret alert #1](https://github.com/ksamba/ghas-demo/security/secret-scanning/1).
It is **resolved as used in tests**, not an open real-world exposure.
After push protection rejected the historical fixture, the repository owner
explicitly approved a one-time `used_in_tests` bypass to seed this alert.
The bypass did not disable repository protection. Do not repeat it for the live demo.

### Rehearse the Prepared Blocked Push

The local-only branch contains a fresh fixture, distinct from the historical value:

```powershell
git switch demo/push-protection-live
git push github demo/push-protection-live
```

The push must be rejected with GH013 / GitHub Push Protection.
If it succeeds, the rehearsal failed; investigate settings before presenting.

Show the successful alternative from a separate, clean history:

```powershell
git switch demo/provider-clean
git push github demo/provider-clean
git switch main
```

The clean branch was already pushed successfully during setup, so repeating its
push normally reports "Everything up-to-date". For a fresh successful live push,
start a new branch from `main`, add a harmless note, commit, and push that branch.
This avoids rewriting commits and preserves the blocked branch for rehearsal.
A later deletion commit on the blocked branch alone is insufficient because the
synthetic value would still exist in its pushed history.

### Create Another Fresh Provider Fixture

On a new branch from `main`:

```powershell
git switch main
git switch -c demo/another-push-rehearsal
npm.cmd run demo:provider-secret
git add fixtures/provider-training.txt
git commit -m "demo: add unissued synthetic training fixture" `
  -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
git push github demo/another-push-rehearsal
```

Do not bypass the rejection. The generator refuses to overwrite an existing file.

### Optional Custom-Pattern Version

For an eligible repository, the alternative `npm.cmd run demo:secret` creates a
clearly synthetic value matching `GHAS_TRAINING_ONLY_[0-9a-f]{32}`. Publish a custom
pattern and enable its push protection before relying on that detector.
This optional custom-pattern flow is not configured in this repository.

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
