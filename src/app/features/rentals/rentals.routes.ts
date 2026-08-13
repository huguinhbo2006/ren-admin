import { Routes } from '@angular/router';

export const rentalsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./rental-list/rental-list.component').then((m) => m.RentalListComponent),
    title: 'Contratos de Renta — Rentame',
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./rental-form/rental-form.component').then((m) => m.RentalFormComponent),
    title: 'Nueva Renta — Rentame',
  },
];
