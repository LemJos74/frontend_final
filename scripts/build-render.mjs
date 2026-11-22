import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

function apiOrigin(value) {
  try {
    const url = new URL(value);
    if (url.protocol === 'https:' && !url.username && !url.password &&
        url.pathname === '/' && !url.search && !url.hash) {
      return url.origin;
    }
  } catch {
    // Use the same configuration error below for missing and malformed values.
  }
  return null;
}

const origin = apiOrigin(process.env.API_BASE_URL?.trim() ?? '');
if (!origin) {
  console.error('API_BASE_URL debe ser el origen HTTPS de FastAPI, sin ruta ni credenciales.');
  process.exitCode = 1;
} else {
  const cli = fileURLToPath(new URL('../node_modules/@angular/cli/bin/ng.js', import.meta.url));
  const { status, error } = spawnSync(process.execPath, [
    cli,
    'build',
    '--configuration=production',
    '--define=LIMPIAHUANCAYO_API_ORIGIN=' + JSON.stringify(origin),
  ], { stdio: 'inherit' });

  if (error) console.error('No se pudo ejecutar Angular CLI.');
  process.exitCode = status ?? 1;
}
