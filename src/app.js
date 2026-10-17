import express from 'express';
import escapeHtml from 'escape-html';

export const app = express();
app.disable('x-powered-by');

app.get('/health', (_request, response) => {
  response.json({ status: 'ok', purpose: 'local security training only' });
});

app.get('/hello', (request, response) => {
  const name = request.query.name ?? 'world';
  if (typeof name !== 'string' || name.length > 2000) {
    response.status(400).json({ error: 'name must be a string of at most 2000 characters' });
    return;
  }

  // Intentionally unsafe training branch: never deploy or merge into main.
  response.type('html').send(`<h1>Hello, ${name}!</h1>`);
});
