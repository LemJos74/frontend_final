import { Routes } from '@angular/router';

export const reportRoutes: Routes = [
  { path: '', title: 'Mis reportes | LimpiaHuancayo', loadComponent: () => import('./components/report-list').then((m) => m.ReportList) },
  { path: 'nuevo', title: 'Nuevo reporte | LimpiaHuancayo', loadComponent: () => import('./components/new-report').then((m) => m.NewReport) },
  { path: ':id', title: 'Detalle del reporte | LimpiaHuancayo', loadComponent: () => import('./components/report-detail').then((m) => m.ReportDetail) },
];
