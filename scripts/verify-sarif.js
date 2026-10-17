import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const [file, expected] = process.argv.slice(2);
assert.ok(file, 'Usage: node scripts/verify-sarif.js <results.sarif> <present|absent>');
assert.ok(['present', 'absent'].includes(expected), 'Expected outcome must be present or absent');

const sarif = JSON.parse(readFileSync(file, 'utf8'));
assert.equal(sarif.version, '2.1.0');
assert.ok(Array.isArray(sarif.runs) && sarif.runs.length > 0, 'SARIF must contain an analysis run');
for (const run of sarif.runs) {
  assert.equal(run.tool.driver.name, 'CodeQL', 'Expected CodeQL analysis');
  assert.ok(run.invocations?.length > 0, 'SARIF must record analysis execution');
  assert.ok(run.invocations.every((invocation) => invocation.executionSuccessful === true),
    'CodeQL execution must succeed');
}

const results = sarif.runs.flatMap((run) => run.results ?? []);
const findings = results.filter((result) => result.ruleId === 'js/reflected-xss');
for (const result of findings) {
  assert.ok(result.locations?.some((location) =>
    location.physicalLocation?.artifactLocation?.uri === 'src/app.js'),
  'The demonstration finding must point to src/app.js');
}

if (expected === 'present') {
  assert.ok(findings.length > 0, 'Expected a reflected XSS finding in the vulnerable branch');
} else {
  assert.equal(findings.length, 0, 'Expected the reflected XSS finding to be absent');
}

console.log(JSON.stringify({
  expected,
  totalFindings: results.length,
  reflectedXssFindings: findings.length,
  findings: findings.map((finding) => ({
    ruleId: finding.ruleId,
    message: finding.message.text,
    location: finding.locations[0].physicalLocation
  }))
}, null, 2));
