import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, map } from 'rxjs/operators';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { TokenService } from './token.service';
import type {
  User,
  AuthTokenResponse,
  ApiResponse,
  PlanUsage,
} from '../../shared/models';

/**
 * AuthService
 *
 * Gestiona el estado de autenticación usando Angular Signals.
 * - currentUser: signal con el usuario autenticado (null si no hay sesión)
 * - isAuthenticated: computed que retorna true si hay usuario
 * - userPlan: computed con el plan del usuario actual
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly tokenService = inject(TokenService);
  private readonly api = environment.apiUrl;

  // ---------------------------------------------------------------------------
  // State (Signals)
  // ---------------------------------------------------------------------------

  /** Usuario actualmente autenticado. null = no autenticado. */
  readonly currentUser = signal<User | null>(
    this.tokenService.getUser<User>()
  );

  /** true si hay una sesión activa. */
  readonly isAuthenticated = computed(() => !!this.currentUser());

  /** Plan del usuario actual. */
  readonly userPlan = computed(() => this.currentUser()?.plan ?? null);

  /** Slug del plan ('free' | 'pro'). */
  readonly planSlug = computed(() => this.userPlan()?.slug ?? 'free');

  /** true si el usuario tiene plan Pro. */
  readonly isPro = computed(() => this.planSlug() === 'pro');

  // ---------------------------------------------------------------------------
  // Methods
  // ---------------------------------------------------------------------------

  /**
   * Inicia sesión con email y contraseña.
   * Guarda el token y actualiza el signal de usuario.
   */
  login(email: string, password: string): Observable<AuthTokenResponse> {
    return this.http
      .post<ApiResponse<AuthTokenResponse>>(`${this.api}/auth/login`, {
        email,
        password,
      })
      .pipe(
        map((res) => res.data),
        tap((data) => this.handleAuthSuccess(data)),
      );
  }

  /**
   * Registra un nuevo usuario.
   */
  register(payload: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    plan_id?: number;
  }): Observable<AuthTokenResponse> {
    return this.http
      .post<ApiResponse<AuthTokenResponse>>(`${this.api}/auth/register`, payload)
      .pipe(
        map((res) => res.data),
        tap((data) => this.handleAuthSuccess(data)),
      );
  }

  /**
   * Cierra sesión en el servidor y limpia el estado local.
   */
  logout(): Observable<void> {
    return this.http
      .post<ApiResponse<void>>(`${this.api}/auth/logout`, {})
      .pipe(
        tap(() => this.clearSession()),
        map(() => undefined),
      );
  }

  /**
   * Obtiene los datos actualizados del usuario autenticado.
   * Útil para refrescar después de cambiar el plan.
   */
  me(): Observable<User> {
    return this.http
      .get<ApiResponse<User>>(`${this.api}/auth/me`)
      .pipe(
        map((res) => res.data),
        tap((user) => {
          this.currentUser.set(user);
          this.tokenService.saveUser(user);
        }),
      );
  }

  /**
   * Actualiza el perfil del usuario.
   */
  updateProfile(payload: Partial<Pick<User, 'name' | 'phone'>>): Observable<User> {
    return this.http
      .patch<ApiResponse<User>>(`${this.api}/auth/profile`, payload)
      .pipe(
        map((res) => res.data),
        tap((user) => {
          this.currentUser.set(user);
          this.tokenService.saveUser(user);
        }),
      );
  }

  /**
   * Verifica si el usuario tiene una feature disponible en su plan.
   */
  hasFeature(feature: keyof NonNullable<User['plan']>['features'] | string): boolean {
    const features = this.userPlan()?.features as Record<string, boolean> | undefined;
    return !!(features?.[feature]);
  }

  /**
   * Limpia la sesión local (sin llamar al servidor).
   * Llamado por el error interceptor cuando hay 401.
   */
  clearSession(): void {
    this.tokenService.clearAll();
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private handleAuthSuccess(data: AuthTokenResponse): void {
    this.tokenService.saveToken(data.token);
    this.tokenService.saveUser(data.user);
    this.currentUser.set(data.user);
  }
}
