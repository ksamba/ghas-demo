import { app } from './app.js';

const server = app.listen(3000, '127.0.0.1', () => {
  console.log('Training sample listening at http://127.0.0.1:3000/hello?name=Developer');
  console.log('Do not expose this training application to a network or deploy it.');
});

server.on('error', (error) => {
  console.error('Unable to start the training application:', error);
  process.exitCode = 1;
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close((error) => {
      if (error) {
        console.error('Unable to close the training application:', error);
        process.exitCode = 1;
      }
    });
  });
}
