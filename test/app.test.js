import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { once } from 'node:events';
import { app } from '../src/app.js';

let server;
let baseUrl;

before(async () => {
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

//comment
after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
});

test('health endpoint identifies the training application', async () => {
  const response = await fetch(`${baseUrl}/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    status: 'ok',
    purpose: 'local security training only'
  });
});

test('greets a named developer in HTML', async () => {
  const response = await fetch(`${baseUrl}/hello?name=Developer`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /^text\/html/);
  assert.equal(await response.text(), '<h1>Hello, Developer!</h1>');
});

test('defaults to world when the name is missing', async () => {
  const response = await fetch(`${baseUrl}/hello`);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), '<h1>Hello, world!</h1>');
});

test('rejects repeated name parameters explicitly', async () => {
  const response = await fetch(`${baseUrl}/hello?name=one&name=two`);
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: 'name must be a string of at most 2000 characters'
  });
});

test('rejects names exceeding the supported length', async () => {
  const response = await fetch(`${baseUrl}/hello?name=${'a'.repeat(2001)}`);
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /at most 2000 characters/);
});
