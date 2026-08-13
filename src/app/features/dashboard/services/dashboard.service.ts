import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { ApiResponse, DashboardData } from '../../../shared/models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/dashboard`;

  readonly data = signal<DashboardData | null>(null);
  readonly loading = signal(false);

  loadDashboard(): Observable<ApiResponse<DashboardData>> {
    this.loading.set(true);
    return this.http.get<ApiResponse<DashboardData>>(this.api).pipe(
      tap((res) => {
        this.data.set(res.data);
        this.loading.set(false);
      }),
    );
  }
}
