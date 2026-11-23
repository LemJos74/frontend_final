import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { Role, landingPath } from '../auth/models/session.model';
import { AuthService } from '../auth/services/auth.service';
import { SessionStore } from '../auth/services/session.store';

export const requireRole = (role: Role): CanActivateChildFn => async () => {
  const auth = inject(AuthService);
  const session = inject(SessionStore);
  const router = inject(Router);
  const login = router.parseUrl('/login');

  if (!session.token()) return login;
  try {
    // Reutiliza el perfil validado solo en la navegación que inicia el login.
    const verified = auth.profile();
    const profile = verified && router.currentNavigation()?.extras.info === verified
      ? verified
      : await auth.loadProfile();
    return profile.rol === role ? true : router.parseUrl(landingPath(profile.rol));
  } catch {
    return login;
  }
};

export const guestGuard: CanActivateChildFn = async () => {
  const auth = inject(AuthService);
  const session = inject(SessionStore);
  const router = inject(Router);

  if (!session.token()) return true;
  try {
    const profile = await auth.loadProfile();
    return router.parseUrl(landingPath(profile.rol));
  } catch {
    return true;
  }
};
