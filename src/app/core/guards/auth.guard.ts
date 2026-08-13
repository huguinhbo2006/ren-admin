import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

/**
 * AuthGuard
 *
 * Protege rutas que requieren autenticación.
 * Redirige a /login si no hay sesión activa.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};

/**
 * GuestGuard
 *
 * Protege rutas de login/register para que usuarios ya autenticados
 * sean redirigidos al dashboard.
 */
export const guestGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};

/**
 * PlanGuard — Feature Gate
 *
 * Uso en rutas:
 * {
 *   path: 'reports',
 *   canActivate: [planGuard('reports')],
 *   ...
 * }
 */
export const planGuard = (feature: string): CanActivateFn => {
  return () => {
    const auth   = inject(AuthService);
    const router = inject(Router);

    if (auth.hasFeature(feature)) {
      return true;
    }

    return router.createUrlTree(['/upgrade'], {
      queryParams: { feature },
    });
  };
};
