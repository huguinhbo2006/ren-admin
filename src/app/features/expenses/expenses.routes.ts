import { Routes } from '@angular/router';

export const expensesRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./expense-list/expense-list.component').then((m) => m.ExpenseListComponent),
    title: 'Egresos y Mantenimientos — Rentame',
  },
];
