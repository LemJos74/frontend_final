# LimpiaHuancayo — Frontend

Aplicación Angular 22 con TypeScript, SCSS, Signal Forms, Bootstrap 5 y Leaflet. Consume la API de LimpiaHuancayo.

## Desarrollo local

Desde la raíz del frontend, ejecuta `npm ci` y `npm start`. En otra terminal, desde la raíz del backend, ejecuta `uv run uvicorn backend.main:app --reload`. Abre http://localhost:4200. El proxy de desarrollo envía `/api` a `http://127.0.0.1:8000`.

El login dirige a `/ciudadano/reportes` o a `/admin/dashboard` según el perfil de la API. La sesión se conserva durante la vida de la pestaña y se elimina al cerrar sesión. `npm run build` compila una versión que conserva las rutas de API relativas.

## Render Static Site

Conecta el repositorio de este frontend desde Render. [Configuración de Static Sites](https://render.com/docs/static-sites) · [Blueprints](https://render.com/docs/blueprint-spec)

| Campo | Valor |
| --- | --- |
| Root Directory | Raíz del repositorio |
| Build Command | `npm ci && npm run build:render` |
| Publish Directory | `dist/frontend-final/browser` |
| Redirects/Rewrites | Rewrite de `/*` a `/index.html` |
| `NODE_VERSION` | `24.21.0` |
| `SKIP_INSTALL_DEPS` | `true`. El comando de build ya ejecuta `npm ci`. |
| `API_BASE_URL` | Origen HTTPS público de FastAPI, sin `/api`, ruta ni credenciales. |

El archivo `render.yaml` contiene la misma configuración para un Blueprint. El único valor propio de la aplicación en ese build es el origen público de la API. Configura en el backend `CORS_ORIGINS` con el origen HTTPS del sitio estático. Mantén las credenciales de PostgreSQL y las claves del backend en el servicio de FastAPI.

Para reproducir el build en PowerShell, asigna primero `API_BASE_URL` en la terminal.

```powershell
$env:API_BASE_URL = 'https://api.ejemplo.invalid'
npm run build:render
```
