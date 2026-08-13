import { Routes } from '@angular/router';

export const assetsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./asset-list/asset-list.component').then((m) => m.AssetListComponent),
    title: 'Catálogo de Activos — Rentame',
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./asset-form/asset-form.component').then((m) => m.AssetFormComponent),
    title: 'Registrar Activo — Rentame',
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./asset-form/asset-form.component').then((m) => m.AssetFormComponent),
    title: 'Editar Activo — Rentame',
  },
];
