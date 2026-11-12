import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Protects administrative routes (`/panel`) against unauthenticated access.
 * Validates active JWT sessions against `GET /api/auth/me` before allowing entry.
 */
export const authGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated() && !authService.accessToken()) {
    return router.createUrlTree(['/administrador']);
  }

  if (authService.accessToken()) {
    const validated = await authService.validarSesionBackend();
    if (!validated) {
      return router.createUrlTree(['/administrador']);
    }
  }

  return authService.isAuthenticated()
    ? true
    : router.createUrlTree(['/administrador']);
};

