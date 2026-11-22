import { HttpInterceptorFn } from '@angular/common/http';

// Render inyecta este origen público al compilar. En desarrollo se usa el proxy.
declare const LIMPIAHUANCAYO_API_ORIGIN: string | undefined;

const origin = typeof LIMPIAHUANCAYO_API_ORIGIN === 'string' ? LIMPIAHUANCAYO_API_ORIGIN : '';

export const apiOriginInterceptor: HttpInterceptorFn = (request, next) =>
  next(origin && request.url.startsWith('/api/')
    ? request.clone({ url: origin + request.url })
    : request);
