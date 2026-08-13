import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { ApiResponse } from '../../../shared/models';

export interface ExpenseCategoryItem {
  id: number;
  user_id?: number | null;
  name: string;
  icon?: string;
  color?: string;
  description?: string;
}

@Injectable({ providedIn: 'root' })
export class ExpenseCategoryService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/expense-categories`;

  readonly categories = signal<ExpenseCategoryItem[]>([]);
  readonly loading = signal(false);

  loadCategories(): Observable<ApiResponse<ExpenseCategoryItem[]>> {
    this.loading.set(true);
    return this.http.get<ApiResponse<ExpenseCategoryItem[]>>(this.api).pipe(
      tap((res) => {
        this.categories.set(res.data);
        this.loading.set(false);
      })
    );
  }

  createCategory(data: Partial<ExpenseCategoryItem>): Observable<ApiResponse<ExpenseCategoryItem>> {
    return this.http.post<ApiResponse<ExpenseCategoryItem>>(this.api, data).pipe(
      tap((res) => {
        this.categories.update((items) => [...items, res.data]);
      })
    );
  }

  deleteCategory(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.api}/${id}`).pipe(
      tap(() => {
        this.categories.update((items) => items.filter((c) => c.id !== id));
      })
    );
  }
}
