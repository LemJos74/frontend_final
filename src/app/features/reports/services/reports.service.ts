import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { forkJoin } from 'rxjs';
import { CatalogOption, ReportDetail, ReportRequest, ReportSummary, ReportType } from '../models/report.model';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly http = inject(HttpClient);

  states() {
    return this.http.get<CatalogOption[]>('/api/catalogos/estados-reporte');
  }

  catalogs() {
    return forkJoin({
      districts: this.http.get<CatalogOption[]>('/api/catalogos/distritos'),
      types: this.http.get<ReportType[]>('/api/catalogos/tipos-reporte'),
    });
  }

  create(report: ReportRequest, photo: File | null = null) {
    if (!photo) return this.http.post<{ id: number }>('/api/reportes', report);

    const form = new FormData();
    for (const [field, value] of Object.entries(report)) form.append(field, String(value));
    form.append('fotografia', photo);
    return this.http.post<{ id: number }>('/api/reportes/con-fotografia', form);
  }

  photo(id: number) {
    return this.http.get('/api/reportes/' + id + '/fotografia', { responseType: 'blob' });
  }

  mine(limit: number, offset: number) {
    return this.http.get<ReportSummary[]>('/api/reportes/mios', {
      params: { limite: limit, desplazamiento: offset },
    });
  }

  detail(id: number) {
    return this.http.get<ReportDetail>('/api/reportes/' + id);
  }
}
