import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { AdminDashboard, AdminReport, ReportFilters, ReportStateChange, UpdatedReportState } from '../models/admin-report.model';

@Injectable({ providedIn: 'root' })
export class AdminReportsService {
  private readonly http = inject(HttpClient);

  dashboard() {
    return this.http.get<AdminDashboard>('/api/admin/dashboard');
  }

  list(limit: number, offset: number, filters: ReportFilters) {
    let params = new HttpParams().set('limite', limit).set('desplazamiento', offset);
    for (const [key, value] of Object.entries(filters)) {
      if (value) params = params.set(key, value);
    }
    return this.http.get<AdminReport[]>('/api/admin/reportes', { params });
  }

  updateState(id: number, change: ReportStateChange) {
    return this.http.patch<UpdatedReportState>('/api/admin/reportes/' + id + '/estado', change);
  }
}
