import { Routes } from '@angular/router';

export const paymentsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./payment-list/payment-list.component').then((m) => m.PaymentListComponent),
    title: 'Cobranza e Ingresos — Rentame',
  },
];
