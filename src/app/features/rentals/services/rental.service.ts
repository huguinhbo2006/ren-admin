import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { ApiResponse, PaginationMeta, Rental } from '../../../shared/models';

export interface RentalFilters {
  status?: string;
  payment_status?: string;
  customer_id?: number | string;
  asset_id?: number | string;
  sort?: string;
  page?: number;
  per_page?: number;
}

@Injectable({ providedIn: 'root' })
export class RentalService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/rentals`;

  readonly rentals = signal<Rental[]>([]);
  readonly pagination = signal<PaginationMeta | null>(null);
  readonly loading = signal(false);

  loadRentals(filters: RentalFilters = {}): Observable<ApiResponse<Rental[]>> {
    this.loading.set(true);

    let params = new HttpParams();
    if (filters.status) params = params.set('filter[status]', filters.status);
    if (filters.payment_status) params = params.set('filter[payment_status]', filters.payment_status);
    if (filters.customer_id) params = params.set('filter[customer_id]', filters.customer_id.toString());
    if (filters.asset_id) params = params.set('filter[asset_id]', filters.asset_id.toString());
    if (filters.sort) params = params.set('sort', filters.sort);
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.per_page) params = params.set('per_page', filters.per_page.toString());

    return this.http.get<ApiResponse<Rental[]>>(this.api, { params }).pipe(
      tap((res) => {
        this.rentals.set(res.data);
        if (res.meta) {
          this.pagination.set(res.meta);
        }
        this.loading.set(false);
      }),
    );
  }

  getRentalById(id: number): Observable<ApiResponse<Rental>> {
    return this.http.get<ApiResponse<Rental>>(`${this.api}/${id}`);
  }

  createRental(data: Record<string, unknown>): Observable<ApiResponse<Rental>> {
    return this.http.post<ApiResponse<Rental>>(this.api, data).pipe(
      tap((res) => {
        this.rentals.update((items) => [res.data, ...items]);
      }),
    );
  }

  updateRental(id: number, data: Record<string, unknown>): Observable<ApiResponse<Rental>> {
    return this.http.put<ApiResponse<Rental>>(`${this.api}/${id}`, data).pipe(
      tap((res) => {
        this.rentals.update((items) =>
          items.map((r) => (r.id === id ? res.data : r))
        );
      }),
    );
  }

  completeRental(id: number): Observable<ApiResponse<Rental>> {
    return this.http.post<ApiResponse<Rental>>(`${this.api}/${id}/complete`, {}).pipe(
      tap((res) => {
        this.rentals.update((items) =>
          items.map((r) => (r.id === id ? res.data : r))
        );
      }),
    );
  }

  cancelRental(id: number): Observable<ApiResponse<Rental>> {
    return this.http.post<ApiResponse<Rental>>(`${this.api}/${id}/cancel`, {}).pipe(
      tap((res) => {
        this.rentals.update((items) =>
          items.map((r) => (r.id === id ? res.data : r))
        );
      }),
    );
  }

  downloadPdf(id: number, folio: string): void {
    this.http.get(`${this.api}/${id}/contract-pdf`, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Contrato_${folio}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
    });
  }
}
