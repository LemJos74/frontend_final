# AGENTS.md

## Calidad y CI/CD

- GitHub Actions es un requisito académico del frontend. Valida los cambios con `npm ci`, `npm exec -- tsc --noEmit -p tsconfig.app.json`, las pruebas automatizadas disponibles y `npm run build` con `API_BASE_URL`.
- El frontend todavía no tiene una suite automatizada. Cuando se incorpore, expón su ejecución en el script `test` de `package.json` y ejecútala en CI sin modo interactivo.
- El despliegue a Render depende del CI exitoso en `master` y usa el SHA validado. Guarda el Deploy Hook en GitHub Secrets y evita imprimirlo.
- Conserva el alcance del frontend. Solicita autorización antes de hacer commit, push o activar un despliegue.
