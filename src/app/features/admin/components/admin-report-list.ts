import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormField, form, validate } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { firstValueFrom, forkJoin } from 'rxjs';
import { apiError } from '../../../shared/api-error';
import { FieldErrors } from '../../../shared/field-errors';
import { ReportStatus } from '../../reports/components/report-status';
import type { CatalogOption } from '../../reports/models/report.model';
import { ReportsService } from '../../reports/services/reports.service';
import type { AdminReport, ReportFilters } from '../models/admin-report.model';
import { AdminReportsService } from '../services/admin-reports.service';

const emptyFilters: ReportFilters = {
  distrito_id: '', tipo_id: '', estado_id: '', fecha_desde: '', fecha_hasta: '',
};
const pageSize = 20;
const isoDay = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
const registrationDate = new Intl.DateTimeFormat('es-PE', {
  timeZone: 'America/Lima', day: '2-digit', month: '2-digit', year: 'numeric',
});

function dateFormatError(value: string) {
  return value && (!isoDay.test(value) || value.startsWith('0000-'))
    ? { kind: 'date-format', message: 'Selecciona una fecha válida.' }
    : null;
}

@Component({
  imports: [FieldErrors, FormField, ReportStatus, RouterLink],
  templateUrl: './admin-report-list.html',
  styleUrl: './admin-report-list.scss',
})
export class AdminReportList {
  private readonly admin = inject(AdminReportsService);
  private readonly catalog = inject(ReportsService);
  private readonly model = signal(emptyFilters);
  private applied = emptyFilters;
  protected readonly filters = form(this.model, (path) => {
    validate(path.fecha_desde, ({ value }) => dateFormatError(value()));
    validate(path.fecha_hasta, ({ value, valueOf }) => {
      const until = value();
      const since = valueOf(path.fecha_desde);
      return dateFormatError(until) ?? (since && until && since > until
        ? { kind: 'date-range', message: 'La fecha hasta debe ser igual o posterior a la fecha desde.' }
        : null);
    });
  });
  protected readonly attempted = signal(false);
  protected readonly options = signal<{ districts: CatalogOption[]; types: CatalogOption[]; states: CatalogOption[] } | null>(null);
  protected readonly catalogError = signal('');
  protected readonly reports = signal<AdminReport[]>([]);
  protected readonly page = signal(0);
  protected readonly hasNext = signal(false);
  protected readonly loading = signal(false);
  protected readonly error = signal('');

  constructor() {
    void this.loadCatalogs();
    void this.load(0);
  }

  protected async loadCatalogs(): Promise<void> {
    this.catalogError.set('');
    try {
      const { options, states } = await firstValueFrom(forkJoin({
        options: this.catalog.catalogs(), states: this.catalog.states(),
      }));
      this.options.set({ ...options, states });
    } catch (error) {
      this.catalogError.set(apiError(error, 'No se pudieron cargar los filtros.'));
    }
  }

  protected apply(event: Event): void {
    event.preventDefault();
    this.attempted.set(true);
    if (this.loading() || this.filters().invalid()) return;
    this.applied = this.model();
    void this.load(0);
  }

  protected clear(): void {
    if (this.loading()) return;
    this.model.set(emptyFilters);
    this.attempted.set(false);
    this.applied = emptyFilters;
    void this.load(0);
  }

  protected formatCreatedAt(value: string): string {
    return registrationDate.format(new Date(value));
  }

  protected async load(page: number): Promise<void> {
    if (this.loading() || page < 0) return;
    this.page.set(page);
    this.loading.set(true);
    this.error.set('');
    try {
      const items = await firstValueFrom(this.admin.list(pageSize + 1, page * pageSize, this.applied));
      this.reports.set(items.slice(0, pageSize));
      this.hasNext.set(items.length > pageSize);
    } catch (error) {
      const detail: unknown = error instanceof HttpErrorResponse && error.status === 422
        ? error.error?.detail : null;
      this.error.set(typeof detail === 'string' ? detail : apiError(error, 'No se pudieron consultar los reportes.'));
    } finally {
      this.loading.set(false);
    }
  }
}
