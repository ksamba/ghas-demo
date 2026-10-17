import { randomInt } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { crc32 } from 'node:zlib';

const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const body = Array.from({ length: 30 }, () => characters[randomInt(characters.length)]).join('');
const prefix = 'ghp_';
function base62(value) {
  let encoded = '';
  do {
    encoded = characters[value % 62] + encoded;
    value = Math.floor(value / 62);
  } while (value > 0);
  return encoded.padStart(6, '0');
}

const value = prefix + body + base62(crc32(Buffer.from(body)));
const directory = fileURLToPath(new URL('../fixtures/', import.meta.url));
mkdirSync(directory, { recursive: true });
const target = fileURLToPath(new URL('../fixtures/provider-training.txt', import.meta.url));
writeFileSync(target, [
  'SYNTHETIC TRAINING FIXTURES ONLY. These strings were never issued by GitHub.',
  'They have no account, permissions, or authentication capability.',
  'This value exercises the documented token-format checksum without creating a credential.',
  `synthetic_training_value=${value}`,
  ''
].join('\n'), { flag: 'wx' });
console.log(`Created unissued, nonfunctional provider-format fixtures: ${target}`);
console.log('Do not use these values for authentication. Only an actual rejected push proves detection.');
