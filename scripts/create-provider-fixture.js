import { randomInt } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { crc32 } from 'node:zlib';

const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const body = Array.from({ length: 30 }, () => characters[randomInt(characters.length)]).join('');
const prefix = 'ghp_';
const alphabets = [
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
];

function base62(value, alphabet) {
  let encoded = '';
  do {
    encoded = alphabet[value % 62] + encoded;
    value = Math.floor(value / 62);
  } while (value > 0);
  return encoded.padStart(6, '0');
}

const candidates = alphabets.flatMap((alphabet) => [body, prefix + body].map((input) =>
  prefix + body + base62(crc32(Buffer.from(input)), alphabet)));
const directory = fileURLToPath(new URL('../fixtures/', import.meta.url));
mkdirSync(directory, { recursive: true });
const target = fileURLToPath(new URL('../fixtures/provider-training.txt', import.meta.url));
writeFileSync(target, [
  'SYNTHETIC TRAINING FIXTURES ONLY. These strings were never issued by GitHub.',
  'They have no account, permissions, or authentication capability.',
  'Candidates exercise documented token-format checksums without creating a credential.',
  ...candidates.map((candidate, index) => `synthetic_candidate_${index + 1}=${candidate}`),
  ''
].join('\n'), { flag: 'wx' });
console.log(`Created unissued, nonfunctional provider-format fixtures: ${target}`);
console.log('Do not use these values for authentication. Only an actual rejected push proves detection.');
