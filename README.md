# LimpiaHuancayo — Frontend

Aplicación Angular 22 con TypeScript, SCSS, Signal Forms, Bootstrap 5 y Leaflet. Consume la API de LimpiaHuancayo.

## Desarrollo local

Desde la raíz del frontend, ejecuta `npm ci` y `npm start`. En otra terminal, desde la raíz del backend, ejecuta `uv run uvicorn backend.main:app --reload`. Abre http://localhost:4200. El proxy de desarrollo envía `/api` a `http://127.0.0.1:8000`.

El login dirige a `/ciudadano/reportes` o a `/admin/dashboard` según el perfil de la API. La sesión se conserva durante la vida de la pestaña y se elimina al cerrar sesión. El proxy se usa con `npm start`. El build de producción requiere `API_BASE_URL`.

## Render Static Site

Conecta el repositorio de este frontend desde Render. [Configuración de Static Sites](https://render.com/docs/static-sites) · [Blueprints](https://render.com/docs/blueprint-spec)

| Campo | Valor |
| --- | --- |
| Root Directory | Raíz del repositorio |
| Build Command | `npm ci && npm run build` |
| Publish Directory | `dist/frontend-final/browser` |
| Redirects/Rewrites | Rewrite de `/*` a `/index.html` |
| `NODE_VERSION` | `24.21.0` |
| `SKIP_INSTALL_DEPS` | `true`. El comando de build ya ejecuta `npm ci`. |
| `API_BASE_URL` | Origen HTTPS público de FastAPI, sin `/api`, ruta ni credenciales. |

El archivo `render.yaml` contiene la misma configuración para un Blueprint. El único valor propio de la aplicación en ese build es el origen público de la API. Configura en el backend `CORS_ORIGINS` con el origen HTTPS del sitio estático. Mantén las credenciales de PostgreSQL y las claves del backend en el servicio de FastAPI.

Para reproducir el build en PowerShell, asigna primero `API_BASE_URL` en la terminal.

```powershell
$env:API_BASE_URL = 'https://api.ejemplo.invalid'
npm run build
```

## GitHub Actions

[Frontend CI/CD](.github/workflows/ci-cd.yml) se ejecuta en Ubuntu con Node.js 24.21.0 para pushes a `master`, pull requests dirigidos a `master` y ejecuciones manuales. Usa la caché de npm, instala desde `package-lock.json` con `npm ci`, verifica TypeScript y compila con la configuración de producción. El paso `npm test --if-present` ejecutará el script `test` cuando exista. Actualmente el proyecto carece de una suite automatizada y de un objetivo `test` en Angular.

Tras un CI exitoso, un push a `master` solicita el despliegue. En una ejecución manual, selecciona `master` y marca `deploy` solo si deseas publicar. Los pull requests ejecutan únicamente CI. GitHub limita a una las solicitudes de despliegue simultáneas de este workflow y puede reemplazar una solicitud pendiente por otra más reciente. Antes de llamar a Render, el job comprueba la punta de `master` y envía el SHA validado mediante `ref`. Render recompila ese commit con su propia configuración. Un HTTP 200 o 202 confirma que Render aceptó la solicitud. Consulta el estado final en **Deploys**. [Concurrencia en GitHub Actions](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency) · [Deploy Hooks de Render](https://render.com/docs/deploy-hooks)

### Configuración manual

1. En GitHub, abre **Settings → Secrets and variables → Actions → Variables** y crea la variable de repositorio `API_BASE_URL` con el valor `https://backend-final-5748.onrender.com`.
2. En Render, abre el sitio estático del frontend y verifica que apunta a `LemJos74/frontend_final`, rama `master`, y que coincide con la tabla de configuración anterior. Establece el mismo origen HTTPS en la variable `API_BASE_URL` del servicio y desactiva **Auto-Deploy** antes de habilitar el pipeline.
3. En **Settings** del sitio estático, copia la URL completa de **Deploy Hook** y guárdala en **Settings → Secrets and variables → Actions → Secrets** de GitHub como secreto de repositorio `RENDER_DEPLOY_HOOK`. Usa la URL generada por Render y deja que el workflow añada el parámetro `ref`.
4. Cuando se autorice publicar el workflow, revisa el job **Validar frontend** en un pull request hacia `master`. Un push posterior a `master` con CI exitoso ya puede solicitar un despliegue. Confirma en **Deploys** que Render recibió el SHA esperado y que el despliegue terminó correctamente.

### Verificación local

Desde la raíz del frontend, ejecuta en PowerShell con Node.js 24.21.0.

```powershell
$env:CI = 'true'
$env:NG_CLI_ANALYTICS = 'false'
npm.cmd ci
npm.cmd exec -- tsc --noEmit -p tsconfig.app.json
npm.cmd test --if-present
$env:API_BASE_URL = 'https://backend-final-5748.onrender.com'
npm.cmd run build
```
