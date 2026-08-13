import { Routes } from '@angular/router';

export const customersRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./customer-list/customer-list.component').then((m) => m.CustomerListComponent),
    title: 'Cartera de Clientes — Rentame',
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./customer-form/customer-form.component').then((m) => m.CustomerFormComponent),
    title: 'Registrar Cliente — Rentame',
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./customer-form/customer-form.component').then((m) => m.CustomerFormComponent),
    title: 'Editar Cliente — Rentame',
  },
];
