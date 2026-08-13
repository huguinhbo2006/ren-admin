import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { ApiResponse } from '../../../shared/models';

export interface BusinessSettings {
  business_name: string;
  business_rfc: string;
  business_logo: string | null;
  business_logo_url: string | null;
  business_address: string;
  business_phone: string;
  contract_template: string;
  notification_days_before: string;
  currency_symbol: string;
  timezone: string;
  invoice_prefix: string;
}

export interface PlanUsageSummary {
  plan_slug: string;
  plan_name: string;
  expires_at: string | null;
  assets: { used: number; limit: number };
  customers: { used: number; limit: number };
  rentals_this_month: { used: number; limit: number };
  extra_services: { used: number; limit: number };
  features: Record<string, boolean>;
}

@Injectable({ providedIn: 'root' })
export class SettingService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  readonly settings = signal<BusinessSettings | null>(null);
  readonly planUsage = signal<PlanUsageSummary | null>(null);
  readonly loading = signal(false);

  loadSettings(): Observable<ApiResponse<BusinessSettings>> {
    this.loading.set(true);
    return this.http.get<ApiResponse<BusinessSettings>>(`${this.api}/settings`).pipe(
      tap((res) => {
        this.settings.set(res.data);
        this.loading.set(false);
      }),
    );
  }

  updateSettings(data: Partial<BusinessSettings>): Observable<ApiResponse<BusinessSettings>> {
    return this.http.put<ApiResponse<BusinessSettings>>(`${this.api}/settings`, data).pipe(
      tap((res) => this.settings.set(res.data)),
    );
  }

  uploadLogo(file: File): Observable<ApiResponse<{ business_logo: string; business_logo_url: string }>> {
    const formData = new FormData();
    formData.append('logo', file);

    return this.http.post<ApiResponse<{ business_logo: string; business_logo_url: string }>>(
      `${this.api}/settings/logo`,
      formData
    ).pipe(
      tap((res) => {
        this.settings.update((s) => s ? { ...s, business_logo_url: res.data.business_logo_url } : null);
      }),
    );
  }

  loadPlanUsage(): Observable<ApiResponse<PlanUsageSummary>> {
    return this.http.get<ApiResponse<PlanUsageSummary>>(`${this.api}/plans/current`).pipe(
      tap((res) => this.planUsage.set(res.data)),
    );
  }

  subscribeToPlan(planSlug: string): Observable<ApiResponse<PlanUsageSummary>> {
    return this.http.post<ApiResponse<PlanUsageSummary>>(`${this.api}/plans/subscribe`, { plan_slug: planSlug }).pipe(
      tap((res) => {
        this.planUsage.set(res.data);
      }),
    );
  }
}
