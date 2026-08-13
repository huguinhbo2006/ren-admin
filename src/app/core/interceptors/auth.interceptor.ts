import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenService } from '../auth/token.service';

/**
 * Auth Interceptor (funcional — Angular 22)
 *
 * Inyecta el Bearer token de Sanctum en todas las peticiones
 * a la API. Si no hay token, la petición continúa sin cabecera.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const token = tokenService.getToken();

  // Solo inyectar en peticiones a la API
  if (!token || !req.url.includes('/api/')) {
    return next(req);
  }

  const authReq = req.clone({
    headers: req.headers
      .set('Authorization', `Bearer ${token}`)
      .set('Accept', 'application/json')
      .set('Content-Type', req.headers.get('Content-Type') ?? 'application/json'),
  });

  return next(authReq);
};
