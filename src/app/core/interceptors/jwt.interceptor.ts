import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { AuthService } from '../auth/services/auth.service';
import { SessionStore } from '../auth/services/session.store';

export const jwtInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith('/api/') || request.url === '/api/auth/login' ||
      request.url === '/api/usuarios/registro') {
    return next(request);
  }

  const session = inject(SessionStore);
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = session.token();
  if (!token) return next(request);

  return next(request.clone({ setHeaders: { Authorization: 'Bearer ' + token } })).pipe(
    tap({
      error: (error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 401 && session.token() === token) {
          auth.logout();
          void router.navigateByUrl('/login', { replaceUrl: true });
        }
      },
    }),
  );
};
