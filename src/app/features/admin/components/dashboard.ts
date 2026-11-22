import { DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { apiError } from '../../../shared/api-error';
import { ReportStatus } from '../../reports/components/report-status';
import type { AdminDashboard } from '../models/admin-report.model';
import { AdminReportsService } from '../services/admin-reports.service';

@Component({
  imports: [DecimalPipe, RouterLink, ReportStatus],
  template: `
    <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
      <h1 class="mb-0">Panel administrativo</h1>
      <a class="btn btn-primary" routerLink="/admin/reportes">Ver reportes</a>
    </div>
    @if (loading()) {
      <p class="surface" role="status">Cargando estadísticas…</p>
    } @else if (error()) {
      <p class="alert alert-danger" role="alert">{{ error() }}</p>
      <button type="button" class="btn btn-outline-secondary" (click)="load()">Reintentar</button>
    } @else if (stats(); as dashboard) {
      <section class="dashboard-total surface mb-4" aria-labelledby="dashboard-total">
        <h2 id="dashboard-total">Total de reportes</h2>
        <p class="dashboard-number mb-0">{{ dashboard.total_reportes | number }}</p>
      </section>
      <section aria-labelledby="dashboard-states">
        <h2 id="dashboard-states">Reportes por estado</h2>
        <ul class="row row-cols-1 row-cols-sm-2 row-cols-xl-4 g-3 list-unstyled mb-0">
          @for (group of dashboard.por_estado; track group.id) {
            <li class="col">
              <div class="surface h-100">
                <app-report-status [name]="group.nombre" />
                <p class="dashboard-number mt-2 mb-0">{{ group.total | number }}</p>
              </div>
            </li>
          }
        </ul>
      </section>
    }
  `,
  styles: [`
    .dashboard-total { background: var(--forest); color: white; }
    .dashboard-number { font-size: clamp(1.65rem, 4vw, 2.65rem); font-weight: 750; line-height: 1.15; overflow-wrap: anywhere; }
  `],
})
export class Dashboard {
  private readonly reports = inject(AdminReportsService);
  protected readonly stats = signal<AdminDashboard | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal('');

  constructor() { void this.load(); }

  protected async load(): Promise<void> {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set('');
    try {
      this.stats.set(await firstValueFrom(this.reports.dashboard()));
    } catch (error) {
      this.error.set(apiError(error, 'No se pudieron cargar las estadísticas.'));
    } finally {
      this.loading.set(false);
    }
  }
}
