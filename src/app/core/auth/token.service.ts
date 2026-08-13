import { Injectable } from '@angular/core';

const TOKEN_KEY = 'rentame_token';
const USER_KEY  = 'rentame_user';

/**
 * TokenService
 *
 * Gestiona el almacenamiento seguro del token de Sanctum en el browser.
 * Para la versión web (Angular), se usa localStorage.
 * La app Ionic usa Capacitor Preferences (más seguro).
 */
@Injectable({ providedIn: 'root' })
export class TokenService {

  /** Guarda el token de autenticación. */
  saveToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  /** Recupera el token actual, o null si no existe. */
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  /** Elimina el token (logout). */
  removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  }

  /** Verifica si existe un token guardado. */
  hasToken(): boolean {
    return !!localStorage.getItem(TOKEN_KEY);
  }

  /** Guarda los datos básicos del usuario para acceso rápido. */
  saveUser(user: object): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  /** Recupera los datos del usuario guardados. */
  getUser<T>(): T | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  }

  /** Limpia todo (token + usuario). */
  clearAll(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}
