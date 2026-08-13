import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ElementRef,
  ViewChild,
  inject,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { DashboardService } from './services/dashboard.service';
import { AuthService } from '../../core/auth/auth.service';
import { CurrencyMxnPipe } from '../../shared/pipes/currency-mxn.pipe';

Chart.register(...registerables);

@Component({
  selector: 'rm-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyMxnPipe],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly dashboardService = inject(DashboardService);
  readonly authService = inject(AuthService);

  readonly data = this.dashboardService.data;
  readonly loading = this.dashboardService.loading;
  readonly currentUser = this.authService.currentUser;

  @ViewChild('chartCanvas') chartCanvas?: ElementRef<HTMLCanvasElement>;
  private chartInstance?: Chart;

  constructor() {
    effect(() => {
      const d = this.data();
      if (d && this.chartCanvas) {
        this.renderChart(d.monthly_chart || []);
      }
    });
  }

  ngOnInit(): void {
    this.dashboardService.loadDashboard().subscribe();
  }

  ngAfterViewInit(): void {
    if (this.data()) {
      this.renderChart(this.data()!.monthly_chart || []);
    }
  }

  ngOnDestroy(): void {
    this.chartInstance?.destroy();
  }

  renderChart(monthlyData: { month: string; income_cents: number; expenses_cents: number }[]): void {
    if (!this.chartCanvas) return;

    this.chartInstance?.destroy();

    const labels = monthlyData.map((d) => d.month);
    const incomeData = monthlyData.map((d) => d.income_cents / 100);
    const expenseData = monthlyData.map((d) => d.expenses_cents / 100);

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Ingresos ($ MXN)',
            data: incomeData,
            backgroundColor: 'rgba(37, 99, 235, 0.85)',
            borderColor: '#2563eb',
            borderRadius: 6,
            barPercentage: 0.6,
          },
          {
            label: 'Egresos ($ MXN)',
            data: expenseData,
            backgroundColor: 'rgba(239, 68, 68, 0.85)',
            borderColor: '#ef4444',
            borderRadius: 6,
            barPercentage: 0.6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              boxWidth: 8,
              font: { family: 'Inter', size: 12 },
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const val = Number(context.raw || 0);
                return ` ${context.dataset.label}: $${val.toFixed(2)}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { family: 'Inter' } },
          },
          y: {
            beginAtZero: true,
            grid: { color: '#f1f5f9' },
            ticks: {
              callback: (value) => `$${value}`,
              font: { family: 'Inter' },
            },
          },
        },
      },
    });
  }

  getUrgencyBadge(days: number): { label: string; class: string } {
    if (days === 0) return { label: 'Vence hoy', class: 'bg-danger text-white' };
    if (days === 1) return { label: 'Vence mañana', class: 'bg-warning text-dark' };
    return { label: `En ${days} días`, class: 'bg-info bg-opacity-25 text-info-emphasis' };
  }
}
