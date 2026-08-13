import { Routes } from '@angular/router';

export const settingsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./settings.component').then((m) => m.SettingsComponent),
    title: 'Configuración — Rentame',
  },
  {
    path: 'upgrade',
    loadComponent: () =>
      import('./upgrade/upgrade.component').then((m) => m.UpgradeComponent),
    title: 'Actualizar a Plan Pro — Rentame',
  },
];
