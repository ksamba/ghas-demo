import assert from 'node:assert/strict';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { crc32 } from 'node:zlib';

function prepare(t, script) {
  const root = mkdtempSync(join(tmpdir(), 'ghas-fixture-test-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, 'scripts'));
  const target = join(root, 'scripts', script);
  copyFileSync(new URL(`../scripts/${script}`, import.meta.url), target);
  return {
    root,
    run: (...args) => spawnSync(process.execPath, [target, ...args], { encoding: 'utf8' })
  };
}

test('provider fixture has the rehearsed format checksum and refuses overwrites', (t) => {
  const fixture = prepare(t, 'create-provider-fixture.js');
  const result = fixture.run();
  assert.equal(result.status, 0, result.stderr);
  const file = join(fixture.root, 'fixtures', 'provider-training.txt');
  const original = readFileSync(file, 'utf8');
  assert.match(original, /never issued by GitHub/);
  const match = original.match(/^synthetic_training_value=ghp_([A-Za-z0-9]{30})([A-Za-z0-9]{6})$/m);
  assert.ok(match, 'Expected one synthetic provider-format value');
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const checksum = [...match[2]].reduce((value, char) => value * 62 + alphabet.indexOf(char), 0);
  assert.equal(checksum, crc32(Buffer.from(match[1])));
  const repeated = fixture.run();
  assert.notEqual(repeated.status, 0);
  assert.match(repeated.stderr, /EEXIST/);
  assert.equal(readFileSync(file, 'utf8'), original);
});

test('custom fixture matches the documented training pattern and refuses overwrites', (t) => {
  const fixture = prepare(t, 'create-secret-fixture.js');
  const result = fixture.run('historical-secret.txt');
  assert.equal(result.status, 0, result.stderr);
  const file = join(fixture.root, 'fixtures', 'historical-secret.txt');
  const original = readFileSync(file, 'utf8');
  assert.match(original, /^training_value=GHAS_TRAINING_ONLY_[0-9a-f]{32}$/m);
  assert.notEqual(fixture.run('historical-secret.txt').status, 0);
  assert.equal(readFileSync(file, 'utf8'), original);
});

test('custom fixture rejects paths outside its fixture directory', (t) => {
  const fixture = prepare(t, 'create-secret-fixture.js');
  const result = fixture.run('../outside.txt');
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /without directories/);
  assert.equal(existsSync(join(fixture.root, 'outside.txt')), false);
});
