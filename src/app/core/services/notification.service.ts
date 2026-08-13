import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiResponse, Notification } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/notifications`;

  readonly notifications = signal<Notification[]>([]);
  readonly unreadCount = signal<number>(0);
  readonly loading = signal(false);

  loadNotifications(): Observable<ApiResponse<Notification[]>> {
    this.loading.set(true);
    return this.http.get<ApiResponse<Notification[]>>(this.api).pipe(
      tap((res) => {
        this.notifications.set(res.data);
        this.loading.set(false);
      }),
    );
  }

  loadUnreadCount(): Observable<ApiResponse<{ unread_count: number }>> {
    return this.http.get<ApiResponse<{ unread_count: number }>>(`${this.api}/unread-count`).pipe(
      tap((res) => this.unreadCount.set(res.data.unread_count)),
    );
  }

  markAsRead(id: number): Observable<ApiResponse<Notification>> {
    return this.http.patch<ApiResponse<Notification>>(`${this.api}/${id}/read`, {}).pipe(
      tap(() => {
        this.notifications.update((items) =>
          items.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
        );
        this.unreadCount.update((c) => Math.max(0, c - 1));
      }),
    );
  }

  markAllAsRead(): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.api}/read-all`, {}).pipe(
      tap(() => {
        this.notifications.update((items) =>
          items.map((n) => ({ ...n, read_at: new Date().toISOString() }))
        );
        this.unreadCount.set(0);
      }),
    );
  }
}
