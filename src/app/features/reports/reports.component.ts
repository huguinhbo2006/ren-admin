import { Component, OnInit, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ReportService } from './services/report.service';
import { AuthService } from '../../core/auth/auth.service';
import { CurrencyMxnPipe } from '../../shared/pipes/currency-mxn.pipe';

@Component({
  selector: 'rm-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CurrencyMxnPipe],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsComponent implements OnInit {
  readonly reportService = inject(ReportService);
  readonly authService = inject(AuthService);

  readonly activeTab = signal<'balance' | 'receivable' | 'utilization' | 'roi' | 'demand'>('balance');
  readonly loading = this.reportService.loading;
  readonly balance = this.reportService.balance;
  readonly receivable = this.reportService.receivable;
  readonly utilization = this.reportService.utilization;
  readonly assetRoi = this.reportService.assetRoi;
  readonly assetDemand = this.reportService.assetDemand;

  readonly dateFrom = signal<string>(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  readonly dateTo = signal<string>(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]);

  ngOnInit(): void {
    if (this.authService.isPro()) {
      this.loadActiveReport();
    }
  }

  setTab(tab: 'balance' | 'receivable' | 'utilization' | 'roi' | 'demand'): void {
    this.activeTab.set(tab);
    this.loadActiveReport();
  }

  onDateChange(): void {
    this.loadActiveReport();
  }

  loadActiveReport(): void {
    const tab = this.activeTab();
    const from = this.dateFrom();
    const to = this.dateTo();

    if (tab === 'balance') {
      this.reportService.loadBalance(from, to).subscribe();
    } else if (tab === 'receivable') {
      this.reportService.loadReceivable().subscribe();
    } else if (tab === 'utilization') {
      this.reportService.loadUtilization(from, to).subscribe();
    } else if (tab === 'roi') {
      this.reportService.loadAssetRoi().subscribe();
    } else if (tab === 'demand') {
      this.reportService.loadAssetDemand().subscribe();
    }
  }

  exportCurrentPdf(): void {
    const tab = this.activeTab();
    this.reportService.exportPdf(tab, this.dateFrom(), this.dateTo());
  }
}
