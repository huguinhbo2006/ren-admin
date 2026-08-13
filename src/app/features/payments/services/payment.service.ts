import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { ApiResponse, PaginationMeta, Payment } from '../../../shared/models';

export interface PaymentFilters {
  rental_id?: number | string;
  method?: string;
  type?: string;
  page?: number;
  per_page?: number;
}

export interface PaymentSummary {
  month: string;
  total_income_cents: number;
  by_method: {
    method: string;
    total_cents: number;
    count: number;
  }[];
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/payments`;

  readonly payments = signal<Payment[]>([]);
  readonly pagination = signal<PaginationMeta | null>(null);
  readonly summary = signal<PaymentSummary | null>(null);
  readonly loading = signal(false);

  loadPayments(filters: PaymentFilters = {}): Observable<ApiResponse<Payment[]>> {
    this.loading.set(true);

    let params = new HttpParams();
    if (filters.rental_id) params = params.set('filter[rental_id]', filters.rental_id.toString());
    if (filters.method) params = params.set('filter[method]', filters.method);
    if (filters.type) params = params.set('filter[type]', filters.type);
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.per_page) params = params.set('per_page', filters.per_page.toString());

    return this.http.get<ApiResponse<Payment[]>>(this.api, { params }).pipe(
      tap((res) => {
        this.payments.set(res.data);
        if (res.meta) {
          this.pagination.set(res.meta);
        }
        this.loading.set(false);
      }),
    );
  }

  loadSummary(): Observable<ApiResponse<PaymentSummary>> {
    return this.http.get<ApiResponse<PaymentSummary>>(`${this.api}/summary`).pipe(
      tap((res) => this.summary.set(res.data)),
    );
  }

  createPayment(data: Record<string, unknown>): Observable<ApiResponse<Payment>> {
    return this.http.post<ApiResponse<Payment>>(this.api, data).pipe(
      tap((res) => {
        this.payments.update((items) => [res.data, ...items]);
        this.loadSummary().subscribe();
      }),
    );
  }

  deletePayment(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.api}/${id}`).pipe(
      tap(() => {
        this.payments.update((items) => items.filter((p) => p.id !== id));
        this.loadSummary().subscribe();
      }),
    );
  }

  downloadReceipt(id: number): void {
    this.http.get(`${this.api}/${id}/receipt-pdf`, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Recibo_Pago_${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
    });
  }
}
