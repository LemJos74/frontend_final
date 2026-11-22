import { Routes } from '@angular/router';
import { guestGuard, requireRole } from './core/guards/session.guard';

const profile = () => import('./features/profile/components/profile').then((m) => m.Profile);
const workspace = () => import('./layouts/workspace-layout').then((m) => m.WorkspaceLayout);

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: '',
    canActivateChild: [guestGuard],
    loadComponent: () => import('./layouts/access-layout').then((m) => m.AccessLayout),
    children: [
      { path: 'login', title: 'Iniciar sesión | LimpiaHuancayo', loadComponent: () => import('./features/access/components/login').then((m) => m.Login) },
      { path: 'registro', title: 'Registro | LimpiaHuancayo', loadComponent: () => import('./features/access/components/register').then((m) => m.Register) },
    ],
  },
  {
    path: 'ciudadano',
    canActivateChild: [requireRole('Ciudadano')],
    loadComponent: workspace,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'reportes' },
      { path: 'perfil', title: 'Perfil ciudadano | LimpiaHuancayo', loadComponent: profile },
      { path: 'reportes', loadChildren: () => import('./features/reports/reports.routes').then((m) => m.reportRoutes) },
    ],
  },
  {
    path: 'admin',
    canActivateChild: [requireRole('Administrador')],
    loadComponent: workspace,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'perfil', title: 'Perfil de administración | LimpiaHuancayo', loadComponent: profile },
      { path: '', loadChildren: () => import('./features/admin/admin.routes').then((m) => m.adminRoutes) },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
