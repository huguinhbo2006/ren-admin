import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { ApiResponse } from '../../../shared/models';

export interface BalanceReport {
  period: string;
  total_income_cents: number;
  total_expense_cents: number;
  net_profit_cents: number;
  profit_margin_pct: number;
}

export interface AccountsReceivableReport {
  total_receivable_cents: number;
  count: number;
  items: {
    rental_id: number;
    folio: string;
    customer_name: string;
    customer_phone: string;
    asset_name: string;
    end_date: string;
    total_amount_cents: number;
    paid_amount_cents: number;
    pending_amount_cents: number;
    overdue_days: number;
    urgency: 'overdue' | 'soon' | 'normal';
  }[];
}

export interface AssetUtilizationReport {
  period: string;
  total_assets: number;
  items: {
    asset_id: number;
    name: string;
    serial_number: string;
    status: string;
    rented_days: number;
    total_days_in_period: number;
    utilization_pct: number;
    income_cents: number;
    expense_cents: number;
    net_return_cents: number;
  }[];
}

export interface AssetRoiReport {
  total_assets: number;
  total_revenue_cents: number;
  total_expense_cents: number;
  total_net_profit_cents: number;
  items: {
    id: number;
    name: string;
    serial_number: string;
    category_name: string;
    status: string;
    daily_rate_cents: number;
    rentals_count: number;
    total_days_rented: number;
    total_revenue_cents: number;
    total_expense_cents: number;
    net_profit_cents: number;
    roi_margin_pct: number;
  }[];
}

export interface AssetDemandReport {
  items: {
    id: number;
    name: string;
    serial_number: string;
    category_name: string;
    daily_rate_cents: number;
    rentals_count: number;
    days_rented: number;
    demand_status: 'high' | 'medium' | 'low';
    demand_label: string;
    demand_class: string;
  }[];
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/reports`;

  readonly balance = signal<BalanceReport | null>(null);
  readonly receivable = signal<AccountsReceivableReport | null>(null);
  readonly utilization = signal<AssetUtilizationReport | null>(null);
  readonly assetRoi = signal<AssetRoiReport | null>(null);
  readonly assetDemand = signal<AssetDemandReport | null>(null);
  readonly loading = signal(false);

  loadBalance(dateFrom?: string, dateTo?: string): Observable<ApiResponse<BalanceReport>> {
    this.loading.set(true);
    let params = new HttpParams();
    if (dateFrom) params = params.set('date_from', dateFrom);
    if (dateTo) params = params.set('date_to', dateTo);

    return this.http.get<ApiResponse<BalanceReport>>(`${this.api}/balance`, { params }).pipe(
      tap((res) => {
        this.balance.set(res.data);
        this.loading.set(false);
      }),
    );
  }

  loadReceivable(): Observable<ApiResponse<AccountsReceivableReport>> {
    this.loading.set(true);
    return this.http.get<ApiResponse<AccountsReceivableReport>>(`${this.api}/accounts-receivable`).pipe(
      tap((res) => {
        this.receivable.set(res.data);
        this.loading.set(false);
      }),
    );
  }

  loadUtilization(dateFrom?: string, dateTo?: string): Observable<ApiResponse<AssetUtilizationReport>> {
    this.loading.set(true);
    let params = new HttpParams();
    if (dateFrom) params = params.set('date_from', dateFrom);
    if (dateTo) params = params.set('date_to', dateTo);

    return this.http.get<ApiResponse<AssetUtilizationReport>>(`${this.api}/asset-utilization`, { params }).pipe(
      tap((res) => {
        this.utilization.set(res.data);
        this.loading.set(false);
      }),
    );
  }

  loadAssetRoi(): Observable<ApiResponse<AssetRoiReport>> {
    this.loading.set(true);
    return this.http.get<ApiResponse<AssetRoiReport>>(`${this.api}/asset-roi`).pipe(
      tap((res) => {
        this.assetRoi.set(res.data);
        this.loading.set(false);
      }),
    );
  }

  loadAssetDemand(): Observable<ApiResponse<AssetDemandReport>> {
    this.loading.set(true);
    return this.http.get<ApiResponse<AssetDemandReport>>(`${this.api}/asset-demand`).pipe(
      tap((res) => {
        this.assetDemand.set(res.data);
        this.loading.set(false);
      }),
    );
  }

  exportPdf(reportType: string, dateFrom?: string, dateTo?: string): void {
    const body = {
      report_type: reportType,
      date_from: dateFrom,
      date_to: dateTo,
    };

    this.http.post(`${this.api}/export-pdf`, body, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Reporte_${reportType}_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
    });
  }
}
