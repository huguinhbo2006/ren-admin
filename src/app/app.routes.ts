import { Routes } from '@angular/router';
import { authGuard, guestGuard, planGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // ---------------------------------------------------------------------------
  // Rutas públicas (solo para usuarios NO autenticados)
  // ---------------------------------------------------------------------------
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
    title: 'Iniciar Sesión — Rentame',
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
    title: 'Crear Cuenta — Rentame',
  },

  // ---------------------------------------------------------------------------
  // App Shell — Layout con Sidebar (requiere autenticación)
  // ---------------------------------------------------------------------------
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      // Redirect raíz al dashboard
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },

      // Dashboard
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
        title: 'Dashboard — Rentame',
      },

      // Activos
      {
        path: 'assets',
        loadChildren: () =>
          import('./features/assets/assets.routes').then((m) => m.assetsRoutes),
        title: 'Activos — Rentame',
      },

      // Clientes
      {
        path: 'customers',
        loadChildren: () =>
          import('./features/customers/customers.routes').then((m) => m.customersRoutes),
        title: 'Clientes — Rentame',
      },

      // Rentas
      {
        path: 'rentals',
        loadChildren: () =>
          import('./features/rentals/rentals.routes').then((m) => m.rentalsRoutes),
        title: 'Rentas — Rentame',
      },

      // Pagos
      {
        path: 'payments',
        loadChildren: () =>
          import('./features/payments/payments.routes').then((m) => m.paymentsRoutes),
        title: 'Pagos — Rentame',
      },

      // Egresos
      {
        path: 'expenses',
        loadChildren: () =>
          import('./features/expenses/expenses.routes').then((m) => m.expensesRoutes),
        title: 'Egresos — Rentame',
      },

      // Reportes (solo Plan Pro)
      {
        path: 'reports',
        canActivate: [planGuard('reports')],
        loadChildren: () =>
          import('./features/reports/reports.routes').then((m) => m.reportsRoutes),
        title: 'Reportes — Rentame',
      },

      // Configuración
      {
        path: 'settings',
        loadChildren: () =>
          import('./features/settings/settings.routes').then((m) => m.settingsRoutes),
        title: 'Configuración — Rentame',
      },

      // Upgrade a Pro
      {
        path: 'upgrade',
        loadComponent: () =>
          import('./features/settings/upgrade/upgrade.component').then((m) => m.UpgradeComponent),
        title: 'Upgrade a Pro — Rentame',
      },

      // Página de acceso denegado
      {
        path: 'forbidden',
        loadComponent: () =>
          import('./shared/components/forbidden/forbidden.component').then((m) => m.ForbiddenComponent),
        title: 'Acceso Denegado — Rentame',
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 404 — Catch all
  // ---------------------------------------------------------------------------
  {
    path: '**',
    loadComponent: () =>
      import('./shared/components/not-found/not-found.component').then((m) => m.NotFoundComponent),
    title: 'Página no encontrada — Rentame',
  },
];
