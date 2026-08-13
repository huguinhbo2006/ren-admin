import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { ApiResponse, AssetCategory } from '../../../shared/models';

@Injectable({ providedIn: 'root' })
export class AssetCategoryService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/asset-categories`;

  readonly categories = signal<AssetCategory[]>([]);
  readonly loading = signal(false);

  loadCategories(): Observable<ApiResponse<AssetCategory[]>> {
    this.loading.set(true);
    return this.http.get<ApiResponse<AssetCategory[]>>(this.api).pipe(
      tap((res) => {
        this.categories.set(res.data);
        this.loading.set(false);
      }),
    );
  }

  createCategory(data: Partial<AssetCategory>): Observable<ApiResponse<AssetCategory>> {
    return this.http.post<ApiResponse<AssetCategory>>(this.api, data).pipe(
      tap((res) => {
        this.categories.update((cats) => [...cats, res.data]);
      }),
    );
  }

  updateCategory(id: number, data: Partial<AssetCategory>): Observable<ApiResponse<AssetCategory>> {
    return this.http.put<ApiResponse<AssetCategory>>(`${this.api}/${id}`, data).pipe(
      tap((res) => {
        this.categories.update((cats) =>
          cats.map((c) => (c.id === id ? res.data : c))
        );
      }),
    );
  }

  deleteCategory(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.api}/${id}`).pipe(
      tap(() => {
        this.categories.update((cats) => cats.filter((c) => c.id !== id));
      }),
    );
  }
}
