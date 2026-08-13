import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { ApiResponse, ExtraService } from '../../../shared/models';

@Injectable({ providedIn: 'root' })
export class ExtraServiceService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/extra-services`;

  readonly services = signal<ExtraService[]>([]);
  readonly loading = signal(false);

  loadServices(): Observable<ApiResponse<ExtraService[]>> {
    this.loading.set(true);
    return this.http.get<ApiResponse<ExtraService[]>>(this.api).pipe(
      tap((res) => {
        this.services.set(res.data);
        this.loading.set(false);
      }),
    );
  }

  createService(data: Partial<ExtraService>): Observable<ApiResponse<ExtraService>> {
    return this.http.post<ApiResponse<ExtraService>>(this.api, data).pipe(
      tap((res) => {
        this.services.update((items) => [...items, res.data]);
      }),
    );
  }

  deleteService(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.api}/${id}`).pipe(
      tap(() => {
        this.services.update((items) => items.filter((s) => s.id !== id));
      }),
    );
  }
}
