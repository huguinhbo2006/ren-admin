import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { ApiResponse, PaginationMeta, Expense } from '../../../shared/models';

export interface ExpenseFilters {
  type?: string;
  asset_id?: number | string;
  category?: string;
  page?: number;
  per_page?: number;
}

export interface ExpenseSummary {
  month: string;
  total_expense_cents: number;
  by_type: {
    type: string;
    total_cents: number;
    count: number;
  }[];
}

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/expenses`;

  readonly expenses = signal<Expense[]>([]);
  readonly pagination = signal<PaginationMeta | null>(null);
  readonly summary = signal<ExpenseSummary | null>(null);
  readonly loading = signal(false);

  loadExpenses(filters: ExpenseFilters = {}): Observable<ApiResponse<Expense[]>> {
    this.loading.set(true);

    let params = new HttpParams();
    if (filters.type) params = params.set('filter[type]', filters.type);
    if (filters.asset_id) params = params.set('filter[asset_id]', filters.asset_id.toString());
    if (filters.category) params = params.set('filter[category]', filters.category);
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.per_page) params = params.set('per_page', filters.per_page.toString());

    return this.http.get<ApiResponse<Expense[]>>(this.api, { params }).pipe(
      tap((res) => {
        this.expenses.set(res.data);
        if (res.meta) {
          this.pagination.set(res.meta);
        }
        this.loading.set(false);
      }),
    );
  }

  loadSummary(): Observable<ApiResponse<ExpenseSummary>> {
    return this.http.get<ApiResponse<ExpenseSummary>>(`${this.api}/summary`).pipe(
      tap((res) => this.summary.set(res.data)),
    );
  }

  createExpense(data: FormData): Observable<ApiResponse<Expense>> {
    return this.http.post<ApiResponse<Expense>>(this.api, data).pipe(
      tap((res) => {
        this.expenses.update((items) => [res.data, ...items]);
        this.loadSummary().subscribe();
      }),
    );
  }

  deleteExpense(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.api}/${id}`).pipe(
      tap(() => {
        this.expenses.update((items) => items.filter((e) => e.id !== id));
        this.loadSummary().subscribe();
      }),
    );
  }
}
