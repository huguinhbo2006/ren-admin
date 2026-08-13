import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withViewTransitions,
} from '@angular/router';
import {
  provideHttpClient,
  withInterceptors,
  withFetch,
} from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // Error listeners globales del browser
    provideBrowserGlobalErrorListeners(),

    // Zoneless Change Detection (Angular 22 — máximo performance)
    // Usa Signals en lugar de Zone.js para detección de cambios
    provideZonelessChangeDetection(),

    // Router con animaciones de transición nativas y binding automático de inputs
    provideRouter(
      routes,
      withComponentInputBinding(),   // inputs del componente desde route params
      withViewTransitions(),          // transiciones CSS nativas entre rutas
    ),

    // HttpClient con interceptores funcionales (moderno, sin clases)
    provideHttpClient(
      withFetch(),                   // usa fetch API en lugar de XMLHttpRequest
      withInterceptors([
        authInterceptor,             // inyecta Bearer token
        errorInterceptor,            // maneja errores globales 401/403/500
      ]),
    ),
  ],
};
