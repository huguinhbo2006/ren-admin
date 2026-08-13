import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

/**
 * Error Interceptor (funcional — Angular 22)
 *
 * Maneja errores HTTP globales:
 * - 401: sesión expirada → redirige a /login
 * - 403: sin permisos → redirige a /forbidden
 * - 500+: error servidor → log
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      switch (error.status) {
        case 401:
          // Token expirado o inválido → limpiar sesión y redirigir
          authService.clearSession();
          router.navigate(['/login'], {
            queryParams: { reason: 'session_expired' },
          });
          break;

        case 403:
          // Sin permisos — puede ser plan insuficiente
          router.navigate(['/forbidden']);
          break;

        case 0:
          // Sin conexión al servidor
          console.error('[Rentame] Sin conexión al servidor API');
          break;

        default:
          if (error.status >= 500) {
            console.error('[Rentame] Error del servidor:', error.status, error.message);
          }
      }

      return throwError(() => error);
    }),
  );
};
