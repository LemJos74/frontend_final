import { HttpErrorResponse } from '@angular/common/http';

export function apiError(error: unknown, fallback: string): string {
  if (!(error instanceof HttpErrorResponse)) return fallback;
  if (error.status === 0 || error.status === 502 || error.status === 504) {
    return 'No se pudo conectar con la API. Comprueba que FastAPI esté en ejecución.';
  }
  if (error.status === 403) return 'Tu cuenta no tiene permiso para realizar esta acción.';
  if (error.status === 422) return 'Revisa los datos del formulario.';
  const detail: unknown = error.error?.detail;
  return error.status < 500 && typeof detail === 'string' ? detail : fallback;
}
