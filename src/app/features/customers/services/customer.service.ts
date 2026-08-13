import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { ApiResponse, Customer, PaginationMeta } from '../../../shared/models';

export interface CustomerFilters {
  is_active?: boolean;
  search?: string;
  sort?: string;
  page?: number;
  per_page?: number;
}

export interface CustomerStatement {
  customer: {
    id: number;
    name: string;
    phone: string;
    email: string | null;
    rfc: string | null;
  };
  summary: {
    total_billed_cents: number;
    total_paid_cents: number;
    balance_owed_cents: number;
  };
  rentals: {
    rental_id: number;
    folio: string;
    asset_name: string;
    start_date: string;
    end_date: string;
    total_amount_cents: number;
    paid_amount_cents: number;
    balance_cents: number;
    status: string;
    payment_status: string;
  }[];
}

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/customers`;

  readonly customers = signal<Customer[]>([]);
  readonly pagination = signal<PaginationMeta | null>(null);
  readonly loading = signal(false);

  loadCustomers(filters: CustomerFilters = {}): Observable<ApiResponse<Customer[]>> {
    this.loading.set(true);

    let params = new HttpParams();
    if (filters.is_active !== undefined) params = params.set('filter[is_active]', String(filters.is_active));
    if (filters.search) params = params.set('filter[search]', filters.search);
    if (filters.sort) params = params.set('sort', filters.sort);
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.per_page) params = params.set('per_page', filters.per_page.toString());

    return this.http.get<ApiResponse<Customer[]>>(this.api, { params }).pipe(
      tap((res) => {
        this.customers.set(res.data);
        if (res.meta) {
          this.pagination.set(res.meta);
        }
        this.loading.set(false);
      }),
    );
  }

  getCustomerById(id: number): Observable<ApiResponse<Customer>> {
    return this.http.get<ApiResponse<Customer>>(`${this.api}/${id}`);
  }

  createCustomer(data: Partial<Customer>): Observable<ApiResponse<Customer>> {
    return this.http.post<ApiResponse<Customer>>(this.api, data).pipe(
      tap((res) => {
        this.customers.update((items) => [res.data, ...items]);
      }),
    );
  }

  updateCustomer(id: number, data: Partial<Customer>): Observable<ApiResponse<Customer>> {
    return this.http.put<ApiResponse<Customer>>(`${this.api}/${id}`, data).pipe(
      tap((res) => {
        this.customers.update((items) =>
          items.map((c) => (c.id === id ? res.data : c))
        );
      }),
    );
  }

  deleteCustomer(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.api}/${id}`).pipe(
      tap(() => {
        this.customers.update((items) => items.filter((c) => c.id !== id));
      }),
    );
  }

  getCustomerStatement(id: number): Observable<ApiResponse<CustomerStatement>> {
    return this.http.get<ApiResponse<CustomerStatement>>(`${this.api}/${id}/statement`);
  }
}
