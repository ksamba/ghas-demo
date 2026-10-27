import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';

//add a comment

const repo = fileURLToPath(new URL('../', import.meta.url));
const directory = resolve(repo, 'fixtures');
const filename = process.argv[2] ?? 'push-protection.txt';
if (!/^[a-z0-9-]+\.txt$/.test(filename)) {
  throw new Error('Fixture filename must be a simple lowercase .txt name without directories.');
}
const target = join(directory, filename);
if (!target.startsWith(directory + sep)) {
  throw new Error('Fixture must remain in the fixtures directory.');
}

mkdirSync(directory, { recursive: true });
const prefix = ['GHAS', 'TRAINING', 'ONLY'].join('_');
const value = `${prefix}_${randomBytes(16).toString('hex')}`;
writeFileSync(target, `Synthetic training value. Not a credential. Cannot authenticate anywhere.\ntraining_value=${value}\n`,
  { flag: 'wx' });
console.log(`Created synthetic fixture: ${target}`);
console.log('A matching published custom pattern is required; this is not a real provider token.');
