import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { ApiResponse, Asset, PaginationMeta } from '../../../shared/models';

export interface AssetFilters {
  status?: string;
  category_id?: number | string;
  search?: string;
  sort?: string;
  page?: number;
  per_page?: number;
}

@Injectable({ providedIn: 'root' })
export class AssetService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/assets`;

  readonly assets = signal<Asset[]>([]);
  readonly pagination = signal<PaginationMeta | null>(null);
  readonly loading = signal(false);

  loadAssets(filters: AssetFilters = {}): Observable<ApiResponse<Asset[]>> {
    this.loading.set(true);

    let params = new HttpParams();
    if (filters.status) params = params.set('filter[status]', filters.status);
    if (filters.category_id) params = params.set('filter[category_id]', filters.category_id.toString());
    if (filters.search) params = params.set('filter[search]', filters.search);
    if (filters.sort) params = params.set('sort', filters.sort);
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.per_page) params = params.set('per_page', filters.per_page.toString());

    return this.http.get<ApiResponse<Asset[]>>(this.api, { params }).pipe(
      tap((res) => {
        this.assets.set(res.data);
        if (res.meta) {
          this.pagination.set(res.meta);
        }
        this.loading.set(false);
      }),
    );
  }

  getAssetById(id: number): Observable<ApiResponse<Asset>> {
    return this.http.get<ApiResponse<Asset>>(`${this.api}/${id}`);
  }

  createAsset(data: Partial<Asset>): Observable<ApiResponse<Asset>> {
    return this.http.post<ApiResponse<Asset>>(this.api, data).pipe(
      tap((res) => {
        this.assets.update((items) => [res.data, ...items]);
      }),
    );
  }

  updateAsset(id: number, data: Partial<Asset>): Observable<ApiResponse<Asset>> {
    return this.http.put<ApiResponse<Asset>>(`${this.api}/${id}`, data).pipe(
      tap((res) => {
        this.assets.update((items) =>
          items.map((a) => (a.id === id ? res.data : a))
        );
      }),
    );
  }

  deleteAsset(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.api}/${id}`).pipe(
      tap(() => {
        this.assets.update((items) => items.filter((a) => a.id !== id));
      }),
    );
  }

  uploadPhoto(id: number, file: File): Observable<ApiResponse<Asset>> {
    const formData = new FormData();
    formData.append('photo', file);

    return this.http.post<ApiResponse<Asset>>(`${this.api}/${id}/photos`, formData).pipe(
      tap((res) => {
        this.assets.update((items) =>
          items.map((a) => (a.id === id ? res.data : a))
        );
      }),
    );
  }
}
