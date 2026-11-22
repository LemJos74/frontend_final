import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  { path: 'dashboard', title: 'Panel administrativo | LimpiaHuancayo', loadComponent: () => import('./components/dashboard').then((m) => m.Dashboard) },
  { path: 'usuarios', title: 'Usuarios | LimpiaHuancayo', loadComponent: () => import('./components/admin-user-list').then((m) => m.AdminUserList) },
  { path: 'reportes', title: 'Reportes ciudadanos | LimpiaHuancayo', loadComponent: () => import('./components/admin-report-list').then((m) => m.AdminReportList) },
  {
    path: 'reportes/:id',
    title: 'Detalle administrativo | LimpiaHuancayo',
    data: { admin: true },
    loadComponent: () => import('../reports/components/report-detail').then((m) => m.ReportDetail),
  },
];
