import localtunnel from 'localtunnel';

async function start() {
  try {
    const tunnel = await localtunnel({ port: 5173 });
    console.log(`\n========================================`);
    console.log(`PUBLIC LIVE PREVIEW URL: ${tunnel.url}`);
    console.log(`========================================\n`);

    tunnel.on('close', () => {
      console.log('Tunnel closed, reconnecting in 3s...');
      setTimeout(start, 3000);
    });

    tunnel.on('error', (err) => {
      console.error('Tunnel error:', err);
    });
  } catch (err) {
    console.error('Failed to create tunnel, retrying in 3s...', err);
    setTimeout(start, 3000);
  }
}

start();

// Keep node process alive indefinitely
setInterval(() => {}, 1000 * 60 * 60);
