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

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
});

test('renders angle brackets as text instead of HTML markup', async () => {
  const response = await fetch(`${baseUrl}/hello?name=${encodeURIComponent('<b>training</b>')}`);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), '<h1>Hello, &lt;b&gt;training&lt;/b&gt;!</h1>');
});

test('encodes ampersands and both quote styles', async () => {
  const response = await fetch(`${baseUrl}/hello?name=${encodeURIComponent('A&B "C" \'D\'')}`);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), '<h1>Hello, A&amp;B &quot;C&quot; &#39;D&#39;!</h1>');
});
