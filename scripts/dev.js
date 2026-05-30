const { spawn } = require('node:child_process');
const http = require('node:http');
const net = require('node:net');
const os = require('node:os');

const networkMode = process.env.DEV_NETWORK_MODE === 'lan' ? 'lan' : process.env.DEV_NETWORK_MODE === 'tunnel' ? 'tunnel' : 'local';
const apiPort = Number(process.env.API_PORT || 3333);
const localApiUrl = `http://127.0.0.1:${apiPort}`;
const children = [];

function run(command, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, {
      stdio: 'inherit',
      shell: true,
      ...options,
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} exited with code ${code}`));
    });
    child.on('error', reject);
  });
}

function start(command, options = {}) {
  const child = spawn(command, {
    stdio: 'inherit',
    shell: true,
    ...options,
  });

  children.push(child);
  return child;
}

function stopChildren() {
  for (const child of children) {
    if (!child.killed) {
      child.kill();
    }
  }
}

function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: '127.0.0.1', port });

    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });

    socket.once('error', () => {
      resolve(false);
    });
  });
}

function isHealthyApi(url) {
  return new Promise((resolve) => {
    const request = http.get(`${url}/health`, (response) => {
      resolve(response.statusCode === 200);
      response.resume();
    });

    request.once('error', () => resolve(false));
    request.setTimeout(3000, () => {
      request.destroy();
      resolve(false);
    });
  });
}

async function findAvailablePort(startPort) {
  const busy = await isPortOpen(startPort);
  if (!busy) {
    return startPort;
  }

  return findAvailablePort(startPort + 1);
}

function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  const candidates = [];

  for (const addresses of Object.values(interfaces)) {
    if (!addresses) {
      continue;
    }

    for (const address of addresses) {
      if (address.family === 'IPv4' && !address.internal) {
        candidates.push(address.address);
      }
    }
  }

  const preferred = candidates.find((address) => {
    return address.startsWith('192.168.') || address.startsWith('10.') || /^172\.(1[6-9]|2\d|3[0-1])\./.test(address);
  });

  return preferred || candidates[0] || null;
}

process.on('SIGINT', () => {
  stopChildren();
  process.exit(0);
});

process.on('SIGTERM', () => {
  stopChildren();
  process.exit(0);
});

(async () => {
  await run('pnpm --dir api setup');

  const expoPort = await findAvailablePort(8081);
  const apiPortBusy = await isPortOpen(apiPort);
  const localIpAddress = networkMode === 'lan' ? getLocalIpAddress() : null;

  if (networkMode === 'lan' && !localIpAddress && !process.env.EXPO_SYNC_API_URL) {
    throw new Error('Nao foi possivel detectar o IP local da maquina para o modo LAN. Defina EXPO_SYNC_API_URL manualmente.');
  }

  const syncApiUrl = process.env.EXPO_SYNC_API_URL || (networkMode === 'lan' ? `http://${localIpAddress}:${apiPort}` : localApiUrl);
  const existingApiIsHealthy = apiPortBusy ? await isHealthyApi(localApiUrl) : false;

  let api = null;

  if (apiPortBusy) {
    if (!existingApiIsHealthy) {
      throw new Error(`A porta ${apiPort} ja esta em uso por outro processo que nao respondeu em ${localApiUrl}/health.`);
    }

    console.log(`API ja disponivel em ${localApiUrl}. Reutilizando instancia existente.`);
  } else {
    api = start('pnpm --dir api dev');
  }

  console.log(`API de sync configurada em ${syncApiUrl}.`);
  console.log(`Expo sera iniciado na porta ${expoPort} em modo ${networkMode.toUpperCase()}.`);
  if (networkMode === 'lan') {
    console.log('Se o QR code nao abrir no celular, tente: pnpm dev:tunnel');
  }

  const expoCommand = networkMode === 'lan'
    ? `pnpm exec expo start --go --host lan --port ${expoPort}`
    : networkMode === 'tunnel'
      ? `pnpm exec expo start --go --host tunnel --port ${expoPort}`
      : `pnpm exec expo start --go --port ${expoPort}`;
  const app = start(expoCommand, {
    env: {
      ...process.env,
      EXPO_SYNC_API_URL: syncApiUrl,
    },
  });

  if (api) {
    api.on('exit', (code) => {
      stopChildren();
      process.exit(code ?? 0);
    });
  }

  app.on('exit', (code) => {
    stopChildren();
    process.exit(code ?? 0);
  });
})().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
